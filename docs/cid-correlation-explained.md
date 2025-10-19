# CID Correlation Service - Plain English Explanation

## The Problem

When BT-Servant processes a user's message, it creates **multiple log entries**
for that single request, all tagged with the same **Correlation ID (CID)**.

**Example: User asks "help me translate john 4:1-3"**

This creates ~12 separate log entries with CID=`9f257829cfc44f43ae13f96c9de8690d`:

```json
// Entry 1 - Language detection
{"message": "language detection (model): en", "cid": "9f25...", ...}

// Entry 2 - Message preprocessing
{"message": "original_message: help me translate john 4:1-3\nnew_message: help me translate John 4:1-3", "cid": "9f25...", ...}

// Entry 3 - Intent detection
{"message": "extracted user intents: get-translation-helps", "cid": "9f25...", ...}

// Entry 4 - Biblical reference extraction
{"message": "[selection-helper] canonical_book=John", "cid": "9f25...", ...}

// Entry 5 - Verse ranges
{"message": "[selection-helper] ranges=[(4, 1, 4, 3)]", "cid": "9f25...", ...}

// Entry 6 - Resources used
{"message": "[translation-helps] selected 2 help entries", "cid": "9f25...", ...}

// Entry 7 - Final response
{"message": "Response from bt_servant: Here are translation helps for John 4:1-3...", "cid": "9f25...", ...}

// ... plus 5 more entries for various processing steps
```

**The UI Challenge:**

When you click on **ONE log entry** in the table, you want to see **ALL the
relevant information** about that request - not just what's in that single line.

## The Solution: "Correlation"

**Correlation** = Finding and combining related log entries that share the same
CID.

### What the "CID Correlation Service" Does

```typescript
// Pseudocode
class CorrelationService {
  // When user clicks on a log entry...
  async getRelatedData(logEntry: LogEntry) {
    const cid = logEntry.cid;

    // 1. Find all other entries with the same CID
    const relatedEntries = findAllByCID(cid);

    // 2. Extract specific patterns from each entry
    const correlatedData = {
      originalMessage: extractFrom(relatedEntries, "original_message:"),
      preprocessedMessage: extractFrom(relatedEntries, "new_message:"),
      language: extractFrom(relatedEntries, "language detection (model):"),
      intents: extractFrom(relatedEntries, "extracted user intents:"),
      biblicalReference: {
        book: extractFrom(relatedEntries, "[selection-helper] canonical_book="),
        ranges: extractFrom(relatedEntries, "[selection-helper] ranges="),
      },
      resourcesSearched: extractFrom(relatedEntries, "[translation-helps] selected"),
      finalResponse: extractFrom(relatedEntries, "Response from bt_servant:"),
    };

    // 3. Return the combined data
    return correlatedData;
  }
}
```

### Why "With Caching"?

This query is **expensive** because for each log entry click:

1. Search through ALL logs to find matching CIDs
2. Parse each related entry's message field
3. Extract patterns
4. Combine the data

If you click on 10 entries from the same conversation (same CID), you'd do this
work 10 times!

**Caching** = Remember the results:

```typescript
class CorrelationService {
  private cache = new Map<string, CorrelatedData>();

  async getRelatedData(logEntry: LogEntry) {
    const cid = logEntry.cid;

    // Check cache first
    if (this.cache.has(cid)) {
      return this.cache.get(cid); // Instant return!
    }

    // Not cached? Do the expensive work
    const correlatedData = this.doExpensiveCorrelation(cid);

    // Save for next time
    this.cache.set(cid, correlatedData);

    return correlatedData;
  }
}
```

## Real-World Example

**User clicks on log entry #4:**

```json
{"message": "[selection-helper] canonical_book=John", "cid": "abc123", ...}
```

**Without correlation:** Detail panel shows:

```
Message: [selection-helper] canonical_book=John
CID: abc123
```

😞 Not very useful!

**With correlation:** Service finds 11 other entries with CID=`abc123` and
combines them:

```
┌──────────────────────────────────────────────┐
│ 💬 Message Flow                              │
│ Original:      help me translate john 4:1-3  │
│ Preprocessed:  help me translate John 4:1-3  │
│ Response:      Here are translation helps... │
├──────────────────────────────────────────────┤
│ 📖 Biblical Reference                        │
│ John 4:1-3                                   │
├──────────────────────────────────────────────┤
│ 🔍 Translation Resources (2 searched)       │
│ ✓ Translation Notes                         │
│ ✓ Translation Words                         │
└──────────────────────────────────────────────┘
```

😊 Much better!

## Architecture

```
User clicks entry
       ↓
  LogDetailPanel.svelte
       ↓
  correlationService.getRelatedData(entry)
       ↓
  ┌─────────────────────────────┐
  │ 1. Check cache              │ ← Instant if cached
  │ 2. Find entries by CID      │ ← Query all logs
  │ 3. Extract patterns         │ ← Parse messages
  │ 4. Combine data             │ ← Build result object
  │ 5. Cache result             │ ← Save for next time
  └─────────────────────────────┘
       ↓
  Return CorrelatedData
       ↓
  LogDetailPanel renders all sections
```

## Performance

**Without caching:**

- Click entry 1: 150ms (query + parse)
- Click entry 2 (same CID): 150ms (query + parse again)
- Click entry 3 (same CID): 150ms (query + parse again)
- **Total: 450ms** 😢

**With caching:**

- Click entry 1: 150ms (query + parse + cache)
- Click entry 2 (same CID): 2ms (cache hit)
- Click entry 3 (same CID): 2ms (cache hit)
- **Total: 154ms** 😊 **3x faster!**

## TL;DR

**"CID Correlation Service with Caching"** =

A module that:

1. Finds all log entries for a single user request (same CID)
2. Extracts useful patterns from each entry
3. Combines them into one complete picture
4. Remembers the results so it doesn't repeat work

**Why we need it:** BT-Servant splits one user request into many log entries,
but users want to see everything in one place.

**Why caching matters:** Same conversation = same CID = same work, so remember
it!

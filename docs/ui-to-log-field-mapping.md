# UI Component → Log Field Mapping

**Purpose:** Explicit mapping from UI components to log patterns/fields for Phase 1b implementation

**Last Updated:** 2025-10-18

---

## 1. FilterSidebar Component

Maps to: `apps/web/src/lib/components/FilterSidebar.svelte`

### Filters Offered

| UI Filter      | Source Field/Pattern                                                                         | Notes                                             |
| -------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| **Log Level**  | JSON field: `level`                                                                          | Direct: "TRACE", "DEBUG", "INFO", "WARN", "ERROR" |
| **Language**   | Message pattern: `"language detection (model): {code}"` OR `"language code {code} detected"` | Extract 2-letter code (en, es, fr, etc)           |
| **Date Range** | JSON field: `timestamp`                                                                      | Parse "YYYY-MM-DD HH:MM:SS" format                |

**Implementation Notes:**

- Languages need to be extracted and indexed from ALL entries to build dropdown options
- Date range should default to last 21 days based on auto-load
- Filters should support multi-select (OR logic within category, AND between categories)

---

## 2. FiltersBar Component

Maps to: `apps/web/src/lib/components/FiltersBar.svelte`

### Inline Filters

| UI Filter          | Source Field/Pattern                                       | Example Value                              |
| ------------------ | ---------------------------------------------------------- | ------------------------------------------ |
| **All Users**      | JSON field: `user`                                         | "kwlv1sXnUvYT9dnn" or "-"                  |
| **Intents**        | Message pattern: `"extracted user intents: {intent-name}"` | "get-translation-helps"                    |
| **Loggers**        | JSON field: `logger`                                       | "bt_servant_engine.services.preprocessing" |
| **Correlation ID** | JSON field: `cid`                                          | "5d0101ac8cf34fb5949217328533ccb3" or "-"  |

**Implementation Notes:**

- "All Users" dropdown needs unique list from `user` field across all entries
- Intents dropdown should show known intents (13 defined) + any dynamically discovered
- Loggers should be extracted and sorted by frequency (most common first)
- CID filter allows searching for all logs in a single request/conversation flow

---

## 3. LogTable / LogCards Components

Maps to: `apps/web/src/lib/components/LogTable.svelte` and `LogCards.svelte`

### Column/Card Fields

| UI Element        | Source Field/Pattern                                 | Extraction Logic                                 |
| ----------------- | ---------------------------------------------------- | ------------------------------------------------ |
| **Timestamp**     | JSON field: `timestamp`                              | Parse to Date, display formatted                 |
| **Level**         | JSON field: `level`                                  | Color-coded badge                                |
| **Logger**        | JSON field: `logger`                                 | Truncate if > 40 chars, show full on hover       |
| **Message**       | JSON field: `message`                                | Show first 100 chars, truncate with "..."        |
| **User**          | JSON field: `user`                                   | Badge display, "-" if not present                |
| **CID**           | JSON field: `cid`                                    | Badge display, truncate to first 8 chars         |
| **Perf Badge**    | Derived: `hasJson` flag                              | Set true when message starts with "PerfReport {" |
| **Intent Badges** | Message pattern: `"extracted user intents: {names}"` | Parse comma-separated list                       |

**Implementation Notes:**

- Messages containing "PerfReport {" should show a "P" or graph icon badge
- Intent badges should be clickable to filter by that intent
- Click on row should expand detail panel or inline details
- Virtualization required for 10k+ entries

---

## 4. LogDetailPanel Component

Maps to: `apps/web/src/lib/components/LogDetailPanel.svelte`

### Detail Fields Displayed

| UI Section                           | Source Field/Pattern                                                             | Extraction Details                 |
| ------------------------------------ | -------------------------------------------------------------------------------- | ---------------------------------- |
| **Basic Info**                       |                                                                                  |                                    |
| → Timestamp                          | JSON field: `timestamp`                                                          | Full precision display             |
| → Level                              | JSON field: `level`                                                              | With color coding                  |
| → Logger                             | JSON field: `logger`                                                             | Full path, copyable                |
| → Correlation ID                     | JSON field: `cid`                                                                | Full value, copyable               |
| → User                               | JSON field: `user`                                                               | Full user ID                       |
| → Task Name                          | JSON field: `taskName`                                                           | May be null                        |
| → Client IP                          | JSON field: `client_ip`                                                          | IPv4/IPv6 or "-"                   |
| **Extracted Fields**                 |                                                                                  |                                    |
| → Language                           | Pattern: `"language detection (model): {code}"`                                  | 2-letter ISO code                  |
| → Region/Country                     | GeoIP lookup on `client_ip`                                                      | Requires GeoLite2 database         |
| → Original Message                   | Pattern: `"original_message: {text}\n"`                                          | From preprocessing logs            |
| → Preprocessed Message               | Pattern: `"new_message: {text}\n"`                                               | From preprocessing logs            |
| → Intents                            | Pattern: `"extracted user intents: {list}"`                                      | Parse comma-separated              |
| → Response to User                   | Pattern: `"Response from bt_servant: {text}"`                                    | Full response text                 |
| → Biblical Reference                 | Pattern: `"[selection-helper] canonical_book={book}"` + `"ranges=[(ch,v,ch,v)]"` | Combine book + ranges              |
| → Resources Searched                 | Pattern: `"[translation-helps] selected {n} help entries"`                       | Count + resource list if available |
| **Performance Data** (if PerfReport) |                                                                                  |                                    |
| → Trace ID                           | PerfReport JSON: `trace_id`                                                      | Full trace ID                      |
| → Total Duration                     | PerfReport JSON: `total_ms`                                                      | Display as seconds                 |
| → Total Tokens                       | PerfReport JSON: `total_tokens`                                                  | Input + output                     |
| → Total Cost                         | PerfReport JSON: `total_cost_usd`                                                | Format as currency                 |
| → Spans List                         | PerfReport JSON: `spans[]`                                                       | Table of all spans with timing     |

**Implementation Notes:**

- All extracted fields are **optional** - display "—" or "(not available)" when missing
- PerfReport section should only show when `hasJson === true`
- PerfReport JSON extraction: when message starts with "PerfReport {", extract substring from "{" to end, parse as JSON
- Biblical reference requires combining multiple log patterns - may need to correlate by CID
- Resources searched may need separate query to find related entries

---

## 5. IntentGraph Component

Maps to: `apps/web/src/lib/components/IntentGraph.svelte`

### Graph Data Sources

| Graph Element        | Source Pattern                              | Logic                                                         |
| -------------------- | ------------------------------------------- | ------------------------------------------------------------- |
| **Intent Nodes**     | Pattern: `"extracted user intents: {list}"` | Each intent becomes a node                                    |
| **Intent Flow**      | Correlate by `cid` + `timestamp` order      | Connect intents in temporal sequence within same conversation |
| **Node Timing**      | PerfReport JSON: `grouped_totals_by_intent` | Duration percentage per intent                                |
| **Node Cost**        | PerfReport JSON: `grouped_totals_by_intent` | Cost per intent                                               |
| **Edge Labels**      | Time between intent detections              | Calculate from timestamp diffs                                |
| **Highlighted Path** | Selected conversation CID                   | Highlight all nodes/edges for that CID                        |

**Implementation Notes:**

- Requires correlation across multiple log entries by CID
- Intent flow visualization requires temporal ordering
- Performance data from PerfReport provides node coloring (green/yellow/red based on duration)
- Multi-intent requests create branching visualization

---

## 6. ConversationGroup Component

Maps to: `apps/web/src/lib/components/ConversationGroup.svelte`

### Grouping Logic

| UI Element              | Source Field/Pattern            | Grouping Strategy                                         |
| ----------------------- | ------------------------------- | --------------------------------------------------------- |
| **Conversation Header** | JSON field: `cid`               | Group all entries with same CID                           |
| **User ID**             | JSON field: `user`              | Display user for conversation                             |
| **Entry Count**         | Count of entries with same CID  | Badge showing total entries                               |
| **Time Span**           | First/last `timestamp` in group | Show duration of conversation                             |
| **Primary Intent**      | Most common intent in group     | Parse from all "extracted user intents" patterns in group |

**Implementation Notes:**

- Group entries by CID before rendering
- Sort conversations by most recent timestamp
- Collapsible/expandable groups
- Show summary stats: duration, entry count, primary intent, cost (if PerfReport available)

---

## 7. SearchBar Component

Maps to: `apps/web/src/lib/components/SearchBar.svelte`

### Searchable Fields

| Search Scope     | Source Fields         | Search Method        |
| ---------------- | --------------------- | -------------------- |
| **Message Text** | JSON field: `message` | MiniSearch full-text |
| **Logger Names** | JSON field: `logger`  | MiniSearch full-text |
| **User ID**      | JSON field: `user`    | Exact match option   |
| **CID**          | JSON field: `cid`     | Exact match option   |

**Implementation Notes:**

- Implement MiniSearch indexing on load
- Support fuzzy matching (Levenshtein distance ≤ 2)
- Instant search with debounce (300ms)
- Highlight matched terms in results
- Search filters should combine with sidebar filters (AND logic)

---

## Pattern Extraction Summary

### Required Message Patterns

```typescript
// Pattern definitions for extraction
const MESSAGE_PATTERNS = {
  language: /language detection \(model\): (\w+)/,
  languageConfirmed: /language code (\w+) detected/,
  intents: /extracted user intents: (.+)/,
  originalMessage: /original_message: ([^\n]+)\n/,
  preprocessedMessage: /new_message: ([^\n]+)\n/,
  response: /Response from bt_servant: (.+)/,
  canonicalBook: /\[selection-helper\] canonical_book=(\w+)/,
  ranges: /\[selection-helper\] ranges=\[(.+)\]/,
  resourceCount: /\[translation-helps\] selected (\d+) help entries/,
  perfReportStart: /^PerfReport \{/,
};
```

### Core JSON Fields

```typescript
// Direct extraction from each JSON log line
interface RawLogEntry {
  message: string; // → Full text content
  client_ip: string; // → GeoIP lookup
  taskName: string | null; // → Display as-is
  timestamp: string; // → Parse to Date
  level: LogLevel; // → Filter + display
  logger: string; // → Filter + display
  cid: string; // → Grouping + filter
  user: string; // → Filter + display
}
```

---

## Implementation Priority

### Phase 1b - Week 1

1. **Core JSON parsing** - All direct fields (timestamp, level, logger, cid, user, client_ip, taskName)
2. **Basic filters** - Level, logger, cid, user (all from direct JSON fields)
3. **LogTable display** - All columns working with real data
4. **PerfReport detection** - `hasJson` flag when message starts with "PerfReport {"

### Phase 1b - Week 2

5. **Message pattern extraction** - Language, intents, original/preprocessed messages
6. **Advanced filters** - Language, intent (from patterns)
7. **LogDetailPanel** - All extracted fields displayed
8. **GeoIP integration** - Client IP → Country/Region

### Phase 1b - Week 3

9. **Full-text search** - MiniSearch integration
10. **Conversation grouping** - Group by CID with stats
11. **IntentGraph** - Basic visualization (nodes only)
12. **PerfReport full parsing** - Extract all JSON data

---

## Testing Checklist

- [ ] All JSON fields parse correctly from example_bt_servant.log
- [ ] Language pattern matches "language detection (model): en"
- [ ] Intent pattern matches "extracted user intents: get-translation-helps"
- [ ] Original/preprocessed message pattern works
- [ ] Response pattern extracts full text
- [ ] PerfReport JSON parsing handles embedded newlines
- [ ] GeoIP lookup works for IPv4 and IPv6
- [ ] Filters work with "-" values (no user, no CID)
- [ ] Search indexes all required fields
- [ ] Conversation grouping handles missing CIDs
- [ ] UI gracefully handles missing/null values

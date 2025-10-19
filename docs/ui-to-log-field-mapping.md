# UI Component → Log Field Mapping

**Purpose:** Explicit mapping from UI components to log patterns/fields for
Phase 1b implementation

**Last Updated:** 2025-10-18

---

## Coverage Status

### ✅ VERIFIED: All patterns exist in actual logs

Every extraction pattern documented below has been verified against the actual
`docs/example_bt_servant.log` file:

- ✅ Direct JSON fields (timestamp, level, logger, cid, user, client_ip,
  taskName, message)
- ✅ Language detection pattern: `"language detection (model): {code}"`
- ✅ Intent extraction pattern: `"extracted user intents: {list}"`
- ✅ Original/preprocessed pattern: `"original_message: ...\nnew_message: ..."`
- ✅ Response pattern: `"Response from bt_servant: {text}"`
- ✅ Biblical reference patterns: `"[selection-helper] canonical_book={book}"`
  - `"ranges=[(ch,v,ch,v)]"`
- ✅ Resources pattern: `"[translation-helps] selected {n} help entries"`
- ✅ PerfReport: `"PerfReport {"` with full JSON structure

### ⚠️ UI Implementation Gaps

Some fields exist in the domain model and logs but are **not yet displayed** in
the Phase 1a UI:

**LogDetailPanel missing:**

- client_ip, taskName (simple fields)
- message_original, message_preprocessed, final_message (require CID
  correlation)
- Structured PerfReport visualization (currently shows raw JSON dump)
- Biblical reference display
- Resources searched display

**These will be added in Phase 1b and Phase 2** (see section 4 for details).

### ✅ Full Coverage Confirmed

Every UI component has a clear data source mapping with extraction logic
documented.

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

| UI Section                             | Source Field/Pattern                                                             | Status         | Extraction Details                         |
| -------------------------------------- | -------------------------------------------------------------------------------- | -------------- | ------------------------------------------ |
| **Basic Info** (Currently Implemented) |                                                                                  |                |                                            |
| → Timestamp                            | JSON field: `timestamp`                                                          | ✅ Implemented | Full precision display                     |
| → Level                                | JSON field: `level`                                                              | ✅ Implemented | With color coding                          |
| → Logger                               | JSON field: `logger`                                                             | ✅ Implemented | Full path, copyable                        |
| → Message (raw)                        | JSON field: `message`                                                            | ✅ Implemented | Displayed in collapsible section           |
| → Correlation ID                       | JSON field: `cid`                                                                | ✅ Implemented | Full value, copyable                       |
| → Trace ID                             | Domain field: `traceId`                                                          | ✅ Implemented | From PerfReport or extracted               |
| → User                                 | JSON field: `user`                                                               | ✅ Implemented | Full user ID                               |
| → Language                             | Pattern: `"language detection (model): {code}"`                                  | ✅ Implemented | 2-letter ISO code                          |
| → Region/Country                       | GeoIP lookup on `client_ip`                                                      | ✅ Implemented | Shows country, region, city                |
| → Intents                              | Pattern: `"extracted user intents: {list}"`                                      | ✅ Implemented | Badge list with colors                     |
| **Fields to ADD in Phase 1b/2**        |                                                                                  |                |                                            |
| → Task Name                            | JSON field: `taskName`                                                           | ⚠️ TO ADD      | May be null                                |
| → Client IP                            | JSON field: `client_ip`                                                          | ⚠️ TO ADD      | IPv4/IPv6 or "-"                           |
| → Original Message                     | Pattern: `"original_message: {text}\n"`                                          | ⚠️ TO ADD      | From preprocessing logs (correlate by CID) |
| → Preprocessed Message                 | Pattern: `"new_message: {text}\n"`                                               | ⚠️ TO ADD      | From preprocessing logs (correlate by CID) |
| → Response to User                     | Pattern: `"Response from bt_servant: {text}"`                                    | ⚠️ TO ADD      | Full response text (correlate by CID)      |
| → Biblical Reference                   | Pattern: `"[selection-helper] canonical_book={book}"` + `"ranges=[(ch,v,ch,v)]"` | ⚠️ TO ADD      | Combine book + ranges (correlate by CID)   |
| → Resources Searched                   | Pattern: `"[translation-helps] selected {n} help entries"`                       | ⚠️ TO ADD      | Count + resource list (correlate by CID)   |
| **Performance Data** (Structured View) |                                                                                  |                |                                            |
| → PerfReport Overview                  | PerfReport JSON: `total_ms`, `total_cost_usd`, `total_tokens`                    | ⚠️ TO ADD      | Summary card at top of detail panel        |
| → Spans Timeline                       | PerfReport JSON: `spans[]`                                                       | ⚠️ TO ADD      | Waterfall/timeline visualization           |
| → Intent Cost Breakdown                | PerfReport JSON: `grouped_totals_by_intent`                                      | ⚠️ TO ADD      | Bar chart or table by intent               |
| → Token Usage Chart                    | PerfReport JSON: `total_input_tokens`, `total_output_tokens`                     | ⚠️ TO ADD      | Pie or bar chart                           |
| **Currently Shows**                    |                                                                                  |                |                                            |
| → Raw JSON Data                        | Complete log entry as JSON                                                       | ✅ Implemented | Collapsible section (not ideal for users)  |

**Implementation Notes:**

- ✅ = Currently implemented in Phase 1a UI
- ⚠️ TO ADD = Domain model has field, but UI doesn't display it yet
- All extracted fields require **correlation by CID** - single log entry doesn't
  contain all data
- PerfReport section should only show when `hasJson === true`
- PerfReport JSON extraction: when message starts with "PerfReport {", extract
  substring from "{" to end, parse as JSON
- Current UI shows raw JSON dump - Phase 2 should add structured visualization
- Biblical reference requires combining multiple log patterns from different
  entries with same CID
- Resources searched may need separate query to find related entries by CID

**Phase 1b Priority:**

1. Add client_ip and taskName display (simple direct fields)
2. Implement CID-based correlation service for multi-entry patterns
3. Add original/preprocessed/response message sections
4. Add biblical reference display

**Phase 2 Priority:**

5. Replace raw JSON dump with structured PerfReport visualization
6. Add waterfall timeline for spans
7. Add cost/token breakdown charts
8. Add resources searched display

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

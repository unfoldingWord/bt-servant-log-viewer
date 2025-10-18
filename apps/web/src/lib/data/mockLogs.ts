import type { LogEntry, Intent } from "@bt-log-viewer/domain";

/**
 * Mock log data for Phase 1a UI development
 *
 * Includes realistic sample data with:
 * - All log levels (TRACE, DEBUG, INFO, WARN, ERROR)
 * - Multiple intents (13 known types)
 * - Various languages (en, es, fr, pt, sw, ar)
 * - Different regions/countries
 * - Mix of entries with/without PerfReports
 * - Representative timestamps
 */

const KNOWN_INTENTS = [
  "get-bible-translation-assistance",
  "consult-fia-resources",
  "get-passage-summary",
  "get-passage-keywords",
  "get-translation-helps",
  "retrieve-scripture",
  "listen-to-scripture",
  "translate-scripture",
  "perform-unsupported-function",
  "retrieve-system-information",
  "set-response-language",
  "set-agentic-strength",
  "converse-with-bt-servant",
] as const;

// Reserved for future expansion - will be used in Phase 1b
// @ts-expect-error - Intentionally unused, reserved for future filtering features
const _LANGUAGES = ["en", "es", "fr", "pt", "sw", "ar", "zh", "hi", "ru"];
// @ts-expect-error - Intentionally unused, reserved for future filtering features
const _COUNTRIES = ["US", "MX", "FR", "BR", "KE", "EG", "CN", "IN", "RU"];

const LOGGERS = [
  "bt_servant_engine.apps.api.routes.webhooks",
  "bt_servant_engine.core.llm.agent",
  "bt_servant_engine.core.parser.message",
  "bt_servant_engine.services.translation",
  "bt_servant_engine.services.scripture",
  "bt_servant_engine.services.audio",
  "bt_servant_engine.middleware.auth",
  "bt_servant_engine.utils.metrics",
] as const;

// Helper to generate realistic timestamps over the last 7 days
const generateTimestamp = (daysAgo: number, hourOffset = 0): Date => {
  const now = new Date();
  now.setDate(now.getDate() - daysAgo);
  now.setHours(now.getHours() + hourOffset);
  return now;
};

// Helper to create realistic intents
const createIntent = (name: string, confidence?: number): Intent => ({
  name,
  confidence: confidence ?? 0.85 + Math.random() * 0.15,
  isKnown: (KNOWN_INTENTS as readonly string[]).includes(name),
});

// NOTE: PerfReport data omitted from Phase 1a mock data for type safety.
// Will be added in Phase 1b when integrating with real API data.

export const mockLogs = [
  // Recent activity - Day 0 (today)
  {
    id: "log_001",
    fileId: "file_2025_10_18",
    fileName: "bt_servant.log",
    ts: generateTimestamp(0, -1),
    level: "INFO",
    logger: LOGGERS[0],
    cid: "cid_a1b2c3d4",
    userId: "user_john_doe",
    message: 'text message from user_john_doe received: "How do I translate Genesis 1:1?"',
    hasJson: true,
    language: "en",
    ip: "192.168.1.100",
    location: { country: "US", region: "Maryland", confidence: 0.95 },
    message_original: "How do I translate Genesis 1:1?",
    message_preprocessed: "translate genesis 1 1",
    intents: [createIntent("get-bible-translation-assistance", 0.92)],
    reference_extracted: {
      raw: "Genesis 1:1",
      book: "Genesis",
      chapter: 1,
      startVerse: 1,
    },
    traceId: "trace_abc123",
    raw: { startLine: 1, endLine: 15 },
  },
  {
    id: "log_002",
    fileId: "file_2025_10_18",
    fileName: "bt_servant.log",
    ts: generateTimestamp(0, -2),
    level: "DEBUG",
    logger: LOGGERS[2],
    cid: "cid_a1b2c3d4",
    message: "Preprocessed message: translate genesis 1 1",
    hasJson: false,
    language: "en",
    raw: { startLine: 16, endLine: 16 },
  },
  {
    id: "log_003",
    fileId: "file_2025_10_18",
    fileName: "bt_servant.log",
    ts: generateTimestamp(0, -2),
    level: "INFO",
    logger: LOGGERS[3],
    cid: "cid_a1b2c3d4",
    message: "Translation assistance provided for Genesis 1:1",
    hasJson: false,
    resources_searched: [
      { id: "res_001", name: "Translation Notes", type: "tn" },
      { id: "res_002", name: "Translation Words", type: "tw" },
    ],
    final_message: "Here are some translation helps for Genesis 1:1...",
    raw: { startLine: 17, endLine: 18 },
  },

  // Spanish user - Day 0
  {
    id: "log_004",
    fileId: "file_2025_10_18",
    fileName: "bt_servant.log",
    ts: generateTimestamp(0, -3),
    level: "INFO",
    logger: LOGGERS[0],
    cid: "cid_e5f6g7h8",
    userId: "user_maria_lopez",
    message: 'text message from user_maria_lopez received: "¿Cómo puedo escuchar Juan 3:16?"',
    hasJson: true,
    language: "es",
    ip: "187.123.45.67",
    location: { country: "MX", region: "Mexico City", confidence: 0.88 },
    message_original: "¿Cómo puedo escuchar Juan 3:16?",
    message_preprocessed: "escuchar juan 3 16",
    intents: [createIntent("listen-to-scripture", 0.89)],
    reference_extracted: {
      raw: "Juan 3:16",
      book: "John",
      chapter: 3,
      startVerse: 16,
    },
    traceId: "trace_def456",
    raw: { startLine: 19, endLine: 32 },
  },

  // Error case - Day 0
  {
    id: "log_005",
    fileId: "file_2025_10_18",
    fileName: "bt_servant.log",
    ts: generateTimestamp(0, -4),
    level: "ERROR",
    logger: LOGGERS[4],
    cid: "cid_i9j0k1l2",
    message: "Failed to fetch scripture: API rate limit exceeded",
    hasJson: false,
    parse_errors: ["API rate limit exceeded"] as string[],
    raw: { startLine: 33, endLine: 35 },
  },

  // Warning - Day 0
  {
    id: "log_006",
    fileId: "file_2025_10_18",
    fileName: "bt_servant.log",
    ts: generateTimestamp(0, -5),
    level: "WARN",
    logger: LOGGERS[6],
    cid: "cid_m3n4o5p6",
    message: "Authentication token expires in 1 hour",
    hasJson: false,
    raw: { startLine: 36, endLine: 36 },
  },

  // Day 1 (yesterday) - French user
  {
    id: "log_007",
    fileId: "file_2025_10_17",
    fileName: "bt_servant.log",
    ts: generateTimestamp(1, -2),
    level: "INFO",
    logger: LOGGERS[0],
    cid: "cid_q7r8s9t0",
    userId: "user_pierre_martin",
    message: 'text message from user_pierre_martin received: "Résumé de Matthieu 5"',
    hasJson: true,
    language: "fr",
    ip: "82.45.123.78",
    location: { country: "FR", region: "Île-de-France", confidence: 0.91 },
    message_original: "Résumé de Matthieu 5",
    message_preprocessed: "résumé matthieu 5",
    intents: [createIntent("get-passage-summary", 0.87)],
    reference_extracted: {
      raw: "Matthieu 5",
      book: "Matthew",
      chapter: 5,
      startVerse: 1,
    },
    traceId: "trace_ghi789",
    raw: { startLine: 100, endLine: 114 },
  },

  // Day 1 - Multiple intents detected
  {
    id: "log_008",
    fileId: "file_2025_10_17",
    fileName: "bt_servant.log",
    ts: generateTimestamp(1, -4),
    level: "INFO",
    logger: LOGGERS[0],
    cid: "cid_u1v2w3x4",
    userId: "user_sarah_kim",
    message:
      'text message from user_sarah_kim received: "I want to translate and listen to Psalm 23"',
    hasJson: true,
    language: "en",
    ip: "98.234.12.45",
    location: { country: "US", region: "California", confidence: 0.94 },
    message_original: "I want to translate and listen to Psalm 23",
    intents: [createIntent("translate-scripture", 0.85), createIntent("listen-to-scripture", 0.78)],
    reference_extracted: {
      raw: "Psalm 23",
      book: "Psalms",
      chapter: 23,
      startVerse: 1,
    },
    traceId: "trace_jkl012",
    raw: { startLine: 115, endLine: 128 },
  },

  // Day 2 - Portuguese user
  {
    id: "log_009",
    fileId: "file_2025_10_16",
    fileName: "bt_servant.log",
    ts: generateTimestamp(2, -1),
    level: "INFO",
    logger: LOGGERS[0],
    cid: "cid_y5z6a7b8",
    userId: "user_lucas_silva",
    message: 'text message from user_lucas_silva received: "Palavras-chave para Romanos 8"',
    hasJson: true,
    language: "pt",
    ip: "200.123.45.67",
    location: { country: "BR", region: "São Paulo", confidence: 0.89 },
    message_original: "Palavras-chave para Romanos 8",
    intents: [createIntent("get-passage-keywords", 0.91)],
    reference_extracted: {
      raw: "Romanos 8",
      book: "Romans",
      chapter: 8,
      startVerse: 1,
    },
    traceId: "trace_mno345",
    raw: { startLine: 200, endLine: 213 },
  },

  // Day 2 - System information request
  {
    id: "log_010",
    fileId: "file_2025_10_16",
    fileName: "bt_servant.log",
    ts: generateTimestamp(2, -3),
    level: "INFO",
    logger: LOGGERS[0],
    cid: "cid_c9d0e1f2",
    userId: "user_admin",
    message: 'text message from user_admin received: "What version are you running?"',
    hasJson: true,
    language: "en",
    message_original: "What version are you running?",
    intents: [createIntent("retrieve-system-information", 0.95)],
    final_message: "BT Servant v2.1.0",
    raw: { startLine: 214, endLine: 220 },
  },

  // Day 3 - Swahili user
  {
    id: "log_011",
    fileId: "file_2025_10_15",
    fileName: "bt_servant.log",
    ts: generateTimestamp(3, -2),
    level: "INFO",
    logger: LOGGERS[0],
    cid: "cid_g3h4i5j6",
    userId: "user_amani_mwangi",
    message:
      'text message from user_amani_mwangi received: "Nataka msaada wa tafsiri kwa Yohana 1"',
    hasJson: true,
    language: "sw",
    ip: "41.90.12.34",
    location: { country: "KE", region: "Nairobi", confidence: 0.86 },
    message_original: "Nataka msaada wa tafsiri kwa Yohana 1",
    intents: [createIntent("get-bible-translation-assistance", 0.83)],
    reference_extracted: {
      raw: "Yohana 1",
      book: "John",
      chapter: 1,
      startVerse: 1,
    },
    traceId: "trace_pqr678",
    raw: { startLine: 300, endLine: 315 },
  },

  // Day 3 - Unsupported function
  {
    id: "log_012",
    fileId: "file_2025_10_15",
    fileName: "bt_servant.log",
    ts: generateTimestamp(3, -4),
    level: "WARN",
    logger: LOGGERS[0],
    cid: "cid_k7l8m9n0",
    userId: "user_test",
    message: 'text message from user_test received: "Can you help me write a sermon?"',
    hasJson: true,
    language: "en",
    message_original: "Can you help me write a sermon?",
    intents: [createIntent("perform-unsupported-function", 0.88)],
    final_message: "I'm designed to assist with Bible translation, not sermon writing.",
    raw: { startLine: 316, endLine: 322 },
  },

  // Day 4 - Set language preference
  {
    id: "log_013",
    fileId: "file_2025_10_14",
    fileName: "bt_servant.log",
    ts: generateTimestamp(4, -1),
    level: "INFO",
    logger: LOGGERS[0],
    cid: "cid_o1p2q3r4",
    userId: "user_ahmed_hassan",
    message: 'text message from user_ahmed_hassan received: "تكلم معي بالعربية"',
    hasJson: true,
    language: "ar",
    ip: "156.210.34.56",
    location: { country: "EG", region: "Cairo", confidence: 0.9 },
    message_original: "تكلم معي بالعربية",
    intents: [createIntent("set-response-language", 0.93)],
    final_message: "سأتحدث معك بالعربية",
    raw: { startLine: 400, endLine: 408 },
  },

  // Day 4 - Translation helps
  {
    id: "log_014",
    fileId: "file_2025_10_14",
    fileName: "bt_servant.log",
    ts: generateTimestamp(4, -3),
    level: "INFO",
    logger: LOGGERS[0],
    cid: "cid_s5t6u7v8",
    userId: "user_translator_team",
    message:
      'text message from user_translator_team received: "Translation helps for 1 Corinthians 13"',
    hasJson: true,
    language: "en",
    message_original: "Translation helps for 1 Corinthians 13",
    intents: [createIntent("get-translation-helps", 0.94)],
    reference_extracted: {
      raw: "1 Corinthians 13",
      book: "1 Corinthians",
      chapter: 13,
      startVerse: 1,
    },
    resources_searched: [
      { id: "res_003", name: "Translation Academy", type: "ta" },
      { id: "res_004", name: "Translation Questions", type: "tq" },
    ],
    traceId: "trace_stu901",
    raw: { startLine: 409, endLine: 425 },
  },

  // Day 5 - Consult FIA resources
  {
    id: "log_015",
    fileId: "file_2025_10_13",
    fileName: "bt_servant.log",
    ts: generateTimestamp(5, -2),
    level: "INFO",
    logger: LOGGERS[0],
    cid: "cid_w9x0y1z2",
    userId: "user_consultant",
    message:
      'text message from user_consultant received: "What does FIA say about covenant in Exodus 19?"',
    hasJson: true,
    language: "en",
    message_original: "What does FIA say about covenant in Exodus 19?",
    intents: [createIntent("consult-fia-resources", 0.9)],
    reference_extracted: {
      raw: "Exodus 19",
      book: "Exodus",
      chapter: 19,
      startVerse: 1,
    },
    resources_searched: [{ id: "res_005", name: "FIA Database", type: "fia" }],
    traceId: "trace_vwx234",
    raw: { startLine: 500, endLine: 516 },
  },

  // Day 5 - Trace example
  {
    id: "log_016",
    fileId: "file_2025_10_13",
    fileName: "bt_servant.log",
    ts: generateTimestamp(5, -4),
    level: "TRACE",
    logger: LOGGERS[1],
    cid: "cid_w9x0y1z2",
    message: "LLM agent initialized with temperature=0.7",
    hasJson: false,
    raw: { startLine: 517, endLine: 517 },
  },

  // Day 6 - Error with stack trace
  {
    id: "log_017",
    fileId: "file_2025_10_12",
    fileName: "bt_servant.log",
    ts: generateTimestamp(6, -1),
    level: "ERROR",
    logger: LOGGERS[5],
    cid: "cid_a3b4c5d6",
    message: "Audio service unavailable: Connection timeout",
    hasJson: false,
    parse_errors: ["Connection timeout after 30s"] as string[],
    raw: { startLine: 600, endLine: 608 },
  },

  // Day 6 - Conversation intent
  {
    id: "log_018",
    fileId: "file_2025_10_12",
    fileName: "bt_servant.log",
    ts: generateTimestamp(6, -3),
    level: "INFO",
    logger: LOGGERS[0],
    cid: "cid_e7f8g9h0",
    userId: "user_curious",
    message: 'text message from user_curious received: "Tell me about the book of Revelation"',
    hasJson: true,
    language: "en",
    message_original: "Tell me about the book of Revelation",
    intents: [createIntent("converse-with-bt-servant", 0.82)],
    final_message: "The book of Revelation is the last book of the Bible...",
    raw: { startLine: 609, endLine: 618 },
  },

  // Day 7 - Set agentic strength
  {
    id: "log_019",
    fileId: "file_2025_10_11",
    fileName: "bt_servant.log",
    ts: generateTimestamp(7, -2),
    level: "INFO",
    logger: LOGGERS[0],
    cid: "cid_i1j2k3l4",
    userId: "user_power_user",
    message: 'text message from user_power_user received: "Set agentic strength to high"',
    hasJson: true,
    language: "en",
    message_original: "Set agentic strength to high",
    intents: [createIntent("set-agentic-strength", 0.96)],
    final_message: "Agentic strength set to: high",
    raw: { startLine: 700, endLine: 706 },
  },

  // Day 7 - Retrieve scripture
  {
    id: "log_020",
    fileId: "file_2025_10_11",
    fileName: "bt_servant.log",
    ts: generateTimestamp(7, -4),
    level: "INFO",
    logger: LOGGERS[0],
    cid: "cid_m5n6o7p8",
    userId: "user_reader",
    message: 'text message from user_reader received: "Show me Philippians 4:13"',
    hasJson: true,
    language: "en",
    message_original: "Show me Philippians 4:13",
    intents: [createIntent("retrieve-scripture", 0.97)],
    reference_extracted: {
      raw: "Philippians 4:13",
      book: "Philippians",
      chapter: 4,
      startVerse: 13,
    },
    final_message: "I can do all things through Christ who strengthens me.",
    traceId: "trace_yza567",
    raw: { startLine: 707, endLine: 720 },
  },
] satisfies LogEntry[];

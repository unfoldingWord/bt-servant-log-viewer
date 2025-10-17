// Domain types - Pure business logic, no dependencies

export type LogLevel = "TRACE" | "DEBUG" | "INFO" | "WARN" | "ERROR";

export interface LogEntry {
  id: string;
  fileId: string;
  fileName: string;
  ts: Date;
  level: LogLevel;
  logger: string;
  cid?: string;
  message: string;
  hasJson: boolean;
  perfReport?: PerfReport;
  // Derived fields - all optional
  language?: string;
  ip?: string;
  location?: GeoLocation;
  message_original?: string;
  message_preprocessed?: string;
  intents?: Intent[];
  final_message?: string;
  reference_extracted?: BibleReference;
  resources_searched?: Resource[];
  traceId?: string;
  userId?: string;
  node?: string;
  raw: { startLine: number; endLine: number };
  parse_errors?: string[];
}

export interface GeoLocation {
  country?: string;
  region?: string;
  city?: string;
  lat?: number;
  lon?: number;
  confidence?: number;
}

export interface Intent {
  name: string;
  confidence?: number;
  parameters?: Record<string, unknown>;
  isKnown: boolean;
}

export interface BibleReference {
  raw: string;
  book: string;
  chapter: number;
  startVerse: number;
  endVerse?: number;
}

export interface Resource {
  id: string;
  name: string;
  type: string;
  searched_at?: Date;
}

export interface PerfReport {
  trace_id?: string;
  user_id?: string;
  total_ms?: number;
  total_s?: number;
  total_input_tokens?: number;
  total_output_tokens?: number;
  total_tokens?: number;
  total_cost_usd?: number;
  grouped_totals_by_intent?: Record<string, IntentMetrics>;
  spans?: Span[];
}

export interface IntentMetrics {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  input_cost_usd: number;
  output_cost_usd: number;
  total_cost_usd: number;
}

export interface Span {
  name: string;
  duration_ms: number;
  duration_se?: number;
  duration_percentage?: string;
  start_offset_ms?: number;
  input_tokens_expended?: number;
  output_tokens_expended?: number;
  total_tokens_expended?: number;
  token_percentage?: string;
}

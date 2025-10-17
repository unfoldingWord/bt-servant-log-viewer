// Parse worker - Skeleton for Web Worker implementation

export interface ParseWorkerMessage {
  type: "parse";
  content: string;
}

export interface ParseWorkerResponse {
  type: "result" | "error";
  data?: unknown;
  error?: string;
}

// TODO: Implement worker logic in Phase 1b

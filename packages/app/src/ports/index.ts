// Ports - Interfaces for external dependencies

import type { LogEntry } from "@bt-log-viewer/domain";

export interface ParsingPort {
  parse(content: string): Promise<LogEntry[]>;
}

export interface IndexPort {
  index(entries: LogEntry[]): Promise<void>;
  query(filters: unknown): Promise<LogEntry[]>;
}

export interface StoragePort {
  save(key: string, value: unknown): Promise<void>;
  load(key: string): Promise<unknown>;
}

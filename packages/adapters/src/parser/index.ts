// Parser adapter - Skeleton implementation

import type { LogEntry } from "@bt-log-viewer/domain";
import type { ParsingPort } from "@bt-log-viewer/app";

export class LogParser implements ParsingPort {
  parse(_content: string): Promise<LogEntry[]> {
    // TODO: Implement log parsing in Phase 2
    return Promise.resolve([]);
  }
}

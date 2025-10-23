// Parser adapter - Implementation for BT-Servant JSON logs

import type { LogEntry } from "@bt-log-viewer/domain";
import type { ParsingPort, ParseOptions } from "@bt-log-viewer/app";
import { JsonLineParser, type ParseOptions as JsonParseOptions } from "./JsonLineParser.js";

export class LogParser implements ParsingPort {
  private jsonParser: JsonLineParser;

  constructor() {
    this.jsonParser = new JsonLineParser();
  }

  parse(content: string, options?: ParseOptions): Promise<LogEntry[]> {
    const result = this.parseWithDiagnostics(content, options);
    return result.then((res) => res.entries);
  }

  parseWithDiagnostics(
    content: string,
    options?: ParseOptions
  ): Promise<ReturnType<JsonLineParser["parse"]>> {
    const parseOptions: JsonParseOptions = {
      fileId: options?.fileId ?? "unknown",
      fileName: options?.fileName ?? "unknown.log",
    };

    const result = this.jsonParser.parse(content, parseOptions);
    return Promise.resolve(result);
  }
}

// Re-export parser types and utilities
export { JsonLineParser } from "./JsonLineParser.js";
export type { ParseOptions, ParseResult, ParseError, ParseStats } from "./JsonLineParser.js";
export { extractDerivedFields } from "./PatternExtractors.js";
export type { DerivedFields } from "./PatternExtractors.js";

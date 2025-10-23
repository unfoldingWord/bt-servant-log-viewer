// JSON line parser for BT-Servant logs
// Parses newline-delimited JSON entries and extracts derived fields

import type { LogEntry, RawLogEntry, PerfReport, LogLevel } from "@bt-log-viewer/domain";
import { extractDerivedFields } from "./PatternExtractors.js";
import { nanoid } from "nanoid";

export interface ParseOptions {
  fileId: string;
  fileName: string;
}

export interface ParseResult {
  entries: LogEntry[];
  errors: ParseError[];
  stats: ParseStats;
}

export interface ParseError {
  line: number;
  error: string;
  raw: string;
}

export interface ParseStats {
  totalLines: number;
  successfulEntries: number;
  failedEntries: number;
  perfReportBlocks: number;
}

export class JsonLineParser {
  /**
   * Parse BT-Servant JSON log content into structured LogEntry objects
   */
  parse(content: string, options: ParseOptions): ParseResult {
    const lines = content.split("\n");
    const entries: LogEntry[] = [];
    const errors: ParseError[] = [];
    const stats: ParseStats = {
      totalLines: lines.length,
      successfulEntries: 0,
      failedEntries: 0,
      perfReportBlocks: 0,
    };

    let currentLine = 0;
    let currentPerfReportBlock: string[] = [];
    let perfReportStartLine = -1;
    let lastTimestamp: Date | undefined;

    while (currentLine < lines.length) {
      const line = lines[currentLine];

      // Guard against undefined
      if (!line) {
        currentLine++;
        continue;
      }

      // Skip empty lines
      if (!line.trim()) {
        currentLine++;
        continue;
      }

      // Check if this is the start of a PerfReport block
      if (line.trim().startsWith("PerfReport {")) {
        perfReportStartLine = currentLine;
        currentPerfReportBlock = [line.trim().substring("PerfReport ".length)];
        currentLine++;

        // Collect lines until we have balanced braces
        let braceCount = this.countBraces(currentPerfReportBlock.join("\n"));

        while (braceCount.open > braceCount.close && currentLine < lines.length) {
          const nextLine = lines[currentLine];
          if (nextLine !== undefined) {
            currentPerfReportBlock.push(nextLine);
          }
          braceCount = this.countBraces(currentPerfReportBlock.join("\n"));
          currentLine++;
        }

        // Try to parse the PerfReport JSON block
        const perfReportJson = currentPerfReportBlock.join("\n");
        try {
          const perfReport = JSON.parse(perfReportJson) as PerfReport;

          // Create a log entry for the PerfReport
          const perfReportEntry = this.createPerfReportEntry(
            perfReport,
            options,
            perfReportStartLine,
            currentLine - 1,
            lastTimestamp
          );
          entries.push(perfReportEntry);
          lastTimestamp = perfReportEntry.ts;
          stats.perfReportBlocks++;
          stats.successfulEntries++;
        } catch (error) {
          errors.push({
            line: perfReportStartLine + 1,
            error: `Failed to parse PerfReport JSON: ${error instanceof Error ? error.message : String(error)}`,
            raw: perfReportJson.substring(0, 200),
          });
          stats.failedEntries++;
        }

        currentPerfReportBlock = [];
        perfReportStartLine = -1;
        continue;
      }

      // Try to parse as standard JSON log entry
      try {
        const rawEntry = JSON.parse(line) as RawLogEntry;
        if (rawEntry.schema_version !== "1.0.0") {
          currentLine++;
          continue;
        }
        const logEntry = this.createLogEntry(rawEntry, options, currentLine);
        entries.push(logEntry);
        lastTimestamp = logEntry.ts;
        stats.successfulEntries++;
      } catch (error) {
        errors.push({
          line: currentLine + 1,
          error: `Failed to parse JSON: ${error instanceof Error ? error.message : String(error)}`,
          raw: line.substring(0, 200),
        });
        stats.failedEntries++;
      }

      currentLine++;
    }

    return { entries, errors, stats };
  }

  /**
   * Create a LogEntry from a RawLogEntry with derived field extraction
   */
  private createLogEntry(raw: RawLogEntry, options: ParseOptions, lineNumber: number): LogEntry {
    const parseErrors: string[] = [];

    // Parse timestamp
    let ts: Date;
    try {
      ts = this.parseTimestamp(raw.timestamp);
    } catch (error) {
      parseErrors.push(
        `Invalid timestamp: ${error instanceof Error ? error.message : String(error)}`
      );
      ts = new Date(); // Fallback to current time
    }

    // Validate log level
    const validLevels: LogLevel[] = ["TRACE", "DEBUG", "INFO", "WARN", "ERROR"];
    if (!validLevels.includes(raw.level)) {
      parseErrors.push(`Invalid log level: ${raw.level}`);
    }

    // Extract derived fields from message
    const derivedFields = extractDerivedFields(raw.message);

    // Check if message contains PerfReport JSON and extract it
    let perfReport: PerfReport | undefined;
    let hasPerfReportReference = false;

    if (raw.message.includes("PerfReport {")) {
      hasPerfReportReference = true;
      try {
        // Extract JSON from message: "PerfReport {..." -> "{..."
        const perfReportStart = raw.message.indexOf("PerfReport {");
        const perfReportJson = raw.message.substring(perfReportStart + "PerfReport ".length);
        perfReport = JSON.parse(perfReportJson) as PerfReport;
      } catch {
        // If parsing fails, just log it in parse_errors
        parseErrors.push("Failed to parse embedded PerfReport JSON");
      }
    }

    // Treat "-" as undefined for optional fields
    const cid = raw.cid && raw.cid !== "-" ? raw.cid : undefined;
    const userId = raw.user && raw.user !== "-" ? raw.user : undefined;
    const ip = raw.client_ip && raw.client_ip !== "-" ? raw.client_ip : undefined;

    return {
      id: nanoid(),
      fileId: options.fileId,
      fileName: options.fileName,
      ts,
      level: raw.level,
      logger: raw.logger,
      cid,
      message: raw.message,
      hasJson: hasPerfReportReference,
      perfReport,
      traceId: perfReport?.trace_id,
      userId: userId ?? perfReport?.user_id,
      ip,
      ...derivedFields,
      raw: { startLine: lineNumber, endLine: lineNumber },
      parse_errors: parseErrors.length > 0 ? parseErrors : undefined,
    };
  }

  /**
   * Create a LogEntry for a PerfReport block
   */
  private createPerfReportEntry(
    perfReport: PerfReport,
    options: ParseOptions,
    startLine: number,
    endLine: number,
    fallbackTimestamp: Date | undefined
  ): LogEntry {
    return {
      id: nanoid(),
      fileId: options.fileId,
      fileName: options.fileName,
      ts: fallbackTimestamp ?? new Date(),
      level: "INFO",
      logger: "bt_servant_engine.performance",
      cid: undefined,
      message: "Performance Report",
      hasJson: true,
      perfReport,
      traceId: perfReport.trace_id,
      userId: perfReport.user_id,
      raw: { startLine, endLine },
    };
  }

  /**
   * Parse BT-Servant timestamp format: "YYYY-MM-DD HH:MM:SS"
   */
  private parseTimestamp(timestamp: string): Date {
    // Format: "2025-10-18 23:08:31"
    const match = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/.exec(timestamp);

    if (!match) {
      throw new Error(`Invalid timestamp format: ${timestamp}`);
    }

    const [, year, month, day, hour, minute, second] = match;
    return new Date(
      Number(year),
      Number(month) - 1, // JavaScript months are 0-indexed
      Number(day),
      Number(hour),
      Number(minute),
      Number(second)
    );
  }

  /**
   * Count opening and closing braces in a string
   */
  private countBraces(str: string): { open: number; close: number } {
    let open = 0;
    let close = 0;
    let inString = false;
    let escapeNext = false;

    for (const char of str) {
      if (escapeNext) {
        escapeNext = false;
        continue;
      }

      if (char === "\\") {
        escapeNext = true;
        continue;
      }

      if (char === '"') {
        inString = !inString;
        continue;
      }

      if (!inString) {
        if (char === "{") open++;
        if (char === "}") close++;
      }
    }

    return { open, close };
  }
}

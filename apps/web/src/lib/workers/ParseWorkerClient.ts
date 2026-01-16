// Client wrapper for the parse worker
// Provides a Promise-based API for parsing in a Web Worker
// TEMPORARY: Worker disabled - using sync parsing while debugging

import type { ParseResult, ParseOptions } from "@bt-log-viewer/adapters";

export class ParseWorkerClient {
  /**
   * Parse synchronously (worker disabled for debugging)
   */
  private async parseSynchronously(content: string, options: ParseOptions): Promise<ParseResult> {
    const { JsonLineParser } = await import("@bt-log-viewer/adapters");
    const parser = new JsonLineParser();
    return parser.parse(content, options);
  }

  /**
   * Parse log content
   * TODO: Re-enable Web Worker once we fix the blocking issue
   */
  async parse(content: string, options: ParseOptions): Promise<ParseResult> {
    return this.parseSynchronously(content, options);
  }

  /**
   * Check if Web Workers are supported and working
   */
  readonly supported = false; // Worker disabled for debugging

  /**
   * Terminate the worker (no-op when worker disabled)
   */
  terminate(): void {
    // No-op - worker is disabled
  }
}

// Singleton instance
export const parseWorkerClient = new ParseWorkerClient();

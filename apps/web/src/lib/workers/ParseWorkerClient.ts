// Client wrapper for the parse worker
// Provides a Promise-based API for parsing in a Web Worker

import type { ParseResult, ParseOptions } from "@bt-log-viewer/adapters";
import type { ParseWorkerMessage, ParseWorkerResponse } from "./parse.worker.js";
import { nanoid } from "nanoid";

const PARSE_TIMEOUT_MS = 30000; // 30 second timeout for parsing

export class ParseWorkerClient {
  private worker: Worker | null = null;
  private pendingRequests = new Map<
    string,
    {
      resolve: (result: ParseResult) => void;
      reject: (error: Error) => void;
      timeoutId: ReturnType<typeof setTimeout>;
    }
  >();
  private isSupported: boolean;
  private workerFailed = false;

  constructor() {
    // Check if we're in a browser environment with Worker support
    this.isSupported = typeof window !== "undefined" && typeof Worker !== "undefined";
  }

  private getWorker(): Worker | null {
    if (this.workerFailed) {
      return null;
    }

    if (!this.worker) {
      if (!this.isSupported) {
        return null;
      }
      try {
        // Vite handles the worker URL transformation at build time
        this.worker = new Worker(new URL("./parse.worker.ts", import.meta.url), {
          type: "module",
        });
        this.worker.onmessage = this.handleMessage.bind(this);
        this.worker.onerror = this.handleError.bind(this);
      } catch {
        this.workerFailed = true;
        return null;
      }
    }
    return this.worker;
  }

  private handleMessage(event: MessageEvent<ParseWorkerResponse>): void {
    const { id, type, result, error } = event.data;
    const pending = this.pendingRequests.get(id);

    if (!pending) {
      return;
    }

    clearTimeout(pending.timeoutId);
    this.pendingRequests.delete(id);

    if (type === "error") {
      pending.reject(new Error(error ?? "Unknown worker error"));
    } else if (result) {
      pending.resolve(result);
    } else {
      pending.reject(new Error("Worker returned empty result"));
    }
  }

  private handleError(event: ErrorEvent): void {
    // Mark worker as failed so we fall back to sync parsing
    this.workerFailed = true;
    this.worker = null;

    // Reject all pending requests on worker error
    for (const [, pending] of this.pendingRequests) {
      clearTimeout(pending.timeoutId);
      pending.reject(new Error(`Worker error: ${event.message}`));
    }
    this.pendingRequests.clear();
  }

  /**
   * Parse synchronously (fallback when worker isn't available)
   */
  private async parseSynchronously(content: string, options: ParseOptions): Promise<ParseResult> {
    const { JsonLineParser } = await import("@bt-log-viewer/adapters");
    const parser = new JsonLineParser();
    return parser.parse(content, options);
  }

  /**
   * Parse log content using Web Worker (non-blocking)
   * Falls back to synchronous parsing if worker is unavailable
   */
  async parse(content: string, options: ParseOptions): Promise<ParseResult> {
    const worker = this.getWorker();

    // Fallback to sync if worker not available
    if (!worker) {
      return this.parseSynchronously(content, options);
    }

    return new Promise((resolve, reject) => {
      const id = nanoid();

      // Set timeout - if worker doesn't respond, fall back to sync
      const timeoutId = setTimeout(() => {
        const pending = this.pendingRequests.get(id);
        if (pending) {
          this.pendingRequests.delete(id);
          // Fall back to sync parsing on timeout
          this.parseSynchronously(content, options).then(resolve).catch(reject);
        }
      }, PARSE_TIMEOUT_MS);

      this.pendingRequests.set(id, { resolve, reject, timeoutId });

      const message: ParseWorkerMessage = {
        id,
        content,
        options,
      };

      try {
        worker.postMessage(message);
      } catch {
        clearTimeout(timeoutId);
        this.pendingRequests.delete(id);
        // Fall back to sync on postMessage failure
        this.parseSynchronously(content, options).then(resolve).catch(reject);
      }
    });
  }

  /**
   * Check if Web Workers are supported and working
   */
  get supported(): boolean {
    return this.isSupported && !this.workerFailed;
  }

  /**
   * Terminate the worker
   */
  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    // Reject any pending requests
    for (const [, pending] of this.pendingRequests) {
      clearTimeout(pending.timeoutId);
      pending.reject(new Error("Worker terminated"));
    }
    this.pendingRequests.clear();
  }
}

// Singleton instance
export const parseWorkerClient = new ParseWorkerClient();

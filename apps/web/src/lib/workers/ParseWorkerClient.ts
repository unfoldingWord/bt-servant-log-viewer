// Client wrapper for the parse worker
// Provides a Promise-based API for parsing in a Web Worker

import type { ParseResult, ParseOptions } from "@bt-log-viewer/adapters";
import type { ParseWorkerMessage, ParseWorkerResponse } from "./parse.worker.js";
import { nanoid } from "nanoid";

export class ParseWorkerClient {
  private worker: Worker | null = null;
  private pendingRequests = new Map<
    string,
    { resolve: (result: ParseResult) => void; reject: (error: Error) => void }
  >();
  private isSupported: boolean;

  constructor() {
    // Check if we're in a browser environment with Worker support
    this.isSupported = typeof window !== "undefined" && typeof Worker !== "undefined";
  }

  private getWorker(): Worker {
    if (!this.worker) {
      if (!this.isSupported) {
        throw new Error("Web Workers are not supported in this environment");
      }
      // Vite handles the worker URL transformation at build time
      this.worker = new Worker(new URL("./parse.worker.ts", import.meta.url), {
        type: "module",
      });
      this.worker.onmessage = this.handleMessage.bind(this);
      this.worker.onerror = this.handleError.bind(this);
    }
    return this.worker;
  }

  private handleMessage(event: MessageEvent<ParseWorkerResponse>): void {
    const { id, type, result, error } = event.data;
    const pending = this.pendingRequests.get(id);

    if (!pending) {
      return;
    }

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
    // Reject all pending requests on worker error
    for (const [id, pending] of this.pendingRequests) {
      pending.reject(new Error(`Worker error: ${event.message}`));
      this.pendingRequests.delete(id);
    }
  }

  /**
   * Parse log content using Web Worker (non-blocking)
   */
  async parse(content: string, options: ParseOptions): Promise<ParseResult> {
    if (!this.isSupported) {
      // Fallback: import parser directly (will block main thread)
      const { JsonLineParser } = await import("@bt-log-viewer/adapters");
      const parser = new JsonLineParser();
      return parser.parse(content, options);
    }

    return new Promise((resolve, reject) => {
      const id = nanoid();
      const worker = this.getWorker();

      this.pendingRequests.set(id, { resolve, reject });

      const message: ParseWorkerMessage = {
        id,
        content,
        options,
      };

      worker.postMessage(message);
    });
  }

  /**
   * Check if Web Workers are supported
   */
  get supported(): boolean {
    return this.isSupported;
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
    for (const [id, pending] of this.pendingRequests) {
      pending.reject(new Error("Worker terminated"));
      this.pendingRequests.delete(id);
    }
  }
}

// Singleton instance
export const parseWorkerClient = new ParseWorkerClient();

// Web Worker for parsing log files off the main thread
// This prevents UI freezing when parsing large log files

import { JsonLineParser, type ParseResult, type ParseOptions } from "@bt-log-viewer/adapters";

export interface ParseWorkerMessage {
  id: string;
  content: string;
  options: ParseOptions;
}

export interface ParseWorkerResponse {
  id: string;
  type: "result" | "error";
  result?: ParseResult;
  error?: string;
}

const parser = new JsonLineParser();

self.onmessage = (event: MessageEvent<ParseWorkerMessage>) => {
  const { id, content, options } = event.data;

  try {
    const result = parser.parse(content, options);
    const response: ParseWorkerResponse = {
      id,
      type: "result",
      result,
    };
    self.postMessage(response);
  } catch (err) {
    const response: ParseWorkerResponse = {
      id,
      type: "error",
      error: err instanceof Error ? err.message : String(err),
    };
    self.postMessage(response);
  }
};

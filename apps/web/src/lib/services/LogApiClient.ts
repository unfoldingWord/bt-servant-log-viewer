// Frontend API client for fetching logs from BT-Servant via our backend proxy
// The backend handles Bearer token authentication, keeping secrets secure

import type { LogEntry } from "@bt-log-viewer/domain";
import type { ParseError as ParserError, ParseStats as ParserStats } from "@bt-log-viewer/adapters";
import { parseWorkerClient } from "../workers/ParseWorkerClient.js";

const FETCH_TIMEOUT_MS = 60000; // 60 second timeout for fetching files

export type ServerEnvironment = "dev" | "qa" | "prod";

export interface ServerHealth {
  dev: boolean;
  qa: boolean;
  prod: boolean;
}

export interface ConfiguredServersResponse {
  servers: ServerEnvironment[];
}

export interface LogFileInfo {
  name: string;
  size_mb: number;
  size_bytes: number;
  modified: string;
  created: string;
  line_count: number | null;
  readable: boolean;
}

export interface LogFilesResponse {
  files: LogFileInfo[];
  count: number;
}

export interface ApiError {
  error: string;
  message: string;
  details?: unknown;
}

export interface ParseDiagnostics {
  filename: string;
  stats: ParserStats;
  errors: ParserError[];
}

/**
 * Client for fetching logs from BT-Servant
 * All requests go through our backend proxy which adds Bearer token authentication
 * Parsing happens in a Web Worker to prevent UI freezing
 */
export class LogApiClient {
  private baseUrl: string;
  private parseDiagnostics: ParseDiagnostics[];

  constructor(baseUrl?: string) {
    // Use relative URLs - API routes are served by the same SvelteKit app
    this.baseUrl = baseUrl ?? "";
    this.parseDiagnostics = [];
  }

  /**
   * Get list of configured servers (those with URL and token set)
   */
  async getConfiguredServers(): Promise<ServerEnvironment[]> {
    const url = `${this.baseUrl}/api/logs/servers`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to get configured servers: ${response.statusText}`);
      }
      const data = (await response.json()) as ConfiguredServersResponse;
      return data.servers;
    } catch (_error) {
      // If request fails, return all servers as fallback
      return ["dev", "qa", "prod"];
    }
  }

  /**
   * Check which servers are available
   * Returns an object with boolean values for each server environment
   */
  async checkHealth(): Promise<ServerHealth> {
    const url = `${this.baseUrl}/api/logs/health`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.statusText}`);
      }
      return await (response.json() as Promise<ServerHealth>);
    } catch (_error) {
      // If health check fails, assume all servers are unavailable
      return { dev: false, qa: false, prod: false };
    }
  }

  /**
   * List all available log files for a specific server
   */
  async listFiles(server: ServerEnvironment): Promise<LogFilesResponse> {
    const url = `${this.baseUrl}/api/logs/files?server=${server}`;

    const response = await fetch(url);

    if (!response.ok) {
      const error = (await response.json()) as ApiError;
      throw new Error(error.message || `Failed to list files: ${response.statusText}`);
    }

    return response.json() as Promise<LogFilesResponse>;
  }

  /**
   * Get log files from the last N days
   */
  async getRecentFiles(server: ServerEnvironment, days = 7, limit = 20): Promise<LogFilesResponse> {
    const url = `${this.baseUrl}/api/logs/recent?server=${server}&days=${String(days)}&limit=${String(limit)}`;

    const response = await fetch(url);

    if (!response.ok) {
      const error = (await response.json()) as ApiError;
      throw new Error(error.message || `Failed to get recent files: ${response.statusText}`);
    }

    return response.json() as Promise<LogFilesResponse>;
  }

  /**
   * Download a specific log file and parse it into LogEntry objects
   * Parsing happens in a Web Worker to prevent UI freezing
   */
  async downloadAndParseFile(server: ServerEnvironment, filename: string): Promise<LogEntry[]> {
    const trimmedFilename = filename.trim();
    const encodedFilename = encodeURIComponent(trimmedFilename);
    const url = `${this.baseUrl}/api/logs/file/${encodedFilename}?server=${server}`;

    // Use AbortController for fetch timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(url, { signal: controller.signal });

      if (!response.ok) {
        const error = (await response.json()) as ApiError;
        throw new Error(error.message || `Failed to download file: ${response.statusText}`);
      }

      const content = await response.text();

      // Parse the log file content using Web Worker (non-blocking)
      const result = await parseWorkerClient.parse(content, {
        fileId: trimmedFilename,
        fileName: trimmedFilename,
      });

      this.parseDiagnostics.push({
        filename: trimmedFilename,
        stats: result.stats,
        errors: result.errors,
      });

      return result.entries;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Download and parse multiple log files
   * Returns a flat array of all log entries from all files
   */
  async downloadAndParseFiles(
    server: ServerEnvironment,
    filenames: string[],
    onProgress?: (current: number, total: number, filename: string) => void
  ): Promise<LogEntry[]> {
    const allEntries: LogEntry[] = [];
    const fileOrder = new Map<string, number>();

    filenames.forEach((originalName, index) => {
      const name = originalName.trim();
      if (name.length > 0) {
        fileOrder.set(name, index);
      }
    });

    for (let i = 0; i < filenames.length; i++) {
      const originalName = filenames[i];
      if (!originalName) continue;

      const filename = originalName.trim();
      if (filename.length === 0) continue;

      onProgress?.(i + 1, filenames.length, filename);

      try {
        const entries = await this.downloadAndParseFile(server, filename);
        allEntries.push(...entries);
      } catch {
        // Continue with other files even if one fails
      }
    }

    allEntries.sort((a, b) => {
      const timeA = a.ts.getTime();
      const timeB = b.ts.getTime();

      const bothHaveTime = Number.isFinite(timeA) && Number.isFinite(timeB);
      if (bothHaveTime && timeA !== timeB) {
        return timeB - timeA; // Newest first
      }

      if (Number.isFinite(timeA) && !Number.isFinite(timeB)) {
        return -1;
      }

      if (!Number.isFinite(timeA) && Number.isFinite(timeB)) {
        return 1;
      }

      const fileIndexA = fileOrder.get(a.fileName) ?? Number.MAX_SAFE_INTEGER;
      const fileIndexB = fileOrder.get(b.fileName) ?? Number.MAX_SAFE_INTEGER;
      if (fileIndexA !== fileIndexB) {
        return fileIndexA - fileIndexB;
      }

      return a.raw.startLine - b.raw.startLine;
    });

    return allEntries;
  }

  /**
   * Load recent logs from a server with size limits to prevent overload
   * This is the primary method used by the UI on startup
   */
  async loadRecentLogs(
    server: ServerEnvironment,
    days = 3,
    options?: { limit?: number; maxSizeMb?: number },
    onProgress?: (current: number, total: number, filename: string) => void
  ): Promise<LogEntry[]> {
    const limit = options?.limit ?? 5;
    const maxSizeBytes = (options?.maxSizeMb ?? 10) * 1024 * 1024;

    // Get list of recent files (already sorted newest-first by bt-servant)
    const filesResponse = await this.getRecentFiles(server, days, limit);

    // Filter files by cumulative size to prevent memory overload
    let cumulativeSize = 0;
    const filesToLoad = filesResponse.files.filter((f) => {
      if (cumulativeSize + f.size_bytes > maxSizeBytes) {
        return false;
      }
      cumulativeSize += f.size_bytes;
      return true;
    });

    this.parseDiagnostics = [];

    // Download and parse files within size limit
    const filenames = filesToLoad.map((f) => f.name.trim());

    return this.downloadAndParseFiles(server, filenames, onProgress);
  }

  getParseDiagnostics(): ParseDiagnostics[] {
    return this.parseDiagnostics;
  }
}

// Singleton instance for use throughout the app
export const logApiClient = new LogApiClient();

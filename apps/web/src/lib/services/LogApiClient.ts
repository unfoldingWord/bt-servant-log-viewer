// Frontend API client for fetching logs from BT-Servant via our backend proxy
// The backend handles Bearer token authentication, keeping secrets secure

import type { LogEntry } from "@bt-log-viewer/domain";
import { LogParser } from "@bt-log-viewer/adapters";

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

/**
 * Client for fetching logs from BT-Servant
 * All requests go through our backend proxy which adds Bearer token authentication
 */
export class LogApiClient {
  private baseUrl: string;
  private parser: LogParser;

  constructor(baseUrl?: string) {
    // Default to localhost in development, or use PUBLIC_API_URL from environment
    this.baseUrl =
      baseUrl ??
      (typeof window !== "undefined" && window.location.origin.includes("localhost")
        ? "http://localhost:3001"
        : "");
    this.parser = new LogParser();
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
  async getRecentFiles(server: ServerEnvironment, days = 21): Promise<LogFilesResponse> {
    const url = `${this.baseUrl}/api/logs/recent?server=${server}&days=${String(days)}`;

    const response = await fetch(url);

    if (!response.ok) {
      const error = (await response.json()) as ApiError;
      throw new Error(error.message || `Failed to get recent files: ${response.statusText}`);
    }

    return response.json() as Promise<LogFilesResponse>;
  }

  /**
   * Download a specific log file and parse it into LogEntry objects
   */
  async downloadAndParseFile(server: ServerEnvironment, filename: string): Promise<LogEntry[]> {
    const url = `${this.baseUrl}/api/logs/file/${filename}?server=${server}`;

    const response = await fetch(url);

    if (!response.ok) {
      const error = (await response.json()) as ApiError;
      throw new Error(error.message || `Failed to download file: ${response.statusText}`);
    }

    const content = await response.text();

    // Parse the log file content
    const entries = await this.parser.parse(content, {
      fileId: filename,
      fileName: filename,
    });

    return entries;
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

    for (let i = 0; i < filenames.length; i++) {
      const filename = filenames[i];
      if (!filename) continue;

      onProgress?.(i + 1, filenames.length, filename);

      try {
        const entries = await this.downloadAndParseFile(server, filename);
        allEntries.push(...entries);
      } catch {
        // Continue with other files even if one fails
      }
    }

    return allEntries;
  }

  /**
   * Load the last 21 days of logs from a server
   * This is the primary method used by the UI on startup
   */
  async loadRecentLogs(
    server: ServerEnvironment,
    days = 21,
    onProgress?: (current: number, total: number, filename: string) => void
  ): Promise<LogEntry[]> {
    // Get list of recent files
    const filesResponse = await this.getRecentFiles(server, days);

    // Download and parse all files
    const filenames = filesResponse.files.map((f) => f.name);

    return this.downloadAndParseFiles(server, filenames, onProgress);
  }
}

// Singleton instance for use throughout the app
export const logApiClient = new LogApiClient();

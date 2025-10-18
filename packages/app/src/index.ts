// Application layer - Use cases and business logic

export * from "./ports/index.js";

// Placeholder for use cases
export interface ParseLogUseCase {
  execute(content: string): Promise<unknown>;
}

export interface IndexLogUseCase {
  execute(fileId: string): Promise<void>;
}

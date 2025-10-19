// Pattern extractors for deriving structured fields from log messages

import type { Intent, BibleReference, Resource } from "@bt-log-viewer/domain";

export interface DerivedFields {
  language?: string;
  message_original?: string;
  message_preprocessed?: string;
  final_message?: string;
  intents?: Intent[];
  reference_extracted?: BibleReference;
  resources_searched?: Resource[];
  traceId?: string;
  node?: string;
}

// Known intents for classification
const KNOWN_INTENTS = new Set([
  "get-bible-translation-assistance",
  "consult-fia-resources",
  "get-passage-summary",
  "get-passage-keywords",
  "get-translation-helps",
  "retrieve-scripture",
  "listen-to-scripture",
  "translate-scripture",
  "perform-unsupported-function",
  "retrieve-system-information",
  "set-response-language",
  "set-agentic-strength",
  "converse-with-bt-servant",
]);

/**
 * Extract all derived fields from a log message
 */
export function extractDerivedFields(message: string): DerivedFields {
  const fields: DerivedFields = {};

  // Extract language
  const language = extractLanguage(message);
  if (language) fields.language = language;

  // Extract messages (original, preprocessed, final)
  const messages = extractMessages(message);
  if (messages.original) fields.message_original = messages.original;
  if (messages.preprocessed) fields.message_preprocessed = messages.preprocessed;
  if (messages.final) fields.final_message = messages.final;

  // Extract intents
  const intents = extractIntents(message);
  if (intents.length > 0) fields.intents = intents;

  // Extract biblical reference
  const reference = extractBiblicalReference(message);
  if (reference) fields.reference_extracted = reference;

  // Extract resources searched
  const resources = extractResourcesSearched(message);
  if (resources.length > 0) fields.resources_searched = resources;

  // Extract trace ID
  const traceId = extractTraceId(message);
  if (traceId) fields.traceId = traceId;

  // Extract node name
  const node = extractNodeName(message);
  if (node) fields.node = node;

  return fields;
}

/**
 * Extract language code from message
 * Pattern: "language detection (model): en"
 */
function extractLanguage(message: string): string | undefined {
  const match = /language detection \(model\):\s*(\w+)/.exec(message);
  return match?.[1];
}

/**
 * Extract original and preprocessed messages
 * Pattern: "original_message: ...\nnew_message: ..."
 */
function extractMessages(message: string): {
  original?: string;
  preprocessed?: string;
  final?: string;
} {
  const result: {
    original?: string;
    preprocessed?: string;
    final?: string;
  } = {};

  // Extract original and preprocessed (appear together)
  const preprocessMatch = /original_message:\s*(.+?)\s*new_message:\s*(.+?)(?:\n|$)/s.exec(message);
  if (preprocessMatch?.[1] && preprocessMatch[2]) {
    result.original = preprocessMatch[1].trim();
    result.preprocessed = preprocessMatch[2].trim();
  }

  // Extract final response
  const finalMatch = /Response from bt_servant:\s*(.+?)$/s.exec(message);
  if (finalMatch?.[1]) {
    result.final = finalMatch[1].trim();
  }

  return result;
}

/**
 * Extract intents from message
 * Pattern: "extracted user intents: intent1, intent2"
 */
function extractIntents(message: string): Intent[] {
  const match = /extracted user intents:\s*(.+?)(?:\n|$)/.exec(message);
  if (!match?.[1]) return [];

  const intentNames = match[1]
    .split(",")
    .map((name) => name.trim())
    .filter((name) => name.length > 0);

  return intentNames.map((name) => ({
    name,
    isKnown: KNOWN_INTENTS.has(name),
  }));
}

/**
 * Extract biblical reference from message
 * Patterns:
 *   "[selection-helper] canonical_book=John"
 *   "[selection-helper] ranges=[(4, 1, 4, 3)]"
 */
function extractBiblicalReference(message: string): BibleReference | undefined {
  const bookMatch = /\[selection-helper\] canonical_book=(\w+)/.exec(message);
  const rangesMatch = /\[selection-helper\] ranges=\[\((\d+),\s*(\d+),\s*(\d+),\s*(\d+)\)\]/.exec(
    message
  );

  if (!bookMatch || !rangesMatch) return undefined;
  if (!bookMatch[1] || !rangesMatch[1] || !rangesMatch[2] || !rangesMatch[3] || !rangesMatch[4]) {
    return undefined;
  }

  const book = bookMatch[1];
  const startChapter = rangesMatch[1];
  const startVerse = rangesMatch[2];
  const endChapter = rangesMatch[3];
  const endVerse = rangesMatch[4];

  // Build raw reference string (e.g., "John 4:1-3")
  const raw =
    Number(startChapter) === Number(endChapter)
      ? `${book} ${startChapter}:${startVerse}-${endVerse}`
      : `${book} ${startChapter}:${startVerse}-${endChapter}:${endVerse}`;

  return {
    raw,
    book,
    chapter: Number(startChapter),
    startVerse: Number(startVerse),
    endVerse: Number(startChapter) === Number(endChapter) ? Number(endVerse) : undefined,
  };
}

/**
 * Extract resources searched from message
 * Pattern: "[translation-helps] selected {n} help entries"
 */
function extractResourcesSearched(message: string): Resource[] {
  const match = /\[translation-helps\] selected (\d+) help entries/.exec(message);
  if (!match) return [];

  const count = Number(match[1]);
  if (count === 0) return [];

  // Create placeholder resources (actual resource details may come from later log entries)
  return [
    {
      id: "translation-helps",
      name: "Translation Helps",
      type: "translation-helps",
    },
  ];
}

/**
 * Extract trace ID from PerfReport references
 * Pattern: "trace_id: ..."
 */
function extractTraceId(message: string): string | undefined {
  const match = /trace_id["\s:]+([a-f0-9-]+)/.exec(message);
  return match?.[1];
}

/**
 * Extract node name from span messages
 * Pattern: "node: something_node" or "[node_name]"
 */
function extractNodeName(message: string): string | undefined {
  const match = /node:\s*(\w+_node)/.exec(message);
  return match?.[1];
}

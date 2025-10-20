// JsonLineParser tests with real log samples

import { describe, it, expect } from "vitest";
import { JsonLineParser } from "./JsonLineParser.js";
import type { ParseOptions } from "./JsonLineParser.js";

describe("JsonLineParser", () => {
  const parser = new JsonLineParser();
  const options: ParseOptions = {
    fileId: "test-file-id",
    fileName: "test.log",
  };

  describe("Basic JSON Parsing", () => {
    it("should parse a simple log entry", () => {
      const content = `{"message": "Initializing bt servant engine...", "client_ip": "-", "taskName": "Task-2", "timestamp": "2025-10-18 23:08:00", "level": "INFO", "logger": "bt_servant_engine.apps.api.app", "cid": "-", "user": "-"}`;

      const result = parser.parse(content, options);

      expect(result.entries).toHaveLength(1);
      expect(result.errors).toHaveLength(0);

      const entry = result.entries[0]!;
      expect(entry.message).toBe("Initializing bt servant engine...");
      expect(entry.level).toBe("INFO");
      expect(entry.logger).toBe("bt_servant_engine.apps.api.app");
      expect(entry.ip).toBeUndefined(); // "-" is treated as undefined
      expect(entry.cid).toBeUndefined(); // "-" is treated as undefined
      expect(entry.userId).toBeUndefined(); // "-" is treated as undefined
      expect(entry.fileId).toBe("test-file-id");
      expect(entry.fileName).toBe("test.log");
    });

    it("should parse timestamp correctly", () => {
      const content = `{"message": "test", "client_ip": "-", "taskName": null, "timestamp": "2025-10-18 23:08:31", "level": "INFO", "logger": "test.logger", "cid": "abc123", "user": "testuser"}`;

      const result = parser.parse(content, options);
      const entry = result.entries[0]!;

      expect(entry.ts).toEqual(new Date(2025, 9, 18, 23, 8, 31)); // Month is 0-indexed
    });

    it("should handle multiple entries separated by newlines", () => {
      const content = [
        '{"message": "First entry", "client_ip": "-", "taskName": null, "timestamp": "2025-10-18 23:08:00", "level": "INFO", "logger": "test", "cid": "-", "user": "-"}',
        '{"message": "Second entry", "client_ip": "-", "taskName": null, "timestamp": "2025-10-18 23:08:01", "level": "DEBUG", "logger": "test", "cid": "-", "user": "-"}',
        '{"message": "Third entry", "client_ip": "-", "taskName": null, "timestamp": "2025-10-18 23:08:02", "level": "ERROR", "logger": "test", "cid": "-", "user": "-"}',
      ].join("\n");

      const result = parser.parse(content, options);

      expect(result.entries).toHaveLength(3);
      expect(result.entries[0]!.message).toBe("First entry");
      expect(result.entries[1]!.message).toBe("Second entry");
      expect(result.entries[2]!.message).toBe("Third entry");
      expect(result.entries[1]!.level).toBe("DEBUG");
      expect(result.entries[2]!.level).toBe("ERROR");
    });

    it("should skip empty lines", () => {
      const content = [
        '{"message": "First", "client_ip": "-", "taskName": null, "timestamp": "2025-10-18 23:08:00", "level": "INFO", "logger": "test", "cid": "-", "user": "-"}',
        "",
        '{"message": "Second", "client_ip": "-", "taskName": null, "timestamp": "2025-10-18 23:08:01", "level": "INFO", "logger": "test", "cid": "-", "user": "-"}',
        "   ",
        '{"message": "Third", "client_ip": "-", "taskName": null, "timestamp": "2025-10-18 23:08:02", "level": "INFO", "logger": "test", "cid": "-", "user": "-"}',
      ].join("\n");

      const result = parser.parse(content, options);

      expect(result.entries).toHaveLength(3);
      expect(result.stats.totalLines).toBe(5);
    });
  });

  describe("Language Extraction", () => {
    it("should extract language code from message", () => {
      const content = `{"message": "language detection (model): en", "client_ip": "2a03:2880:12ff:70::", "taskName": null, "timestamp": "2025-10-18 23:08:36", "level": "INFO", "logger": "bt_servant_engine.services.preprocessing", "cid": "5d0101ac8cf34fb5949217328533ccb3", "user": "kwlv1sXnUvYT9dnn"}`;

      const result = parser.parse(content, options);
      const entry = result.entries[0]!;

      expect(entry.language).toBe("en");
    });

    it("should handle messages without language info", () => {
      const content = `{"message": "Some other message", "client_ip": "-", "taskName": null, "timestamp": "2025-10-18 23:08:00", "level": "INFO", "logger": "test", "cid": "-", "user": "-"}`;

      const result = parser.parse(content, options);
      const entry = result.entries[0]!;

      expect(entry.language).toBeUndefined();
    });
  });

  describe("Message Extraction", () => {
    it("should extract original and preprocessed messages", () => {
      const content = `{"message": "original_message: hello bt servant!\\nnew_message: Hello, BT Servant!\\nreason_for_decision: The user's message is a simple greeting and does not require any changes or clarification.\\nmessage_changed: False", "client_ip": "2a03:2880:12ff:70::", "taskName": null, "timestamp": "2025-10-18 23:08:39", "level": "INFO", "logger": "bt_servant_engine.services.preprocessing", "cid": "5d0101ac8cf34fb5949217328533ccb3", "user": "kwlv1sXnUvYT9dnn"}`;

      const result = parser.parse(content, options);
      const entry = result.entries[0]!;

      expect(entry.message_original).toBe("hello bt servant!");
      expect(entry.message_preprocessed).toBe("Hello, BT Servant!");
    });

    it("should extract final response message", () => {
      const content = `{"message": "Response from bt_servant: Hello! How can I assist you today?", "client_ip": "2a03:2880:12ff:70::", "taskName": "Task-5", "timestamp": "2025-10-18 23:08:45", "level": "INFO", "logger": "bt_servant_engine.apps.api.routes.webhooks", "cid": "5d0101ac8cf34fb5949217328533ccb3", "user": "kwlv1sXnUvYT9dnn"}`;

      const result = parser.parse(content, options);
      const entry = result.entries[0]!;

      expect(entry.final_message).toBe("Hello! How can I assist you today?");
    });
  });

  describe("Intent Extraction", () => {
    it("should extract single intent", () => {
      const content = `{"message": "extracted user intents: converse-with-bt-servant", "client_ip": "2a03:2880:12ff:70::", "taskName": null, "timestamp": "2025-10-18 23:08:41", "level": "INFO", "logger": "bt_servant_engine.services.preprocessing", "cid": "5d0101ac8cf34fb5949217328533ccb3", "user": "kwlv1sXnUvYT9dnn"}`;

      const result = parser.parse(content, options);
      const entry = result.entries[0]!;

      expect(entry.intents).toHaveLength(1);
      expect(entry.intents![0]!.name).toBe("converse-with-bt-servant");
      expect(entry.intents![0]!.isKnown).toBe(true);
    });

    it("should extract multiple intents", () => {
      const content = `{"message": "extracted user intents: get-translation-helps, retrieve-scripture", "client_ip": "-", "taskName": null, "timestamp": "2025-10-18 23:08:00", "level": "INFO", "logger": "test", "cid": "-", "user": "-"}`;

      const result = parser.parse(content, options);
      const entry = result.entries[0]!;

      expect(entry.intents).toHaveLength(2);
      expect(entry.intents![0]!.name).toBe("get-translation-helps");
      expect(entry.intents![1]!.name).toBe("retrieve-scripture");
      expect(entry.intents![0]!.isKnown).toBe(true);
      expect(entry.intents![1]!.isKnown).toBe(true);
    });

    it("should mark unknown intents", () => {
      const content = `{"message": "extracted user intents: unknown-intent-name", "client_ip": "-", "taskName": null, "timestamp": "2025-10-18 23:08:00", "level": "INFO", "logger": "test", "cid": "-", "user": "-"}`;

      const result = parser.parse(content, options);
      const entry = result.entries[0]!;

      expect(entry.intents).toHaveLength(1);
      expect(entry.intents![0]!.name).toBe("unknown-intent-name");
      expect(entry.intents![0]!.isKnown).toBe(false);
    });
  });

  describe("User and CID Extraction", () => {
    it("should extract user ID", () => {
      const content = `{"message": "test", "client_ip": "-", "taskName": null, "timestamp": "2025-10-18 23:08:00", "level": "INFO", "logger": "test", "cid": "abc123", "user": "kwlv1sXnUvYT9dnn"}`;

      const result = parser.parse(content, options);
      const entry = result.entries[0]!;

      expect(entry.userId).toBe("kwlv1sXnUvYT9dnn");
      expect(entry.cid).toBe("abc123");
    });

    it("should handle hyphen as undefined", () => {
      const content = `{"message": "test", "client_ip": "-", "taskName": null, "timestamp": "2025-10-18 23:08:00", "level": "INFO", "logger": "test", "cid": "-", "user": "-"}`;

      const result = parser.parse(content, options);
      const entry = result.entries[0]!;

      expect(entry.cid).toBeUndefined();
      expect(entry.userId).toBeUndefined();
      expect(entry.ip).toBeUndefined();
    });
  });

  describe("PerfReport Parsing", () => {
    it("should parse PerfReport JSON block", () => {
      const perfReportContent = `PerfReport {
   "user_id":"kwlv1sXnUvYT9dnn",
   "trace_id":"wamid.test123",
   "total_ms":18697.78,
   "total_s":18.7,
   "total_input_tokens":12484,
   "total_output_tokens":227,
   "total_tokens":12711,
   "total_cost_usd":0.03348,
   "spans":[
      {
         "name":"brain:determine_query_language_node",
         "duration_ms":2048.52,
         "duration_se":2.05,
         "duration_percentage":"11.0%",
         "start_offset_ms":2515.06,
         "input_tokens_expended":345,
         "output_tokens_expended":6,
         "total_tokens_expended":351
      }
   ]
}`;

      const result = parser.parse(perfReportContent, options);

      expect(result.entries).toHaveLength(1);
      expect(result.stats.perfReportBlocks).toBe(1);

      const entry = result.entries[0]!;
      expect(entry.perfReport).toBeDefined();
      expect(entry.perfReport?.user_id).toBe("kwlv1sXnUvYT9dnn");
      expect(entry.perfReport?.trace_id).toBe("wamid.test123");
      expect(entry.perfReport?.total_ms).toBe(18697.78);
      expect(entry.perfReport?.total_tokens).toBe(12711);
      expect(entry.perfReport?.spans).toHaveLength(1);
      expect(entry.perfReport?.spans![0]!.name).toBe("brain:determine_query_language_node");
    });

    it("should handle PerfReport mixed with regular entries", () => {
      const content = [
        '{"message": "Regular entry 1", "client_ip": "-", "taskName": null, "timestamp": "2025-10-18 23:08:00", "level": "INFO", "logger": "test", "cid": "-", "user": "-"}',
        "PerfReport {",
        '   "user_id":"testuser",',
        '   "total_ms":100.0',
        "}",
        '{"message": "Regular entry 2", "client_ip": "-", "taskName": null, "timestamp": "2025-10-18 23:08:01", "level": "INFO", "logger": "test", "cid": "-", "user": "-"}',
      ].join("\n");

      const result = parser.parse(content, options);

      expect(result.entries).toHaveLength(3);
      expect(result.entries[0]!.message).toBe("Regular entry 1");
      expect(result.entries[1]!.message).toBe("Performance Report");
      expect(result.entries[1]!.perfReport).toBeDefined();
      expect(result.entries[2]!.message).toBe("Regular entry 2");
    });
  });

  describe("Error Handling", () => {
    it("should handle malformed JSON gracefully", () => {
      const content = [
        '{"message": "Valid entry", "client_ip": "-", "taskName": null, "timestamp": "2025-10-18 23:08:00", "level": "INFO", "logger": "test", "cid": "-", "user": "-"}',
        "{this is not valid json}",
        '{"message": "Another valid entry", "client_ip": "-", "taskName": null, "timestamp": "2025-10-18 23:08:01", "level": "INFO", "logger": "test", "cid": "-", "user": "-"}',
      ].join("\n");

      const result = parser.parse(content, options);

      expect(result.entries).toHaveLength(2);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]!.line).toBe(2);
      expect(result.stats.successfulEntries).toBe(2);
      expect(result.stats.failedEntries).toBe(1);
    });

    it("should handle invalid timestamp format", () => {
      const content = `{"message": "test", "client_ip": "-", "taskName": null, "timestamp": "invalid-timestamp", "level": "INFO", "logger": "test", "cid": "-", "user": "-"}`;

      const result = parser.parse(content, options);

      expect(result.entries).toHaveLength(1);
      const entry = result.entries[0]!;
      expect(entry.parse_errors).toBeDefined();
      expect(entry.parse_errors?.length).toBeGreaterThan(0);
      expect(entry.parse_errors?.[0]).toContain("Invalid timestamp");
    });

    it("should handle malformed PerfReport block", () => {
      const content = ["PerfReport {", '   "user_id":"test",', '   "invalid": json here', "}"].join(
        "\n"
      );

      const result = parser.parse(content, options);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]!.error).toContain("Failed to parse PerfReport");
    });
  });

  describe("Parse Statistics", () => {
    it("should provide accurate statistics", () => {
      const content = [
        '{"message": "Entry 1", "client_ip": "-", "taskName": null, "timestamp": "2025-10-18 23:08:00", "level": "INFO", "logger": "test", "cid": "-", "user": "-"}',
        '{"message": "Entry 2", "client_ip": "-", "taskName": null, "timestamp": "2025-10-18 23:08:01", "level": "INFO", "logger": "test", "cid": "-", "user": "-"}',
        "{invalid json}",
        "",
        '{"message": "Entry 3", "client_ip": "-", "taskName": null, "timestamp": "2025-10-18 23:08:02", "level": "INFO", "logger": "test", "cid": "-", "user": "-"}',
      ].join("\n");

      const result = parser.parse(content, options);

      expect(result.stats.totalLines).toBe(5);
      expect(result.stats.successfulEntries).toBe(3);
      expect(result.stats.failedEntries).toBe(1);
      expect(result.stats.perfReportBlocks).toBe(0);
    });
  });
});

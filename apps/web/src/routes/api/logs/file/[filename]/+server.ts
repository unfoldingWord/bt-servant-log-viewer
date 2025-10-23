// GET /api/logs/file/:filename?server=qa
// Download a specific log file
// Streams the response for efficient handling of large files

import { json } from "@sveltejs/kit";
import { z } from "zod";
import { getServerConfig, isValidServerEnvironment } from "$lib/server/btServant";
import type { RequestHandler } from "@sveltejs/kit";

const serverQuerySchema = z.object({
  server: z.enum(["dev", "qa", "prod"]).default("qa"),
});

const fileParamsSchema = z.object({
  filename: z
    .string()
    .trim()
    .min(1, "Filename is required")
    .refine((value) => !value.includes("/") && !value.includes("\\"), {
      message: "Filename must not contain path separators",
    })
    .refine((value) => !value.includes(".."), {
      message: "Filename must not include relative path segments",
    })
    .refine((value) => /^[a-zA-Z0-9._-]+$/.test(value), {
      message: "Filename contains invalid characters",
    })
    .refine((value) => /\.log(?:[._-][a-zA-Z0-9_-]+)*$/i.test(value), {
      message: "Filename must end with .log and optional rotated/compressed suffixes",
    }),
});

export const GET: RequestHandler = async ({ params, url }) => {
  try {
    const { filename } = fileParamsSchema.parse(params);
    const serverParam = url.searchParams.get("server") ?? "qa";
    const { server } = serverQuerySchema.parse({ server: serverParam });

    if (!isValidServerEnvironment(server)) {
      return json(
        { error: "Invalid server parameter. Must be one of: dev, qa, prod" },
        { status: 400 }
      );
    }

    const config = getServerConfig(server);
    const apiUrl = `${config.url}/admin/logs/files/${encodeURIComponent(filename)}`;

    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${config.token}`,
      },
    });

    if (!response.ok) {
      return json(
        { error: `BT-Servant API error: ${response.statusText}` },
        { status: response.status }
      );
    }

    // Stream the file content
    const contentType = response.headers.get("content-type") ?? "text/plain";
    const contentLength = response.headers.get("content-length");

    const headers: Record<string, string> = {
      "Content-Type": contentType,
    };

    if (contentLength) {
      headers["Content-Length"] = contentLength;
    }

    // Return the response body as a stream
    if (response.body) {
      return new Response(response.body, { headers });
    }

    // Fallback to text if no body stream
    const text = await response.text();
    return new Response(text, { headers });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return json({ error: "Invalid parameters", details: err.issues }, { status: 400 });
    }
    return json({ error: "Internal server error" }, { status: 500 });
  }
};

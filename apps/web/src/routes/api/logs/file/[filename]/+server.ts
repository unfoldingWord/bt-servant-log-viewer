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
  filename: z.string().regex(/^[a-zA-Z0-9._-]+\.log$/),
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
    const apiUrl = `${config.url}/admin/logs/files/${filename}`;

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
      return json({ error: "Invalid parameters" }, { status: 400 });
    }
    return json({ error: "Internal server error" }, { status: 500 });
  }
};

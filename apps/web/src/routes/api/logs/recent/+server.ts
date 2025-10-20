// GET /api/logs/recent?server=qa&days=21
// Get log files from the last N days

import { json } from "@sveltejs/kit";
import { z } from "zod";
import { getServerConfig, isValidServerEnvironment } from "$lib/server/btServant";
import type { RequestHandler } from "@sveltejs/kit";

const recentLogsQuerySchema = z.object({
  server: z.enum(["dev", "qa", "prod"]).default("qa"),
  days: z.coerce.number().int().min(1).max(90).default(21),
});

export const GET: RequestHandler = async ({ url }) => {
  try {
    const serverParam = url.searchParams.get("server") ?? "qa";
    const daysParam = url.searchParams.get("days") ?? "21";

    const { server, days } = recentLogsQuerySchema.parse({
      server: serverParam,
      days: daysParam,
    });

    if (!isValidServerEnvironment(server)) {
      return json(
        { error: "Invalid server parameter. Must be one of: dev, qa, prod" },
        { status: 400 }
      );
    }

    const config = getServerConfig(server);
    const apiUrl = `${config.url}/admin/logs/recent?days=${String(days)}`;

    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${config.token}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return json(
        { error: `BT-Servant API error: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = (await response.json()) as unknown;
    return json(data);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return json({ error: "Invalid query parameters" }, { status: 400 });
    }
    return json({ error: "Internal server error" }, { status: 500 });
  }
};

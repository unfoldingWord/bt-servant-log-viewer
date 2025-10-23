// Proxy routes for BT-Servant log API
// These routes add Bearer token authentication and forward requests to BT-Servant

import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import {
  getServerConfig,
  isValidServerEnvironment,
  getAllServerEnvironments,
  getConfiguredServers,
  type ServerEnvironment,
} from "../config/btServant.js";

// Query parameter schemas
const serverQuerySchema = z.object({
  server: z.enum(["dev", "qa", "prod"]).default("qa"),
});

const recentLogsQuerySchema = z.object({
  server: z.enum(["dev", "qa", "prod"]).default("qa"),
  days: z.coerce.number().int().min(1).max(90).default(21),
});

const fileParamsSchema = z.object({
  filename: z
    .string()
    .trim()
    .refine((value) => value.length > 0, {
      message: "Filename is required",
    })
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

/**
 * Check if a server is available by calling /alive endpoint
 * Note: /alive uses a different bearer token than /admin/logs endpoints
 */
async function checkServerHealth(server: ServerEnvironment, signal: AbortSignal): Promise<boolean> {
  try {
    const config = getServerConfig(server);
    const url = `${config.url}/alive`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${config.aliveToken}`,
        Accept: "application/json",
      },
      signal,
    });

    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Register log proxy routes
 * These routes proxy requests to BT-Servant API with Bearer token authentication
 */
export function logRoutes(fastify: FastifyInstance): void {
  /**
   * GET /api/logs/servers
   * Get list of configured servers (those with URL and token set)
   * Returns { servers: ["dev", "qa", "prod"] }
   */
  fastify.get("/api/logs/servers", async (_request, reply) => {
    const servers = getConfiguredServers();
    return await reply.send({ servers });
  });

  /**
   * GET /api/logs/health
   * Check which servers are available
   * Returns { dev: boolean, qa: boolean, prod: boolean }
   */
  fastify.get("/api/logs/health", async (_request, reply) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, 5000); // 5 second timeout per server

    try {
      const environments = getAllServerEnvironments();
      const healthChecks = await Promise.all(
        environments.map(async (env) => {
          const isHealthy = await checkServerHealth(env, controller.signal);
          return [env, isHealthy] as const;
        })
      );

      const health = Object.fromEntries(healthChecks);
      return await reply.send(health);
    } finally {
      clearTimeout(timeout);
    }
  });

  /**
   * GET /api/logs/files?server=qa
   * List all available log files
   */
  fastify.get(
    "/api/logs/files",
    async (
      request: FastifyRequest<{ Querystring: z.infer<typeof serverQuerySchema> }>,
      reply: FastifyReply
    ) => {
      try {
        const { server } = serverQuerySchema.parse(request.query);

        if (!isValidServerEnvironment(server)) {
          return await reply.code(400).send({
            error: "Invalid server parameter",
            message: `Server must be one of: dev, qa, prod`,
          });
        }

        const config = getServerConfig(server);
        const url = `${config.url}/admin/logs/files`;

        fastify.log.info({ url, server }, "Fetching log files list");

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${config.token}`,
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          fastify.log.error(
            { status: response.status, statusText: response.statusText },
            "BT-Servant API error"
          );

          return await reply.code(response.status).send({
            error: "BT-Servant API error",
            message: response.statusText,
          });
        }

        const data = (await response.json()) as unknown;
        return await reply.send(data);
      } catch (error) {
        fastify.log.error({ error }, "Error fetching log files");

        if (error instanceof z.ZodError) {
          return reply.code(400).send({
            error: "Invalid query parameters",
            details: error.issues,
          });
        }

        return reply.code(500).send({
          error: "Internal server error",
          message: error instanceof Error ? error.message : "Unknown error occurred",
        });
      }
    }
  );

  /**
   * GET /api/logs/recent?server=qa&days=21
   * Get log files from the last N days
   */
  fastify.get(
    "/api/logs/recent",
    async (
      request: FastifyRequest<{
        Querystring: z.infer<typeof recentLogsQuerySchema>;
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { server, days } = recentLogsQuerySchema.parse(request.query);

        if (!isValidServerEnvironment(server)) {
          return await reply.code(400).send({
            error: "Invalid server parameter",
            message: `Server must be one of: dev, qa, prod`,
          });
        }

        const config = getServerConfig(server);
        const url = `${config.url}/admin/logs/recent?days=${String(days)}`;

        fastify.log.info({ url, server, days }, "Fetching recent log files");

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${config.token}`,
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          fastify.log.error(
            { status: response.status, statusText: response.statusText },
            "BT-Servant API error"
          );

          return await reply.code(response.status).send({
            error: "BT-Servant API error",
            message: response.statusText,
          });
        }

        const data = (await response.json()) as unknown;
        return await reply.send(data);
      } catch (error) {
        fastify.log.error({ error }, "Error fetching recent log files");

        if (error instanceof z.ZodError) {
          return reply.code(400).send({
            error: "Invalid query parameters",
            details: error.errors,
          });
        }

        return reply.code(500).send({
          error: "Internal server error",
          message: error instanceof Error ? error.message : "Unknown error occurred",
        });
      }
    }
  );

  /**
   * GET /api/logs/file/:filename?server=qa
   * Download a specific log file
   * Streams the response for efficient handling of large files
   */
  fastify.get(
    "/api/logs/file/:filename",
    async (
      request: FastifyRequest<{
        Params: z.infer<typeof fileParamsSchema>;
        Querystring: z.infer<typeof serverQuerySchema>;
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { filename } = fileParamsSchema.parse(request.params);
        const { server } = serverQuerySchema.parse(request.query);

        if (!isValidServerEnvironment(server)) {
          return await reply.code(400).send({
            error: "Invalid server parameter",
            message: `Server must be one of: dev, qa, prod`,
          });
        }

        const config = getServerConfig(server);
        const url = `${config.url}/admin/logs/files/${filename}`;

        fastify.log.info({ url, server, filename }, "Downloading log file");

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${config.token}`,
          },
        });

        if (!response.ok) {
          fastify.log.error(
            { status: response.status, statusText: response.statusText },
            "BT-Servant API error"
          );

          return await reply.code(response.status).send({
            error: "BT-Servant API error",
            message: response.statusText,
          });
        }

        // Stream the file content
        const contentType = response.headers.get("content-type") ?? "text/plain";
        const contentLength = response.headers.get("content-length");

        reply.header("Content-Type", contentType);
        if (contentLength) {
          reply.header("Content-Length", contentLength);
        }

        // Stream response body
        if (response.body) {
          return await reply.send(response.body);
        }

        // Fallback to text if no body stream
        const text = await response.text();
        return await reply.send(text);
      } catch (error) {
        fastify.log.error({ error }, "Error downloading log file");

        if (error instanceof z.ZodError) {
          return reply.code(400).send({
            error: "Invalid parameters",
            details: error.issues,
          });
        }

        return reply.code(500).send({
          error: "Internal server error",
          message: error instanceof Error ? error.message : "Unknown error occurred",
        });
      }
    }
  );
}

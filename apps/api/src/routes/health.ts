import { FastifyPluginAsync } from "fastify";
import { z } from "zod";

const HealthResponseSchema = z.object({
  status: z.literal("ok"),
  timestamp: z.string(),
  uptime: z.number(),
});

const MetricsResponseSchema = z.object({
  uptime: z.number(),
  memory: z.object({
    heapUsed: z.number(),
    heapTotal: z.number(),
    external: z.number(),
    rss: z.number(),
  }),
  cpu: z.object({
    user: z.number(),
    system: z.number(),
  }),
});

export const healthRoutes: FastifyPluginAsync = async (fastify): Promise<void> => {
  // Health check endpoint
  fastify.get("/healthz", () => {
    return HealthResponseSchema.parse({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // Metrics endpoint
  fastify.get("/metrics", () => {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return MetricsResponseSchema.parse({
      uptime: process.uptime(),
      memory: {
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external,
        rss: memUsage.rss,
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
    });
  });
};

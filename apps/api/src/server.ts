import Fastify from "fastify";
import cors from "@fastify/cors";
import { healthRoutes } from "./routes/health.js";

const server = Fastify({
  logger: {
    level: process.env["LOG_LEVEL"] ?? "info",
  },
});

// Register CORS
await server.register(cors, {
  origin: process.env["CORS_ORIGIN"] ?? true,
});

// Register routes
await server.register(healthRoutes);

// Graceful shutdown
const handleShutdown = async (): Promise<void> => {
  await server.close();
  process.exit(0);
};

process.on("SIGINT", () => void handleShutdown());
process.on("SIGTERM", () => void handleShutdown());

// Start server
const start = async (): Promise<void> => {
  try {
    const port = Number(process.env["PORT"]) || 3001;
    const host = process.env["HOST"] ?? "0.0.0.0";

    await server.listen({ port, host });
    server.log.info(`API server running at http://${host}:${String(port)}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

void start();

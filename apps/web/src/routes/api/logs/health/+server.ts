// GET /api/logs/health
// Check which servers are available
// Returns { dev: boolean, qa: boolean, prod: boolean }

import { json } from "@sveltejs/kit";
import { getAllServerEnvironments, checkServerHealth } from "$lib/server/btServant";
import type { RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = async () => {
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
    return json(health);
  } finally {
    clearTimeout(timeout);
  }
};

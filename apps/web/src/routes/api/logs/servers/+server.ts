// GET /api/logs/servers
// Returns list of configured servers (those with URL and token set)

import { json } from "@sveltejs/kit";
import { getConfiguredServers } from "$lib/server/btServant";
import type { RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = () => {
  const servers = getConfiguredServers();
  return json({ servers });
};

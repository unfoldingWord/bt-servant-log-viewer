// BT-Servant API configuration with environment variable management
// This file is server-only and never exposed to the browser

export type ServerEnvironment = "dev" | "qa" | "prod";

interface BtServantConfig {
  url: string;
  token: string;
  aliveToken: string;
}

interface BtServantConfigs {
  dev: BtServantConfig;
  qa: BtServantConfig;
  prod: BtServantConfig;
}

/**
 * BT-Servant API configuration loaded from environment variables
 * Tokens are kept on the backend and never exposed to the browser
 *
 * Note: aliveToken is for /alive health check endpoint (different from admin logs token)
 */
const btServantConfig: BtServantConfigs = {
  dev: {
    url: process.env["BT_SERVANT_DEV_URL"] ?? "http://localhost:8080",
    token: process.env["BT_SERVANT_DEV_TOKEN"] ?? "",
    aliveToken: process.env["BT_SERVANT_DEV_ALIVE_TOKEN"] ?? "",
  },
  qa: {
    url: process.env["BT_SERVANT_QA_URL"] ?? "https://qa.servant.bible",
    token: process.env["BT_SERVANT_QA_TOKEN"] ?? "",
    aliveToken: process.env["BT_SERVANT_QA_ALIVE_TOKEN"] ?? "",
  },
  prod: {
    url: process.env["BT_SERVANT_PROD_URL"] ?? "https://app.servant.bible",
    token: process.env["BT_SERVANT_PROD_TOKEN"] ?? "",
    aliveToken: process.env["BT_SERVANT_PROD_ALIVE_TOKEN"] ?? "",
  },
} as const;

/**
 * Validate that all required environment variables are set
 * Call this at server startup to fail fast if misconfigured
 */
export function validateBtServantConfig(): void {
  const errors: string[] = [];

  // Check each environment
  const environments: ServerEnvironment[] = ["dev", "qa", "prod"];

  for (const env of environments) {
    const config = btServantConfig[env];

    if (!config.url) {
      errors.push(`Missing BT_SERVANT_${env.toUpperCase()}_URL environment variable`);
    }

    if (!config.token) {
      errors.push(`Missing BT_SERVANT_${env.toUpperCase()}_TOKEN environment variable`);
    }

    if (!config.aliveToken) {
      errors.push(`Missing BT_SERVANT_${env.toUpperCase()}_ALIVE_TOKEN environment variable`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`BT-Servant configuration validation failed:\n${errors.join("\n")}`);
  }
}

/**
 * Get configuration for a specific server environment
 * Throws error if server parameter is invalid
 */
export function getServerConfig(server: string): BtServantConfig {
  if (!isValidServerEnvironment(server)) {
    throw new Error(`Invalid server environment: ${server}. Must be one of: dev, qa, prod`);
  }

  return btServantConfig[server];
}

/**
 * Type guard to validate server environment parameter
 */
export function isValidServerEnvironment(server: string): server is ServerEnvironment {
  return server === "dev" || server === "qa" || server === "prod";
}

/**
 * Get all configured server environments
 */
export function getAllServerEnvironments(): ServerEnvironment[] {
  return ["dev", "qa", "prod"];
}

/**
 * Check if a server has URL, token, and aliveToken configured
 */
function isServerConfigured(server: ServerEnvironment): boolean {
  const config = btServantConfig[server];
  return Boolean(config.url && config.token && config.aliveToken);
}

/**
 * Get list of servers that have all required credentials configured
 */
export function getConfiguredServers(): ServerEnvironment[] {
  return getAllServerEnvironments().filter(isServerConfigured);
}

/**
 * Check if a server is available by calling /alive endpoint
 * Note: /alive uses a different bearer token than /admin/logs endpoints
 */
export async function checkServerHealth(
  server: ServerEnvironment,
  signal: AbortSignal
): Promise<boolean> {
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

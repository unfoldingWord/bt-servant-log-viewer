// BT-Servant API configuration with environment variable management

export type ServerEnvironment = "dev" | "qa" | "prod";

interface BtServantConfig {
  url: string;
  token: string;
}

interface BtServantConfigs {
  dev: BtServantConfig;
  qa: BtServantConfig;
  prod: BtServantConfig;
}

/**
 * BT-Servant API configuration loaded from environment variables
 * Tokens are kept on the backend and never exposed to the browser
 */
const btServantConfig: BtServantConfigs = {
  dev: {
    url: process.env["BT_SERVANT_DEV_URL"] ?? "http://localhost:8080",
    token: process.env["BT_SERVANT_DEV_TOKEN"] ?? "",
  },
  qa: {
    url: process.env["BT_SERVANT_QA_URL"] ?? "https://qa.servant.bible",
    token: process.env["BT_SERVANT_QA_TOKEN"] ?? "",
  },
  prod: {
    url: process.env["BT_SERVANT_PROD_URL"] ?? "https://app.servant.bible",
    token: process.env["BT_SERVANT_PROD_TOKEN"] ?? "",
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
    throw new Error(`Invalid server environment: ${server}. Must be one of: qa, prod, local`);
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
 * Check if a server has both URL and token configured
 */
function isServerConfigured(server: ServerEnvironment): boolean {
  const config = btServantConfig[server];
  return Boolean(config.url && config.token);
}

/**
 * Get list of servers that have both URL and token configured
 */
export function getConfiguredServers(): ServerEnvironment[] {
  return getAllServerEnvironments().filter(isServerConfigured);
}

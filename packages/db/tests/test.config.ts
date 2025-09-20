import { config } from "dotenv";
import { expand } from "dotenv-expand";

// Load environment variables for testing
expand(config({ path: "../../.env" }));

// Test configuration
export const testConfig = {
  // Database configuration
  database: {
    url: process.env.DATABASE_URL!,
    rlsUrl: process.env.RLS_CLIENT_DATABASE_URL!,
    enableRls: process.env.ENABLE_RLS === "true",
  },
  
  // Test settings
  test: {
    timeout: 30000, // 30 seconds timeout for tests
    retries: 3, // Retry failed tests up to 3 times
    parallel: false, // Run tests sequentially to avoid database conflicts
  },
  
  // Cleanup settings
  cleanup: {
    truncateTables: true, // Truncate tables between tests
    resetSequences: true, // Reset sequences after truncation
  },
};

// Validate required environment variables
const requiredEnvVars = ["DATABASE_URL"];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(", ")}`);
}

export default testConfig;

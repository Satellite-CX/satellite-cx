#!/usr/bin/env bun

import { spawn } from "bun";
import { existsSync } from "fs";
import { join } from "path";

// Test configuration
const testConfig = {
  timeout: 30000,
  retries: 3,
  parallel: false,
  reporter: "verbose",
};

// Test files to run
const testFiles = [
  "tests/setup.ts",
  "tests/organization.test.ts",
  "tests/constraints.test.ts",
  "tests/rls.test.ts",
  "tests/workflow.test.ts",
];

// Environment validation
function validateEnvironment() {
  const requiredEnvVars = ["DATABASE_URL"];
  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missingEnvVars.length > 0) {
    console.error(`❌ Missing required environment variables: ${missingEnvVars.join(", ")}`);
    console.error("Please set up your .env file with the required variables.");
    process.exit(1);
  }
  
  console.log("✅ Environment variables validated");
}

// Check if test files exist
function validateTestFiles() {
  const missingFiles = testFiles.filter(file => !existsSync(join(process.cwd(), file)));
  
  if (missingFiles.length > 0) {
    console.error(`❌ Missing test files: ${missingFiles.join(", ")}`);
    process.exit(1);
  }
  
  console.log("✅ Test files validated");
}

// Run tests using pnpm workspace filter
async function runTestsWithPnpm() {
  console.log("🧪 Starting database schema tests with pnpm workspace...\n");
  
  // Validate environment and files
  validateEnvironment();
  validateTestFiles();
  
  try {
    console.log("📦 Running tests with pnpm workspace filter...");
    
    const result = await spawn({
      cmd: ["pnpm", "run", "test", "--filter", "@repo/db"],
      cwd: join(process.cwd(), "../.."), // Go to workspace root
      stdio: ["inherit", "inherit", "inherit"],
    });
    
    if (result.exitCode !== 0) {
      console.error("❌ Tests failed");
      process.exit(1);
    }
    
    console.log("✅ All tests passed!");
  } catch (error) {
    console.error("❌ Error running tests:", error);
    process.exit(1);
  }
}

// Run tests directly with bun
async function runTestsDirectly() {
  console.log("🧪 Starting database schema tests directly...\n");
  
  // Validate environment and files
  validateEnvironment();
  validateTestFiles();
  
  // Run each test file
  for (const testFile of testFiles) {
    console.log(`\n📁 Running ${testFile}...`);
    
    try {
      const result = await spawn({
        cmd: ["bun", "test", testFile, "--timeout", testConfig.timeout.toString(), "--reporter", testConfig.reporter],
        cwd: process.cwd(),
        stdio: ["inherit", "inherit", "inherit"],
      });
      
      if (result.exitCode !== 0) {
        console.error(`❌ Tests failed for ${testFile}`);
        process.exit(1);
      }
      
      console.log(`✅ Tests passed for ${testFile}`);
    } catch (error) {
      console.error(`❌ Error running ${testFile}:`, error);
      process.exit(1);
    }
  }
  
  console.log("\n🎉 All tests completed successfully!");
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const usePnpm = args.includes("--pnpm") || args.includes("-p");
  
  try {
    if (usePnpm) {
      await runTestsWithPnpm();
    } else {
      await runTestsDirectly();
    }
  } catch (error) {
    console.error("❌ Test runner failed:", error);
    process.exit(1);
  }
}

// Run if this script is executed directly
if (import.meta.main) {
  main();
}

export { runTestsWithPnpm, runTestsDirectly, validateEnvironment, validateTestFiles };

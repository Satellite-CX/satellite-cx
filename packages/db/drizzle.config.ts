import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";
import "dotenv/config";
import { defineConfig } from "drizzle-kit";
import path from "path";

const projectRoot = path.resolve(__dirname, "..", "..");

dotenvExpand.expand(
  dotenv.config({
    path: path.resolve(projectRoot, ".env"),
  })
);

export default defineConfig({
  out: "./drizzle",
  schema: "./src/schema/index.ts",
  dialect: "postgresql",
  verbose: true,
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});

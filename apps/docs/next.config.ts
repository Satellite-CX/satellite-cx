import { createMDX } from "fumadocs-mdx/next";
import path from "path";
import type { NextConfig } from "next";
import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";

const projectRoot = path.resolve(__dirname, "..", "..");

dotenvExpand.expand(
  dotenv.config({
    path: path.resolve(projectRoot, ".env"),
  })
);

const withMDX = createMDX();

const config: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, "../../"),
  transpilePackages: ["api"],
};

export default withMDX(config);

import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";
import viteReact from "@vitejs/plugin-react";
import mdx from "fumadocs-mdx/vite";

export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [
    mdx(await import("./source.config")),
    tsConfigPaths({
      projects: ["./tsconfig.json"],
    }),
    tanstackStart({
      srcDirectory: "src",
    }),
    viteReact(),
  ],
});

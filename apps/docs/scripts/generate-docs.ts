import { generateFiles } from "fumadocs-openapi";
import { openapi } from "../src/lib/openapi";

void generateFiles({
  input: openapi,
  output: "./content/docs",
  // Using cleaned descriptions that won't break MDX syntax
  includeDescription: true,
});

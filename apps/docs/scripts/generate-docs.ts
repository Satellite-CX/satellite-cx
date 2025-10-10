import { generateFiles } from "fumadocs-openapi";
import { openapi } from "../src/lib/openapi";
import { openapiDocument } from "api/docs";

Bun.write("openapi.json", JSON.stringify(openapiDocument, null, 2));

void generateFiles({
  input: openapi,
  output: "./content/docs/api",
  per: "operation",
  groupBy: "tag",
  includeDescription: true,
});

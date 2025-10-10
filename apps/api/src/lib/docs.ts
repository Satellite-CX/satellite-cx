import { openapi } from "../openapi";
import type { OpenAPIV3_1 } from "openapi-types";

export const openapiDocument = openapi.getOpenAPI31Document({
  openapi: "3.1.0",
  info: {
    version: "1.0.0",
    title: "My API",
  },
}) as OpenAPIV3_1.Document;

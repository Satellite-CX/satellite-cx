import { apiKey as apiKeyPlugin } from "better-auth/plugins";

export const apiKey = apiKeyPlugin({
  defaultPrefix: "scx_",
});

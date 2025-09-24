import { apiKey as apiKeyPlugin } from "better-auth/plugins";

export const API_KEY_PREFIX = "scx_";

export const apiKey = apiKeyPlugin({
  defaultPrefix: API_KEY_PREFIX,
});

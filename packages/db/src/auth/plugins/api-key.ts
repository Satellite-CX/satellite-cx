import { apiKey as apiKeyPlugin } from "better-auth/plugins";
import { API_KEY_PREFIX } from "../../utils";

export const apiKey = apiKeyPlugin({
  defaultPrefix: API_KEY_PREFIX,
  enableMetadata: true,
});

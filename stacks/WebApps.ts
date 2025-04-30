import { api } from "./Api";
import { auth } from "./Auth";
import { bucket } from "./Bucket";
import { cf, domain } from "./Domain";
import { allSecrets } from "./Secrets";

// import { websocket_api } from "./Websocket";

const main_app_url = $dev ? "http://localhost:3000" : `https://${domain}`;

export const main_app = new sst.aws.SolidStart(`MainApp`, {
  path: "packages/web",
  buildCommand: "pnpm build",
  dev: {
    autostart: true,
  },
  environment: {
    VITE_API_URL: api.url,
    VITE_APP_URL: main_app_url,
    VITE_AUTH_URL: auth.url,
    // VITE_WS_LINK: websocket_api.url,
  },
  link: [
    bucket,
    // websocket_api,
    api,
    auth,
    ...allSecrets,
  ],
  domain: {
    name: domain,
    dns: cf,
  },
  invalidation: {
    paths: "all",
    wait: false,
  },
  permissions: [
    {
      actions: ["*"],
      resources: ["*"],
    },
  ],
});

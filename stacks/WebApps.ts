import { api } from "./Api";
import {
  // adminAuth,
  auth,
  // portalAuth
} from "./Auth";
import { bucket } from "./Bucket";
import { cf, domain } from "./Domain";
import { allSecrets } from "./Secrets";
import { websocket_api } from "./Websocket";

const main_app_url = $dev ? "http://localhost:3000" : `https://${domain}`;
const portal_app_url = $dev ? "http://localhost:3001" : `https://portal.${domain}`;
const admin_app_url = $dev ? "http://localhost:3002" : `https://admin.${domain}`;

const login_redirect_main_app = $dev
  ? "http://localhost:3000/api/auth/callback"
  : "https://northstar.oetzi.dev/api/auth/callback";
const login_redirect_portal_app = $dev
  ? "http://localhost:3001/api/auth/callback"
  : "https://portal.northstar.oetzi.dev/api/auth/callback";
const login_redirect_admin_app = $dev
  ? "http://localhost:3002/api/auth/callback"
  : "https://admin.northstar.oetzi.dev/api/auth/callback";

export const main_app = new sst.aws.SolidStart(`MainApp`, {
  path: "packages/web",
  buildCommand: "pnpm build",
  dev: {
    autostart: false,
  },
  environment: {
    VITE_API_URL: api.url,
    VITE_APP_URL: main_app_url,
    VITE_PORTAL_URL: portal_app_url,
    VITE_ADMIN_URL: admin_app_url,
    VITE_AUTH_URL: auth.authenticator.url,
    VITE_WS_LINK: websocket_api.url,
    VITE_LOGIN_REDIRECT: login_redirect_main_app,
  },
  link: [bucket, websocket_api, api, auth, ...allSecrets],
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

export const portal_app = new sst.aws.SolidStart(`PortalApp`, {
  path: "packages/portal",
  buildCommand: "pnpm build",
  dev: {
    autostart: false,
  },
  environment: {
    VITE_API_URL: api.url,
    VITE_APP_URL: main_app_url,
    VITE_PORTAL_URL: portal_app_url,
    VITE_ADMIN_URL: admin_app_url,
    VITE_AUTH_URL: auth.authenticator.url,
    VITE_WS_LINK: websocket_api.url,
    VITE_LOGIN_REDIRECT: login_redirect_portal_app,
  },
  link: [...allSecrets, bucket, websocket_api, api, auth],
  domain: {
    name: `portal.${domain}`,
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

export const admin_app = new sst.aws.SolidStart(`AdminApp`, {
  path: "packages/admin",
  buildCommand: "pnpm build",
  dev: {
    autostart: false,
  },
  environment: {
    VITE_API_URL: api.url,
    VITE_APP_URL: main_app_url,
    VITE_PORTAL_URL: portal_app_url,
    VITE_ADMIN_URL: admin_app_url,
    VITE_AUTH_URL: auth.authenticator.url,
    VITE_WS_LINK: websocket_api.url,
    VITE_LOGIN_REDIRECT: login_redirect_admin_app,
  },
  link: [...allSecrets, bucket, websocket_api, api, auth],
  domain: {
    name: `admin.${domain}`,
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

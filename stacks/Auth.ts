import { domain } from "./Domain";
import { mainEmail } from "./Email";
import { allSecrets } from "./Secrets";

const copyFiles = [
  {
    from: "packages/core/src/drizzle",
    to: "drizzle",
  },
];

export const auth = new sst.aws.Auth(`Auth`, {
  authenticator: {
    handler: "packages/functions/src/auth.handler",
    link: [...allSecrets, mainEmail],
    environment: {
      AUTH_MAIN_FRONTEND_URL: $dev ? "http://localhost:3000" : "https://" + domain,
      AUTH_PORTAL_FRONTEND_URL: $dev ? "http://localhost:3001" : "https://portal." + domain,
      AUTH_ADMIN_FRONTEND_URL: $dev ? "http://localhost:3002" : "https://admin." + domain,
      EMAIL_DOMAIN: domain,
    },
    permissions: [
      {
        actions: ["ses:SendEmail"],
        resources: ["*"],
      },
    ],
    runtime: "nodejs20.x",
    copyFiles,
  },
});

// export const portalAuth = new sst.aws.Auth(`PortalAuth`, {
//   authenticator: {
//     handler: "packages/functions/src/auth.handler",
//     link: [...allSecrets, mainEmail],
//     environment: {
//       AUTH_FRONTEND_URL: $dev ? "http://localhost:3001" : "https://portal." + domain,
//       EMAIL_DOMAIN: `portal.${domain}`,
//     },
//     permissions: [
//       {
//         actions: ["ses:SendEmail"],
//         resources: ["*"],
//       },
//     ],
//     runtime: "nodejs20.x",
//     copyFiles,
//   },
// });

// export const adminAuth = new sst.aws.Auth(`AdminAuth`, {
//   authenticator: {
//     handler: "packages/functions/src/auth.handler",
//     link: [...allSecrets, mainEmail],
//     environment: {
//       AUTH_FRONTEND_URL: $dev ? "http://localhost:3002" : "https://admin." + domain,
//       EMAIL_DOMAIN: `admin.${domain}`,
//     },
//     permissions: [
//       {
//         actions: ["ses:SendEmail"],
//         resources: ["*"],
//       },
//     ],
//     runtime: "nodejs20.x",
//     copyFiles,
//   },
// });

import { cf, domain } from "./Domain";
import { allSecrets } from "./Secrets";

const copyFiles = [
  {
    from: "packages/core/src/drizzle",
    to: "drizzle",
  },
];

export const auth = new sst.aws.Auth(`Auth`, {
  issuer: {
    handler: "packages/functions/src/auth.handler",
    link: [...allSecrets],
    // runtime: "nodejs22.x",
    nodejs: {
      install: ["@neondatabase/serverless", "postgres"],
    },
    copyFiles,
  },
  domain: {
    name: "auth." + domain,
    dns: cf,
  },
});

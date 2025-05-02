// import {
//   // adminAuth,
//   auth,
//   // portalAuth
// } from "./Auth";
import { bucket } from "./Bucket";
import { cf, domain } from "./Domain";
// import { Layers } from "./Layers";
import { allSecrets } from "./Secrets";

// import { websocket_api } from "./Websocket";

// const layers = [Layers.ghostscript, Layers.graphicsmagick, Layers.imageMagick].map((l) =>
//   aws.serverlessrepository.getApplication({ applicationId: l }),
// );

export const api = new sst.aws.ApiGatewayV2("Api", {
  domain: {
    name: `api.${domain}`,
    dns: cf,
  },
  cors: {
    allowOrigins: ["*"],
  },
});

const link = [
  ...allSecrets,
  bucket,
  // auth,
  // websocket_api,
];

const copyFiles = [
  {
    from: "packages/core/src/drizzle",
    to: "drizzle",
  },
];

api.route("POST /migration", {
  handler: "packages/functions/src/migrator.handler",
  description: "This is the migrator function",
  link,
  copyFiles,
});

api.route("POST /websockets/revoke/all", {
  handler: "packages/functions/src/ws.revokeWebsocketConnections",
  description: "This is the revokeWebsocketConnections function",
  link,
  copyFiles,
  nodejs: {
    install: ["@neondatabase/serverless", "postgres"],
  },
});

api.route("GET /preview/document/{id}", {
  handler: "packages/functions/src/preview.document",
  description: "This is the preview.document function",
  link,
  copyFiles: [
    ...copyFiles,
    {
      from: "packages/ghostscript-layer",
      to: "opt",
    },
    { from: "packages/imagemagick-layer", to: "opt" },
  ],
  nodejs: {
    install: ["@neondatabase/serverless", "postgres"],
  },
  timeout: "60 seconds",
});

api.route("GET /preview/parser/{id}", {
  handler: "packages/functions/src/preview.parser",
  description: "This is the preview.parser function",
  link,
  copyFiles: [
    ...copyFiles,
    {
      from: "packages/ghostscript-layer",
      to: "opt",
    },
    { from: "packages/imagemagick-layer", to: "opt" },
  ],
  nodejs: {
    install: ["@neondatabase/serverless", "postgres"],
  },
  timeout: "60 seconds",
});

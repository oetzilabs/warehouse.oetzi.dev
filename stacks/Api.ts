import {
  // adminAuth,
  auth,
  // portalAuth
} from "./Auth";
import { bucket } from "./Bucket";
import { cf, domain } from "./Domain";
// import { Layers } from "./Layers";
import { allSecrets } from "./Secrets";
import { websocket_api } from "./Websocket";

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
  auth,
  websocket_api,
  // portalAuth, adminAuth
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

api.route("POST /admin/document/{id}/update", {
  handler: "packages/functions/src/admin/document.update",
  description: "This is the document.update function for admins",
  link,
  copyFiles,
  nodejs: {
    install: ["@neondatabase/serverless", "postgres"],
  },
});

api.route("POST /admin/authorization/roles_and_permissions.cleanup", {
  handler: "packages/functions/src/admin/authorization/roles_and_permissions.cleanup",
  description: "This is the admin/authorization/roles_and_permissions.cleanup function",
  link,
  copyFiles,
  nodejs: {
    install: ["@neondatabase/serverless", "postgres"],
  },
});

api.route("POST /admin/authorization/roles_and_permissions.seed", {
  handler: "packages/functions/src/admin/authorization/roles_and_permissions.seed",
  description: "This is the admin/authorization/roles_and_permissions.seed function",
  link,
  copyFiles,
  nodejs: {
    install: ["@neondatabase/serverless", "postgres"],
  },
});

api.route("POST /admin/vat_codes.seed", {
  handler: "packages/functions/src/admin/vat_codes.seed",
  description: "This is the admin/vat_codes.seed function",
  link,
  copyFiles,
  nodejs: {
    install: ["@neondatabase/serverless", "postgres"],
  },
});

api.route("POST /cleanup.transitposition", {
  handler: "packages/functions/src/cleanup.transitposition",
  description: "This is the cleanup.transitposition function",
  link,
  copyFiles,
  nodejs: {
    install: ["@neondatabase/serverless", "postgres"],
  },
});

// api.route("POST /seed.parsers", {
//   handler: "packages/functions/src/migrator.seed_parsers",
//   description: "This is the seed_parsers function",
//   link,
//   copyFiles,
//   nodejs: {
//     install: ["@neondatabase/serverless", "postgres"],
//   },
// });

api.route("GET /session", {
  handler: "packages/functions/src/session.handler",
  description: "This is the session.handler function",
  link,
  copyFiles,
  nodejs: {
    install: ["@neondatabase/serverless", "postgres"],
  },
});

api.route("POST /presigned-upload", {
  handler: "packages/functions/src/presigned-upload.handler",
  description: "This is the presigned-upload function",
  link,
  copyFiles,
  nodejs: {
    install: ["@neondatabase/serverless", "postgres"],
  },
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

api.route("GET /preview/contact/{id}", {
  handler: "packages/functions/src/preview.contact",
  description: "This is the preview.contact function",
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

api.route("GET /admin/parser/{slug}", {
  handler: "packages/functions/src/admin/parser.convert",
  description: "This is the parser.convert function",
  link,
  copyFiles,
  nodejs: {
    install: ["@neondatabase/serverless", "postgres"],
  },
});

api.route("GET /messages/{mid}/attachments", {
  handler: "packages/functions/src/messages.allattachment_zip",
  description: "This is the messages.allattachment_zip function",
  link,
  copyFiles,
  nodejs: {
    install: ["@neondatabase/serverless", "postgres"],
  },
});

api.route("GET /messages/attachment/{id}", {
  handler: "packages/functions/src/messages.attachment",
  description: "This is the messages.attachment function",
  link,
  copyFiles,
  nodejs: {
    install: ["@neondatabase/serverless", "postgres"],
  },
});

export const subscriber = bucket.subscribe(
  {
    handler: "packages/functions/src/bucket.filecreated_put",
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
    url: true,
  },
  {
    events: ["s3:ObjectCreated:Put"],
    filterSuffix: ".pdf",
  },
);

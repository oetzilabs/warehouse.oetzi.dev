/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "warehouse-oetzi-dev",
      region: "eu-central-1",
      removal: input?.stage === "production" ? "retain" : "remove",
      home: "cloudflare",
      providers: {
        aws: {
          region: "eu-central-1",
        },
        cloudflare: {
          version: "5.37.1",
        },
      },
    };
  },
  async run() {
    await import("./stacks/Secrets");
    await import("./stacks/Domain");

    const { bucket } = await import("./stacks/Bucket");
    const { realtime } = await import("./stacks/Realtime");
    const { localprinter } = await import("./stacks/LocalPrinter");
    // const auth = await import("./stacks/Auth");
    const api = await import("./stacks/Api");
    const web_apps = await import("./stacks/WebApps");
    const { migrate, generate, studio, drizzleKitUp, seed } = await import("./stacks/Database");

    return {
      storageName: bucket.name,
      storageArn: bucket.arn,
      storageUrn: bucket.urn,

      realtimeEndpoint: realtime.endpoint,
      realtimeAuthorizer: realtime.authorizer,
      realtimeUrn: realtime.urn,

      migrateUrn: migrate.urn,
      generateUrn: generate.urn,
      dbStudioUrn: studio.urn,
      drizzleKitUp: drizzleKitUp.urn,
      seed: seed.urn,

      // authUrl: auth.auth.url,

      api: api.api.url,
      main_app_url: $dev ? "http://localhost:3000" : web_apps.main_app.url,
    };
  },
});

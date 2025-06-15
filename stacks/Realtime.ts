import { allSecrets } from "./Secrets";

const link = [...allSecrets];

const copyFiles = [
  {
    from: "packages/core/src/drizzle",
    to: "drizzle",
  },
];

export const realtime = new sst.aws.Realtime("RealtimeServer", {
  authorizer: {
    handler: "packages/functions/src/realtime/authorizer.handler",
    link,
    copyFiles,
    timeout: "30 seconds",
    url: true,
  },
});

export const realtimeSubscriber = realtime.subscribe(
  {
    handler: "packages/functions/src/realtime/subscriber.handler",
    link: [...link, realtime],
    copyFiles,
    timeout: "30 seconds",
    url: true,
  },
  {
    filter: `${$app.name}/${$app.stage}/#`,
  },
);

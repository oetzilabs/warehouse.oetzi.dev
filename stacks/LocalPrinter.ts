import { realtime } from "./Realtime";
import { secret } from "./Secrets";

export const localprinter = new sst.x.DevCommand("LocalPrinter", {
  dev: {
    command: "bun run start:node2",
    directory: "packages/printer",
    autostart: false,
  },
  environment: {
    BROKER_URL: $interpolate`wss://${realtime.endpoint}/mqtt?x-amz-customauthorizer-name=${realtime.authorizer}`,
    PREFIX: `${$app.name}/${$app.stage}/`,
    ORG_ID: "local",
  },
  link: [secret.SECRET_DATABASE_URL, secret.SECRET_DATABASE_PROVIDER, realtime],
});

import { auth } from "./Auth";
import { bucket } from "./Bucket";
import { cf, domain } from "./Domain";
import { allSecrets } from "./Secrets";

export const websocket_api = new sst.aws.ApiGatewayWebSocket("websocket_api", {
  // link: [...allSecrets, bucket, auth],
  domain: {
    name: `websocket.${domain}`,
    dns: cf,
  },
});

websocket_api.route("$connect", {
  handler: "packages/functions/src/ws.connect",
  description: "This is the connect function",
  link: [...allSecrets, bucket, auth, websocket_api],
});

websocket_api.route("$disconnect", {
  handler: "packages/functions/src/ws.disconnect",
  description: "This is the disconnect function",
  link: [...allSecrets, bucket, auth, websocket_api],
});

websocket_api.route("$default", {
  handler: "packages/functions/src/ws.main",
  description: "This is the main function",
  link: [...allSecrets, bucket, auth, websocket_api],
});

websocket_api.route("sendnotification", {
  handler: "packages/functions/src/ws.sendnotification",
  description: "This is the sendnotification function",
  link: [...allSecrets, bucket, auth, websocket_api],
});

websocket_api.route("ping", {
  handler: "packages/functions/src/ws.ping",
  description: "This is the ping function",
  link: [...allSecrets, bucket, auth, websocket_api],
});

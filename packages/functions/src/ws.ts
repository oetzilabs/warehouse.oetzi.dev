import { WebsocketCore } from "@zomoetzidev/core/src/entities/websocket";
import { StatusCodes } from "http-status-codes";
import { ApiHandler, error, json, WebSocketApiHandler } from "./utils";

export const connect = WebSocketApiHandler(async (event) => {
  const connectionId = event.requestContext.connectionId;
  if (!connectionId) return error("No connectionId", StatusCodes.BAD_REQUEST);
  const x = await WebsocketCore.connect(connectionId);
  return json(x);
});

export const disconnect = WebSocketApiHandler(async (event) => {
  const connectionId = event.requestContext.connectionId;
  if (!connectionId) return error("No connectionId", StatusCodes.BAD_REQUEST);
  const x = await WebsocketCore.disconnect(connectionId);
  return json(x);
});

export const ping = WebSocketApiHandler(async (event) => {
  const connectionId = event.requestContext.connectionId;
  if (!connectionId) return error("No connectionId", StatusCodes.BAD_REQUEST);
  const payload_wrapper = JSON.parse(event.body || "{payload: {}}");
  // console.log("payload_wrapper", payload_wrapper);
  if (!payload_wrapper.payload) return error("No payload", StatusCodes.BAD_REQUEST);
  const payload = payload_wrapper.payload;
  const userId = payload.userId;
  if (!userId) return error("No userId", StatusCodes.BAD_REQUEST);
  const x = await WebsocketCore.update(connectionId, userId);
  // console.log("Updated Websocket Connection Entry", x, "payload", payload);
  const id = payload.id;
  const sentAt = Date.now();

  await WebsocketCore.sendMessageToConnection(
    {
      action: "pong",
      payload: {
        recievedId: id,
        sentAt: Date.now(),
      },
    },
    connectionId,
  );

  // const missingNotifications = await Notifications.sendMissingNotifications(userId);
  // console.log("missingNotifications", missingNotifications);
  return json({
    action: "pong",
    payload: {
      recievedId: id,
      sentAt,
    },
  });
});

export const main = WebSocketApiHandler(async (event) => {
  const connectionId = event.requestContext.connectionId;
  if (!connectionId) return error("No connectionId", StatusCodes.BAD_REQUEST);
  const payload = JSON.parse(event.body || "{}");
  if (!payload.userId) return error("No userId", StatusCodes.BAD_REQUEST);
  const userId = payload.userId;
  const x = await WebsocketCore.update(connectionId, userId);
  return json(x);
});

export const sendnotification = WebSocketApiHandler(async (event) => {
  const connectionId = event.requestContext.requestId;
  if (!connectionId) return error("No connectionId", StatusCodes.BAD_REQUEST);

  const x = await WebsocketCore.broadcast({
    id: "test-user-notification",
    type: "user:info",
    title: "Test",
    content: "Test",
    dismissedAt: null,
  });

  return json(x);
});

export const revokeWebsocketConnections = ApiHandler(async (event, context) => {
  const revoked = await WebsocketCore.revokeAll();
  const revokedConnections = [];
  for (const connection of revoked) {
    revokedConnections.push({ id: connection.id, userId: connection.userId });
  }
  return json({ revoked: revokedConnections });
});

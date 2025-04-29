export type WebsocketMessageProtocol = {
  send: WebsocketMessage;
  message: WebsocketMessage;
  // "parser-create": WebsocketMessage;
  // "document-update": WebsocketMessage;
  // "document-delete": WebsocketMessage;
  // "document-create": WebsocketMessage;
  // "document-undo-delete": WebsocketMessage;
  // "document-transit-position": WebsocketMessage;
  // "organization-join": WebsocketMessage;
  // "customer-reply": WebsocketMessage;
  clear: never;
  ping: {
    action: "ping";
    payload: {
      userId: string;
      id: string;
    };
  };
  pong: {
    action: "pong";
    payload: {
      recievedId: string;
      sentAt: number;
    };
  };
};

export type WebsocketMessage = {
  action: keyof WebsocketMessageProtocol;
  payload: any;
};

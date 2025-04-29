import { Listener } from "@solid-primitives/event-bus";
import type { WebsocketMessage, WebsocketMessageProtocol } from "@warehouseoetzidev/core/src/utils/websocket";
import { onCleanup, onMount, Show } from "solid-js";
import { useWebsocket } from "./providers/Websocket";

export const WebsocketSubscribe = (props: {
  handler: (data: WebsocketMessage) => Promise<void> | Promise<[unknown, void]> | void;
  type: keyof WebsocketMessageProtocol;
}) => {
  const ws = useWebsocket();
  onMount(() => {
    const unsub = ws!.subscribe(props.type)(props.handler);
    onCleanup(() => {
      // console.info("[WS] Unsubscribed from " + props.type);
      unsub();
    });
  });
  return <div class="hidden" data-websocket={props.type} />;
};

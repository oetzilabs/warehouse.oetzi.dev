import { cn } from "@/lib/utils";
import { useAction } from "@solidjs/router";
import type { UserMessageTopicsList } from "@zomoetzidev/core/src/entities/users";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { For, Show, createEffect, createSignal } from "solid-js";
import { setMessageTopicMessagesAsRead } from "../../lib/api/messages";
import { message_topic, setMessageTopic } from "./use-message";
dayjs.extend(relativeTime);

type Props = {
  type: "all" | "unread";
  messages: UserMessageTopicsList;
};

const lastMessage = (messages: UserMessageTopicsList[number]["messages"]) => {
  return messages.length > 0
    ? messages.sort((a, b) => dayjs(b.message.createdAt).diff(dayjs(a.message.createdAt)))[0]
    : null;
};

export const MessageTopicList = (props: Props) => {
  const setMessageTopicMessagesAsReadAction = useAction(setMessageTopicMessagesAsRead);
  const [messages, setMessages] = createSignal<UserMessageTopicsList>(props.messages);

  createEffect(() => {
    setMessages(props.messages);
  });

  return (
    <div class="flex flex-col w-full h-full">
      <For each={messages()}>
        {(item) => (
          <button
            type="button"
            class={cn(
              "flex flex-col items-start gap-2 border-b p-3 text-left text-sm transition-all hover:bg-accent",
              message_topic.selected === item.id && "bg-muted"
            )}
            onClick={async () => {
              setMessageTopic({
                selected: item.id,
              });
              await setMessageTopicMessagesAsReadAction(item.id);
              setMessages((oldMessages) => {
                // set the messages with the new readAt
                oldMessages.forEach((m) => {
                  if (m.id === item.id) {
                    m.messages.forEach((m) => {
                      m.message.readAt = new Date();
                    });
                  }
                });
                return oldMessages;
              });
            }}
          >
            <div class="flex w-full flex-col gap-1">
              <div class="flex items-center">
                <div class="flex items-center gap-2">
                  <div class="font-semibold">{item.owner.name}</div>
                  <Show when={!lastMessage(item.messages)?.message.readAt}>
                    <span class="flex h-2 w-2 rounded-full bg-blue-600" />
                  </Show>
                </div>
                <div
                  class={cn(
                    "ml-auto text-xs",
                    message_topic.selected === item.id ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {dayjs(item.createdAt).fromNow()}
                </div>
              </div>
              <div class="text-xs font-medium">{item.subject}</div>
            </div>
            <div class="line-clamp-2 text-xs text-muted-foreground">
              {lastMessage(item.messages)?.message.content.substring(0, 300)}
            </div>
            <div class="flex items-center gap-2">
              <Show when={item.deletedAt}>
                {(dA) => (
                  <div class="px-3 py-1 flex flex-row items-center justify-center gap-2 border border-neutral-300 dark:border-neutral-700 rounded-full text-xs bg-neutral-200 dark:bg-neutral-500">
                    Removed {dayjs(dA()).fromNow()}
                  </div>
                )}
              </Show>
            </div>
          </button>
        )}
      </For>
    </div>
  );
};

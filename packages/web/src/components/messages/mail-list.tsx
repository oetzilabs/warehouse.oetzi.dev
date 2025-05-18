import { Badge } from "@/components/ui/badge";
import { getMessages } from "@/lib/api/messages";
import { cn } from "@/lib/utils";
import { createAsync } from "@solidjs/router";
import { type MessageInfo } from "@warehouseoetzidev/core/src/entities/messages";
import dayjs from "dayjs";
import { Accessor, For } from "solid-js";

interface MailListProps {
  type: "all" | "unread";
  onSelectedMail: (mail: MessageInfo | null) => void;
  selectedMail: Accessor<MessageInfo | null>;
  list: Accessor<MessageInfo[]>;
}

export function MailList(props: MailListProps) {
  return (
    <div class="flex grow flex-col gap-2 overflow-auto p-4 pt-0">
      <For each={props.type === "all" ? props.list() : props.list().filter((v) => !v.readAt)}>
        {(item) => (
          <button
            type="button"
            class={cn(
              "flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all hover:bg-accent",
              props.selectedMail()?.id === item.id && "bg-muted",
            )}
            onClick={() => props.onSelectedMail(item)}
          >
            <div class="flex w-full flex-col gap-1">
              <div class="flex items-center">
                <div class="flex items-center gap-2">
                  <div class="font-semibold">{item.sender}</div>
                  {!item.readAt && <span class="flex size-2 rounded-full bg-blue-600" />}
                </div>
                <div
                  class={cn(
                    "ml-auto text-xs",
                    props.selectedMail()?.id === item.id ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {dayjs(item.sentAt ?? item.createdAt).fromNow()}
                </div>
              </div>
              <div class="text-xs font-medium">{item.title}</div>
            </div>
            <div class="line-clamp-2 text-xs text-muted-foreground">{item.content.substring(0, 300)}</div>
            {/* {item.labels.length ? (
              <div class="flex items-center gap-2">
                <For each={item.labels}>
                  {(label) => <Badge variant={label === "work" ? "default" : "secondary"}>{label}</Badge>}
                </For>
              </div>
            ) : null} */}
          </button>
        )}
      </For>
    </div>
  );
}

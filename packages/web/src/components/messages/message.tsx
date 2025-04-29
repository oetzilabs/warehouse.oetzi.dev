import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import Download from "lucide-solid/icons/download";
import Loader2 from "lucide-solid/icons/loader-2";
import { createSignal, For } from "solid-js";
import { Show } from "solid-js/web";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { Image, ImageFallback, ImageRoot } from "../ui/image";
import { SingleMessage } from "./message-display";

dayjs.extend(relativeTime);

export const Message = (props: { message: SingleMessage; direction: "left" | "right" }) => {
  const [isDownloadingAttachment, setIsDownloadingAttachment] = createSignal<string | null>(null);
  const [isDownloadingAllAttachments, setIsDownloadingAllAttachments] = createSignal<string | null>(null);

  return (
    <div
      class={cn("flex w-full h-min", {
        "justify-start items-start": props.direction === "left",
        "justify-end items-end": props.direction === "right",
      })}
    >
      <div class="whitespace-pre-wrap p-4 text-sm rounded-xl min-w-[200px] max-w-[450px] w-max h-min flex gap-4 border border-neutral-200 dark:border-neutral-700">
        <ImageRoot>
          <Image alt={props.message.user.name} />
          <ImageFallback class="uppercase bg-neutral-200 dark:bg-neutral-800">
            {props.message.user.name
              .split(" ")
              .map((chunk) => chunk[0])
              .join("")}
          </ImageFallback>
        </ImageRoot>
        <div class="flex flex-col gap-4 w-full h-max items-start">
          <span>{props.message.message.content}</span>
          <Show when={props.message.message.attachments.length > 0}>
            <div class="flex flex-col gap-2 w-full h-min p-2 border border-neutral-200 dark:border-neutral-700 rounded-md">
              <span class="text-xs font-medium">Attachments:</span>
              <div class="flex flex-row flex-wrap gap-2 w-full">
                <For each={props.message.message.attachments}>
                  {(attachment) => (
                    <Button
                      size="sm"
                      variant="ghost"
                      class="flex items-center gap-2 text-xs w-max p-1.5 px-3 border border-neutral-200 dark:border-neutral-700 "
                      disabled={isDownloadingAttachment() === attachment.id}
                      onClick={() => {
                        if (isDownloadingAttachment()) return;
                        setIsDownloadingAttachment(attachment.id);
                        fetch(`${import.meta.env.VITE_API_URL}/messages/attachment/${attachment.id}`)
                          .then((r) => r.blob())
                          .then((b) => {
                            const a = document.createElement("a");
                            a.href = URL.createObjectURL(b);
                            a.download = attachment.name;
                            a.click();
                            setIsDownloadingAttachment(null);
                          });
                      }}
                    >
                      <Show when={isDownloadingAttachment() === attachment.id}>
                        <Loader2 class="size-4 animate-spin" />
                      </Show>
                      {attachment.name}
                    </Button>
                  )}
                </For>
                <Show when={props.message.message.attachments.length > 1}>
                  <Button
                    size="sm"
                    variant="default"
                    class="flex items-center gap-2 text-xs w-max p-1.5 px-3 border border-neutral-200 dark:border-neutral-700"
                    disabled={isDownloadingAllAttachments() === props.message.message.id}
                    onClick={() => {
                      if (isDownloadingAllAttachments()) return;
                      setIsDownloadingAllAttachments(props.message.message.id);
                      fetch(`${import.meta.env.VITE_API_URL}/messages/${props.message.message.id}/attachments`)
                        .then((r) => r.blob())
                        .then((b) => {
                          const a = document.createElement("a");
                          a.href = URL.createObjectURL(b);
                          a.download = `${props.message.topic.slug}.zip`;
                          a.click();
                          setIsDownloadingAllAttachments(null);
                        });
                    }}
                  >
                    <Show
                      when={isDownloadingAllAttachments() === props.message.message.id}
                      fallback={<Download class="size-4" />}
                    >
                      <Loader2 class="size-4 animate-spin" />
                    </Show>
                    Download All
                  </Button>
                </Show>
              </div>
            </div>
          </Show>
          <Show when={!props.message.message.readAt}>
            <div class="flex flex-col gap-2 w-full h-min">
              <span class="text-xs font-medium flex items-center gap-2 text-muted-foreground italic">
                {dayjs(props.message.message.createdAt).fromNow()}
              </span>
            </div>
          </Show>
          <Show when={props.message.message.readAt}>
            <div class="flex flex-col gap-2 w-full h-min">
              <span class="text-xs font-medium flex items-center gap-2 text-muted-foreground italic">
                {dayjs(props.message.message.readAt).fromNow()}
              </span>
            </div>
          </Show>
        </div>
      </div>
    </div>
  );
};

export const MessagePreview = (props: { username: string; message: string; attachments: string[] }) => {
  return (
    <div class={cn("flex w-full h-min justify-end items-end")}>
      <div class="whitespace-pre-wrap p-4 text-sm rounded-xl min-w-[200px] max-w-[450px] w-max h-min flex gap-4 border border-neutral-200 dark:border-neutral-700">
        <ImageRoot>
          <Image alt={props.username} />
          <ImageFallback class="uppercase bg-neutral-200 dark:bg-neutral-800">
            {props.username
              .split(" ")
              .map((chunk) => chunk[0])
              .join("")}
          </ImageFallback>
        </ImageRoot>
        <div class="flex flex-col gap-4 w-full h-max items-start">
          <span>{props.message}</span>
          <Show when={props.attachments.length > 0}>
            <div class="flex flex-col gap-2 w-full h-min p-2 border border-neutral-200 dark:border-neutral-700 rounded-md">
              <span class="text-xs font-medium">Attachments:</span>
              <div class="flex flex-row flex-wrap gap-2 w-full">
                <For each={props.attachments}>
                  {(attachment) => (
                    <div class="flex items-center gap-2 text-xs w-max p-1.5 px-3 border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 rounded-md animate-pulse">
                      {attachment}
                    </div>
                  )}
                </For>
              </div>
            </div>
          </Show>
        </div>
      </div>
    </div>
  );
};

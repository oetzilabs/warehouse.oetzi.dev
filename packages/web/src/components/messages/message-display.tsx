import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Image, ImageFallback, ImageRoot } from "@/components/ui/image";
import { Separator } from "@/components/ui/separator";
import { Switch, SwitchControl, SwitchLabel, SwitchThumb } from "@/components/ui/switch";
import { TextArea } from "@/components/ui/textarea";
import { TextFieldRoot } from "@/components/ui/textfield";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { UserSession } from "@/lib/api/auth";
import { addMessageToMesageTopic, getMessageTopics, removeAttachment, removeMessageTopic } from "@/lib/api/messages";
import { cn } from "@/lib/utils";
import type { DropdownMenuTriggerProps } from "@kobalte/core/dropdown-menu";
import type { TooltipTriggerProps } from "@kobalte/core/tooltip";
import { revalidate, useAction, useSubmission } from "@solidjs/router";
import type { UserMessageTopicsList } from "@warehouseoetzidev/core/src/entities/users";
import dayjs from "dayjs";
import FilePlus from "lucide-solid/icons/file-plus";
import SendHorizontal from "lucide-solid/icons/send-horizontal";
import X from "lucide-solid/icons/x";
import { createEffect, createMemo, createSignal, For, Show } from "solid-js";
import { toast } from "solid-sonner";
import { Transition } from "solid-transition-group";
import { useSession } from "../SessionProvider";
import { WebsocketSubscribe } from "../WebsocketSubscribe";
import { Message, MessagePreview } from "./message";
import { message_topic } from "./use-message";

type Props = {
  messages: UserMessageTopicsList;
  session: UserSession;
};

type AttachmentFile = {
  name: string;
  id: string;
};

export type SingleMessage = UserMessageTopicsList[number]["messages"][number];

export const MessageData = (props: Props) => {
  const data = createMemo(() => props.messages.find((mm) => mm.id === message_topic.selected) ?? null);

  const deleteMessageTopic = useAction(removeMessageTopic);
  const isRemovingMessageTopic = useSubmission(removeMessageTopic);

  const addMessageToMesageTopicAction = useAction(addMessageToMesageTopic);
  const isAddingMessageToMesageTopic = useSubmission(addMessageToMesageTopic);

  const [newMessage, setNewMessage] = createSignal("");

  const [attachments, setAttachments] = createSignal<AttachmentFile[]>([]);
  const [uploadingFiles, setUploadingFiles] = createSignal<File[]>([]);

  const orderByCreated = (messages: SingleMessage[]) => {
    return messages.sort((a, b) => dayjs(a.message.createdAt).diff(dayjs(b.message.createdAt)));
  };

  let fileInput: HTMLInputElement;

  const handleFileInput = async (e: Event) => {
    const input = e.target as HTMLInputElement;
    if (input.files) {
      if (input.files.length > 0) {
        // first upload the files to `/api/upload-attachment`
        // then add the attachments to list of attachments
        setUploadingFiles([...uploadingFiles(), ...input.files]);
        const formData = new FormData();
        for (const file of input.files) {
          formData.append("files", file);
        }

        toast.promise(
          fetch("/api/upload-attachments", {
            method: "POST",
            body: formData,
          }).then((r) => r.json() as Promise<{ files: AttachmentFile[] }>),
          {
            loading: "Uploading attachments...",
            success: (r) => {
              setAttachments(r.files);
              setUploadingFiles([]);
              return "Attachments uploaded!";
            },
            error: "Error uploading attachments",
            position: "bottom-left",
          },
        );
      }
    }
  };

  const clearAttachments = async () => {
    const as = attachments();
    for (const a of as) {
      await removeAttachmentAction(a.id);
      setAttachments(as.filter((a) => a.id !== a.id));
    }
  };

  const removeAttachmentAction = useAction(removeAttachment);
  const isRemovingAttachment = useSubmission(removeAttachment);

  let scrollAnchor: HTMLDivElement;

  const sendMessage = async () => {
    const d = data();
    if (!d) return;
    const m = newMessage();
    if (!m) return;
    const as = attachments();
    setNewMessage("");
    setAttachments([]);
    setUploadingFiles([]);
    await addMessageToMesageTopicAction(
      d.id,
      m,
      as.map((a) => a.id),
    );
    scrollAnchor.scrollIntoView({ behavior: "instant" });
    await revalidate(getMessageTopics.key);
    scrollAnchor.scrollIntoView({ behavior: "instant" });
  };

  const [previousData, setPreviousData] = createSignal<string | null>(null);

  createEffect(() => {
    if (data() !== null && previousData() !== data()!.id) {
      scrollAnchor.scrollIntoView();
      setPreviousData(data()!.id);
    }
  });

  return (
    <>
      <input type="file" class="hidden" ref={fileInput!} onChange={handleFileInput} multiple />
      <div class="w-full h-full flex flex-col overflow-hidden">
        <div class="w-full h-min flex items-center p-2 border-b border-neutral-200 dark:border-neutral-700">
          <div class="flex items-center gap-2">
            <Tooltip openDelay={0} closeDelay={0}>
              <TooltipTrigger
                as={(props: TooltipTriggerProps) => (
                  <Button variant="ghost" size="icon" disabled={!data()} {...props}>
                    <svg xmlns="http://www.w3.org/2000/svg" class="size-4" viewBox="0 0 24 24">
                      <path
                        fill="none"
                        stroke="currentColor"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2m2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8m-9 4h4"
                      />
                    </svg>
                    <span class="sr-only">Archive</span>
                  </Button>
                )}
              />
              <TooltipContent>Archive</TooltipContent>
            </Tooltip>
            <Tooltip openDelay={0} closeDelay={0}>
              <TooltipTrigger
                as={(props: TooltipTriggerProps) => (
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={!data() || isRemovingMessageTopic.pending}
                    {...props}
                    onClick={() => {
                      const id = data()?.id;
                      if (!id) return;
                      toast.promise(Promise.all([deleteMessageTopic(id), revalidate(getMessageTopics.key)]), {
                        loading: "Deleting message topic...",
                        success: "Message topic deleted",
                        error: "Error deleting message topic",
                        position: "bottom-left",
                      });
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="size-4" viewBox="0 0 24 24">
                      <path
                        fill="none"
                        stroke="currentColor"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M4 7h16m-10 4v6m4-6v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"
                      />
                    </svg>
                    <span class="sr-only">Move to trash</span>
                  </Button>
                )}
              />
              <TooltipContent>Move to trash</TooltipContent>
            </Tooltip>
          </div>
          <div class="ml-auto flex items-center gap-2">
            {/* <Tooltip openDelay={0} closeDelay={0}>
              <TooltipTrigger
                as={(props: TooltipTriggerProps) => (
                  <Button variant="ghost" size="icon" disabled={!data()} {...props}>
                    <svg xmlns="http://www.w3.org/2000/svg" class="size-4" viewBox="0 0 24 24">
                      <g
                        fill="none"
                        stroke="currentColor"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                      >
                        <path d="M18 4a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-5l-5 3v-3H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3z" />
                        <path d="m11 8l-3 3l3 3m5-3H8" />
                      </g>
                    </svg>
                    <span class="sr-only">Reply</span>
                  </Button>
                )}
              />
              <TooltipContent>Reply</TooltipContent>
            </Tooltip> */}
            <Tooltip openDelay={0} closeDelay={0}>
              <TooltipTrigger
                as={(props: TooltipTriggerProps) => (
                  <Button variant="ghost" size="icon" disabled={!data()} {...props}>
                    <svg xmlns="http://www.w3.org/2000/svg" class="size-4" viewBox="0 0 24 24">
                      <g
                        fill="none"
                        stroke="currentColor"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                      >
                        <path d="M18 4a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-5l-5 3v-3H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3z" />
                        <path d="m13 8l3 3l-3 3m3-3H8" />
                      </g>
                    </svg>
                    <span class="sr-only">Forward</span>
                  </Button>
                )}
              />
              <TooltipContent>Forward</TooltipContent>
            </Tooltip>
          </div>
          <Separator orientation="vertical" class="mx-2 h-6" />
          <DropdownMenu placement="bottom-end">
            <DropdownMenuTrigger
              as={(props: DropdownMenuTriggerProps) => (
                <Button variant="ghost" size="icon" disabled={!data()} {...props}>
                  <svg xmlns="http://www.w3.org/2000/svg" class="size-4" viewBox="0 0 24 24">
                    <path
                      fill="none"
                      stroke="currentColor"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M11 12a1 1 0 1 0 2 0a1 1 0 1 0-2 0m0 7a1 1 0 1 0 2 0a1 1 0 1 0-2 0m0-14a1 1 0 1 0 2 0a1 1 0 1 0-2 0"
                    />
                  </svg>
                  <span class="sr-only">More</span>
                </Button>
              )}
            />
            <DropdownMenuContent>
              <DropdownMenuItem>Mark as unread</DropdownMenuItem>
              <DropdownMenuItem>Star thread</DropdownMenuItem>
              <DropdownMenuItem>Add label</DropdownMenuItem>
              <DropdownMenuItem>Mute thread</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <Show
          when={data()}
          fallback={<div class="p-8 text-center text-muted-foreground">No message topic selected</div>}
          keyed
        >
          {(mt) => (
            <div class="flex h-full flex-col w-full">
              <WebsocketSubscribe
                type="customer-reply"
                handler={async (data) => {
                  if (data.payload.topic_id === mt.id && data.payload.revalidate_id === props.session.user!.id) {
                    await revalidate(getMessageTopics.key);
                    scrollAnchor.scrollIntoView({ behavior: "instant", inline: "end" });
                  }
                }}
              />
              <div class="h-min flex items-start p-4 border-b border-neutral-200 dark:border-neutral-700">
                <div class="flex items-start gap-4 text-sm">
                  <ImageRoot>
                    <Image alt={mt.owner.name} />
                    <ImageFallback class="uppercase">
                      {mt.owner.name
                        .split(" ")
                        .map((chunk) => chunk[0])
                        .join("")}
                    </ImageFallback>
                  </ImageRoot>
                  <div class="grid gap-1">
                    <div class="font-semibold">{mt.owner.name}</div>
                    <div class="line-clamp-1 text-xs">{mt.subject}</div>
                    <div class="line-clamp-1 text-xs">
                      <span class="font-medium">Reply-To:</span> {mt.receiver.email}
                    </div>
                  </div>
                </div>
                <Show when={mt.createdAt}>
                  {(d) => (
                    <div class="ml-auto text-xs txt-muted-foreground">{dayjs(d()).format("MMM DD, YYYY h:mm A")}</div>
                  )}
                </Show>
              </div>
              <div class="flex flex-col p-2 w-full flex-1 items-start justify-end border-b border-neutral-200 dark:border-neutral-700 overflow-hidden">
                <div class="flex flex-col gap-2 w-full h-full overflow-y-auto overflow-x-hidden px-2">
                  <For each={orderByCreated(mt.messages)}>
                    {(message) => (
                      <Transition name="slide-fade-up">
                        <Message
                          message={message}
                          direction={message.message.owner.id === props.session.user!.id ? "right" : "left"}
                        />
                      </Transition>
                    )}
                  </For>
                  <Show when={props.session} keyed>
                    {(s) => (
                      <Show when={isAddingMessageToMesageTopic.pending && isAddingMessageToMesageTopic.input}>
                        {(m) => <MessagePreview message={m()[1]} username={s.user!.name} attachments={m()[2]} />}
                      </Show>
                    )}
                  </Show>
                  <div
                    ref={scrollAnchor!}
                    style={{
                      "overflow-anchor": "auto",
                    }}
                  ></div>
                </div>
              </div>
              <div class="flex flex-col w-full flex-1">
                <TextFieldRoot
                  class="border-b border-neutral-200 dark:border-neutral-700"
                  value={newMessage()}
                  onChange={setNewMessage}
                  readOnly={isAddingMessageToMesageTopic.pending}
                >
                  <TextArea
                    class="p-4 border-none !mt-0 rounded-none focus-visible:ring-0 !shadow-none !outline-none resize-none"
                    placeholder={`Reply ${mt.receiver.name}...`}
                    autoResize
                    onKeyDown={(e: KeyboardEvent) => {
                      // if Ctrl+Enter is pressed, send the message
                      if (e.ctrlKey && e.key === "Enter") {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                  />
                </TextFieldRoot>
                <div class="p-4 text-sm w-full h-min flex gap-4 items-center justify-between border-b border-neutral-200 dark:border-neutral-700">
                  <div class="w-full flex flex-row gap-2 h-max">
                    <For each={attachments()}>
                      {(attachment) => (
                        <div
                          class={cn(
                            "flex items-center px-3 py-2 text-xs w-max border border-neutral-200 dark:border-neutral-700 rounded-md gap-2",
                            {
                              "opacity-50 cursor-not-allowed": isRemovingAttachment.pending,
                            },
                          )}
                        >
                          {attachment.name}
                          <Button
                            variant="secondary"
                            size="icon"
                            class="flex items-center gap-2 size-5"
                            disabled={isRemovingAttachment.pending}
                            onClick={async () => {
                              // remove uploaded file from server
                              await removeAttachmentAction(attachment.id);
                              setAttachments(attachments().filter((a) => a.id !== attachment.id));
                            }}
                          >
                            <X class="size-3" />
                          </Button>
                        </div>
                      )}
                    </For>
                    <For each={uploadingFiles()}>
                      {(file) => (
                        <div
                          class={cn(
                            "flex items-center px-3 py-2 text-xs w-max border border-neutral-200 dark:border-neutral-700 rounded-md gap-2 bg-neutral-50 dark:bg-neutral-900 animate-pulse",
                          )}
                        >
                          {file.name}
                        </div>
                      )}
                    </For>
                  </div>
                  <div class="flex items-center gap-2 justify-center w-max">
                    <Show when={attachments().length > 0}>
                      <Button
                        variant="secondary"
                        size="sm"
                        class="flex items-center gap-2 w-max"
                        onClick={clearAttachments}
                      >
                        <X class="size-4" />
                        Clear
                      </Button>
                    </Show>
                    <Button
                      size="sm"
                      class="flex items-center gap-2 w-max"
                      onClick={() => {
                        fileInput?.click();
                      }}
                    >
                      <FilePlus class="size-4" />
                      Add attachment
                    </Button>
                  </div>
                </div>
                <div class="flex items-center justify-between p-4 h-max w-full">
                  <Switch class="flex items-center gap-2 text-xs font-normal">
                    <SwitchControl>
                      <SwitchThumb />
                    </SwitchControl>
                    <SwitchLabel>Mute this topic</SwitchLabel>
                  </Switch>
                  <Button
                    size="sm"
                    disabled={!data() || isAddingMessageToMesageTopic.pending}
                    class="ml-auto flex flex-row items-center gap-2"
                    onClick={async () => {
                      sendMessage();
                    }}
                  >
                    Send
                    <SendHorizontal class="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Show>
      </div>
    </>
  );
};

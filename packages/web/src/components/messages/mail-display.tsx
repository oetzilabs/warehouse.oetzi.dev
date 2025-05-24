import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Switch, SwitchControl, SwitchLabel, SwitchThumb } from "@/components/ui/switch";
import { TextField, TextFieldTextArea } from "@/components/ui/text-field";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getMessages } from "@/lib/api/messages";
import { createAsync } from "@solidjs/router";
import { type MessageInfo } from "@warehouseoetzidev/core/src/entities/messages";
import Archive from "lucide-solid/icons/archive";
import Clock from "lucide-solid/icons/clock";
import DotsVertical from "lucide-solid/icons/ellipsis";
import Forward from "lucide-solid/icons/forward";
import Reply from "lucide-solid/icons/reply";
import ReplyAll from "lucide-solid/icons/reply-all";
import Trash from "lucide-solid/icons/trash";
import { Accessor, createMemo, Show } from "solid-js";

export function MailDisplay(props: { mail: Accessor<MessageInfo | null> }) {
  return (
    <div class="flex grow flex-col">
      <div class="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800">
        <div class="flex items-center gap-2">
          <Tooltip openDelay={0} closeDelay={0}>
            <TooltipTrigger as={Button} variant="ghost" size="icon" disabled={!props.mail()}>
              <Archive />
              <span class="sr-only">Archive</span>
            </TooltipTrigger>
            <TooltipContent>Archive</TooltipContent>
          </Tooltip>
          <Tooltip openDelay={0} closeDelay={0}>
            <TooltipTrigger as={Button} variant="ghost" size="icon" disabled={!props.mail()}>
              <Trash />
              <span class="sr-only">Move to trash</span>
            </TooltipTrigger>
            <TooltipContent>Move to trash</TooltipContent>
          </Tooltip>
          <Separator orientation="vertical" class="mx-2 h-4" />
          <Tooltip openDelay={0} closeDelay={0}>
            <TooltipTrigger as={Button} variant="ghost" size="icon" disabled={!props.mail()}>
              <Clock />
              <span class="sr-only">Snooze</span>
            </TooltipTrigger>
            <TooltipContent>Snooze</TooltipContent>
          </Tooltip>
        </div>
        <div class="flex flex-row items-center gap-2">
          <div class="flex items-center gap-2">
            <Tooltip openDelay={0} closeDelay={0}>
              <TooltipTrigger as={Button} variant="ghost" size="icon" disabled={!props.mail()}>
                <Reply class="size-4" />
                <span class="sr-only">Reply</span>
              </TooltipTrigger>
              <TooltipContent>Reply</TooltipContent>
            </Tooltip>
            <Tooltip openDelay={0} closeDelay={0}>
              <TooltipTrigger as={Button} variant="ghost" size="icon" disabled={!props.mail()}>
                <ReplyAll class="size-4" />
                <span class="sr-only">Reply all</span>
              </TooltipTrigger>
              <TooltipContent>Reply all</TooltipContent>
            </Tooltip>
            <Tooltip openDelay={0} closeDelay={0}>
              <TooltipTrigger as={Button} variant="ghost" size="icon" disabled={!props.mail()}>
                <Forward class="size-4" />
                <span class="sr-only">Forward</span>
              </TooltipTrigger>
              <TooltipContent>Forward</TooltipContent>
            </Tooltip>
          </div>
          <Separator orientation="vertical" class="mx-2 h-4" />
          <DropdownMenu placement="bottom-end">
            <DropdownMenuTrigger as={Button} variant="ghost" size="icon" disabled={!props.mail()}>
              <DotsVertical class="size-4" />
              <span class="sr-only">More</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Mark as unread</DropdownMenuItem>
              <DropdownMenuItem>Star thread</DropdownMenuItem>
              <DropdownMenuItem>Add label</DropdownMenuItem>
              <DropdownMenuItem>Mute thread</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <Show when={props.mail()} fallback={<div class="p-8 text-center text-muted-foreground">No message selected</div>}>
        {(m) => (
          <div class="flex flex-1 flex-col">
            <div class="flex items-start p-4">
              <div class="flex items-start gap-4 text-sm">
                <Avatar>
                  <AvatarImage alt={m().sender} />
                  <AvatarFallback>
                    {m()
                      .title.split(" ")
                      .map((chunk) => chunk[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div class="grid gap-1">
                  <div class="font-semibold">{m().title}</div>
                  <div class="line-clamp-1 text-xs">
                    <span class="font-medium">Reply-To:</span> {m().sender}
                  </div>
                </div>
              </div>
              <div class="ml-auto text-xs text-muted-foreground">
                {new Intl.DateTimeFormat("en-US", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(m().sentAt ?? m().createdAt)}
              </div>
            </div>
            <Separator />
            <div class="flex-1 whitespace-pre-wrap p-4 text-sm">{m().content}</div>
            <Separator class="mt-auto" />
            <div class="p-4">
              <div class="grid gap-4">
                <TextField>
                  <TextFieldTextArea class="p-4" placeholder={`Reply ${m().sender}...`} />
                </TextField>
                <div class="flex items-center">
                  <Switch class="flex items-center gap-2 text-xs font-normal">
                    <SwitchControl>
                      <SwitchThumb />
                    </SwitchControl>
                    <SwitchLabel>Mute this thread</SwitchLabel>
                  </Switch>
                  <Button size="sm" class="ml-auto">
                    Send
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Show>
    </div>
  );
}

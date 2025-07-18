import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  acceptNotification,
  getNotifications,
  markNotificationUnread,
  syncNotifications,
} from "@/lib/api/notifications";
import { A, createAsync, revalidate, useAction, useSubmission } from "@solidjs/router";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import relativeTime from "dayjs/plugin/relativeTime";
import ArrowLeft from "lucide-solid/icons/arrow-left";
import Info from "lucide-solid/icons/info";
import Loader2 from "lucide-solid/icons/loader-2";
import RotateCw from "lucide-solid/icons/rotate-cw";
import { For, Show, Suspense } from "solid-js";
import { toast } from "solid-sonner";

dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);

export default function NotificationsPage() {
  const data = createAsync(() => getNotifications({ ignoreRead: true }), { deferStream: true });
  const manunalSync = useAction(syncNotifications);
  const isManuallySyncing = useSubmission(syncNotifications);
  const acceptNotificationAction = useAction(acceptNotification);
  const isAcceptingNotification = useSubmission(acceptNotification);
  const markNotificationUnreadAction = useAction(markNotificationUnread);
  const isMarkingNotificationUnread = useSubmission(markNotificationUnread);

  return (
    <div class="flex flex-row w-full grow p-2 gap-2">
      <div class="w-full flex flex-row h-full gap-4">
        <div class="w-full flex flex-col bg-background">
          <div class="flex items-center gap-2 justify-between w-full bg-background pb-2">
            <div class="flex flex-row items-center gap-4">
              <Button size="sm" as={A} href="/dashboard" variant="outline" class="bg-background">
                <ArrowLeft class="size-4" />
                Back
              </Button>
              <h1 class="font-semibold leading-none">Notifications</h1>
            </div>
            <div class="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                class="bg-background"
                onClick={() => {
                  toast.promise(revalidate(getNotifications.key), {
                    loading: "Refreshing orders...",
                    success: "Orders refreshed",
                    error: "Failed to refresh orders",
                  });
                }}
              >
                <span class="sr-only md:not-sr-only">Refresh</span>
                <RotateCw class="size-4" />
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  toast.promise(manunalSync(), {
                    loading: "Refreshing orders...",
                    success: "Orders refreshed",
                    error: "Failed to refresh orders",
                  });
                }}
                disabled={isManuallySyncing.pending}
              >
                <span class="sr-only md:not-sr-only">Sync</span>
                <Show when={!isManuallySyncing.pending} fallback={<Loader2 class="size-4 animate-spin" />}>
                  <RotateCw class="size-4" />
                </Show>
              </Button>
            </div>
          </div>
          <div class="flex flex-col gap-4 w-full">
            <Suspense
              fallback={
                <div class="flex flex-col gap-4 w-full">
                  <Skeleton class="w-full h-20" />
                  <Skeleton class="w-full h-20" />
                  <Skeleton class="w-full h-40" />
                  <Skeleton class="w-full h-20" />
                  <Skeleton class="w-full h-32" />
                </div>
              }
            >
              <Show when={data()}>
                {(ns) => (
                  <For
                    each={ns()}
                    fallback={
                      <div class="flex flex-col gap-4 w-full items-center justify-center p-12 border rounded-lg">
                        <span class="text-sm text-muted-foreground select-none">There are no notifications!</span>
                      </div>
                    }
                  >
                    {(n) => (
                      <div class="flex flex-col w-full border rounded-lg overflow-clip bg-muted-foreground/10 dark:bg-muted/30">
                        <div class="flex flex-row items-center justify-between p-2 pl-4">
                          <div class="flex flex-row items-center gap-2 text-sm">
                            <Info class="size-4" />
                            <span class="font-semibold">{n.title}</span>
                            <span class="">·</span>
                            <span>{dayjs(n.createdAt).format("LLL")}</span>
                          </div>
                          <div class="flex flex-row gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isAcceptingNotification.pending || n.readAt !== null || n.readByUserId !== null}
                              class="bg-background"
                              onClick={() => {
                                toast.promise(acceptNotificationAction(n.id), {
                                  loading: "Marking as read...",
                                  success: "Marked as read",
                                  error: "Failed to mark as read",
                                });
                              }}
                            >
                              <span class="sr-only md:not-sr-only">Mark as read</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={
                                isAcceptingNotification.pending || (n.readAt === null && n.readByUserId === null)
                              }
                              class="bg-background"
                              onClick={() => {
                                toast.promise(markNotificationUnreadAction(n.id), {
                                  loading: "Marking as unread...",
                                  success: "Marked as unread",
                                  error: "Failed to mark as unread",
                                });
                              }}
                            >
                              <span class="sr-only md:not-sr-only">Mark as unread</span>
                            </Button>
                          </div>
                        </div>
                        <div class="flex flex-row items-center gap-2 pl-4 pr-2 pb-3">
                          <div class="prose prose-sm prose-neutral dark:prose-invert">
                            <span>{n.content}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </For>
                )}
              </Show>
            </Suspense>
          </div>
        </div>
      </div>

      <div class="flex flex-col w-full md:w-[500px] p-4 md:overflow-auto border-b md:border-b-0 h-content"></div>
    </div>
  );
}

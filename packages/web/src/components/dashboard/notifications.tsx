import { createAsync, A } from "@solidjs/router";
import { getNotifications } from "@/lib/api/notifications";
import { buttonVariants } from "@/components/ui/button";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { cn } from "@/lib/utils";
import type { UserSession } from "@/lib/api/auth";
import { Show } from "solid-js";
import { For } from "solid-js";
import { getCurrentOrganizationSlug } from "../../lib/api/auth";
dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);

export const NotificationList = (props: { session: UserSession }) => {
  const notifications = createAsync(() => getNotifications());
  const currentOrganizationSlug = createAsync(() => getCurrentOrganizationSlug());

  return (
    <div class="flex flex-col w-full gap-2">
      <div class="flex flex-col w-full gap-2">
        <Show when={currentOrganizationSlug()}>
          {(slug) => (
            <>
              <A href={`/organization/${slug()}/notifications`} class="flex flex-col w-full font-medium text-sm">
                Notifications
              </A>
              <div class="flex flex-col w-full gap-2">
                <Show when={typeof notifications !== undefined && notifications()}>
                  {(notificationlist) => (
                    <For
                      each={notificationlist()}
                      fallback={
                        <div class="w-full flex flex-col items-center justify-center bg-neutral-50 dark:bg-neutral-950 text-muted-foreground text-xs p-3 border border-neutral-200 dark:border-neutral-800 rounded-md">
                          <span>No Notifications,</span>
                          <span>you are good to go!</span>
                        </div>
                      }
                    >
                      {(notification) => (
                        <A
                          href={`/dashboard/notifications/${notification.id}`}
                          class={cn(
                            buttonVariants({
                              variant: "ghost",
                              size: "sm",
                            }),
                            "flex flex-col w-full p-2 border relative border-neutral-200 dark:border-neutral-800 rounded-md min-h-10 h-auto"
                          )}
                        >
                          <div class="w-full flex flex-row items-center justify-between">
                            <div class="flex flex-row items-center justify-start w-full text-sm font-semibold">
                              {notification.title}
                            </div>
                            <div class="flex flex-row items-center justify-end w-max text-muted-foreground"></div>
                          </div>
                          <div class="flex flex-row w-full text-xs font-normal text-muted-foreground">
                            {notification.content}
                          </div>
                        </A>
                      )}
                    </For>
                  )}
                </Show>
              </div>
            </>
          )}
        </Show>
      </div>
    </div>
  );
};

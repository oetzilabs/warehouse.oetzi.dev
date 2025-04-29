import { getNotificationSettings } from "@/lib/api/notifications";
import { cn } from "@/lib/utils";
import { sleep } from "@/utils";
import { changeNotificationSettings } from "@/utils/api/actions";
import { createAsync, revalidate, useAction, useSubmission } from "@solidjs/router";
import BellDot from "lucide-solid/icons/bell-dot";
import BellOff from "lucide-solid/icons/bell-off";
import User from "lucide-solid/icons/user";
import { createEffect, For } from "solid-js";
import { toast } from "solid-sonner";

const notifications_types = [
  {
    type: "everything",
    icon: <BellDot class="w-4 h-4" />,
    description: "Email digest, mentions & all activity.",
  },
  {
    type: "mentions",
    icon: <User class="w-4 h-4" />,
    description: "Only mentions and comments.",
  },
  {
    type: "nothing",
    icon: <BellOff class="w-4 h-4" />,
    description: "Turn off all notifications.",
  },
];

export const Notifications = () => {
  const notifcationSettings = createAsync(() => getNotificationSettings());

  const _changeNotificationSettings = useAction(changeNotificationSettings);
  const isChangingNotificationSettings = useSubmission(changeNotificationSettings);

  createEffect(() => {
    if (isChangingNotificationSettings.result) {
      toast.success("Notification settings updated");
    }
  });

  const handleNotificationChange = async (type: string) => {
    await _changeNotificationSettings(type);
    await sleep(150);
    await revalidate(getNotificationSettings.key);
  };

  return (
    <div class="flex flex-col items-start gap-8 w-full">
      <div class="flex flex-col items-start gap-2 w-full">
        <span class="text-lg font-semibold">Notifications</span>
        <span class="text-sm text-muted-foreground">Choose what you want to be notified about.</span>
      </div>
      <div class="flex flex-col items-start gap-2 w-full">
        <div class="grid gap-1 w-full">
          <For each={notifications_types}>
            {(n) => (
              <button
                type="button"
                class={cn(
                  "flex flex-row items-center justify-start gap-6 w-full transition-all hover:bg-accent hover:text-accent-foreground py-2 px-4 rounded-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
                  {
                    "bg-accent text-accent-foreground border border-neutral-300 dark:border-neutral-700 shadow-sm":
                      notifcationSettings()?.type === n.type,
                  },
                )}
                disabled={isChangingNotificationSettings.pending}
                onClick={() => handleNotificationChange(n.type)}
              >
                <div class="flex flex-row items-center gap-2">{n.icon}</div>
                <div class="flex flex-col gap-3 items-start justify-start w-full">
                  <span class="text-sm font-semibold capitalize">{n.type}</span>
                  <span class="text-xs text-muted-foreground">{n.description}</span>
                </div>
              </button>
            )}
          </For>
        </div>
      </div>
    </div>
  );
};

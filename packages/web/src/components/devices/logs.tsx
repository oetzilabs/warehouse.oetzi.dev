import { Button } from "@/components/ui/button";
import { getDeviceLogs } from "@/lib/api/devices";
import { createAsync, revalidate } from "@solidjs/router";
import Loader2 from "lucide-solid/icons/loader-2";
import RefreshIcon from "lucide-solid/icons/rotate-cw";
import { For, Show, Suspense } from "solid-js";
import { toast } from "solid-sonner";

export type DeviceLogsProps = {
  deviceId: string;
};

export function DeviceLogs(props: DeviceLogsProps) {
  // TODO: Replace with actual API call
  const deviceLogs = createAsync(() => getDeviceLogs(props.deviceId), { deferStream: true });

  const refresh = () =>
    toast.promise(revalidate([]), {
      loading: "Refreshing logs...",
      success: "Logs refreshed",
      error: "Failed to refresh logs",
    });

  return (
    <div class="flex flex-col gap-4 grow ">
      <Suspense
        fallback={
          <div class="w-full h-full flex items-center justify-center flex-row gap-4 py-10 rounded-lg text-muted-foreground">
            <Loader2 class="size-4 animate-spin" />
            <span class="text-sm">Loading...</span>
          </div>
        }
      >
        <Show when={deviceLogs()}>
          {(logs) => (
            <div class="flex flex-col gap-4 grow">
              <For
                each={logs()}
                fallback={
                  <div class="flex flex-col items-center justify-center flex-1 w-full py-10">
                    <div class="flex flex-col items-center justify-center h-max w-full gap-4">
                      <div class="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
                        <span>There are currently no logs for this device.</span>
                      </div>
                      <Button size="sm" variant="secondary" class="py-2" onClick={refresh}>
                        <RefreshIcon class="size-4" />
                        <span class="sr-only md:not-sr-only">Refresh</span>
                      </Button>
                    </div>
                  </div>
                }
              >
                {(log) => <div />}
              </For>
            </div>
          )}
        </Show>
      </Suspense>
    </div>
  );
}

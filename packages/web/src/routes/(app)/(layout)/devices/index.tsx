import { DevicesList } from "@/components/lists/devices";
import { Button } from "@/components/ui/button";
import { getAuthenticatedUser, getSessionToken } from "@/lib/api/auth";
import { getDevices } from "@/lib/api/devices";
import { A, createAsync, revalidate, RouteDefinition, useAction, useSubmission } from "@solidjs/router";
import ArrowLeft from "lucide-solid/icons/arrow-left";
import Cpu from "lucide-solid/icons/cpu";
import Plus from "lucide-solid/icons/plus";
import PrinterPlus from "lucide-solid/icons/printer";
import RotateCw from "lucide-solid/icons/rotate-cw";
import { Show } from "solid-js";
import { toast } from "solid-sonner";

export const route = {
  preload: (props) => {
    const user = getAuthenticatedUser();
    const sessionToken = getSessionToken();
    const devices = getDevices();
    return { user, sessionToken, devices };
  },
} as RouteDefinition;

export default function DevicesPage() {
  const data = createAsync(() => getDevices(), { deferStream: true });

  return (
    <div class="flex flex-col-reverse md:flex-row w-full h-full gap-0 overflow-auto lg:overflow-hidden">
      <div class="w-full flex flex-row h-content gap-4 p-4 border-r-0 md:border-r md:overflow-auto">
        <div class="w-full flex flex-col gap-4">
          <div class="flex items-center gap-4 justify-between w-full bg-background">
            <div class="flex flex-row items-center gap-4">
              <div class="size-8 rounded-md flex items-center justify-center bg-muted-foreground/10 dark:bg-muted/50">
                <Cpu class="size-4" />
              </div>
              <h1 class="font-semibold leading-none">Devices</h1>
            </div>
            <div class="flex items-center gap-0">
              <Button
                size="icon"
                variant="outline"
                class="w-9 rounded-r-none bg-background"
                onClick={() => {
                  toast.promise(revalidate(getDevices.key), {
                    loading: "Refreshing devices...",
                    success: "Devices refreshed",
                    error: "Failed to refresh devices",
                  });
                }}
              >
                <RotateCw class="size-4" />
              </Button>
              <Button as={A} href="/devices/new" size="sm" class="pl-2.5 rounded-l-none pr-2.5 md:pr-3">
                <Plus class="size-4" />
                <span class="sr-only md:not-sr-only">Add Device</span>
              </Button>
            </div>
          </div>
          <Show when={data()}>{(devicesList) => <DevicesList data={devicesList} />}</Show>
        </div>
      </div>
      <div class="flex flex-col w-full md:w-[500px] p-4 md:overflow-auto border-b md:border-b-0 h-content"></div>
    </div>
  );
}

import { DevicesList } from "@/components/lists/devices";
import { Button } from "@/components/ui/button";
import { getAuthenticatedUser, getSessionToken } from "@/lib/api/auth";
import { getDevices } from "@/lib/api/devices";
import { A, createAsync, revalidate, RouteDefinition, useAction, useSubmission } from "@solidjs/router";
import ArrowLeft from "lucide-solid/icons/arrow-left";
import Plus from "lucide-solid/icons/plus";
import PrinterPlus from "lucide-solid/icons/printer";
import RotateCw from "lucide-solid/icons/rotate-cw";
import { Show } from "solid-js";
import { toast } from "solid-sonner";

export const route = {
  preload: (props) => {
    const user = getAuthenticatedUser({ skipOnboarding: true });
    const sessionToken = getSessionToken();
    const devices = getDevices();
    return { user, sessionToken, devices };
  },
} as RouteDefinition;

export default function DevicesPage() {
  const data = createAsync(() => getDevices(), { deferStream: true });

  return (
    <Show when={data()}>
      {(devicesList) => (
        <div class="container flex flex-col grow py-0">
          <div class="w-full flex flex-row h-full">
            <div class="w-full flex flex-col gap-4">
              <div class="flex items-center gap-4 justify-between w-full">
                <div class="flex flex-row items-center gap-4">
                  <Button size="sm" variant="outline" class="bg-background" as={A} href="/dashboard">
                    <ArrowLeft class="size-4" />
                    Dashboard
                  </Button>
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
                  <Button as={A} href="/devices/new" size="sm" class="pl-2.5 rounded-l-none">
                    <Plus class="size-4" />
                    Add Device
                  </Button>
                </div>
              </div>
              <DevicesList data={devicesList} />
            </div>
          </div>
        </div>
      )}
    </Show>
  );
}

import { StatusBadge } from "@/components/StatusBadge";
import { getAuthenticatedUser, getSessionToken } from "@/lib/api/auth";
import { getFacilityDevicesByWarehouseId } from "@/lib/api/facilities";
import { createAsync, RouteDefinition, useParams } from "@solidjs/router";
import { createSignal, For, Show, Suspense } from "solid-js";

export const route = {
  preload: (props) => {
    getAuthenticatedUser();
    getSessionToken();
    const params = props.params;
    getFacilityDevicesByWarehouseId(params.whid, params.fcid);
  },
} as RouteDefinition;

export default function MapPage() {
  const params = useParams();
  const facilityDevices = createAsync(() => getFacilityDevicesByWarehouseId(params.whid, params.fcid));

  return (
    <div class="flex flex-col w-full grow">
      <Suspense fallback={<div class="flex flex-col w-full grow">Loading...</div>}>
        <Show when={facilityDevices()}>
          {(devices) => (
            <div class="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <For each={devices()}>
                {(d) => (
                  <div class="w-full h-full flex flex-col gap-2">
                    <div class="flex flex-row gap-1">
                      <span class="font-bold">{d.name}</span>
                      <StatusBadge status={d.status} />
                    </div>
                    <div class="flex flex-col gap-2">
                      <span class="font-bold">{d.description}</span>
                    </div>
                  </div>
                )}
              </For>
            </div>
          )}
        </Show>
      </Suspense>
    </div>
  );
}

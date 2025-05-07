import { Authenticated } from "@/components/Authenticated";
import { useBreadcrumbs } from "@/components/providers/Breadcrumbs";
import WarehouseMap from "@/components/WarehouseMap";
import { getAuthenticatedUser, getSessionToken } from "@/lib/api/auth";
import { getWarehouses } from "@/lib/api/warehouses";
import { createAsync, RouteDefinition } from "@solidjs/router";
import Loader2 from "lucide-solid/icons/loader-2";
import { onMount, Show, Suspense } from "solid-js";

export const route = {
  preload: () => {
    const user = getAuthenticatedUser({ skipOnboarding: true });
    const sessionToken = getSessionToken();
    return { user, sessionToken };
  },
} as RouteDefinition;

export default function DashboardPage() {
  const warehouses = createAsync(() => getWarehouses(), { deferStream: true });

  const { setBreadcrumbs } = useBreadcrumbs();

  onMount(() => {
    setBreadcrumbs([
      {
        label: "Dashboard",
        href: "/dashboard",
      },
    ]);
  });

  return (
    <Authenticated skipOnboarding={false}>
      {(user) => (
        <div class="w-full h-full flex">
          <div class="w-full h-full flex flex-col items-center justify-center relative">
            <Suspense
              fallback={
                <div class="w-full h-full flex items-center justify-center">
                  <Loader2 class="size-4 animate-spin"></Loader2>
                </div>
              }
            >
              <Show when={warehouses()}>{(wh) => <WarehouseMap warehouses={wh()} />}</Show>
            </Suspense>
          </div>
        </div>
      )}
    </Authenticated>
  );
}

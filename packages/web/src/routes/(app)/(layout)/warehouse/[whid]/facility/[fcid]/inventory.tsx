import FacilityEditor from "@/components/FacilityEditor";
import { useUser } from "@/components/providers/User";
import { getAuthenticatedUser, getSessionToken } from "@/lib/api/auth";
import { getFacilityByWarehouseId } from "@/lib/api/facilities";
import { createAsync, RouteDefinition, useParams } from "@solidjs/router";
import { createSignal, Show } from "solid-js";

export const route = {
  preload: () => {
    const user = getAuthenticatedUser({ skipOnboarding: true });
    const sessionToken = getSessionToken();
    return { user, sessionToken };
  },
} as RouteDefinition;

export default function MapPage() {
  const params = useParams();
  const facility = createAsync(() => getFacilityByWarehouseId(params.whid, params.fcid));

  return (
    <Show when={facility()}>
      {(fc) => (
        <div class="flex flex-col gap-4 w-full h-full relative">
          <FacilityEditor facility={fc} />
        </div>
      )}
    </Show>
  );
}

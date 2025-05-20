import { getAuthenticatedUser, getSessionToken } from "@/lib/api/auth";
import { getFacilityDevicesByWarehouseId } from "@/lib/api/facilities";
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
  const facilityDevices = createAsync(() => getFacilityDevicesByWarehouseId(params.whid, params.fcid));
}


import { useUser } from "@/components/providers/User";
import { getAuthenticatedUser, getSessionToken } from "@/lib/api/auth";
import { RouteDefinition } from "@solidjs/router";
import { createSignal, Show } from "solid-js";
import FacilityEditor from "../../../components/FacilityEditor";

export const route = {
  preload: () => {
    const user = getAuthenticatedUser({ skipOnboarding: true });
    const sessionToken = getSessionToken();
    return { user, sessionToken };
  },
} as RouteDefinition;

export default function MapPage() {
  const user = useUser();
  return <Show when={user.currentFacility()}>{(fc) => <FacilityEditor facility={fc} />}</Show>;
}

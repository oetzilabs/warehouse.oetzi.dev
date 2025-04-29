import type { UserSession } from "@/lib/api/auth";
import { getAuthenticatedSession } from "@/lib/api/auth";
import { createContextProvider } from "@solid-primitives/context";
import { createAsync } from "@solidjs/router";
import { createEffect, createSignal } from "solid-js";

export const [SessionProvider, useSession] = createContextProvider(() => {
  const authenticatedSession = createAsync(() => getAuthenticatedSession(), { deferStream: true });
  const [session, setSession] = createSignal<UserSession & { isLoading: boolean }>({
    token: null,
    user: null,
    expiresAt: null,
    organizations: [],
    current_organization: null,
    id: null,
    createdAt: null,
    isLoading: true,
  });
  createEffect(() => {
    const aS = authenticatedSession();
    if (!aS) {
      return;
    }
    const merged = Object.assign({ isLoading: false }, aS);
    setSession(merged);
  });
  return session;
});

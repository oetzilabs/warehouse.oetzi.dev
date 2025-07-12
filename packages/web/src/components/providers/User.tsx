import { getAuthenticatedUser, getSessionToken } from "@/lib/api/auth";
import { escapeLike, Zero } from "@rocicorp/zero";
import { createQuery, createZero } from "@rocicorp/zero/solid";
import { createAsync, revalidate } from "@solidjs/router";
import { type SessionInfo } from "@warehouseoetzidev/core/src/entities/sessions";
import { type UserInfo } from "@warehouseoetzidev/core/src/entities/users";
import { schema, Schema } from "@warehouseoetzidev/zero/src/index";
import { createMutators, Mutators } from "@warehouseoetzidev/zero/src/mutators";
// import { Schema } from "effect";
import { Accessor, createContext, createMemo, createSignal, onMount, ParentProps, useContext } from "solid-js";
import { toast } from "solid-sonner";

export const UserContext = createContext<{
  user: Accessor<UserInfo | null>;
  session: Accessor<UserInfo["sessions"][number] | null>;
  currentOrganization: Accessor<UserInfo["sessions"][number]["org"] | null>;
  ready: Accessor<boolean>;
  reload: () => void;
  z: Accessor<Zero<Schema, Mutators> | undefined>;
}>({
  user: () => null,
  session: () => null,
  currentOrganization: () => null,
  ready: () => false,
  reload: () => {},
  z: () => undefined,
});

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return ctx;
}

export function UserProvider(props: ParentProps) {
  const getUser = createAsync(() => getAuthenticatedUser(), { deferStream: true });
  const sessionToken = createAsync(() => getSessionToken(), { deferStream: true });

  const [z, setZ] = createSignal<Zero<Schema, Mutators> | undefined>(undefined);

  const reload = () => {
    setReady(false);
    toast.promise(revalidate([getAuthenticatedUser.key, getSessionToken.key]), {
      error: "Failed to reload user",
      loading: "Reloading user...",
      success: (d) => {
        setReady(true);
        return "Reloaded";
      },
    });
  };

  const user = createMemo(() => {
    const u = getUser();
    if (!u) return null;
    return u;
  });

  const currentSession = createMemo(() => {
    const u = user();
    if (!u) {
      return null;
    }
    if (!u.sessions) {
      return null;
    }
    const t = sessionToken();
    if (!t) {
      console.log("no session token");
      return null;
    }
    const sess = u.sessions.find((s) => s.access_token === t);
    return sess ?? null;
  });
  const currentOrganization = createMemo(() => {
    const session = currentSession();
    if (!session) {
      return null;
    }
    return session.org;
  });

  const [ready, setReady] = createSignal(false);

  onMount(() => {
    const cs = currentSession();
    if (!cs) {
      return;
    }
    const cu = getUser();
    if (!cu) {
      return;
    }
    setZ(
      createZero({
        userID: cs.userId,
        auth: cs.access_token,
        server: import.meta.env.VITE_PUBLIC_SERVER,
        schema,
        mutators: createMutators(cu),
        kvStore: "idb",
      }),
    );
    setReady(true);
  });

  return (
    <UserContext.Provider
      value={{
        user,
        currentOrganization,
        session: currentSession,
        ready,
        reload,
        z,
      }}
    >
      {props.children}
    </UserContext.Provider>
  );
}

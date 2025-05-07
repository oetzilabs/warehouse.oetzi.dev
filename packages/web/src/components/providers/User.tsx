import { getAuthenticatedUser, getSessionToken } from "@/lib/api/auth";
import { createAsync } from "@solidjs/router";
import { type OrganizationInfo } from "@warehouseoetzidev/core/src/entities/organizations";
import { type SessionInfo } from "@warehouseoetzidev/core/src/entities/sessions";
import { type UserInfo } from "@warehouseoetzidev/core/src/entities/users";
import { type WarehouseInfo } from "@warehouseoetzidev/core/src/entities/warehouses";
import {
  Accessor,
  createContext,
  createEffect,
  createMemo,
  createSignal,
  onMount,
  ParentProps,
  useContext,
} from "solid-js";

export const UserContext = createContext<{
  user: Accessor<UserInfo | null>;
  session: Accessor<SessionInfo | null>;
  currentOrganization: Accessor<OrganizationInfo | null>;
  currentWarehouse: Accessor<WarehouseInfo | null>;
  ready: Accessor<boolean>;
}>({
  user: () => null,
  session: () => null,
  currentOrganization: () => null,
  currentWarehouse: () => null,
  ready: () => false,
});

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return ctx;
}

export function UserProvider(props: ParentProps) {
  const getUser = createAsync(() => getAuthenticatedUser({ skipOnboarding: true }), { deferStream: true });
  const sessionToken = createAsync(() => getSessionToken(), { deferStream: true });

  const user = () => {
    const u = getUser();
    if (!u) return null;
    return u;
  };

  const currentSession = () => {
    const u = user();
    if (!u) {
      console.log("no user");
      return null;
    }
    const t = sessionToken();
    if (!t) {
      console.log("no session token");
      return null;
    }
    const sess = u.sessions.find((s) => s.access_token === t);
    return sess ?? null;
  };
  const currentOrganization = () => {
    const session = currentSession();
    if (!session) {
      return null;
    }
    // @ts-ignore
    return session.org;
  };

  const currentWarehouse = () => {
    const session = currentSession();
    if (!session) {
      return null;
    }
    // @ts-ignore
    return session.wh;
  };

  const [ready, setReady] = createSignal(false);

  onMount(() => {
    setReady(true);
  });

  return (
    <UserContext.Provider
      value={{
        user,
        currentOrganization,
        currentWarehouse,
        // @ts-ignore
        session: currentSession,
        ready,
      }}
    >
      {props.children}
    </UserContext.Provider>
  );
}

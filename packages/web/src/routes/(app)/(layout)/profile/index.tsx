import { getAuthenticatedSession, getAuthenticatedUser } from "@/lib/api/auth";
import { getLocale } from "@/lib/api/locale";
import { createAsync, RouteDefinition, RouteLoadFuncArgs, RoutePreloadFunc } from "@solidjs/router";
import { Match, Switch } from "solid-js";

export const route = {
  preload: async (params) => {
    await getLocale();
    const session = await getAuthenticatedSession();
    const user = await getAuthenticatedUser();
    return { session, user };
  },
} satisfies RouteDefinition;

export default function ProfilePage() {
  const user = createAsync(() => getAuthenticatedUser());

  return (
    <div class="flex flex-col items-start grow w-full gap-8 p-4">
      <h1 class="text-3xl font-medium">Profile</h1>
      <Switch>
        <Match when={!user()}>
          <div>Loading...</div>
        </Match>
        <Match when={user()}>
          {(u) => (
            <div class="flex flex-col items-start gap-2">
              <span class="text-lg font-semibold">{u().username}</span>
              <span class="text-sm text-muted-foreground">{u().email}</span>
            </div>
          )}
        </Match>
      </Switch>
    </div>
  );
}

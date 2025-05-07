import { getAuthenticatedUser, getSessionToken } from "@/lib/api/auth";
import { createAsync } from "@solidjs/router";
import { type UserInfo } from "@warehouseoetzidev/core/src/entities/users";
import Loader2 from "lucide-solid/icons/loader-2";
import { JSX, Show, Suspense } from "solid-js";
import { NotLoggedIn } from "./NotLoggedIn";

export const Authenticated = (props: {
  children: (props: { user: UserInfo; sessionToken?: string }) => JSX.Element;
  skipOnboarding: boolean;
}) => {
  const user = createAsync(() => getAuthenticatedUser({ skipOnboarding: props.skipOnboarding }), { deferStream: true });
  const sessionToken = createAsync(() => getSessionToken(), { deferStream: true });
  const ChildComp = props.children;

  return (
    <Suspense
      fallback={
        <div class="flex p-4 w-full h-full items-center justify-center text-muted-foreground">
          <Loader2 class="size-6 animate-spin" />
        </div>
      }
    >
      <Show
        when={user()}
        fallback={
          <div class="flex p-4 w-full h-full items-center justify-center text-muted-foreground">
            <div class="w-max h-max min-w-96">
              <NotLoggedIn />
            </div>
          </div>
        }
      >
        {(u) => <ChildComp user={u()} sessionToken={sessionToken()} />}
      </Show>
    </Suspense>
  );
};

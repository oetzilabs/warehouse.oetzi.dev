import { getAuthenticatedSession, type UserSession } from "@/lib/api/auth";
import { createAsync } from "@solidjs/router";
import Loader2 from "lucide-solid/icons/loader-2";
import { JSX, Show, Suspense } from "solid-js";
import { NotLoggedIn } from "./NotLoggedIn";

export const Authenticated = (props: { children: (props: { session: UserSession }) => JSX.Element }) => {
  const session = createAsync(() => getAuthenticatedSession());
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
        when={session()?.user && session()}
        fallback={
          <div class="flex p-4 w-full h-full items-center justify-center text-muted-foreground">
            <div class="w-max h-max min-w-96">
              <NotLoggedIn />
            </div>
          </div>
        }
      >
        {(s) => <ChildComp session={s()} />}
      </Show>
    </Suspense>
  );
};

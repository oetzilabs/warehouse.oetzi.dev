import { getAuthenticatedSession, getAuthenticatedSessions, type UserSession } from "@/lib/api/auth";
import { revokeAllSessions, revokeSession } from "@/utils/api/actions";
import { createAsync, revalidate, useAction, useSubmission } from "@solidjs/router";
import dayjs from "dayjs";
import Loader2 from "lucide-solid/icons/loader-2";
import { For, Show, Suspense } from "solid-js";
import { toast } from "solid-sonner";
import { sleep } from "../../utils";
import { NotLoggedIn } from "../NotLoggedIn";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";

export const SessionList = (props: { session: UserSession }) => {
  const sessions = createAsync(() => getAuthenticatedSessions());
  const isRevokingAllSessions = useSubmission(revokeAllSessions);
  const allSessionRevoker = useAction(revokeAllSessions);
  const sessionRevoker = useAction(revokeSession);
  const isRevokingSession = useSubmission(revokeSession);

  return (
    <Show when={props.session} fallback={<NotLoggedIn />}>
      {(currentSession) => (
        <div class="flex flex-col items-start gap-8 w-full">
          <div class="flex flex-col items-start gap-2 w-full">
            <span class="text-lg font-semibold">Sessions</span>
            <span class="text-muted-foreground text-xs">Manage your sessions here.</span>
          </div>
          <div class="gap-4 w-full flex flex-col">
            <Suspense fallback={<For each={[0, 1]}>{() => <Skeleton class="w-full h-48" />}</For>}>
              <For each={sessions()}>
                {(s) => {
                  return (
                    <div class="rounded-md border border-neutral-200 dark:border-neutral-800 p-4 flex flex-col w-full gap-4">
                      <div class="flex flex-row gap-2 items-center justify-between">
                        <span class="text-lg font-semibold">{s.id}</span>
                        <Show when={s.id === currentSession().id}>
                          <Badge class="text-sm w-max px-3 py-1.5" variant="outline">
                            Current
                          </Badge>
                        </Show>
                      </div>
                      <div class="flex flex-row gap-2 items-center justify-between">
                        <span class="text-sm text-muted-foreground">Expires {dayjs(s.expiresAt).fromNow()}</span>
                        <Button
                          size="sm"
                          disabled={isRevokingSession.pending}
                          variant="destructive"
                          onClick={() => {
                            toast.promise(
                              Promise.all([sessionRevoker(s.id), sleep(150), revalidate(getAuthenticatedSession.key)]),
                              {
                                loading: "Hold on a second, we're revoking the session",
                                icon: <Loader2 class="size-4 animate-spin" />,
                                error: "There was an error revoking the session",
                                success: "Session has been revoked, redirecting to home page!",
                              },
                            );
                          }}
                        >
                          Revoke Session
                        </Button>
                      </div>
                    </div>
                  );
                }}
              </For>
            </Suspense>
          </div>
          <div class="flex flex-col gap-2 items-start w-full py-0">
            <div class="bg-red-100 dark:bg-red-900/50 w-full p-4 rounded-md border border-red-300 dark:border-red-700">
              <span class="text-red-500 dark:text-white text-sm">
                You can revoke all sessions to log out of all devices. This will also log you out of your{" "}
                <i>
                  <b>current</b>
                </i>{" "}
                device.
              </span>
              <div class="flex flex-row gap-2 w-full items-center justify-between">
                <div class="flex flex-row gap-2 w-full" />
                <div class="w-max">
                  <Button
                    variant="destructive"
                    size="sm"
                    type="submit"
                    class="w-max"
                    disabled={isRevokingAllSessions.pending}
                    onClick={() => {
                      toast.promise(
                        Promise.all([allSessionRevoker(), sleep(150), revalidate(getAuthenticatedSession.key)]),
                        {
                          loading: "Hold on a second, we're revoking all sessions",
                          icon: <Loader2 class="size-4 animate-spin" />,
                          error: "There was an error revoking all sessions",
                          success: "All sessions have been revoked, redirecting to home page!",
                        },
                      );
                    }}
                  >
                    Revoke All Sessions
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Show>
  );
};

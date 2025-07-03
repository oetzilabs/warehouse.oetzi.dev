import { useBreadcrumbs } from "@/components/providers/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { getAuthenticatedUser, getSessionToken } from "@/lib/api/auth";
import { A, createAsync } from "@solidjs/router";
import Play from "lucide-solid/icons/play";
import UploadFile from "lucide-solid/icons/upload";
import { createMemo, onMount, Show } from "solid-js";
import { toast } from "solid-sonner";

export default function OnboardingPage() {
  const user = createAsync(() => getAuthenticatedUser({ skipOnboarding: true }), { deferStream: true });
  const sessionToken = createAsync(() => getSessionToken(), { deferStream: true });

  const hasOnboarded = (user: NonNullable<Awaited<ReturnType<typeof getAuthenticatedUser>>>, sessionToken: string) => {
    const session = user.sessions.find((s) => s.access_token === sessionToken);
    if (!session) {
      return false;
    }
    return (
      session.current_organization_id !== null && session.current_warehouse_id !== null && user.has_finished_onboarding
    );
  };

  return (
    <div class="w-full h-full flex items-start md:items-center md:justify-center grow">
      <div class="flex w-full max-w-6xl h-[600px] border-0 md:border rounded-none md:rounded-lg overflow-clip grow">
        <div class="flex flex-row w-full grow">
          <div class="flex p-6 w-full flex-col gap-1 h-full grow">
            <div class="w-full flex flex-row items-center justify-between">
              <span class="text-xl font-medium w-max">Welcome to WareHouse.</span>
              <div class="size-[6px] bg-muted-foreground/50 rounded-full" />
            </div>
            <div class="w-full flex flex-col gap-4">
              <span class="text-sm font-medium text-muted-foreground">Onboarding</span>
            </div>
            <div class="w-full flex flex-col gap-4 grow">
              <Show
                when={user() && sessionToken() && !hasOnboarded(user()!, sessionToken()!)}
                fallback={
                  <div class="w-full">
                    <span class="text-sm font-medium text-muted-foreground/80">
                      Hey you, you are already onboarded! Click{" "}
                      <A href="/dashboard" class="text-teal-500">
                        here
                      </A>{" "}
                      to go to the app!
                    </span>
                  </div>
                }
              >
                <div class="flex flex-col gap-2 w-full grow">
                  <span class="text-sm font-medium text-muted-foreground/80">
                    To get started with WareHouse, please follow the onboarding assistant step by step. Choose the
                    option that best fits your needs to begin using WareHouse.
                  </span>
                  <div class="w-full flex flex-col gap-4 grow">
                    <div class="flex grow w-full" />
                    <div class="w-full flex flex-row gap-2 items-center justify-end">
                      <Button size="sm" type="submit" as={A} href="./step/company">
                        Start
                        <Play class="size-4" />
                      </Button>
                      {/* <Button
                        size="sm"
                        type="button"
                        disabled
                        variant="outline"
                        onClick={() => {
                          toast.info("Importing data is not yet supported");
                        }}
                      >
                        Import
                        <UploadFile class="size-4" />
                      </Button> */}
                    </div>
                  </div>
                </div>
              </Show>
            </div>
          </div>
          <div class="hidden md:flex w-full bg-muted h-full overflow-clip">
            <img src="https://picsum.photos/seed/picsum/400/600?grayscale" class="flex w-full h-full object-cover" />
          </div>
        </div>
      </div>
    </div>
  );
}

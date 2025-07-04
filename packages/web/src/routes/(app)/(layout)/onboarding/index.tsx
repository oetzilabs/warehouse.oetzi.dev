import { useUser } from "@/components/providers/User";
import { Button } from "@/components/ui/button";
import { A } from "@solidjs/router";
import Play from "lucide-solid/icons/play";
import { Show } from "solid-js";

export default function OnboardingPage() {
  const { ready, user } = useUser();

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
                when={ready() && !(user()?.has_finished_onboarding ?? false)}
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

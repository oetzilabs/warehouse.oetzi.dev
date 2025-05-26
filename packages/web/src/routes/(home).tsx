import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { getAuthenticatedUser } from "@/lib/api/auth";
import { createMediaQuery } from "@kobalte/utils";
import { A, createAsync, RouteDefinition } from "@solidjs/router";
import { Show } from "solid-js";

export const route = {
  preload: (props) => {
    getAuthenticatedUser({ skipOnboarding: true });
  },
} satisfies RouteDefinition;

export default function IndexPage() {
  const user = createAsync(() => getAuthenticatedUser({ skipOnboarding: true }), { deferStream: true });
  const isMobile = createMediaQuery("(max-width: 640px)", true);

  return (
    <>
      <div class="flex flex-col h-full w-full overflow-y-auto">
        <div class="flex grow w-full">
          <div class="flex flex-col container py-20 md:py-10 gap-32">
            <div class="w-full flex flex-col items-center text-center gap-10 md:gap-20">
              <div class="flex flex-col gap-20 items-center justify-center w-full">
                <div class="flex flex-col w-max gap-4 items-center justify-center">
                  <div class="inline-flex flex-row w-full gap-1 p-2 max-w-xs md:max-w-full rounded-lg text-white font-semibold bg-gradient-to-br from-indigo-500 to-indigo-600 px-4 text-sm items-baseline">
                    <div>
                      ANNOUNCEMENT: We are currently in the process of building the first version of{" "}
                      <span class="font-[Pacifico] font-medium">warehouse.</span> Stay tuned for updates!
                    </div>
                  </div>
                </div>
                <div class="w-full flex flex-col gap-8 md:gap-16 items-center justify-center">
                  <div class="flex flex-col gap-8 md:gap-16 items-center justify-center w-full">
                    <div class="flex flex-col gap-8 select-none items-center justify-center">
                      <h1 class="text-neutral-800 dark:text-neutral-200 font-bold text-2xl md:text-[60px] leading-none tracking-tight">
                        Supercharge your
                      </h1>
                      <span class="px-2 py-0.5 rounded font-[Pacifico] text-6xl md:text-[180px] leading-none text-indigo-600 dark:text-indigo-500">
                        warehouse.
                      </span>
                    </div>
                    <p class="text-muted-foreground text-base md:text-xl font-medium">
                      Empower your business with seamless and efficient inventory solutions.
                    </p>
                  </div>
                  <div class="flex flex-row gap-4 items-center">
                    <Show
                      when={typeof user() === "undefined"}
                      fallback={
                        <Button size="lg" class="w-max px-4" as={A} href="/dashboard">
                          Open Warehouse
                        </Button>
                      }
                    >
                      <Button size="lg" class="w-max px-4" as={A} href="/dashboard">
                        Get Started
                      </Button>
                    </Show>
                    <Button size="lg" class="w-max px-4 bg-background" variant="outline">
                      Learn More
                    </Button>
                  </div>
                </div>
              </div>
              <div class="w-full flex flex-row gap-4 items-center justify-center">
                <div class="flex w-full rounded-xl h-auto aspect-video border border-neutral-200 dark:border-neutral-800 items-center justify-center">
                  <span class="text-neutral-800 dark:text-neutral-200 text-lg font-medium select-none">
                    Hero Image Placeholder
                  </span>
                </div>
              </div>
            </div>
            <div class="w-full grid grid-cols-1 md:grid-cols-3 gap-8"></div>
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
}

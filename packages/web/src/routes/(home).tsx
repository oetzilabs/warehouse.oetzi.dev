import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { getAuthenticatedUser } from "@/lib/api/auth";
import { createMediaQuery } from "@kobalte/utils";
import { A, createAsync, RouteDefinition } from "@solidjs/router";
import { Show } from "solid-js";
import { useBreadcrumbs } from "../components/providers/Breadcrumbs";

export const route = {
  preload: async (props) => {
    const user = await getAuthenticatedUser({ skipOnboarding: true });
    return { user };
  },
} satisfies RouteDefinition;

export default function IndexPage() {
  const user = createAsync(() => getAuthenticatedUser({ skipOnboarding: true }), { deferStream: true });
  const isMobile = createMediaQuery("(max-width: 640px)", true);

  const { reset } = useBreadcrumbs();
  reset();
  return (
    <>
      <div class="flex grow w-full">
        <div class="flex flex-col container py-20 md:py-32 gap-32">
          <div class="w-full flex flex-col items-center text-center gap-10 md:gap-20">
            <div class="flex flex-col gap-8 items-center justify-center w-full">
              <div class="w-full flex flex-col gap-6 items-center justify-center">
                <div class="flex flex-col gap-4 items-center justify-center w-full">
                  <div class="flex flex-row gap-2 text-2xl md:text-4xl font-bold select-none">
                    <h1 class="text-neutral-800 dark:text-neutral-200">Welcome to</h1>
                    <span class="bg-teal-500 px-2 py-0.5 rounded text-white">WareHouse.</span>
                  </div>
                  <p class="text-teal-600 dark:text-teal-400 text-base md:text-lg font-semibold">
                    Empower your business with seamless and efficient inventory solutions.
                  </p>
                </div>
                <div class="flex flex-row gap-4 items-center">
                  <Show
                    when={typeof user() === "undefined"}
                    fallback={
                      <Button size={isMobile() ? "default" : "lg"} class="w-max" as={A} href="/dashboard">
                        Open App
                      </Button>
                    }
                  >
                    <Button size={isMobile() ? "default" : "lg"} class="w-max" as={A} href="/dashboard">
                      Get Started
                    </Button>
                  </Show>
                  <Button size={isMobile() ? "default" : "lg"} class="w-max" variant="secondary">
                    Learn More
                  </Button>
                </div>
              </div>
              <div class="flex flex-col w-max gap-4 items-center justify-center">
                <div class="flex flex-col w-full gap-4 p-2 max-w-xs md:max-w-full rounded-lg text-white font-semibold bg-gradient-to-br from-teal-400 to-teal-300 px-4 border border-teal-200 dark:border-teal-800 text-sm">
                  ANNOUNCEMENT: We are currently in the process of building the first version of WareHouse. Stay tuned
                  for updates!
                </div>
              </div>
            </div>
            <div class="w-full flex flex-row gap-4 items-center justify-center">
              <div class="flex w-full md:w-5/6 rounded-3xl drop-shadow-2xl bg-neutral-100 dark:bg-neutral-900 h-auto aspect-video border border-neutral-200 dark:border-neutral-800 items-center justify-center">
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
    </>
  );
}

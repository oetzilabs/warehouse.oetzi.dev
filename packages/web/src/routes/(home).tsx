import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { getAuthenticatedUser, getSessionToken } from "@/lib/api/auth";
import { A, RouteDefinition } from "@solidjs/router";
import ArrowUpRight from "lucide-solid/icons/arrow-up-right";

export const route = {
  preload: async (props) => {
    const user = await getAuthenticatedUser();
    const sessionToken = await getSessionToken();
    return { user, sessionToken };
  },
} satisfies RouteDefinition;

export default function IndexPage() {
  return (
    <>
      <div class="flex flex-col h-full w-full overflow-y-auto bg-background">
        <div class="flex flex-col w-full">
          <div class="relative isolate px-6 lg:px-8 w-full flex flex-col items-center justify-center border-b ">
            <div class="flex flex-col items-center justify-center w-full container px-4 pt-32 sm:pt-48 lg:pt-56 gap-10 lg:gap-40">
              <div class="text-center flex flex-col items-center justify-center gap-6">
                <div class="hidden sm:flex sm:justify-center">
                  <div class="rounded-full px-3 py-1 text-sm/6 ring-1 ring-neutral-900/10 backdrop-blur-sm bg-white[0.01] dark:bg-neutral-950[0.01] dark:ring-neutral-200/10">
                    This application is currently in development.
                  </div>
                </div>
                <h1 class="text-balance text-5xl font-semibold tracking-tight text-neutral-900 sm:text-7xl dark:text-neutral-100">
                  Automate and enrich your{" "}
                  <span class="text-pretty font-medium  font-['Pacifico'] text-primary">warehouse</span>
                </h1>
                <p class="text-pretty text-sm font-medium text-neutral-500 sm:text-xl/8 dark:text-neutral-300">
                  Warehouse is a platform that provides a simple and intuitive management of your inventory, orders, and
                  shipments.
                </p>
                <div class="mt-10 flex items-center justify-center gap-4">
                  <Button as={A} href="/dashboard">
                    Get started
                  </Button>
                  <Button as={A} href="/blog/learn-more" variant="outline" class="bg-background">
                    Learn more
                    <ArrowUpRight class="size-4" />
                  </Button>
                </div>
              </div>
              <div class="w-full border-t border-x rounded-t-lg aspect-[16/4.5] bg-neutral-50 dark:bg-white/[0.005] drop-shadow-xl z-0 overflow-clip touch-none select-none"></div>
            </div>
          </div>
          <div class="relative isolate w-full flex flex-col items-center justify-center py-20 z-10 bg-background">
            <div class="container !px-8 lg:!px-4 flex flex-col items-start justify-start gap-20">
              <div class="w-full flex flex-row items-center justify-between gap-4">
                <h2 class="text-lg/8 font-semibold text-neutral-900 dark:text-neutral-100">
                  Trusted and used by these companies
                </h2>
                <div class="flex flex-row gap-4 items-center">
                  <span class="text-sm text-muted-foreground">Missing your company?</span>
                  <Button as={A} href="/request-hero" size="sm" variant="outline" class="bg-background">
                    Chat with us
                    <ArrowUpRight class="size-4" />
                  </Button>
                </div>
              </div>
              <div class="flex flex-row items-center justify-center gap-4 w-full">
                <div class="bg-muted rounded-lg w-full h-20 border"></div>
                <div class="bg-muted rounded-lg w-full h-20 border"></div>
                <div class="bg-muted rounded-lg w-full h-20 border"></div>
                <div class="bg-muted rounded-lg w-full h-20 border"></div>
                <div class="bg-muted rounded-lg w-full h-20 border"></div>
              </div>
            </div>
          </div>
          <div class="relative isolate w-full flex flex-col items-center justify-center py-20 z-10 bg-background">
            <div class="container !px-8 lg:!px-4 flex flex-col items-start justify-start gap-20">
              <div class="w-full flex flex-row items-center justify-between gap-4">
                <h2 class="text-lg/8 font-semibold text-neutral-900 dark:text-neutral-100">
                  Features? We got you covered!
                </h2>
                <div class="flex flex-row gap-4 items-center">
                  <span class="text-sm text-muted-foreground">Want to add a feature?</span>
                  <Button as={A} href="/blog/roadmap" size="sm" variant="outline" class="bg-background">
                    Check out our roadmap
                    <ArrowUpRight class="size-4" />
                  </Button>
                </div>
              </div>
              <div class="flex flex-row items-center justify-center gap-4 w-full">
                {/* Features List */}
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                  <div class="flex flex-col items-start bg-muted-foreground/5 dark:bg-muted/15 rounded-lg p-6 border ">
                    <div class="flex items-center justify-center bg-primary/10 text-primary rounded-full p-2 mb-4">
                      <svg class="size-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path d="M3 7V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1" />
                        <rect width="18" height="13" x="3" y="7" rx="2" />
                        <path d="M16 3v4" />
                        <path d="M8 3v4" />
                      </svg>
                    </div>
                    <h3 class="text-lg font-semibold mb-2">Inventory Management</h3>
                    <p class="text-sm text-muted-foreground">
                      Track, organize, and manage your products with real-time updates and smart categorization.
                    </p>
                  </div>
                  <div class="flex flex-col items-start bg-muted-foreground/5 dark:bg-muted/15 rounded-lg p-6 border ">
                    <div class="flex items-center justify-center bg-primary/10 text-primary rounded-full p-2 mb-4">
                      <svg class="size-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path d="M21 15V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9" />
                        <path d="M3 21h18" />
                        <path d="M7 21v-4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v4" />
                      </svg>
                    </div>
                    <h3 class="text-lg font-semibold mb-2">Order & Shipment Tracking</h3>
                    <p class="text-sm text-muted-foreground">
                      Stay on top of your orders and shipments with automated status updates and notifications.
                    </p>
                  </div>
                  <div class="flex flex-col items-start bg-muted-foreground/5 dark:bg-muted/15 rounded-lg p-6 border ">
                    <div class="flex items-center justify-center bg-primary/10 text-primary rounded-full p-2 mb-4">
                      <svg class="size-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path d="M12 20v-6" />
                        <path d="M6 20v-4" />
                        <path d="M18 20v-2" />
                        <path d="M12 4v4" />
                        <path d="M6 4v2" />
                        <path d="M18 4v6" />
                        <rect width="18" height="16" x="3" y="4" rx="2" />
                      </svg>
                    </div>
                    <h3 class="text-lg font-semibold mb-2">Analytics & Insights</h3>
                    <p class="text-sm text-muted-foreground">
                      Make informed decisions with powerful analytics, visual reports, and actionable insights.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
}

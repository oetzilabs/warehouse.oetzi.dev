import { useUser } from "@/components/providers/User";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { A } from "@solidjs/router";
import ExternalLink from "lucide-solid/icons/external-link";
import X from "lucide-solid/icons/x";
import { onCleanup, Show } from "solid-js";

export default function DashboardPage() {
  const user = useUser();

  return (
    <div class="flex flex-col w-full grow">
      <div class="flex flex-col gap-4 w-full grow">
        <Show
          when={user.currentWarehouse()}
          fallback={
            <Alert class="flex flex-col gap-2">
              <div class="absolute right-0 top-0 pr-3 pt-3">
                <Button type="button" aria-label="Close" size="icon" class="size-8" variant="ghost">
                  <X class="size-4 shrink-0" aria-hidden={true} />
                </Button>
              </div>
              <AlertTitle class="text-lg">Welcome to your workspace</AlertTitle>
              <AlertDescription class="flex flex-col text-muted-foreground text-sm">
                <span>Start with our step-by-step guide to configure the workspace to your needs.</span>
                <span>
                  For further resources, our video tutorials and audience-specific documentations are designed to
                  provide you with a in-depth understanding of our platform.
                </span>
              </AlertDescription>
              <div class="flex items-center gap-2 pt-2">
                <Button type="button" size="sm">
                  Get started
                </Button>
                <Button as={A} href="#" size="sm" variant="secondary">
                  View tutorials
                  <ExternalLink class="size-4" aria-hidden={true} />
                </Button>
              </div>
            </Alert>
          }
        >
          {(warehouse) => (
            <div class="flex flex-row gap-4 w-full grow">
              <div class="flex flex-col gap-4 w-full grow p-4">
                <div class="flex flex-row gap-4 items-center justify-between">
                  <div class="flex flex-row items-baseline gap-4">
                    <span class="text-3xl font-bold leading-none">Overview</span>
                  </div>
                  <div class="w-max"></div>
                </div>
              </div>
              <div class="hidden md:flex flex-col gap-4 border-l border-neutral-200 dark:border-neutral-800 max-w-md w-full h-full bg-neutral-50 dark:bg-neutral-900/50"></div>
            </div>
          )}
        </Show>
      </div>
    </div>
  );
}

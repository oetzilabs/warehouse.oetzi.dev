import { Button } from "@/components/ui/button";
import { getLastSoldProducts } from "@/lib/api/dashboard";
import { A, createAsync } from "@solidjs/router";
import dayjs from "dayjs";
import ArrowUpRight from "lucide-solid/icons/arrow-up-right";
import Loader2 from "lucide-solid/icons/loader-2";
import Plus from "lucide-solid/icons/plus";
import { For, Show, Suspense } from "solid-js";

export const LastSoldProducts = () => {
  const lastSoldProductsData = createAsync(async () => getLastSoldProducts(), { deferStream: true });
  return (
    <Suspense
      fallback={
        <div class="flex flex-col  w-full h-full border border-neutral-200 dark:border-neutral-800 rounded-lg grow">
          <Loader2 class="size-4 animate-spin" />
        </div>
      }
    >
      <Show when={lastSoldProductsData()}>
        {(data) => (
          <div class="flex flex-col  w-full h-full border border-neutral-200 dark:border-neutral-800 rounded-lg grow">
            <div class="flex flex-row items-center justify-between p-2 pl-4 bg-muted-foreground/5 dark:bg-muted/30">
              <h3 class="font-semibold text-neutral-900 dark:text-neutral-100">Last Sold Products</h3>
              <div class="flex flex-row gap-2">
                <Button size="sm" as={A} href="/products/new">
                  <span class="sr-only md:not-sr-only">Create</span>
                  <Plus class="size-4" />
                </Button>
              </div>
            </div>
            <div class="flex flex-col border-t border-neutral-200 dark:border-neutral-800 grow">
              <div class="flex flex-col grow">
                <For
                  each={data()}
                  fallback={
                    <div class="flex flex-col items-center justify-center h-full py-10 text-sm text-muted-foreground">
                      Nothing Sold Yet
                    </div>
                  }
                >
                  {(product) => (
                    <div class="flex flex-row items-center gap-3 p-4 border-b last:border-b-0 border-neutral-200 dark:border-neutral-800 hover:bg-muted-foreground/[0.025] dark:hover:bg-muted/15 transition-colors">
                      <div class="flex flex-col grow">
                        <span class="font-medium text-neutral-900 dark:text-neutral-100">{product.name}</span>
                        <span class="text-sm text-neutral-500 dark:text-neutral-400">
                          {dayjs(product.createdAt).format("MMM D, YYYY")}
                        </span>
                      </div>
                      <Button size="sm" as={A} href={`/products/${product.id}`} variant="outline" class="bg-background">
                        Open
                        <ArrowUpRight class="size-4" />
                      </Button>
                    </div>
                  )}
                </For>
              </div>
            </div>
          </div>
        )}
      </Show>
    </Suspense>
  );
};

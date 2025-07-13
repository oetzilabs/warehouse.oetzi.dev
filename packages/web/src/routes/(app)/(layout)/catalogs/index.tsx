import { CatalogsList } from "@/components/lists/catalogs";
import { Button } from "@/components/ui/button";
import { LineChart } from "@/components/ui/charts";
import { getAuthenticatedUser, getSessionToken } from "@/lib/api/auth";
import { getCatalogs } from "@/lib/api/catalogs";
import { A, createAsync, revalidate, RouteDefinition } from "@solidjs/router";
import { CatalogInfo } from "@warehouseoetzidev/core/src/entities/catalogs";
import dayjs from "dayjs";
import ArrowLeft from "lucide-solid/icons/arrow-left";
import BookOpenText from "lucide-solid/icons/book-open-text";
import Plus from "lucide-solid/icons/plus";
import RotateCw from "lucide-solid/icons/rotate-cw";
import { createSignal, Show } from "solid-js";
import { toast } from "solid-sonner";

export const route = {
  preload: () => {
    const user = getAuthenticatedUser();
    const sessionToken = getSessionToken();
    const catalogs = getCatalogs();
    return { user, sessionToken, catalogs };
  },
} as RouteDefinition;

export default function CatalogsPage() {
  const catalogs = createAsync(() => getCatalogs(), { deferStream: true });
  const [search, setSearch] = createSignal("");
  const [dsearch, setDSearch] = createSignal("");

  const calculateCatalogStats = (catalogs: CatalogInfo[]) => {
    const dailyStats = catalogs.reduce(
      (acc, catalog) => {
        const date = dayjs(catalog.createdAt).format("YYYY-MM-DD");
        if (acc[date]) {
          acc[date] += catalog.products.length;
        } else {
          acc[date] = catalog.products.length;
        }
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      labels: Object.keys(dailyStats),
      datasets: [
        {
          label: "Items in Catalogs",
          data: Object.values(dailyStats),
          fill: true,
          pointStyle: false,
        },
      ],
    };
  };

  return (
    <div class="container flex flex-col grow py-0 relative">
      <div class="w-full flex flex-row h-full">
        <div class="w-full flex flex-col gap-0">
          <div class="sticky top-12 z-10 flex items-center gap-4 justify-between w-full bg-background pb-4">
            <div class="flex flex-row items-center gap-4">
              <div class="size-8 rounded-md flex items-center justify-center bg-muted-foreground/10 dark:bg-muted/50">
                <BookOpenText class="size-4" />
              </div>
              <h1 class="font-medium">Catalog</h1>
            </div>
            <div class="flex items-center gap-0">
              <Button
                size="icon"
                variant="outline"
                class="w-9 rounded-r-none bg-background"
                onClick={() => {
                  toast.promise(revalidate(getCatalogs.keyFor()), {
                    loading: "Refreshing catalogs...",
                    success: "Catalogs refreshed",
                    error: "Failed to refresh catalogs",
                  });
                }}
              >
                <RotateCw class="size-4" />
              </Button>
              <Button size="sm" class="pl-2.5 rounded-l-none" as={A} href="./new">
                <Plus class="size-4" />
                <span class="sr-only md:not-sr-only">Create</span>
              </Button>
            </div>
          </div>
          <Show when={catalogs()}>
            {(catalogsList) => (
              <div class="flex flex-col gap-4 w-full grow">
                <CatalogsList data={catalogsList} />
              </div>
            )}
          </Show>
        </div>
      </div>
    </div>
  );
}

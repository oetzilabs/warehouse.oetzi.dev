import { CatalogsList } from "@/components/catalogs-list";
import { FilterPopover } from "@/components/filter-popover";
import { Button } from "@/components/ui/button";
import { LineChart } from "@/components/ui/charts";
import { TextField, TextFieldInput } from "@/components/ui/text-field";
import { getAuthenticatedUser, getSessionToken } from "@/lib/api/auth";
import { getCatalogs } from "@/lib/api/catalogs";
import { FilterConfig, useFilter } from "@/lib/filtering";
import { debounce, leadingAndTrailing } from "@solid-primitives/scheduled";
import { A, createAsync, revalidate, RouteDefinition } from "@solidjs/router";
import { CatalogInfo } from "@warehouseoetzidev/core/src/entities/catalogs";
import dayjs from "dayjs";
import PackageSearch from "lucide-solid/icons/package-search";
import Plus from "lucide-solid/icons/plus";
import RotateCw from "lucide-solid/icons/rotate-cw";
import { createSignal, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { toast } from "solid-sonner";

export const route = {
  preload: () => {
    const user = getAuthenticatedUser({ skipOnboarding: true });
    const sessionToken = getSessionToken();
    const catalogs = getCatalogs();
    return { user, sessionToken, catalogs };
  },
} as RouteDefinition;

export default function CatalogsPage() {
  const catalogs = createAsync(() => getCatalogs(), { deferStream: true });
  const [search, setSearch] = createSignal("");
  const [dsearch, setDSearch] = createSignal("");

  const [filterConfig, setFilterConfig] = createStore<FilterConfig<CatalogInfo>>({
    disabled: () => (catalogs() ?? []).length === 0,
    dateRange: {
      start: catalogs()?.length ? catalogs()![0].createdAt : new Date(),
      end: catalogs()?.length ? catalogs()![catalogs()!.length - 1].createdAt : new Date(),
      preset: "clear",
    },
    search: { term: dsearch() },
    sort: {
      default: "date",
      current: "date",
      direction: "desc",
      variants: [
        {
          field: "date",
          label: "Date",
          fn: (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
        },
        {
          field: "items",
          label: "Items",
          fn: (a, b) => a.products.length - b.products.length,
        },
      ],
    },
  });

  const debouncedSearch = leadingAndTrailing(
    debounce,
    (text: string) => {
      setDSearch(text);
      setFilterConfig((prev) => ({ ...prev, search: { ...prev.search!, term: text } }));
    },
    500,
  );

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
    <Show when={catalogs()}>
      {(catalogsList) => (
        <div class="container flex flex-col grow py-4">
          <div class="w-full flex flex-row h-full">
            <div class="w-full flex flex-col gap-4">
              <div class="flex items-center gap-4 justify-between w-full">
                <h1 class="font-semibold leading-none">Catalogs</h1>
                <div class="flex items-center gap-0">
                  <Button
                    size="icon"
                    variant="outline"
                    class="w-9 h-8 rounded-r-none bg-background"
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
                  <Button size="sm" class="h-8 pl-2.5 rounded-l-none" as={A} href="./new">
                    <Plus class="size-4" />
                    Create
                  </Button>
                </div>
              </div>
              <div class="flex flex-col gap-4 w-full grow">
                <div class="flex flex-col gap-2 w-full">
                  <div class="flex flex-col gap-2 w-full rounded-lg border h-60">
                    <div class="flex flex-col gap-2 w-full h-full p-4">
                      <LineChart data={calculateCatalogStats(catalogsList())} />
                    </div>
                  </div>
                </div>
                <div class="flex flex-row items-center justify-between gap-4">
                  <TextField
                    value={search()}
                    onChange={(e) => {
                      setSearch(e);
                      debouncedSearch(e);
                    }}
                    class="w-full max-w-full"
                  >
                    <TextFieldInput placeholder="Search catalogs" class="w-full max-w-full rounded-lg px-4" />
                  </TextField>
                  <div class="w-max">
                    <FilterPopover config={filterConfig} onChange={setFilterConfig} data={catalogsList} />
                  </div>
                </div>
                <CatalogsList data={catalogsList} />
              </div>
            </div>
          </div>
        </div>
      )}
    </Show>
  );
}

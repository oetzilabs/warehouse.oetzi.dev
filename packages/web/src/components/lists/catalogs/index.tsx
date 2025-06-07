import { FilterPopover } from "@/components/filters/popover";
import { Button } from "@/components/ui/button";
import { TextField, TextFieldInput } from "@/components/ui/text-field";
import { FilterConfig, useFilter } from "@/lib/filtering";
import { debounce, leadingAndTrailing } from "@solid-primitives/scheduled";
import { A } from "@solidjs/router";
import { CatalogInfo } from "@warehouseoetzidev/core/src/entities/catalogs";
import dayjs from "dayjs";
import ArrowUpRight from "lucide-solid/icons/arrow-up-right";
import { Accessor, createSignal, For, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { GenericList } from "../default";

type CatalogsListProps = {
  data: Accessor<CatalogInfo[]>;
};

export const CatalogsList = (props: CatalogsListProps) => {
  const [search, setSearch] = createSignal("");
  const [dsearch, setDSearch] = createSignal("");

  const [filterConfig, setFilterConfig] = createStore<FilterConfig<CatalogInfo>>({
    disabled: () => props.data().length === 0,
    dateRange: {
      start: props.data().length === 0 ? new Date() : props.data()[0].createdAt,
      end: props.data().length === 0 ? new Date() : props.data()[props.data().length - 1].createdAt,
      preset: "clear",
    },
    search: {
      term: dsearch(),
      fields: ["name", "description"],
      fuseOptions: { keys: ["name", "description"] },
    },
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
          field: "name",
          label: "Name",
          fn: (a, b) => a.name.localeCompare(b.name),
        },
      ],
    },
    filter: {
      default: null,
      current: null,
      variants: [],
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

  const filteredData = useFilter(props.data, filterConfig);

  const renderCatalogItem = (catalog: CatalogInfo) => (
    <div class="flex flex-col w-full h-content">
      <div class="flex flex-row items-center justify-between p-4 border-b bg-muted/30">
        <div class="flex flex-col gap-0.5">
          <span class="text-sm font-medium">{catalog.name}</span>
          <span class="text-xs text-muted-foreground">{catalog.description}</span>
          <span class="text-xs text-muted-foreground">
            {dayjs(catalog.updatedAt ?? catalog.createdAt).format("MMM DD, YYYY - h:mm A")}
          </span>
        </div>
        <Button as={A} href={`/catalogs/${catalog.id}`} size="sm" class="gap-2 place-self-start">
          Open
          <ArrowUpRight class="size-4" />
        </Button>
      </div>
      <div class="flex flex-col w-full h-full">
        <Show
          when={catalog.deletedAt === null}
          fallback={
            <div class="text-sm text-muted-foreground flex flex-col items-center justify-center p-8">
              This catalog has been deleted
            </div>
          }
        >
          <For
            each={catalog.products.map((p) => p.product)}
            fallback={
              <div class="flex flex-col gap-4 items-center justify-center text-sm text-muted-foreground">
                No products added
              </div>
            }
          >
            {(product) => (
              <div class="flex flex-col gap-4 items-center justify-center p-4 border-b last:border-b-0 bg-background">
                <div class="flex flex-col gap-2 w-full h-full">
                  <span class="text-sm font-medium">{product.name}</span>
                  <span class="text-xs text-muted-foreground">
                    Price: {product.sellingPrice} {product.currency}
                  </span>
                  <span class="text-xs text-muted-foreground">{product.sku}</span>
                </div>
              </div>
            )}
          </For>
        </Show>
      </div>
    </div>
  );

  return (
    <div class="w-full flex flex-col gap-4">
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
          <FilterPopover config={filterConfig} onChange={setFilterConfig} data={props.data} />
        </div>
      </div>

      <GenericList
        data={props.data}
        filteredData={filteredData}
        renderItem={renderCatalogItem}
        emptyMessage="No catalogs have been added"
        noResultsMessage="No catalogs have been found"
        searchTerm={() => filterConfig.search.term}
        variant="grid"
      />
    </div>
  );
};

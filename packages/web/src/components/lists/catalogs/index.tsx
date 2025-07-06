import { Button } from "@/components/ui/button";
import { TextField, TextFieldInput } from "@/components/ui/text-field";
import { A } from "@solidjs/router";
import { CatalogInfo } from "@warehouseoetzidev/core/src/entities/catalogs";
import dayjs from "dayjs";
import Fuse, { IFuseOptions } from "fuse.js";
import ArrowUpRight from "lucide-solid/icons/arrow-up-right";
import { Accessor, createMemo, createSignal, For, Show } from "solid-js";
import { GenericList } from "../default";

type CatalogsListProps = {
  data: Accessor<CatalogInfo[]>;
};

export const CatalogsList = (props: CatalogsListProps) => {
  const [search, setSearch] = createSignal("");

  const renderCatalogItem = (catalog: CatalogInfo) => (
    <div class="flex flex-col w-full h-full">
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
            <div class="text-sm text-muted-foreground flex flex-col items-center justify-center p-8 h-full w-full">
              This catalog has been deleted
            </div>
          }
        >
          <For
            each={catalog.products.map((p) => p.product)}
            fallback={
              <div class="flex flex-col gap-4 items-center justify-center text-sm text-muted-foreground h-full w-full p-4">
                No products added
              </div>
            }
          >
            {(product) => (
              <div class="flex flex-col gap-4 items-center justify-center p-4 border-b last:border-b-0 bg-background">
                <div class="flex flex-col gap-3 w-full h-full">
                  <div class="flex flex-row items-center gap-4 justify-between w-full">
                    <span class="text-sm font-medium truncate">{product.name}</span>
                    <span class="px-2 py-1 border text-xs rounded-lg leading-none  text-white bg-emerald-400 border-emerald-500 dark:bg-emerald-700 dark:border-emerald-600">
                      action
                    </span>
                  </div>
                  <div class="flex flex-row items-center gap-2 justify-between w-full">
                    <span class="text-xs text-muted-foreground">
                      Price: {product.sellingPrice.toFixed(2)} {product.currency}
                    </span>
                    <span class="text-xs font-medium">Dicount: 0%</span>
                  </div>

                  {/* <span class="text-xs text-muted-foreground">{product.sku}</span> */}
                </div>
              </div>
            )}
          </For>
        </Show>
      </div>
    </div>
  );

  const filteredData = createMemo(() => {
    const term = search();
    const set = props.data();
    if (term.length === 0) {
      return set;
    }

    const options: IFuseOptions<CatalogInfo> = {
      keys: ["name", "description"],
      includeScore: true,
      threshold: 0.3,
    };

    const fuse = new Fuse(set, options);
    return fuse.search(term).map((d) => d.item);
  });

  return (
    <div class="w-full flex flex-col gap-4 pb-4">
      <div class="sticky top-12 z-10 flex flex-row items-center justify-between gap-0 w-full bg-background">
        <TextField
          value={search()}
          onChange={(e) => {
            setSearch(e);
          }}
          class="w-full max-w-full"
        >
          <TextFieldInput placeholder="Search catalogs" class="w-full max-w-full rounded-lg px-4" />
        </TextField>
      </div>

      <GenericList
        data={props.data}
        filteredData={filteredData}
        renderItem={renderCatalogItem}
        emptyMessage="No catalogs have been added"
        noResultsMessage="No catalogs have been found"
        searchTerm={search}
        variant="grid"
      />
    </div>
  );
};

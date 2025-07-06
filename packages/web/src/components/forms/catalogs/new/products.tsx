import { TextField, TextFieldInput } from "@/components/ui/text-field";
import { getProducts } from "@/lib/api/products";
import { cn } from "@/lib/utils";
import { createAsync } from "@solidjs/router";
import { FieldApi } from "@tanstack/solid-form";
import { type NewCatalogFormData } from "@warehouseoetzidev/core/src/entities/catalogs/schemas";
import { type OrganizationProductInfo } from "@warehouseoetzidev/core/src/entities/products";
import Fuse, { IFuseOptions } from "fuse.js";
import Loader2 from "lucide-solid/icons/loader-2";
import Plus from "lucide-solid/icons/plus";
import X from "lucide-solid/icons/x";
import { Accessor, createMemo, createSignal, Index, Show, Suspense } from "solid-js";
import { useNewCatalogForm } from "./form";

export const Products = () => {
  const { form } = useNewCatalogForm();
  const [searchProduct, setSearchProduct] = createSignal("");
  const products = createAsync(() => getProducts(), { deferStream: true });

  return (
    <section class="p-0 grid grid-cols-1 md:grid-cols-5 gap-8">
      <div class="flex flex-col gap-2 col-span-2">
        <h2 class="text-lg font-semibold">Products</h2>
        <p class="text-muted-foreground text-sm">Select products to include in this catalog.</p>
      </div>
      <div class="flex flex-col gap-4 col-span-3">
        <div class="flex w-full">
          <TextField value={searchProduct()} onChange={setSearchProduct} class="w-full max-w-full">
            <TextFieldInput placeholder="Search products" class="w-full max-w-full rounded-lg px-4" />
          </TextField>
        </div>
        <form.Field name="products" mode="array">
          {(productsField) => (
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto">
              <Suspense
                fallback={
                  <div class="flex items-center justify-center py-4">
                    <Loader2 class="size-4 animate-spin" />
                  </div>
                }
              >
                <Show when={products()}>
                  {(productsList) => (
                    <ProductList data={productsList} search={searchProduct} productsField={productsField} />
                  )}
                </Show>
              </Suspense>
            </div>
          )}
        </form.Field>
      </div>
    </section>
  );
};

interface ProductListProps {
  data: Accessor<OrganizationProductInfo[]>;
  search: Accessor<string>;
  productsField: Accessor<
    FieldApi<
      NewCatalogFormData,
      "products",
      NewCatalogFormData["products"],
      any,
      any,
      any,
      any,
      any,
      any,
      any,
      any,
      any,
      any,
      any,
      any,
      any,
      any,
      any,
      any
    >
  >; // Adjust type as per your form library;
}

const ProductList = (props: ProductListProps) => {
  const filtered = createMemo(() => {
    const list = props.data() ?? [];
    const term = props.search();
    if (!term) return list;
    const options: IFuseOptions<OrganizationProductInfo> = {
      isCaseSensitive: false,
      threshold: 0.4,
      minMatchCharLength: 1,
      keys: ["name", "sku"],
    };
    const fuse = new Fuse(list, options);
    return fuse.search(term).map((d) => d.item);
  });

  // Helper to check if a product is selected
  const isSelected = (id: string) => props.productsField().state.value.findIndex((p) => p.id === id) !== -1;

  // Select/deselect handlers using array ops
  const handleSelect = (product: OrganizationProductInfo) => {
    if (!isSelected(product.product.id)) {
      props.productsField().pushValue({
        id: product.product.id,
        discount: 0,
        variant: "action",
      });
    }
  };

  const handleDeselect = (id: string) => {
    const idx = props.productsField().state.value.findIndex((p) => p.id === id);
    if (idx !== -1) {
      props.productsField().removeValue(idx);
    }
  };

  return (
    <Show
      when={filtered().length > 0}
      fallback={
        <div class="text-center py-4 text-sm text-muted-foreground bg-muted-foreground/5 rounded-lg">
          No products available
        </div>
      }
    >
      <Index each={filtered()}>
        {(product) => (
          <ProductCard
            product={product()}
            isSelected={isSelected(product().product.id)}
            onSelect={() => handleSelect(product())}
            onDeselect={() => handleDeselect(product().product.id)}
          />
        )}
      </Index>
    </Show>
  );
};

function ProductCard(props: {
  product: OrganizationProductInfo;
  isSelected: boolean;
  onSelect: () => void;
  onDeselect: () => void;
}) {
  return (
    <div
      class={cn("flex flex-col gap-2 p-1 rounded-lg border cursor-pointer transition-colors", {
        "border-primary": props.isSelected,
        "border-input hover:bg-muted-foreground/5": !props.isSelected,
      })}
      onClick={() => (props.isSelected ? props.onDeselect() : props.onSelect())}
    >
      <div class="w-full aspect-[4/3] flex items-center justify-center rounded-md bg-muted-foreground/5 dark:bg-muted/15 border">
        <Show
          when={props.product.product.images.length > 0 && props.product.product.images[0]}
          fallback={<span class="text-xs text-muted-foreground select-none">No image</span>}
        >
          {(i) => <img src={i().image.url} class="object-cover w-full h-full" />}
        </Show>
      </div>
      <div class="flex flex-col p-2">
        <div class="flex flex-row items-center justify-between gap-2 w-full">
          <span class={cn("font-semibold truncate", { "text-primary": props.isSelected })}>
            {props.product.product.name}
          </span>
          <button
            type="button"
            class={cn(
              "rounded-full border border-input bg-background p-1 flex items-center justify-center transition-colors",
              { "border-primary bg-primary/80 text-white": props.isSelected },
            )}
            onClick={(e) => {
              e.stopPropagation();
              props.isSelected ? props.onDeselect() : props.onSelect();
            }}
          >
            <Show when={props.isSelected} fallback={<Plus class="size-3" />}>
              <X class="size-3" />
            </Show>
          </button>
        </div>
        <span class="text-xs text-muted-foreground">SKU: {props.product.product.sku}</span>
        {/* If you want to show price/currency, add those fields to OrganizationProductInfo and render here */}
        <span class="text-xs text-muted-foreground">
          {props.product.product.organizations[0].priceHistory
            .map((p) => p.sellingPrice)
            .reduce((a, b) => a + b, 0)
            .toFixed(2)}{" "}
          {props.product.product.organizations[0].priceHistory[0].currency}
        </span>
      </div>
    </div>
  );
}

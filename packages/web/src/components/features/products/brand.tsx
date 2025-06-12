import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TextField, TextFieldInput } from "@/components/ui/text-field";
import { assignBrand, clearBrand, getProductBrands } from "@/lib/api/products";
import { cn } from "@/lib/utils";
import { createAsync, useAction, useSubmission } from "@solidjs/router";
import { type BrandInfo } from "@warehouseoetzidev/core/src/entities/brands";
import { type ProductInfo } from "@warehouseoetzidev/core/src/entities/products";
import dayjs from "dayjs";
import Fuse from "fuse.js";
import Loader2 from "lucide-solid/icons/loader-2";
import Pencil from "lucide-solid/icons/pencil";
import Plus from "lucide-solid/icons/plus";
import X from "lucide-solid/icons/x";
import { Accessor, createSignal, For, Show, Suspense } from "solid-js";
import { toast } from "solid-sonner";

type BrandProps = {
  product: Accessor<ProductInfo>;
};

export const Brand = (props: BrandProps) => {
  const brands = createAsync(() => getProductBrands(), { deferStream: true });
  const [brandDialogOpen, setBrandDialogOpen] = createSignal(false);
  const [brandSearch, setBrandSearch] = createSignal("");

  const assignBrandAction = useAction(assignBrand);
  const isAssigningBrand = useSubmission(assignBrand);

  const clearBrandAction = useAction(clearBrand);
  const isClearingBrand = useSubmission(clearBrand);

  const filteredBrands = (brands: BrandInfo[]) => {
    if (!brandSearch()) return brands;

    const fuse = new Fuse(brands, {
      keys: ["name", "description"],
      threshold: 0.3,
    });

    return fuse.search(brandSearch()).map((result) => result.item);
  };
  return (
    <div class="flex flex-col border rounded-lg overflow-clip">
      <div class="flex flex-row items-center gap-4 justify-between border-b bg-muted-foreground/5 dark:bg-muted/30 p-4 ">
        <h2 class="font-medium">Brand</h2>
        <div class="flex flex-row items-center gap-2">
          <Dialog open={brandDialogOpen()} onOpenChange={setBrandDialogOpen}>
            <DialogTrigger as={Button} variant="outline" size="sm" class="bg-background">
              <Show
                when={props.product().brands}
                fallback={
                  <>
                    <Plus class="size-4" />
                    Assign Brand
                  </>
                }
              >
                <Pencil class="size-4" />
                Change Brand
              </Show>
            </DialogTrigger>
            <DialogContent class="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Select Brand</DialogTitle>
                <DialogDescription>Search and select a brand for this product</DialogDescription>
              </DialogHeader>
              <div class="flex flex-col gap-4">
                <TextField value={brandSearch()} onChange={(value) => setBrandSearch(value)}>
                  <TextFieldInput placeholder="Search brands..." />
                </TextField>
                <div class="grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto">
                  <Suspense
                    fallback={
                      <div class="flex items-center justify-center py-4">
                        <Loader2 class="size-4 animate-spin" />
                      </div>
                    }
                  >
                    <Show
                      when={brands()}
                      fallback={
                        <div class="text-center py-4 text-sm text-muted-foreground bg-muted-foreground/5 rounded-lg">
                          No brands available
                        </div>
                      }
                    >
                      {(list) => (
                        <For
                          each={filteredBrands(list())}
                          fallback={
                            <div class="text-center py-4 text-sm text-muted-foreground bg-muted-foreground/5 rounded-lg">
                              No brands found
                            </div>
                          }
                        >
                          {(brand) => (
                            <div
                              class={cn(
                                "flex flex-col gap-1 p-4 rounded-lg border cursor-pointer hover:bg-muted-foreground/5",
                                {
                                  "border-primary bg-primary/20": props.product().brands?.id === brand.id,
                                  "border-input": props.product().brands?.id !== brand.id,
                                  "opacity-50":
                                    brand.id === props.product().brands?.id ||
                                    isAssigningBrand.pending ||
                                    isClearingBrand.pending,
                                },
                              )}
                              onClick={() => {
                                if (brand.id === props.product().brands?.id) {
                                  toast.warning("Brand is already assigned");
                                  return;
                                }
                                if (isAssigningBrand.pending) return;
                                toast.promise(assignBrandAction(props.product().id, brand.id), {
                                  loading: "Assigning brand...",
                                  success: () => {
                                    setBrandDialogOpen(false);
                                    setBrandSearch("");
                                    return "Brand assigned";
                                  },
                                  error: "Failed to assign brand",
                                });
                              }}
                            >
                              <span class="font-medium">{brand.name}</span>
                              <Show when={brand.description}>
                                <span class="text-sm text-muted-foreground">{brand.description}</span>
                              </Show>
                            </div>
                          )}
                        </For>
                      )}
                    </Show>
                  </Suspense>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    toast.promise(clearBrandAction(props.product().id), {
                      loading: "Clearing brand...",
                      success: () => {
                        setBrandDialogOpen(false);
                        setBrandSearch("");
                        return "Brand cleared";
                      },
                      error: "Failed to clear brand",
                    });
                  }}
                  disabled={isClearingBrand.pending}
                >
                  <Show when={isClearingBrand.pending} fallback={<X class="size-4" />}>
                    <Loader2 class="size-4 animate-spin" />
                  </Show>
                  Clear
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setBrandDialogOpen(false);
                    setBrandSearch("");
                  }}
                >
                  Cancel
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <Show
        when={props.product().brands}
        fallback={
          <span class="flex flex-col items-center justify-center text-sm text-muted-foreground p-8">
            No brands added.
          </span>
        }
      >
        {(b) => (
          <div class="flex flex-col gap-1 p-4">
            <div class="flex flex-col gap-1">
              <span class="text-sm text-muted-foreground">{b().name ?? "N/A"}</span>
            </div>
          </div>
        )}
      </Show>
    </div>
  );
};

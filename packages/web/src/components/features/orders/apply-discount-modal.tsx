import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TextField, TextFieldInput } from "@/components/ui/text-field";
import { getDiscounts, getDiscountsApplied } from "@/lib/api/discounts";
import { A, createAsync } from "@solidjs/router";
import Fuse from "fuse.js";
import Loader2 from "lucide-solid/icons/loader-2";
import Plus from "lucide-solid/icons/plus";
import Tag from "lucide-solid/icons/tag";
import { createSignal, For, Show, Suspense } from "solid-js";

type ApplyDiscountModalProps = {
  orderId: string;
  customerId: string;
};

export const ApplyDiscountModal = (props: ApplyDiscountModalProps) => {
  const discounts = createAsync(() => getDiscounts(), { deferStream: true });
  const alreadyApplied = createAsync(() => getDiscountsApplied(props.orderId), { deferStream: true });
  const [search, setSearch] = createSignal("");

  const [discountIds, setDiscountIds] = createSignal([]);

  const hasDiscount = () => {
    const did = discountIds();
    const alreadyAppliedDiscounts = alreadyApplied();
    // use a set to avoid duplicates
    const discountSet = new Set(did);
    for (const discount of alreadyAppliedDiscounts) {
      discountSet.add(discount.discountId);
    }
    return discountSet.size > 0;
  };

  const searchedDiscounts = () => {
    if (!discounts()) return [];
    if (!search()) return discounts();

    const fuse = new Fuse(discounts(), {
      keys: ["code", "description"],
      threshold: 0.3,
    });

    return fuse.search(search()).map((result) => result.item);
  };

  return (
    <Dialog>
      <DialogTrigger as={Button} size="sm" variant="secondary">
        <Tag class="size-4" />
        <span>Apply Coupon</span>
      </DialogTrigger>
      <DialogContent class="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Apply Discount</DialogTitle>
          <DialogDescription>Select or create a discount to apply to this order.</DialogDescription>
        </DialogHeader>
        <Tabs>
          <TabsList class="w-full justify-start">
            <TabsTrigger value="choose">Choose</TabsTrigger>
            <TabsTrigger value="manual" disabled>
              Manual
            </TabsTrigger>
          </TabsList>
          <TabsContent value="choose">
            <div class="flex flex-col gap-4">
              <TextField value={search()} onChange={(value) => setSearch(value)}>
                <TextFieldInput placeholder="Search discounts..."></TextFieldInput>
              </TextField>
              <div class="flex flex-col gap-2 max-h-[400px] overflow-y-auto">
                <Suspense
                  fallback={
                    <div class="flex items-center justify-center p-4">
                      <Loader2 class="size-4 animate-spin" />
                    </div>
                  }
                >
                  <Show when={searchedDiscounts()}>
                    {(discs) => (
                      <div class="flex flex-col border rounded-lg overflow-clip p-1">
                        <For
                          each={discs()}
                          fallback={
                            <div class="flex flex-col items-center justify-center p-10 gap-4 w-full border-b last:border-b-0 bg-muted-foreground/[0.025] dark:bg-muted-foreground/[0.05]">
                              <span class="text-sm text-muted-foreground select-none">
                                No discounts found in your organization
                              </span>
                              <Button size="sm" variant="secondary" as={A} href={`/discounts/add`}>
                                <span>Add Discount</span>
                                <Plus class="size-4" />
                              </Button>
                            </div>
                          }
                        >
                          {(discount) => (
                            <Button
                              variant={discountIds().includes(discount.id) ? "default" : "ghost"}
                              class="flex flex-col items-start gap-1 h-auto p-4"
                              size="sm"
                              onClick={() => {
                                const ids = discountIds();
                                if (ids.includes(discount.id)) {
                                  setDiscountIds((ids) => ids.filter((id) => id !== discount.id));
                                } else {
                                  setDiscountIds((ids) => [...ids, discount.id]);
                                }
                              }}
                            >
                              <span class="font-medium">{discount.code}</span>
                              <span class="text-sm text-muted-foreground">{discount.description}</span>
                            </Button>
                          )}
                        </For>
                      </div>
                    )}
                  </Show>
                </Suspense>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="manual">
            <div class="flex flex-col gap-4">
              <span class="text-sm text-muted-foreground">
                This area is not yet implemented. Please contact us if you would like to use this feature.
              </span>
            </div>
          </TabsContent>
        </Tabs>
        <div class="flex flex-row items-center justify-end gap-2">
          <Button size="sm" disabled={!hasDiscount()}>
            <span>Apply</span>
            <Tag class="size-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

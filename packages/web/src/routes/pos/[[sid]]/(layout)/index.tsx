import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LineChart } from "@/components/ui/charts";
import { getAuthenticatedUser, getSessionToken } from "@/lib/api/auth";
import { getCashRegister } from "@/lib/api/pos";
import { cn } from "@/lib/utils";
import { A, createAsync, revalidate, RouteDefinition, useParams } from "@solidjs/router";
import { type SaleInfo } from "@warehouseoetzidev/core/src/entities/sales";
import dayjs from "dayjs";
import Loader2 from "lucide-solid/icons/loader-2";
import Plus from "lucide-solid/icons/plus";
import RotateCw from "lucide-solid/icons/rotate-cw";
import X from "lucide-solid/icons/x";
import { createSignal, For, onMount, Show, Suspense } from "solid-js";
import { toast } from "solid-sonner";

export const route = {
  preload: async (props) => {
    const user = await getAuthenticatedUser({ skipOnboarding: true });
    const sessionToken = await getSessionToken();
    const cr = await getCashRegister(props.params.sid);
    return { user, sessionToken, cr };
  },
} as RouteDefinition;

export default function PosPage() {
  const params = useParams();
  const cashRegister = createAsync(() => getCashRegister(params.sid), { deferStream: true });

  const calculateTotal = (items: SaleInfo["items"]) => {
    const totals = items.reduce(
      (acc, item) => {
        const currency = item.product.currency;
        if (!acc[currency]) {
          acc[currency] = 0;
        }
        acc[currency] += item.quantity * item.product.sellingPrice;
        return acc;
      },
      {} as Record<string, number>,
    );
    return Object.entries(totals).reduce(
      (acc, [currency, value]) => {
        if (!acc[currency]) {
          acc[currency] = 0;
        }
        acc[currency] += value;
        return acc;
      },
      {} as Record<string, number>,
    );
  };

  return (
    <Suspense
      fallback={
        <div class="flex flex-col grow w-full h-full">
          <div class="flex flex-row w-full h-full gap-4">
            <div class="flex flex-col w-1/2 grow gap-4 select-none touch-none"></div>
            <div class="flex flex-col w-1/2 grow gap-4"></div>
          </div>
        </div>
      }
    >
      <Show
        when={cashRegister()}
        fallback={
          <div class="flex flex-col gap-4 items-center justify-center w-full rounded-lg border">
            <span class="select-none touch-none">This session does not have any items</span>
          </div>
        }
      >
        {(register) => (
          <div class="flex flex-col grow w-full h-full">
            <div class="flex flex-row w-full h-full  gap-4">
              <div class="flex flex-col w-1/2 grow gap-4 select-none touch-none">
                <div class="flex flex-row gap-4 w-full border rounded-lg overflow-clip p-4 items-center justify-between">
                  <Badge variant="outline" class="w-max uppercase">
                    {register().status}
                  </Badge>
                  <div class="">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        // TODO: Cancel the sale
                      }}
                      disabled={register().status === "confirmed" || register().status === "cancelled"}
                    >
                      Cancel
                      <X class="size-4" />
                    </Button>
                  </div>
                </div>
                <div class="flex flex-col w-full font-['Geist_Mono_Variable'] border-b min-h-1/2 grow bg-white text-black border rounded-lg overflow-clip ">
                  <div class="flex flex-col w-full grow">
                    <div class="flex flex-col w-full h-full">
                      <For each={register().items}>
                        {(item) => (
                          <div class="flex flex-col gap-4 w-full h-max border-b border-neutral-200 last:border-b-0">
                            <div class="flex flex-col gap-2 w-full h-full">
                              <div class="flex flex-col gap-2 w-full h-full text-sm">
                                <div class="p-4 w-full flex flex-col gap-2">
                                  <div class="flex flex-row items-center justify-between gap-2">
                                    <span class="truncate w-full">{item.product.name}</span>
                                    <div class="flex flex-row items-center justify-between gap-2">
                                      <span class="shrink-0 w-max">{item.quantity}x</span>
                                      <span class="shrink-0 w-max">
                                        {item.product.sellingPrice.toFixed(2)} {item.product.currency}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </For>
                    </div>
                    <div class="flex flex-col w-full p-4 h-max border-t border-neutral-200">
                      <div class="flex flex-row w-full font-['Geist_Mono_Variable'] font-semibold">
                        <span class="w-full">Total</span>
                        <div class="flex-col flex gap-2 w-max">
                          <For each={Object.entries(calculateTotal(register().items))}>
                            {([currency, value]) => (
                              <span class="w-max">
                                {value.toFixed(2)} {currency}
                              </span>
                            )}
                          </For>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <Show when={register().note}>
                  {(note) => (
                    <div class="flex flex-col gap-4 w-1/2 grow border rounded-lg overflow-clip">
                      <span>{note()}</span>
                    </div>
                  )}
                </Show>
                <div class="flex flex-col h-2/5 border rounded-lg overflow-clip">
                  <div class="w-full h-full flex flex-col font-['Geist_Mono_Variable'] text-center bg-muted-foreground/10 dark:bg-muted/30 text-lg">
                    <div class="grid grid-cols-4 w-full h-full border-b border-neutral-300 dark:border-neutral-700">
                      <div class="flex flex-col items-center justify-center cursor-pointer hover:bg-muted-foreground/5 dark:hover:bg-muted/15 border-r active:bg-muted-foreground/10 dark:active:bg-muted/30 border-neutral-300 dark:border-neutral-700">
                        1
                      </div>
                      <div class="flex flex-col items-center justify-center cursor-pointer hover:bg-muted-foreground/5 dark:hover:bg-muted/15 border-r active:bg-muted-foreground/10 dark:active:bg-muted/30 border-neutral-300 dark:border-neutral-700">
                        2
                      </div>
                      <div class="flex flex-col items-center justify-center cursor-pointer hover:bg-muted-foreground/5 dark:hover:bg-muted/15 border-r active:bg-muted-foreground/10 dark:active:bg-muted/30 border-neutral-300 dark:border-neutral-700">
                        3
                      </div>
                      <div class="flex flex-col items-center justify-center cursor-pointer bg-black dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 border-neutral-300">
                        storno
                      </div>
                    </div>
                    <div class="grid grid-cols-4 w-full h-full border-b border-neutral-300 dark:border-neutral-700">
                      <div class="flex flex-col items-center justify-center cursor-pointer hover:bg-muted-foreground/5 dark:hover:bg-muted/15 border-r active:bg-muted-foreground/10 dark:active:bg-muted/30 border-neutral-300 dark:border-neutral-700">
                        4
                      </div>
                      <div class="flex flex-col items-center justify-center cursor-pointer hover:bg-muted-foreground/5 dark:hover:bg-muted/15 border-r active:bg-muted-foreground/10 dark:active:bg-muted/30 border-neutral-300 dark:border-neutral-700">
                        5
                      </div>
                      <div class="flex flex-col items-center justify-center cursor-pointer hover:bg-muted-foreground/5 dark:hover:bg-muted/15 border-r active:bg-muted-foreground/10 dark:active:bg-muted/30 border-neutral-300 dark:border-neutral-700">
                        6
                      </div>
                      <div class="flex flex-col items-center justify-center cursor-pointer hover:bg-muted-foreground/5 dark:hover:bg-muted/15 border-neutral-300">
                        x
                      </div>
                    </div>
                    <div class="grid grid-cols-4 w-full h-full border-b border-neutral-300 dark:border-neutral-700">
                      <div class="flex flex-col items-center justify-center cursor-pointer hover:bg-muted-foreground/5 dark:hover:bg-muted/15 border-r active:bg-muted-foreground/10 dark:active:bg-muted/30 border-neutral-300 dark:border-neutral-700">
                        7
                      </div>
                      <div class="flex flex-col items-center justify-center cursor-pointer hover:bg-muted-foreground/5 dark:hover:bg-muted/15 border-r active:bg-muted-foreground/10 dark:active:bg-muted/30 border-neutral-300 dark:border-neutral-700">
                        8
                      </div>
                      <div class="flex flex-col items-center justify-center cursor-pointer hover:bg-muted-foreground/5 dark:hover:bg-muted/15 border-r active:bg-muted-foreground/10 dark:active:bg-muted/30 border-neutral-300 dark:border-neutral-700">
                        9
                      </div>
                      <div class="flex flex-col items-center justify-center cursor-pointer hover:bg-muted-foreground/5 dark:hover:bg-muted/15 border-neutral-300">
                        x
                      </div>
                    </div>
                    <div class="grid grid-cols-4 w-full h-full border-neutral-300">
                      <div class="flex flex-col items-center justify-center cursor-pointer hover:bg-muted-foreground/5 dark:hover:bg-muted/15 border-r active:bg-muted-foreground/10 dark:active:bg-muted/30 border-neutral-300 dark:border-neutral-700">
                        .
                      </div>
                      <div class="flex flex-col items-center justify-center cursor-pointer hover:bg-muted-foreground/5 dark:hover:bg-muted/15 border-r active:bg-muted-foreground/10 dark:active:bg-muted/30 border-neutral-300 dark:border-neutral-700">
                        0
                      </div>
                      <div class="flex flex-col items-center justify-center cursor-pointer hover:bg-muted-foreground/5 dark:hover:bg-muted/15 border-r active:bg-muted-foreground/10 dark:active:bg-muted/30 border-neutral-300 dark:border-neutral-700"></div>
                      <div class="flex flex-col items-center justify-center cursor-pointer bg-emerald-500 text-white hover:bg-emerald-600 border-neutral-300">
                        ok
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="flex flex-col w-1/2 grow gap-4">
                <div class="rounded-lg overflow-clip border grow">
                  <div class="p-4 border-b">
                    <span>Coupons</span>
                  </div>
                  <div class="grid grid-cols-4 w-full h-max p-4 gap-4">
                    <div class="w-full h-full flex flex-col items-center justify-center p-4 border rounded-md">A</div>
                    <div class="w-full h-full flex flex-col items-center justify-center p-4 border rounded-md">B</div>
                    <div class="w-full h-full flex flex-col items-center justify-center p-4 border rounded-md">C</div>
                    <div class="w-full h-full flex flex-col items-center justify-center p-4 border rounded-md">X</div>
                    <div class="w-full h-full flex flex-col items-center justify-center p-4 border rounded-md">Y</div>
                    <div class="w-full h-full flex flex-col items-center justify-center p-4 border rounded-md">Z</div>
                    <div class="w-full h-full flex flex-col items-center justify-center p-4 border rounded-md">
                      <Plus class="size-4" />
                    </div>
                  </div>
                </div>
                <div class="rounded-lg overflow-clip border grow">
                  <div class="p-4 border-b">
                    <span>Customer</span>
                  </div>
                  <div class="grid grid-cols-4 w-full h-max p-4 gap-4">
                    <div class="w-full h-full flex flex-col items-center justify-center p-4 border rounded-md">A</div>
                    <div class="w-full h-full flex flex-col items-center justify-center p-4 border rounded-md">B</div>
                    <div class="w-full h-full flex flex-col items-center justify-center p-4 border rounded-md">A</div>
                    <div class="w-full h-full flex flex-col items-center justify-center p-4 border rounded-md">B</div>
                  </div>
                </div>
                <div class="rounded-lg overflow-clip border grow">
                  <div class="p-4 border-b">
                    <span>Card Reader</span>
                  </div>
                  <div class="flex flex-row w-full h-max p-4 gap-4">
                    <div class="w-full h-full flex flex-col items-center justify-center p-4 border rounded-md">A</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Show>
    </Suspense>
  );
}

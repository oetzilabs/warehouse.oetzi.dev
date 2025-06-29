import { Button } from "@/components/ui/button";
import { getSuppliers } from "@/lib/api/suppliers";
import { cn } from "@/lib/utils";
import { A, createAsync, revalidate } from "@solidjs/router";
import dayjs from "dayjs";
import Plus from "lucide-solid/icons/plus";
import RotateCw from "lucide-solid/icons/rotate-cw";
import { For, Show, Suspense } from "solid-js";
import { toast } from "solid-sonner";
import { useNewProductForm } from "./form";

export const Suppliers = () => {
  const { form } = useNewProductForm();
  const suppliers = createAsync(() => getSuppliers(), { deferStream: true });
  return (
    <section class="p-0 grid grid-cols-1 md:grid-cols-5 gap-8">
      <div class="flex flex-col gap-2 col-span-2">
        {" "}
        <h2 class="text-lg font-semibold">Suppliers</h2>
        <p class="text-muted-foreground text-sm">
          Select suppliers for this product. You can choose multiple suppliers.
        </p>
      </div>
      <div class="col-span-3">
        <form.Field name="suppliers" mode="array">
          {(suppliersField) => (
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              <Suspense>
                <Show when={suppliers()}>
                  {(suppliersList) => (
                    <For
                      each={suppliersList()}
                      fallback={
                        <div class="col-span-full w-full flex flex-col gap-4 items-center justify-center bg-muted-foreground/5 rounded-lg p-14 border">
                          <span class="text-muted-foreground text-sm">You don't have any suppliers</span>
                          <div class="flex flex-row gap-4 items-center justify-center">
                            <Button
                              size="sm"
                              class="bg-background"
                              variant="outline"
                              onClick={() => {
                                toast.promise(revalidate(getSuppliers.key), {
                                  loading: "Refreshing suppliers...",
                                  success: "Suppliers refreshed",
                                  error: "Failed to refresh suppliers",
                                });
                              }}
                            >
                              <RotateCw class="size-4" />
                              Refresh
                            </Button>
                            <Button size="sm" as={A} href="/suppliers/new">
                              <Plus class="size-4" />
                              Add Supplier
                            </Button>
                          </div>
                        </div>
                      }
                    >
                      {(s) => {
                        const idx = () => suppliersField().state.value.indexOf(s.id);
                        const isSelected = () => idx() !== -1;
                        return (
                          <div
                            class={cn(
                              "bg-muted-foreground/5 dark:bg-muted/15 rounded-lg p-4 w-full cursor-pointer flex flex-col items-start justify-center border",
                              {
                                "text-white !bg-indigo-600 hover:bg-indigo-600": isSelected(),
                              },
                            )}
                            onClick={() => {
                              if (isSelected()) {
                                suppliersField().removeValue(idx());
                              } else {
                                suppliersField().pushValue(s.id);
                              }
                            }}
                          >
                            <span class="text-sm font-medium">{s.name}</span>
                            <For each={s.notes}>
                              {(note) => (
                                <span
                                  class={cn("text-xs text-muted-foreground text-center", {
                                    "text-white/70": isSelected(),
                                  })}
                                >
                                  {note.content}
                                </span>
                              )}
                            </For>
                            <For each={s.contacts}>
                              {(contact) => (
                                <span
                                  class={cn("text-xs text-muted-foreground text-center", {
                                    "text-white/70": isSelected(),
                                  })}
                                >
                                  {contact.email}
                                </span>
                              )}
                            </For>
                            <span
                              class={cn("text-xs text-muted-foreground text-center", {
                                "text-white/70": isSelected(),
                              })}
                            >
                              {dayjs(s.updatedAt ?? s.createdAt).format("MMM DD, YYYY - h:mm A")}
                            </span>
                          </div>
                        );
                      }}
                    </For>
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

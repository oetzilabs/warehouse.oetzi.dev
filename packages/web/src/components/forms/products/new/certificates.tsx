import { Button } from "@/components/ui/button";
import { getCertificates } from "@/lib/api/certificates";
import { cn } from "@/lib/utils";
import { A, createAsync, revalidate } from "@solidjs/router";
import dayjs from "dayjs";
import Plus from "lucide-solid/icons/plus";
import RotateCw from "lucide-solid/icons/rotate-cw";
import { For, Show, Suspense } from "solid-js";
import { toast } from "solid-sonner";
import { useNewProductForm } from "./form";

export const Certificates = () => {
  const { form } = useNewProductForm();
  const certificates = createAsync(() => getCertificates(), { deferStream: true });
  return (
    <section class="p-0 grid grid-cols-1 md:grid-cols-5 gap-8">
      <div class="flex flex-col gap-2 col-span-2">
        {" "}
        <h2 class="text-lg font-semibold">Certificates</h2>
        <p class="text-muted-foreground text-sm">Attach certificates relevant to this product.</p>
      </div>
      <div class="col-span-3">
        <form.Field name="certificates" mode="array">
          {(certificatesField) => (
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full">
              <Suspense>
                <Show when={certificates()}>
                  {(certificatesList) => (
                    <For
                      each={certificatesList()}
                      fallback={
                        <div class="col-span-full w-full flex flex-col gap-4 items-center justify-center bg-muted-foreground/5 rounded-lg p-14 border">
                          <span class="text-muted-foreground text-sm">
                            There are currently no certificates in the system, please create one.
                          </span>
                          <div class="flex flex-row gap-2 items-center justify-center">
                            <Button
                              size="sm"
                              class="bg-background"
                              variant="outline"
                              onClick={() => {
                                toast.promise(revalidate(getCertificates.key), {
                                  loading: "Refreshing certificates...",
                                  success: "Certificates refreshed",
                                  error: "Failed to refresh certificates",
                                });
                              }}
                            >
                              <RotateCw class="size-4" />
                              Refresh
                            </Button>
                            <Button size="sm" as={A} href="/certificates/new">
                              <Plus class="size-4" />
                              Add Certificate
                            </Button>
                          </div>
                        </div>
                      }
                    >
                      {(certificate) => {
                        const idx = () => certificatesField().state.value.indexOf(certificate.id);
                        const isSelected = () => idx() !== -1;
                        return (
                          <div
                            class={cn(
                              "bg-muted-foreground/5 rounded-lg p-4 flex flex-col gap-4 items-center justify-center border border-neutral-200 dark:border-neutral-800 select-none cursor-pointer",
                              {
                                "text-white bg-indigo-600 font-medium hover:bg-indigo-600": isSelected(),
                              },
                            )}
                            onClick={() => {
                              if (isSelected()) {
                                certificatesField().removeValue(idx());
                              } else {
                                certificatesField().pushValue(certificate.id);
                              }
                            }}
                          >
                            <span class="text-sm font-medium">{certificate.name}</span>
                            <span
                              class={cn("text-sm text-muted-foreground text-center", {
                                "text-white/70": isSelected(),
                              })}
                            >
                              {certificate.description ?? "No description available"}
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

import { Button } from "@/components/ui/button";
import {
  NumberField,
  NumberFieldDecrementTrigger,
  NumberFieldGroup,
  NumberFieldIncrementTrigger,
  NumberFieldInput,
  NumberFieldLabel,
} from "@/components/ui/number-field";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TextField, TextFieldInput, TextFieldLabel, TextFieldTextArea } from "@/components/ui/text-field";
import { getAuthenticatedUser, getSessionToken } from "@/lib/api/auth";
import { getCertificates } from "@/lib/api/certificates";
import { getProductBrands, getProductLabels } from "@/lib/api/products";
import { getStorageConditions } from "@/lib/api/storage_conditions";
import { getSuppliers } from "@/lib/api/suppliers";
import { cn } from "@/lib/utils";
import { A, createAsync, revalidate, RouteDefinition } from "@solidjs/router";
import { createForm, formOptions } from "@tanstack/solid-form";
import { type ProductCreate } from "@warehouseoetzidev/core/src/drizzle/sql/schemas/products/products";
import dayjs from "dayjs";
import ArrowLeft from "lucide-solid/icons/arrow-left";
import Award from "lucide-solid/icons/award";
import Info from "lucide-solid/icons/info";
import Plus from "lucide-solid/icons/plus";
import RotateCw from "lucide-solid/icons/rotate-cw";
import Tag from "lucide-solid/icons/tag";
import Thermometer from "lucide-solid/icons/thermometer";
import Users from "lucide-solid/icons/users";
import { createSignal, For, Index, Show, Suspense } from "solid-js";
import { toast } from "solid-sonner";
import BarcodeScanner from "../../../../components/features/scanner/barcodescanner";

export const route = {
  preload: (props) => {
    getAuthenticatedUser();
    getSessionToken();
    getSuppliers();
    getProductLabels();
    getCertificates();
    getStorageConditions();
  },
} as RouteDefinition;

export default function NewProductPage() {
  const suppliers = createAsync(() => getSuppliers(), { deferStream: true });
  const labels = createAsync(() => getProductLabels(), { deferStream: true });
  const certificates = createAsync(() => getCertificates(), { deferStream: true });
  const conditions = createAsync(() => getStorageConditions(), { deferStream: true });
  const brands = createAsync(() => getProductBrands(), { deferStream: true });
  const formOps = formOptions({
    defaultValues: {
      name: "",
      barcode: "",
      sku: "",
      description: "",
      dimensions: {
        depth: 0,
        width: 0,
        height: 0,
        unit: "cm",
      },
      weight: {
        value: 0.0,
        unit: "kg",
      },

      customsTariffNumber: "unknown",
      countryOfOrigin: "unknown",

      brand_id: null,

      labels: [],
      catalogs: [],
      certificates: [],
      conditions: [],
      suppliers: [],
    } as {
      name: string;
      barcode: string;
      sku: string;
      description: string;
      dimensions: {
        depth: number;
        width: number;
        height: number;
        unit: "cm" | "in" | (string & {});
      };
      weight: {
        value: number;
        unit: "kg" | "lb";
      };
      customsTariffNumber: string;
      countryOfOrigin: string;
      brand_id: string | null;
      labels: string[];
      catalogs: string[];
      certificates: string[];
      conditions: string[];
      suppliers: string[];
    },
  });
  const form = createForm(() => ({
    ...formOps,
  }));

  return (
    <div class="container flex flex-row grow py-4">
      <div class="w-full py-4 flex flex-col gap-4">
        <div class="flex items-center gap-4 justify-between w-full">
          <div class="flex items-center gap-4">
            <Button size="sm" variant="outline" class="bg-background" as={A} href="/products">
              <ArrowLeft class="size-4" />
              Back to Products
            </Button>
            <h1 class="font-semibold leading-none">New Product</h1>
          </div>
          <div class="flex items-center gap-4">
            <Button size="sm" onClick={() => {}}>
              <Plus class="size-4" />
              Add
            </Button>
          </div>
        </div>
        <div class="w-full grow flex flex-col">
          <Tabs defaultValue="basic-info">
            <TabsList class="flex flex-row gap-0 w-full items-center justify-start">
              <TabsTrigger value="basic-info" class="data-[selected]:text-primary gap-2">
                <Info class="size-4" />
                Basic Information
              </TabsTrigger>
              <form.Field name="labels" mode="array">
                {(labelsField) => (
                  <TabsTrigger value="labels" class="data-[selected]:text-primary gap-2">
                    <Tag class="size-4" />
                    Labels ({labelsField().state.value.length})
                  </TabsTrigger>
                )}
              </form.Field>
              <form.Field name="conditions" mode="array">
                {(conditionsField) => (
                  <TabsTrigger value="conditions" class="data-[selected]:text-primary gap-2">
                    <Thermometer class="size-4" />
                    Conditions ({conditionsField().state.value.length})
                  </TabsTrigger>
                )}
              </form.Field>
              <form.Field name="certificates" mode="array">
                {(certificatesField) => (
                  <TabsTrigger value="certificates" class="data-[selected]:text-primary gap-2">
                    <Award class="size-4" />
                    Certificates ({certificatesField().state.value.length})
                  </TabsTrigger>
                )}
              </form.Field>
              <form.Field name="suppliers" mode="array">
                {(suppliersField) => (
                  <TabsTrigger value="suppliers" class="data-[selected]:text-primary gap-2">
                    <Users class="size-4" />
                    Suppliers ({suppliersField().state.value.length})
                  </TabsTrigger>
                )}
              </form.Field>
            </TabsList>
            <form class="w-full grow flex flex-col gap-4">
              <TabsContent value="basic-info" class="pt-4 px-0">
                <div class="w-full flex flex-col gap-4">
                  <form.Field name="name">
                    {(field) => (
                      <TextField
                        value={field().state.value}
                        onChange={(e) => field().setValue(e)}
                        class="gap-2 flex flex-col"
                      >
                        <TextFieldLabel class="capitalize pl-1">
                          Name <span class="text-red-500">*</span>
                        </TextFieldLabel>
                        <TextFieldInput class="h-9" placeholder="Product Name" />
                      </TextField>
                    )}
                  </form.Field>
                  <form.Field name="barcode">
                    {(field) => (
                      <div class="gap-2 flex flex-row items-end justify-center">
                        <TextField
                          value={field().state.value}
                          onChange={(e) => field().setValue(e)}
                          class="gap-2 flex flex-col w-full"
                        >
                          <TextFieldLabel class="capitalize pl-1">Barcode</TextFieldLabel>
                          <TextFieldInput class="w-full" placeholder="Barcode" />
                        </TextField>
                        <BarcodeScanner
                          onScan={(data) => {
                            field().handleChange(data);
                          }}
                        />
                      </div>
                    )}
                  </form.Field>
                  <form.Field name="sku">
                    {(field) => (
                      <TextField
                        value={field().state.value}
                        onChange={(e) => field().setValue(e)}
                        class="gap-2 flex flex-col"
                      >
                        <TextFieldLabel class="capitalize pl-1">SKU</TextFieldLabel>
                        <TextFieldInput class="h-9" placeholder="SKU" />
                      </TextField>
                    )}
                  </form.Field>
                  <form.Field name="description">
                    {(field) => (
                      <TextField
                        value={field().state.value}
                        onChange={(e) => field().setValue(e)}
                        class="gap-2 flex flex-col"
                      >
                        <TextFieldLabel class="capitalize pl-1">Description</TextFieldLabel>
                        <TextFieldTextArea placeholder="Product Description" autoResize />
                      </TextField>
                    )}
                  </form.Field>
                  <form.Field name="customsTariffNumber">
                    {(field) => (
                      <TextField
                        value={field().state.value}
                        onChange={(e) => field().setValue(e)}
                        class="gap-2 flex flex-col"
                      >
                        <TextFieldLabel class="capitalize pl-1">Customs Tariff Number</TextFieldLabel>
                        <TextFieldInput class="h-9" placeholder="Customs Tariff Number" />
                      </TextField>
                    )}
                  </form.Field>
                  <form.Field name="countryOfOrigin">
                    {(field) => (
                      <TextField
                        value={field().state.value}
                        onChange={(e) => field().setValue(e)}
                        class="gap-2 flex flex-col"
                      >
                        <TextFieldLabel class="capitalize pl-1">Country of Origin</TextFieldLabel>
                        <TextFieldInput class="h-9" placeholder="Country of Origin" />
                      </TextField>
                    )}
                  </form.Field>
                  <form.Field name="brand_id">
                    {(field) => (
                      <div class="gap-2 flex flex-col">
                        <span class="capitalize pl-1 text-sm font-medium">Brand</span>
                        <Suspense
                          fallback={
                            <div class="grid gap-2 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                              <Skeleton class="w-48 h-20" />
                              <Skeleton class="w-48 h-20" />
                            </div>
                          }
                        >
                          <Show when={brands()}>
                            {(brandsList) => (
                              <div class="grid gap-2 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                                <For each={brandsList()}>
                                  {(brand) => (
                                    <div
                                      class={cn(
                                        "bg-muted-foreground/5 rounded-lg p-3 flex flex-col gap-1 border border-neutral-200 dark:border-neutral-800 select-none cursor-pointer",
                                        {
                                          "text-white bg-indigo-600 hover:bg-indigo-600":
                                            field().state.value === brand.id,
                                        },
                                      )}
                                      onClick={() => {
                                        //toggle brand
                                        if (field().state.value === brand.id) {
                                          field().setValue(null);
                                        } else {
                                          field().setValue(brand.id);
                                        }
                                      }}
                                    >
                                      <span class="text-sm font-medium">{brand.name}</span>
                                      <span
                                        class={cn("text-xs", {
                                          "text-muted-foreground": field().state.value !== brand.id,
                                        })}
                                      >
                                        {brand.description ?? ""}
                                      </span>
                                    </div>
                                  )}
                                </For>
                              </div>
                            )}
                          </Show>
                        </Suspense>
                      </div>
                    )}
                  </form.Field>
                </div>
              </TabsContent>
              <form.Field name="labels" mode="array">
                {(labelsField) => (
                  <TabsContent value="labels" class="pt-4 px-0">
                    <div class="w-full flex flex-col gap-4">
                      <div class="grid  gap-4 w-full grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        <Suspense>
                          <Show when={labels()}>
                            {(labelsList) => (
                              <For
                                each={labelsList().sort((a, b) => {
                                  const aHasImage = a.image?.length ?? 0;
                                  const bHasImage = b.image?.length ?? 0;
                                  const aIsNewer = (a.updatedAt ?? a.createdAt) > (b.updatedAt ?? b.createdAt);
                                  return aHasImage > bHasImage ? -1 : aHasImage < bHasImage ? 1 : aIsNewer ? -1 : 1;
                                })}
                                fallback={
                                  <div class="col-span-full w-full flex flex-col gap-2 items-center justify-center bg-muted-foreground/5 rounded-lg p-14 border">
                                    <span class="text-muted-foreground text-sm">
                                      There are currently no labels in the system, please contact the administrator.
                                    </span>
                                    <div class="flex flex-row gap-4 items-center justify-center">
                                      <Button
                                        size="sm"
                                        class="bg-background"
                                        variant="outline"
                                        onClick={() => {
                                          toast.promise(revalidate(getProductLabels.key), {
                                            loading: "Refreshing labels...",
                                            success: "Labels refreshed",
                                            error: "Failed to refresh labels",
                                          });
                                        }}
                                      >
                                        <RotateCw class="size-4" />
                                        Refresh
                                      </Button>
                                    </div>
                                  </div>
                                }
                              >
                                {(label) => {
                                  const idx = () => labelsField().state.value.indexOf(label.id);
                                  const isSelected = () => idx() !== -1;
                                  return (
                                    <div
                                      class={cn(
                                        "bg-muted-foreground/5 rounded-lg flex flex-col gap-2 border border-neutral-200 dark:border-neutral-800 select-none cursor-pointer overflow-clip w-full h-content",
                                        {
                                          "text-white bg-indigo-600 hover:bg-indigo-600": isSelected(),
                                        },
                                      )}
                                      onClick={() => {
                                        if (isSelected()) {
                                          labelsField().removeValue(idx());
                                        } else {
                                          labelsField().pushValue(label.id);
                                        }
                                      }}
                                    >
                                      <Show
                                        when={(label.image?.length ?? 0) > 0 && label.image}
                                        fallback={<div class="bg-muted-foreground w-full h-32"></div>}
                                      >
                                        {(i) => <img src={i()} class="border-b w-full h-32 object-cover" />}
                                      </Show>
                                      <div class="flex flex-col gap-2 p-4 grow">
                                        <div class="flex flex-col gap-1">
                                          <span class="text-sm font-medium leading-none">{label.name}</span>
                                          <span
                                            class={cn("text-sm text-muted-foreground ", {
                                              "text-white/70": isSelected(),
                                            })}
                                          >
                                            {label.description ?? "No description available"}
                                          </span>
                                        </div>
                                        <div class="flex grow"></div>
                                        <div class="flex flex-col gap-1">
                                          <span
                                            class={cn("text-xs text-muted-foreground ", {
                                              "text-white/70": isSelected(),
                                            })}
                                          >
                                            {dayjs(label.updatedAt ?? label.createdAt).format("MMM DD, YYYY - h:mm A")}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                }}
                              </For>
                            )}
                          </Show>
                        </Suspense>
                      </div>
                    </div>
                  </TabsContent>
                )}
              </form.Field>
              <form.Field name="conditions" mode="array">
                {(conditionsField) => (
                  <TabsContent value="conditions" class="pt-4 px-0">
                    <div class="w-full flex flex-col gap-4">
                      <div class="grid grid-cols-6 gap-4 w-full">
                        <Suspense>
                          <Show when={conditions()}>
                            {(conditionsList) => (
                              <For
                                each={conditionsList()}
                                fallback={
                                  <div class="col-span-full w-full flex flex-col gap-2 items-center justify-center bg-muted-foreground/5 rounded-lg p-14 border">
                                    <span class="text-muted-foreground text-sm">
                                      There are currently no codnitions in the system, please contact the administrator.
                                    </span>
                                    <div class="flex flex-row gap-4 items-center justify-center">
                                      <Button
                                        size="sm"
                                        class="bg-background"
                                        variant="outline"
                                        onClick={() => {
                                          toast.promise(revalidate(getStorageConditions.key), {
                                            loading: "Refreshing storage conditions...",
                                            success: "Storage conditions refreshed",
                                            error: "Failed to refresh storage conditions",
                                          });
                                        }}
                                      >
                                        <RotateCw class="size-4" />
                                        Refresh
                                      </Button>
                                    </div>
                                  </div>
                                }
                              >
                                {(condition) => {
                                  const idx = () => conditionsField().state.value.indexOf(condition.id);
                                  const isSelected = () => idx() !== -1;
                                  return (
                                    <div
                                      class={cn(
                                        "bg-muted-foreground/5 rounded-lg p-4 flex flex-col gap-2 items-center justify-center border border-neutral-200 dark:border-neutral-800 select-none cursor-pointer",
                                        {
                                          "text-white bg-indigo-600 hover:bg-indigo-600": isSelected(),
                                        },
                                      )}
                                      onClick={() => {
                                        if (isSelected()) {
                                          conditionsField().removeValue(idx());
                                        } else {
                                          conditionsField().pushValue(condition.id);
                                        }
                                      }}
                                    >
                                      <span class="text-sm font-medium">{condition.name}</span>
                                      <span
                                        class={cn("text-sm text-muted-foreground text-center", {
                                          "text-white/70": isSelected(),
                                        })}
                                      >
                                        {condition.description ?? "No description available"}
                                      </span>
                                      <span
                                        class={cn("text-xs text-muted-foreground text-center", {
                                          "text-white/70": isSelected(),
                                        })}
                                      >
                                        {dayjs(condition.updatedAt ?? condition.createdAt).format(
                                          "MMM DD, YYYY - h:mm A",
                                        )}
                                      </span>
                                    </div>
                                  );
                                }}
                              </For>
                            )}
                          </Show>
                        </Suspense>
                        <Button
                          size="sm"
                          class="w-max"
                          onClick={() => {
                            toast.promise(revalidate(getProductLabels.key), {
                              loading: "Refreshing labels...",
                              success: "Labels refreshed",
                              error: "Failed to refresh labels",
                            });
                          }}
                        >
                          <RotateCw class="size-4" />
                          Refresh
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                )}
              </form.Field>
              <form.Field name="certificates" mode="array">
                {(certificatesField) => (
                  <TabsContent value="certificates" class="pt-4 px-0">
                    <div class="w-full flex flex-col gap-4">
                      <div class="grid grid-cols-6 gap-4 w-full">
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
                                    <div class="flex flex-row gap-4 items-center justify-center">
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
                        <Button
                          size="sm"
                          class="w-max"
                          onClick={() => {
                            toast.promise(revalidate(getProductLabels.key), {
                              loading: "Refreshing certificates...",
                              success: "Labels refreshed",
                              error: "Failed to refresh certificates",
                            });
                          }}
                        >
                          <RotateCw class="size-4" />
                          Refresh
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                )}
              </form.Field>
              <form.Field name="suppliers" mode="array">
                {(suppliersField) => (
                  <TabsContent value="suppliers" class="pt-4 px-0">
                    <div class="w-full flex flex-col gap-4">
                      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
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
                    </div>
                  </TabsContent>
                )}
              </form.Field>
            </form>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

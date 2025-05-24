import { Button } from "@/components/ui/button";
import {
  NumberField,
  NumberFieldDecrementTrigger,
  NumberFieldGroup,
  NumberFieldIncrementTrigger,
  NumberFieldInput,
  NumberFieldLabel,
} from "@/components/ui/number-field";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TextField, TextFieldInput, TextFieldLabel, TextFieldTextArea } from "@/components/ui/text-field";
import { getAuthenticatedUser, getSessionToken } from "@/lib/api/auth";
import { getCertificates } from "@/lib/api/certificates";
import { getProductLabels, getProductsByWarehouseId } from "@/lib/api/products";
import { getStorageConditions } from "@/lib/api/storage_conditions";
import { getSuppliers } from "@/lib/api/suppliers";
import { cn } from "@/lib/utils";
import { A, createAsync, revalidate, RouteDefinition, useParams } from "@solidjs/router";
import { createForm, formOptions } from "@tanstack/solid-form";
import { type ProductCreate } from "@warehouseoetzidev/core/src/drizzle/sql/schemas/products/products";
import dayjs from "dayjs";
import Award from "lucide-solid/icons/award";
import Info from "lucide-solid/icons/info";
import Plus from "lucide-solid/icons/plus";
import RotateCw from "lucide-solid/icons/rotate-cw";
import Tag from "lucide-solid/icons/tag";
import Thermometer from "lucide-solid/icons/thermometer";
import Users from "lucide-solid/icons/users";
import { createSignal, For, Show, Suspense } from "solid-js";
import { toast } from "solid-sonner";

export const route = {
  preload: (props) => {
    getAuthenticatedUser();
    getSessionToken();
    getProductsByWarehouseId(props.params.whid);
    getSuppliers(props.params.whid);
    getProductLabels();
    getCertificates();
    getStorageConditions();
  },
} as RouteDefinition;

export default function NewProductPage() {
  const params = useParams();
  const suppliers = createAsync(() => getSuppliers(), { deferStream: true });
  const labels = createAsync(() => getProductLabels(), { deferStream: true });
  const certificates = createAsync(() => getCertificates(), { deferStream: true });
  const conditions = createAsync(() => getStorageConditions(), { deferStream: true });
  const formOps = formOptions({
    defaultValues: {
      name: "",
      description: "",
      sku: "",
      barcode: "",

      brand_id: "",

      minimumStock: 0,
      maximumStock: null,
      reorderPoint: null,

      serialNumber: "",
      lotNumber: "",
      batchNumber: "",
      manufacturingDate: null,
      expirationDate: null,
      shelfLife: null,

      status: "active",
      condition: "new",

      purchasePrice: null,
      sellingPrice: 0,
      msrp: null,
      currency: "EUR",

      weight: {
        value: 0,
        unit: "kg",
      },
      dimensions: null,

      safetyStock: null,
      customsTariffNumber: "",
      countryOfOrigin: "",
    } satisfies Required<ProductCreate>,
  });
  const [chosenLabels, setChosenLabels] = createSignal<string[]>([]);
  const [chosenSuppliers, setChosenSuppliers] = createSignal<string[]>([]);
  const [chosenCertificates, setChosenCertificates] = createSignal<string[]>([]);
  const [chosenConditions, setChosenConditions] = createSignal<string[]>([]);
  const form = createForm(() => ({
    ...formOps,
  }));
  return (
    <div class="container flex flex-row grow py-4">
      <div class="w-full py-4 flex flex-col gap-4 border rounded-xl">
        <div class="flex px-4 items-center gap-4 justify-between w-full">
          <h1 class="font-semibold leading-none">New Product</h1>
          <div class="flex items-center gap-4">
            <Button size="sm" onClick={() => {}}>
              <Plus class="size-4" />
              Add
            </Button>
          </div>
        </div>
        <div class="w-full grow flex flex-col">
          <Tabs defaultValue="basic-info" class="w-full border-t overflow-clip h-full">
            <TabsList class="flex flex-row gap-0 w-full items-center justify-start h-max rounded-none bg-transparent p-0 !py-0">
              <TabsTrigger
                value="basic-info"
                class="!shadow-none bg-transparent data-[selected]:text-primary border-b data-[selected]:border-primary rounded-none gap-2 py-3 px-4"
              >
                <Info class="size-4" />
                Basic Information
              </TabsTrigger>
              <TabsTrigger
                value="labels"
                class="!shadow-none bg-transparent data-[selected]:text-primary border-b data-[selected]:border-primary rounded-none gap-2 py-3 px-4"
              >
                <Tag class="size-4" />
                Labels ({chosenLabels().length})
              </TabsTrigger>
              <TabsTrigger
                value="conditions"
                class="!shadow-none bg-transparent data-[selected]:text-primary border-b data-[selected]:border-primary rounded-none gap-2 py-3 px-4"
              >
                <Thermometer class="size-4" />
                Conditions ({chosenConditions().length})
              </TabsTrigger>
              <TabsTrigger
                value="certificates"
                class="!shadow-none bg-transparent data-[selected]:text-primary border-b data-[selected]:border-primary rounded-none gap-2 py-3 px-4"
              >
                <Award class="size-4" />
                Certificates ({chosenCertificates().length})
              </TabsTrigger>
              <TabsTrigger
                value="suppliers"
                class="!shadow-none bg-transparent data-[selected]:text-primary border-b data-[selected]:border-primary rounded-none gap-2 py-3 px-4"
              >
                <Users class="size-4" />
                Suppliers ({chosenSuppliers().length})
              </TabsTrigger>
              <div class="w-full border-b py-3 inline-flex px-4">
                <div class="size-5 border-b border-transparent" />
              </div>
            </TabsList>
            <form class="w-full grow flex flex-col gap-4">
              <TabsContent value="basic-info">
                <div class="w-full flex flex-col gap-4 py-2 pb-4 px-4">
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
                  <div class="flex flex-row gap-4 items-center w-full">
                    <form.Field name="minimumStock">
                      {(field) => (
                        <NumberField
                          class="w-full"
                          value={field().state.value}
                          onRawValueChange={(e) => field().setValue(e)}
                          minValue={0}
                        >
                          <NumberFieldLabel class="capitalize pl-1">Minimum Stock</NumberFieldLabel>
                          <NumberFieldGroup>
                            <NumberFieldInput class="h-16 text-lg font-medium" />
                            <NumberFieldIncrementTrigger class="width-auto h-full !p-5 [&>svg]:size-5" />
                            <NumberFieldDecrementTrigger class="width-auto h-full !p-5 [&>svg]:size-5" />
                          </NumberFieldGroup>
                        </NumberField>
                      )}
                    </form.Field>
                    <form.Field name="maximumStock">
                      {(field) => (
                        <NumberField
                          class="w-full"
                          value={typeof field().state.value !== "boolean" ? field().state.value : undefined}
                          onRawValueChange={(e) => field().setValue(e)}
                          minValue={form.state.values.minimumStock ?? 0}
                        >
                          <NumberFieldLabel class="capitalize pl-1">Maximum Stock</NumberFieldLabel>
                          <NumberFieldGroup>
                            <NumberFieldInput class="h-16 text-lg font-medium" />
                            <NumberFieldIncrementTrigger class="width-auto h-full !p-5 [&>svg]:size-5" />
                            <NumberFieldDecrementTrigger class="width-auto h-full !p-5 [&>svg]:size-5" />
                          </NumberFieldGroup>
                        </NumberField>
                      )}
                    </form.Field>
                    <form.Field name="reorderPoint">
                      {(field) => (
                        <NumberField
                          class="w-full"
                          value={typeof field().state.value !== "boolean" ? field().state.value : undefined}
                          onRawValueChange={(e) => field().setValue(e)}
                          minValue={form.state.values.minimumStock ?? 0}
                          maxValue={form.state.values.maximumStock ?? 0}
                        >
                          <NumberFieldLabel class="capitalize pl-1">Reorder Point</NumberFieldLabel>
                          <NumberFieldGroup>
                            <NumberFieldInput class="h-16 text-lg font-medium" />
                            <NumberFieldIncrementTrigger class="width-auto h-full !p-5 [&>svg]:size-5" />
                            <NumberFieldDecrementTrigger class="width-auto h-full !p-5 [&>svg]:size-5" />
                          </NumberFieldGroup>
                        </NumberField>
                      )}
                    </form.Field>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="labels">
                <div class="w-full flex flex-col gap-4 py-2 pb-4 px-4">
                  <div class="grid  gap-4 w-full grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    <Suspense>
                      <Show when={labels()}>
                        {(labelsList) => (
                          <For
                            each={labelsList().sort((a, b) => {
                              // has image and image length is greater than 0 is first.
                              // then sort by updatedAt or createdAt
                              // old code: (a.image?.length ?? 0) > 0 ? -1 : (b.image?.length ?? 0) > 0 ? 1 : 0,
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
                            {(label) => (
                              <div
                                class={cn(
                                  "bg-muted-foreground/5 rounded-lg flex flex-col gap-2 border border-neutral-200 dark:border-neutral-800 select-none cursor-pointer overflow-clip w-full h-content",
                                  {
                                    "text-white bg-indigo-600 hover:bg-indigo-600": chosenLabels().includes(label.id),
                                  },
                                )}
                                onClick={() => {
                                  if (chosenLabels().includes(label.id)) {
                                    setChosenLabels((c) => c.filter((l) => l !== label.id));
                                  } else {
                                    setChosenLabels((c) => [...c, label.id]);
                                  }
                                }}
                              >
                                <Show
                                  when={(label.image?.length ?? 0) > 0 && label.image}
                                  fallback={<div class="bg-muted-foreground w-full h-32"></div>}
                                >
                                  {(i) => <img src={i()} class="border-b w-full h-32 object-cover" />}
                                </Show>
                                <div class="flex flex-col gap-2 p-4 pt-2 grow">
                                  <div class="flex flex-col gap-1">
                                    <span class="text-sm font-medium leading-none">{label.name}</span>
                                    <span
                                      class={cn("text-sm text-muted-foreground ", {
                                        "text-white/70": chosenLabels().includes(label.id),
                                      })}
                                    >
                                      {label.description ?? "No description available"}
                                    </span>
                                  </div>
                                  <div class="flex grow"></div>
                                  <div class="flex flex-col gap-1">
                                    <span
                                      class={cn("text-xs text-muted-foreground ", {
                                        "text-white/70": chosenLabels().includes(label.id),
                                      })}
                                    >
                                      {dayjs(label.updatedAt ?? label.createdAt).format("MMM DD, YYYY - h:mm A")}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}
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
              <TabsContent value="conditions">
                <div class="w-full flex flex-col gap-4 py-2 pb-4 px-4">
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
                            {(condition) => (
                              <div
                                class={cn(
                                  "bg-muted-foreground/5 rounded-lg p-4 flex flex-col gap-2 items-center justify-center border border-neutral-200 dark:border-neutral-800 select-none cursor-pointer",
                                  {
                                    "text-white bg-indigo-600 hover:bg-indigo-600": chosenLabels().includes(
                                      condition.id,
                                    ),
                                  },
                                )}
                                onClick={() => {
                                  if (chosenConditions().includes(condition.id)) {
                                    setChosenConditions((c) => c.filter((l) => l !== condition.id));
                                  } else {
                                    setChosenConditions((c) => [...c, condition.id]);
                                  }
                                }}
                              >
                                <span class="text-sm font-medium">{condition.name}</span>
                                <span
                                  class={cn("text-sm text-muted-foreground text-center", {
                                    "text-white/70": chosenConditions().includes(condition.id),
                                  })}
                                >
                                  {condition.description ?? "No description available"}
                                </span>
                                <span
                                  class={cn("text-xs text-muted-foreground text-center", {
                                    "text-white/70": chosenConditions().includes(condition.id),
                                  })}
                                >
                                  {dayjs(condition.updatedAt ?? condition.createdAt).format("MMM DD, YYYY - h:mm A")}
                                </span>
                              </div>
                            )}
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
              <TabsContent value="certificates">
                <div class="w-full flex flex-col gap-4 py-2 pb-4 px-4">
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
                            {(certificate) => (
                              <div
                                class={cn(
                                  "bg-muted-foreground/5 rounded-lg p-4 flex flex-col gap-4 items-center justify-center border border-neutral-200 dark:border-neutral-800 select-none cursor-pointer",
                                  {
                                    "text-white bg-indigo-600 font-medium hover:bg-indigo-600":
                                      chosenCertificates().includes(certificate.id),
                                  },
                                )}
                                onClick={() => {
                                  if (chosenCertificates().includes(certificate.id)) {
                                    setChosenCertificates((c) => c.filter((l) => l !== certificate.id));
                                  } else {
                                    setChosenCertificates((c) => [...c, certificate.id]);
                                  }
                                }}
                              >
                                <span class="text-sm font-medium">{certificate.name}</span>
                                <span
                                  class={cn("text-sm text-muted-foreground text-center", {
                                    "text-white/70": chosenCertificates().includes(certificate.id),
                                  })}
                                >
                                  {certificate.description ?? "No description available"}
                                </span>
                              </div>
                            )}
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
              <TabsContent value="suppliers">
                <div class="w-full flex flex-col gap-4 py-2 pb-4 px-4">
                  <div class="grid grid-cols-6 gap-4 w-full">
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
                            {(s) => (
                              <div
                                class={cn("bg-muted-foreground/5 rounded-lg p-4", {
                                  "text-white bg-indigo-600 hover:bg-indigo-600": chosenSuppliers().includes(s.id),
                                })}
                                onClick={() => {
                                  if (chosenSuppliers().includes(s.id)) {
                                    setChosenSuppliers((c) => c.filter((l) => l !== s.id));
                                  } else {
                                    setChosenSuppliers((c) => [...c, s.id]);
                                  }
                                }}
                              >
                                <span class="text-sm font-medium">{s.name}</span>
                                <For each={s.notes}>
                                  {(note) => (
                                    <span
                                      class={cn("text-xs text-muted-foreground text-center", {
                                        "text-white/70": chosenSuppliers().includes(s.id),
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
                                        "text-white/70": chosenSuppliers().includes(s.id),
                                      })}
                                    >
                                      {contact.email}
                                    </span>
                                  )}
                                </For>
                                <span
                                  class={cn("text-xs text-muted-foreground text-center", {
                                    "text-white/70": chosenSuppliers().includes(s.id),
                                  })}
                                >
                                  {dayjs(s.updatedAt ?? s.createdAt).format("MMM DD, YYYY - h:mm A")}
                                </span>
                              </div>
                            )}
                          </For>
                        )}
                      </Show>
                    </Suspense>
                  </div>
                </div>
              </TabsContent>
            </form>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

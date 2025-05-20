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
import { getProductLabels, getProductsByWarehouseId } from "@/lib/api/products";
import { getSuppliersByWarehouseId } from "@/lib/api/suppliers";
import { cn } from "@/lib/utils";
import { A, createAsync, revalidate, RouteDefinition, useParams } from "@solidjs/router";
import { createForm, formOptions } from "@tanstack/solid-form";
import { type ProductCreate } from "@warehouseoetzidev/core/src/drizzle/sql/schemas/products/products";
import Plus from "lucide-solid/icons/plus";
import RotateCw from "lucide-solid/icons/rotate-cw";
import { createSignal, For, Show, Suspense } from "solid-js";
import { toast } from "solid-sonner";

export const route = {
  preload: (props) => {
    const user = getAuthenticatedUser({ skipOnboarding: true });
    const sessionToken = getSessionToken();
    const sales = getProductsByWarehouseId(props.params.whid);
    const suppliers = getSuppliersByWarehouseId(props.params.whid);
    const labels = getProductLabels();
    return { user, sessionToken, sales, suppliers, labels };
  },
} as RouteDefinition;

export default function NewProductPage() {
  const params = useParams();
  const suppliers = createAsync(() => getSuppliersByWarehouseId(params.whid), { deferStream: true });
  const labels = createAsync(() => getProductLabels(), { deferStream: true });
  const formOps = formOptions({
    defaultValues: {
      name: "",
      description: "",
      sku: "",
      barcode: "",

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

      certifications: [],
      safetyStock: null,
      customsTariffNumber: "",
      countryOfOrigin: "",
    } satisfies Required<ProductCreate>,
  });
  const [chosenLabels, setChosenLabels] = createSignal<string[]>([]);
  const [chosenSuppliers, setChosenSuppliers] = createSignal<string[]>([]);
  const form = createForm(() => ({
    ...formOps,
  }));
  return (
    <div class="w-full flex flex-row grow">
      <div class="w-full p-4 flex flex-col gap-4">
        <div class="flex items-center gap-4 justify-between w-full">
          <h1 class="text-2xl font-bold leading-0">New Product</h1>
          <div class="flex items-center gap-4">
            <Button size="sm" class="h-8" onClick={() => {}}>
              <Plus class="size-4" />
              Add
            </Button>
          </div>
        </div>
        <div class="w-full grow flex flex-col">
          <Tabs defaultValue="basic-info" class="w-full">
            <TabsList class="flex flex-row gap-0 w-full items-center justify-start h-max rounded-none bg-transparent p-0 !py-0">
              <TabsTrigger
                value="basic-info"
                class="!shadow-none bg-transparent data-[selected]:text-primary border-b border-neutral-300 dark:border-neutral-800 data-[selected]:border-indigo-600 rounded-none"
              >
                Basic Information
              </TabsTrigger>
              <TabsTrigger
                value="labels"
                class="!shadow-none bg-transparent data-[selected]:text-primary border-b border-neutral-300 dark:border-neutral-800 data-[selected]:border-indigo-600 rounded-none"
              >
                Labels {chosenLabels().length > 0 && `(${chosenLabels().length})`}
              </TabsTrigger>
              <TabsTrigger
                value="suppliers"
                class="!shadow-none bg-transparent data-[selected]:text-primary border-b border-neutral-300 dark:border-neutral-800 data-[selected]:border-indigo-600 rounded-none"
              >
                Suppliers
              </TabsTrigger>
              <div class="w-full h-[34px] border-b border-neutral-300 dark:border-neutral-800 "></div>
            </TabsList>
            <form class="w-full grow flex flex-col gap-4">
              <TabsContent value="basic-info">
                <div class="w-full flex flex-col gap-4 max-w-2xl py-2">
                  <form.Field name="name">
                    {(field) => (
                      <TextField
                        value={field().state.value}
                        onChange={(e) => field().setValue(e)}
                        class="gap-2 flex flex-col"
                      >
                        <TextFieldLabel class="capitalize pl-1">{field().name}</TextFieldLabel>
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
                        <TextFieldLabel class="capitalize pl-1">{field().name}</TextFieldLabel>
                        <TextFieldTextArea placeholder="Product Description" />
                      </TextField>
                    )}
                  </form.Field>
                  {/* <form.Field name="sku">
                    {(field) => (
                      <div class="flex flex-row gap-4 items-center w-full">
                        <TextField
                          value={field().state.value}
                          onChange={(e) => field().setValue(e)}
                          class="gap-2 flex flex-col w-full"
                        >
                          <TextFieldLabel class="capitalize pl-1 w-full">SKU</TextFieldLabel>
                          <TextFieldInput class="h-9" placeholder="SKU" />
                        </TextField>
                        <div class="place-self-end w-max">
                          <Button type="button" size="sm" variant="secondary" class="h-9 px-4" onClick={() => {}}>
                            Generate
                          </Button>
                        </div>
                      </div>
                    )}
                  </form.Field>
                  <form.Field name="barcode">
                    {(field) => (
                      <div class="flex flex-row gap-4 items-center w-full">
                        <TextField
                          value={field().state.value}
                          onChange={(e) => field().setValue(e)}
                          class="gap-2 flex flex-col w-full"
                        >
                          <TextFieldLabel class="capitalize pl-1">{field().name}</TextFieldLabel>
                          <TextFieldInput class="h-9" placeholder="Barcode" />
                        </TextField>
                        <div class="place-self-end w-max">
                          <Button type="button" size="sm" variant="secondary" class="h-9 px-4" onClick={() => {}}>
                            Generate
                          </Button>
                        </div>
                      </div>
                    )}
                  </form.Field> */}
                  <form.Field name="minimumStock">
                    {(field) => (
                      <NumberField
                        class="w-full"
                        value={field().state.value}
                        onRawValueChange={(e) => field().setValue(e)}
                        minValue={0}
                      >
                        <NumberFieldLabel class="capitalize pl-1">{field().name}</NumberFieldLabel>
                        <NumberFieldGroup>
                          <NumberFieldInput class="h-9" />
                          <NumberFieldIncrementTrigger />
                          <NumberFieldDecrementTrigger />
                        </NumberFieldGroup>
                      </NumberField>
                    )}
                  </form.Field>
                  <form.Field name="maximumStock">
                    {(field) => (
                      <NumberField
                        class="w-full"
                        value={typeof field().state.value !== "boolean" ? field().state.value : null}
                        onRawValueChange={(e) => field().setValue(e)}
                        minValue={0}
                      >
                        <NumberFieldLabel class="capitalize pl-1">{field().name}</NumberFieldLabel>
                        <NumberFieldGroup>
                          <NumberFieldInput class="h-9" />
                          <NumberFieldIncrementTrigger />
                          <NumberFieldDecrementTrigger />
                        </NumberFieldGroup>
                      </NumberField>
                    )}
                  </form.Field>
                </div>
              </TabsContent>
              <TabsContent value="labels">
                <div class="w-full flex flex-col gap-4 py-2">
                  <div class="grid grid-cols-6 gap-4 w-full">
                    <Suspense>
                      <Show when={labels()}>
                        {(labelsList) => (
                          <For
                            each={labelsList()}
                            fallback={
                              <div class="col-span-full w-full flex flex-col gap-2 items-center justify-center bg-muted-foreground/5 rounded-lg p-14 border">
                                <span class="text-muted-foreground text-sm">
                                  There are currently no labels in the system, please contact the administrator.
                                </span>
                                <div class="flex flex-row gap-2 items-center justify-center">
                                  <Button
                                    size="sm"
                                    class="h-8"
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
                                  "bg-muted-foreground/5 rounded-lg p-4 flex flex-col gap-2 items-center justify-center border border-neutral-200 dark:border-neutral-800 select-none cursor-pointer",
                                  {
                                    "text-white bg-indigo-600 font-medium hover:bg-indigo-600": chosenLabels().includes(
                                      label.id,
                                    ),
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
                                <Show when={(label.image?.length ?? 0) > 0 && label.image}>
                                  {(i) => <img src={i()} class="size-40 rounded-lg" />}
                                </Show>
                                <span class="text-sm font-medium">{label.name}</span>
                                <span
                                  class={cn("text-sm text-muted-foreground text-center", {
                                    "text-white/70": chosenLabels().includes(label.id),
                                  })}
                                >
                                  {label.description ?? "No description available"}
                                </span>
                              </div>
                            )}
                          </For>
                        )}
                      </Show>
                    </Suspense>
                    <Button
                      size="sm"
                      class="h-8 w-max"
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
              <TabsContent value="suppliers">
                <div class="w-full flex flex-col gap-4 max-w-2xl py-2">
                  <div class="grid grid-cols-6 gap-4">
                    <Suspense>
                      <Show when={suppliers()}>
                        {(suppliersList) => (
                          <For
                            each={suppliersList()}
                            fallback={
                              <div class="col-span-full w-full flex flex-col gap-2 items-center justify-center bg-muted-foreground/5 rounded-lg p-14 border">
                                <span class="text-muted-foreground text-sm">You don't have any suppliers</span>
                                <div class="flex flex-row gap-2 items-center justify-center">
                                  <Button
                                    size="sm"
                                    class="h-8"
                                    onClick={() => {
                                      toast.promise(revalidate(getSuppliersByWarehouseId.keyFor(params.whid)), {
                                        loading: "Refreshing suppliers...",
                                        success: "Suppliers refreshed",
                                        error: "Failed to refresh suppliers",
                                      });
                                    }}
                                  >
                                    <RotateCw class="size-4" />
                                    Refresh
                                  </Button>
                                  <Button size="sm" class="h-8" as={A} href="/suppliers">
                                    <Plus class="size-4" />
                                    Add Supplier
                                  </Button>
                                </div>
                              </div>
                            }
                          >
                            {(s) => <div class="bg-muted-foreground/5 rounded-lg p-4">{s.supplier.name}</div>}
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

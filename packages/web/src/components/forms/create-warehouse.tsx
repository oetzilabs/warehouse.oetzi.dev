import { Button } from "@/components/ui/button";
import {
  TextField,
  TextFieldErrorMessage,
  TextFieldInput,
  TextFieldLabel,
  TextFieldTextArea,
} from "@/components/ui/text-field";
import { getTypes } from "@/lib/api/warehouses";
import { createAsync } from "@solidjs/router";
import { clientOnly } from "@solidjs/start";
import { createForm } from "@tanstack/solid-form";
import Check from "lucide-solid/icons/check";
import ChevronLeft from "lucide-solid/icons/chevron-left";
import ChevronRight from "lucide-solid/icons/chevron-right";
import Loader2 from "lucide-solid/icons/loader-2";
import { createEffect, createSignal, For, JSXElement, onMount, Show, Suspense } from "solid-js";
import { toast } from "solid-sonner";
import { minLength, pipe, string } from "valibot";
import { Skeleton } from "../ui/skeleton";

const warehouseForm = createForm(() => ({
  defaultValues: {
    // warehouse_type (id)
    warehouse_type_id: "",
    name: "",
    description: "",
    address: "",
    latitude: 0,
    longitude: 0,
  },
}));

export type CreateWarehouseFormProps = {
  onSubmit: (values: typeof warehouseForm.state.values) => void;
  disabled?: boolean;
  showMap: (lat: number, lon: number) => void;
  hideMap: () => void;
};

type AddressResult = {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  class: string;
  type: string;
  place_rank: number;
  importance: number;
  addresstype: string;
  name: string;
  display_name: string;
  address: {
    house_number: string;
    road: string;
    village: string;
    municipality?: string;
    county: string;
    state: string;
    "ISO3166-2-lvl4": string;
    postcode: string;
    country: string;
    country_code: string;
    town?: string;
  };
  boundingbox: Array<string>;
};

type StepComponentProps = {
  goto: (name: string) => void;
};

// Basic Information Step Component
const BasicInfoStep = (props: StepComponentProps) => {
  return (
    <div class="flex flex-col gap-4">
      <warehouseForm.Field
        name="name"
        validators={{
          // onChange: pipe(string(), minLength(3)),
          onBlur: pipe(string(), minLength(3, "Please enter a name for your warehouse with at least 3 characters.")),
        }}
        children={(field) => (
          <TextField
            value={field().state.value}
            onChange={(value) => field().setValue(() => value)}
            name={field().name}
            validationState={field().state.meta.isValid ? "valid" : "invalid"}
          >
            <TextFieldLabel>
              Warehouse Name <span class="text-red-500">*</span>
            </TextFieldLabel>
            <TextFieldInput placeholder="Main Warehouse" onBlur={field().handleBlur} />
            <Show when={!field().state.meta.isValid}>
              <TextFieldErrorMessage>{field().state.meta.errors[0]?.message}</TextFieldErrorMessage>
            </Show>
          </TextField>
        )}
      />
      <warehouseForm.Field
        name="description"
        validators={{
          // onChange: pipe(string(), minLength(3)),
          onBlur: string(),
        }}
        children={(field) => (
          <TextField
            value={field().state.value}
            onChange={(value) => field().setValue(() => value)}
            name={field().name}
          >
            <TextFieldLabel>Description</TextFieldLabel>
            <TextFieldTextArea placeholder="Description of your warehouse" autoResize />
          </TextField>
        )}
      />
    </div>
  );
};

const LocationStep = (
  props: StepComponentProps & {
    showMap: (lat: number, lon: number) => void;
    hideMap: () => void;
  },
) => {
  const [addressResults, setAddressResults] = createSignal<AddressResult[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = createSignal(false);

  // Effect to clear results when address input is cleared
  createEffect(() => {
    if (warehouseForm.state.values.address.length === 0) {
      setAddressResults([]);
    }
  });

  const checkAddress = async (address: string) => {
    if (address.length === 0) {
      setAddressResults([]);
      return;
    }
    setIsSearchingAddress(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${address}&format=json&addressdetails=1`;
      const response = await fetch(url);
      const data: AddressResult[] = await response.json();
      if (data.length > 0) {
        setAddressResults(data);
      } else {
        toast.error(`Error fetching geolocation data: No results found`);
        setAddressResults([]);
      }
    } catch (e) {
      toast.error(`Error fetching geolocation data: ${e}`);
      setAddressResults([]);
    } finally {
      setIsSearchingAddress(false);
    }
  };

  return (
    <div class="flex flex-col gap-4 w-full">
      <warehouseForm.Field
        name="address"
        validators={{ onChange: string() }}
        children={(field) => (
          <TextField
            onChange={(value) => field().setValue(() => value)}
            value={field().state.value}
            class="w-full"
            name={field().name}
            validationState={field().state.meta.isValid ? "valid" : "invalid"}
          >
            <TextFieldLabel>
              Address <span class="text-red-500">*</span>
            </TextFieldLabel>
            <TextFieldInput
              value={field().state.value}
              placeholder="123 Warehouse St."
              class="w-full"
              onBlur={field().handleBlur}
            />
            <TextFieldErrorMessage>{field().state.meta.errors[0]?.message}</TextFieldErrorMessage>
          </TextField>
        )}
        listeners={{
          onBlur: (props) => checkAddress(props.value),
          onBlurDebounceMs: 500,
          onChange: (props) => checkAddress(props.value),
          onChangeDebounceMs: 500,
        }}
      />
      <Show when={isSearchingAddress()}>
        <div class="flex items-center gap-2 text-muted-foreground w-full justify-center">
          <Loader2 class="size-4 animate-spin" />
          <span class="text-sm text-muted-foreground">Searching for address...</span>
        </div>
      </Show>
      <Show when={addressResults().length > 0}>
        <div class="flex flex-col rounded-md border max-h-[300px] overflow-y-auto w-full">
          <For each={addressResults()}>
            {(result) => (
              <div class="flex flex-row gap-2 items-center justify-center p-2 border-b last-of-type:border-b-0 hover:bg-muted/10 w-full">
                <div class="flex flex-col gap-1 w-full">
                  <span class="text-xs ">{result.display_name}</span>
                </div>
                <warehouseForm.Subscribe
                  selector={(state) => ({
                    latitude: state.values.latitude,
                    longitude: state.values.longitude,
                  })}
                >
                  {(state) => (
                    <Button
                      size="sm"
                      variant={
                        state().latitude === Number(result.lat) && state().longitude === Number(result.lon)
                          ? "default"
                          : "outline"
                      }
                      onClick={() => {
                        const isSame =
                          state().latitude === Number(result.lat) && state().longitude === Number(result.lon);
                        if (isSame) {
                          warehouseForm.setFieldValue("latitude", () => 0);
                          warehouseForm.setFieldValue("longitude", () => 0);
                          props.hideMap();
                        } else {
                          warehouseForm.setFieldValue("latitude", () => Number(result.lat));
                          warehouseForm.setFieldValue("longitude", () => Number(result.lon));
                          props.showMap(warehouseForm.state.values.latitude, warehouseForm.state.values.longitude);
                        }
                      }}
                      class="w-10"
                    >
                      <Show
                        when={state().latitude === Number(result.lat) && state().longitude === Number(result.lon)}
                        fallback="Use"
                      >
                        <Check class="size-4" />
                      </Show>
                    </Button>
                  )}
                </warehouseForm.Subscribe>
              </div>
            )}
          </For>
        </div>
      </Show>
      {/* <warehouseForm.Subscribe
        selector={(state) => ({
          latitude: state.values.latitude,
          longitude: state.values.longitude,
        })}
      >
        {(state) => (
          <Show when={state().latitude !== 0 || state().longitude !== 0}>
            
          </Show>
        )}
      </warehouseForm.Subscribe> */}
    </div>
  );
};

const ChooseFromTemplateStep = (props: StepComponentProps) => {
  const wareHouseTypes = createAsync(() => getTypes(), { deferStream: true });

  return (
    <div class="flex flex-col gap-4 w-full">
      <span class="text-sm text-muted-foreground opacity-80">You can choose from a pre-configured template.</span>
      <div class="flex flex-col gap-2 w-full max-h-[450px] overflow-y-auto">
        <Suspense
          fallback={
            <div class="flex flex-col gap-4">
              <Skeleton class="w-full h-16" />
              <Skeleton class="w-full h-16" />
              <Skeleton class="w-full h-16" />
              <Skeleton class="w-full h-16" />
            </div>
          }
        >
          <Show when={wareHouseTypes()}>
            {(types) => (
              <For
                each={types()}
                fallback={
                  <div class="w-full flex flex-col gap-1 items-center justify-center bg-muted border p-4 rounded-md">
                    <span class="text-sm text-muted-foreground opacity-80">No templates available.</span>
                    <span class="text-sm text-muted-foreground opacity-50">
                      Contact your administrator to create a new one.
                    </span>
                  </div>
                }
              >
                {(type) => (
                  <div class="flex flex-row gap-2 items-center justify-center p-2 border rounded-md">
                    <div class="flex flex-col gap-1 w-full">
                      <div class="flex flex-row items-center justify-between gap-2 w-full">
                        <div class="flex flex-col gap-1 w-full">
                          <span class="text-xs ">
                            {type.name} ({type.code})
                          </span>
                          <span class="text-xs text-muted-foreground opacity-80">
                            {type.description ?? "No description"}
                          </span>
                        </div>
                        <warehouseForm.Subscribe
                          selector={(state) => ({
                            wh_type_id: state.values.warehouse_type_id,
                          })}
                        >
                          {(state) => (
                            <Button
                              size={type.id === state().wh_type_id ? "icon" : "sm"}
                              variant={type.id === state().wh_type_id ? "default" : "secondary"}
                              class="place-self-end size-8 p-2"
                              onClick={() => {
                                // toggle
                                const wh_type_id = type.id === state().wh_type_id ? "" : type.id;
                                warehouseForm.setFieldValue("warehouse_type_id", () => wh_type_id);
                              }}
                            >
                              <Show when={type.id === state().wh_type_id} fallback="Use">
                                <Check class="size-4" />
                              </Show>
                            </Button>
                          )}
                        </warehouseForm.Subscribe>
                      </div>

                      <Show when={type.image} fallback={<div class="w-full h-40 bg-muted rounded-sm" />}>
                        {(i) => <img src={i()} class="w-full h-40 object-cover rounded-sm overflow-clip" />}
                      </Show>
                    </div>
                  </div>
                )}
              </For>
            )}
          </Show>
        </Suspense>
      </div>
      <div class="flex flex-row gap-4 w-full justify-between items-center">
        <span class="text-sm text-muted-foreground opacity-80">Or you can create a new one from scratch.</span>
        <warehouseForm.Subscribe
          selector={(state) => ({
            wh_type_id: state.values.warehouse_type_id !== "",
          })}
        >
          {(state) => (
            <Button
              size="sm"
              variant="secondary"
              class="w-max"
              onClick={() => props.goto("advanced-storage")}
              disabled={state().wh_type_id}
            >
              Advanced Setup
            </Button>
          )}
        </warehouseForm.Subscribe>
      </div>
    </div>
  );
};

const StorageConfigStep = (props: StepComponentProps) => {
  return (
    <div class="flex flex-col gap-4">
      <span class="text-sm text-muted-foreground opacity-80">This configuration is not implemented yet.</span>
    </div>
  );
};

const OverviewStep = (props: StepComponentProps) => {
  return (
    <div class="flex flex-col gap-4">
      <span class="text-sm text-muted-foreground opacity-80">This configuration is not implemented yet.</span>
    </div>
  );
};

export default function CreateWarehouseForm(props: CreateWarehouseFormProps) {
  const [step, setStep] = createSignal(0);

  const goto = <Name extends (typeof steps)[number]["name"]>(name: Name) => {
    setStep(steps.findIndex((step) => step.name === name));
  };

  const steps = [
    {
      name: "basic",
      title: "Basic Information",
      component: <BasicInfoStep goto={goto} />,
      next: "location",
    },
    {
      name: "location",
      title: "Location",
      component: <LocationStep goto={goto} showMap={props.showMap} hideMap={props.hideMap} />,
      next: "choose-from-template",
      prev: "basic",
    },
    {
      name: "choose-from-template",
      title: "Choose from Template",
      component: <ChooseFromTemplateStep goto={goto} />,
      next: "overview",
      prev: "location",
    },
    {
      name: "advanced-storage",
      title: "Advanced Storage",
      component: <StorageConfigStep goto={goto} />,
      next: "overview",
      prev: "choose-from-template",
    },
    {
      name: "overview",
      title: "Overview",
      component: <OverviewStep goto={goto} />,
      prev: "choose-from-template",
    },
  ];

  const currentStepComponent = () => steps[step()].component;

  return (
    <form class="w-full flex flex-col gap-4 grow">
      <div class="text-lg font-semibold">{steps[step()].title}</div>
      <Suspense
        fallback={
          <div class="flex flex-col gap-4 w-full bg-muted border p-4 rounded-md">
            <Loader2 class="size-4 animate-spin" />
          </div>
        }
      >
        {currentStepComponent()}
      </Suspense>
      <div class="flex grow w-full" />
      <div class="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            const prevStep = steps[step()].prev;
            if (!prevStep) {
              setStep(step() - 1);
            } else {
              const prevStepIndex = steps.findIndex((s) => s.name === prevStep);
              setStep(prevStepIndex);
            }
          }}
          disabled={step() === 0}
        >
          <ChevronLeft class="size-4" />
          Back
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={props.disabled || warehouseForm.state.isSubmitting}
          onClick={() => {
            warehouseForm.validateAllFields("submit").then((fieldErrors) => {
              if (fieldErrors.length === 0) {
                if (step() === steps.length - 1) {
                  props.onSubmit(warehouseForm.state.values);
                } else {
                  const nextStep = steps[step()].next;
                  if (!nextStep) {
                    setStep(step() + 1);
                  } else {
                    const nextStepIndex = steps.findIndex((s) => s.name === nextStep);
                    setStep(nextStepIndex);
                  }
                }
              } else {
                toast.error("Please fix the errors in the current step.");
              }
            });
          }}
        >
          <Show
            when={step() === steps.length - 1}
            fallback={
              <>
                Next
                <ChevronRight class="size-4" />
              </>
            }
          >
            <Show
              when={!warehouseForm.state.isSubmitting}
              fallback={
                <>
                  <Loader2 class="size-4 animate-spin" />
                  Creating...
                </>
              }
            >
              Create Warehouse
            </Show>
          </Show>
        </Button>
      </div>
    </form>
  );
}

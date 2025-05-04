import { Button } from "@/components/ui/button";
import {
  NumberField,
  NumberFieldDecrementTrigger,
  NumberFieldGroup,
  NumberFieldIncrementTrigger,
  NumberFieldInput,
  NumberFieldLabel,
} from "@/components/ui/number-field";
import { TextField, TextFieldInput, TextFieldLabel, TextFieldTextArea } from "@/components/ui/text-field";
import { clientOnly } from "@solidjs/start";
import { createForm } from "@tanstack/solid-form";
import Check from "lucide-solid/icons/check";
import ChevronLeft from "lucide-solid/icons/chevron-left";
import ChevronRight from "lucide-solid/icons/chevron-right";
import Loader2 from "lucide-solid/icons/loader-2";
import { createEffect, createSignal, For, Show } from "solid-js";
import { toast } from "solid-sonner";
import { minLength, number, pipe, string } from "valibot";

const CMap = clientOnly(() => import("@/components/ClientMap"));

export type CreateWarehouseFormProps = {
  onSubmit: (values: any) => void;
  disabled?: boolean;
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

export default function CreateWarehouseForm(props: CreateWarehouseFormProps) {
  const [step, setStep] = createSignal(0);
  const form = createForm(() => ({
    defaultValues: {
      name: "",
      description: "",
      address: "",
      latitude: 0,
      longitude: 0,
    },
  }));

  const [coords, setCoords] = createSignal<[number, number]>([0, 0]);

  const [addressResults, setAddressResults] = createSignal<AddressResult[]>([]);

  createEffect(() => {
    if (form.state.values.address.length === 0) {
      setAddressResults([]);
    }
  });

  const isSameCoords = (lat: string, lon: string) => {
    return coords()[0] === Number(lat) && coords()[1] === Number(lon);
  };

  const checkAddress = (address: string) => {
    // fetch geolocation data form nominatim
    const url = `https://nominatim.openstreetmap.org/search?q=${address}&format=json&addressdetails=1`;
    fetch(url)
      .then((response) => response.json())
      .then((data: AddressResult[]) => {
        if (data.length > 0) {
          setAddressResults(data);
        } else {
          toast.error(`Error fetching geolocation data: No results found`);
        }
      })
      .catch((e) => {
        toast.error(`Error fetching geolocation data: ${e}`);
      });
  };

  const steps = [
    {
      title: "Basic Information",
      component: (
        <div class="flex flex-col gap-4">
          <form.Field
            name="name"
            validators={{ onChange: pipe(string(), minLength(3)) }}
            children={(field) => (
              <TextField value={field().state.value} onChange={(e) => field().setValue(e)}>
                <TextFieldLabel>
                  Warehouse Name <span class="text-red-500">*</span>
                </TextFieldLabel>
                <TextFieldInput placeholder="Main Warehouse" />
              </TextField>
            )}
          />
          <form.Field
            name="description"
            children={(field) => (
              <TextField value={field().state.value} onChange={(e) => field().setValue(e)}>
                <TextFieldLabel>Description</TextFieldLabel>
                <TextFieldTextArea placeholder="Description of your warehouse" autoResize />
              </TextField>
            )}
          />
        </div>
      ),
    },
    {
      title: "Location",
      component: (
        <div class="flex flex-col gap-4 w-full">
          <form.Field
            name="address"
            validators={{ onChange: pipe(string(), minLength(5)) }}
            children={(field) => (
              <TextField onChange={(e) => field().setValue(e)} class="w-full">
                <TextFieldLabel>
                  Address <span class="text-red-500">*</span>
                </TextFieldLabel>
                <TextFieldInput value={field().state.value} placeholder="123 Warehouse St." class="w-full" />
              </TextField>
            )}
            listeners={{
              onBlur: (props) => {
                checkAddress(props.value);
              },
              onBlurDebounceMs: 500,
              onChange: (props) => {
                checkAddress(props.value);
              },
              onChangeDebounceMs: 500,
            }}
          />
          <Show when={addressResults().length > 0}>
            <div class="flex flex-col rounded-md border max-h-[300px] overflow-y-auto w-full">
              <For each={addressResults()}>
                {(result) => (
                  <div class="flex flex-row gap-2 items-center justify-center p-2 border-b last-of-type:border-b-0 hover:bg-muted/10 w-full">
                    <div class="flex flex-col gap-1 w-full">
                      <span class="text-xs ">{result.display_name}</span>
                    </div>
                    <Button
                      size="sm"
                      variant={isSameCoords(result.lat, result.lon) ? "default" : "outline"}
                      onClick={() => {
                        if (isSameCoords(result.lat, result.lon)) {
                          setCoords([0, 0]);
                        } else {
                          setCoords([Number(result.lat), Number(result.lon)]);
                        }
                      }}
                      class="w-10"
                    >
                      <Show when={isSameCoords(result.lat, result.lon)} fallback="Use">
                        <Check class="size-4" />
                      </Show>
                    </Button>
                  </div>
                )}
              </For>
            </div>
          </Show>
          <form.Subscribe
            selector={(state) => ({
              visible: state.isDirty,
            })}
          >
            {(state) => (
              <div class="w-full aspect-square">
                <CMap coords={coords} visible={() => state().visible && !isSameCoords("0", "0")} />
              </div>
            )}
          </form.Subscribe>
        </div>
      ),
    },
    {
      title: "Storage Configuration",
      component: (
        <div class="flex flex-col gap-4">
          <span class="text-sm text-muted-foreground opacity-80">This configuration is not implemented yet.</span>
        </div>
      ),
    },
  ];

  return (
    <form
      class="w-full flex flex-col gap-4 grow"
      onSubmit={(e) => {
        e.preventDefault();
        if (step() === steps.length - 1) {
          form.handleSubmit();
        } else {
          setStep(step() + 1);
        }
      }}
    >
      <div class="text-lg font-semibold">{steps[step()].title}</div>
      {steps[step()].component}
      <div class="flex grow w-full" />
      <div class="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => setStep(step() - 1)} disabled={step() === 0}>
          <ChevronLeft class="size-4" />
          Back
        </Button>
        <Button
          size="sm"
          type="button"
          disabled={props.disabled}
          onClick={() => {
            if (step() === steps.length - 1) {
              props.onSubmit(form.state.values);
            } else {
              setStep(step() + 1);
            }
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
              when={!props.disabled}
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

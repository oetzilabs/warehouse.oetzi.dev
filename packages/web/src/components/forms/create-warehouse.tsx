import { Button } from "@/components/ui/button";
import {
  TextField,
  TextFieldErrorMessage,
  TextFieldInput,
  TextFieldLabel,
  TextFieldTextArea,
} from "@/components/ui/text-field";
import { debounce } from "@solid-primitives/scheduled";
import { createForm } from "@tanstack/solid-form";
import Check from "lucide-solid/icons/check";
import Loader2 from "lucide-solid/icons/loader-2";
import { createEffect, createMemo, createSignal, For, Show } from "solid-js";
import { toast } from "solid-sonner";
import { minLength, pipe, set, string } from "valibot";

const warehouseForm = createForm(() => ({
  defaultValues: {
    // warehouse_type (id)
    warehouse_type_id: "",
    name: "",
    description: "",
    address: {
      street: "",
      house_number: "",
      additional: "",
      postal_code: "",
      city: "",
      state: "",
      country: "",
      lat: 0,
      lon: 0,
    },
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

export default function CreateWarehouseForm(props: CreateWarehouseFormProps) {
  const [addressResults, setAddressResults] = createSignal<AddressResult[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = createSignal(false);
  const [input, setInput] = createSignal("");
  const [debouncedI, setDebouncedInput] = createSignal("");

  const debouncedInput = debounce((message: string) => setDebouncedInput(message), 500);

  // Effect to clear results and hide map when address input is cleared
  createEffect(() => {
    // Access the nested address field value
    if (debouncedI() === "") {
      setAddressResults([]);
      props.hideMap(); // Hide map when address is cleared
    } else {
      checkAddress(input());
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
    <form
      class="w-full flex flex-col gap-4 grow"
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        props.onSubmit(warehouseForm.state.values);
      }}
    >
      <div class="text-lg font-semibold">Warehouse Information</div>
      <div class="flex flex-col gap-4">
        <warehouseForm.Field
          name="name"
          validators={{
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

        {/* Update the name to address.street or similar if needed, based on your final address structure */}
        {/* For now, assuming the address TextField is for the full address string search */}
        <TextField
          onChange={(v) => {
            setInput(v);
            debouncedInput(v);
          }}
          value={input()}
          class="w-full"
        >
          <TextFieldLabel>
            Search Address <span class="text-red-500">*</span>
          </TextFieldLabel>
          <TextFieldInput placeholder="123 Warehouse St." class="w-full" />
        </TextField>
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
                  {/* Subscribe to the nested lat_lon field */}
                  <warehouseForm.Subscribe selector={(state) => [state.values.address.lat, state.values.address.lon]}>
                    {(latLon) => (
                      <Button
                        size="sm"
                        type="button"
                        variant={
                          latLon()[0] === Number(result.lat) && latLon()[1] === Number(result.lon)
                            ? "default"
                            : "outline"
                        }
                        onClick={() => {
                          const isSame = latLon()[0] === Number(result.lat) && latLon()[1] === Number(result.lon);
                          if (isSame) {
                            // Set lat_lon back to default [0, 0]
                            warehouseForm.setFieldValue("address.lat", () => 0);
                            warehouseForm.setFieldValue("address.lon", () => 0);
                            props.hideMap();
                          } else {
                            // Set the selected lat_lon
                            warehouseForm.setFieldValue("address.lat", () => Number(result.lat));
                            warehouseForm.setFieldValue("address.lon", () => Number(result.lon));
                            warehouseForm.setFieldValue(
                              "address.city",
                              () => result.address.town ?? result.address.village,
                            );
                            warehouseForm.setFieldValue("address.country", () => result.address.country);
                            warehouseForm.setFieldValue("address.house_number", () => result.address.house_number);
                            warehouseForm.setFieldValue("address.postal_code", () => result.address.postcode);
                            warehouseForm.setFieldValue("address.state", () => result.address.state);
                            warehouseForm.setFieldValue("address.street", () => result.display_name);
                            warehouseForm.setFieldValue("address.additional", () => result.type);

                            // Pass the new lat_lon to showMap
                            props.showMap(Number(result.lat), Number(result.lon));
                          }
                        }}
                        class="w-10"
                      >
                        <Show
                          when={latLon()[0] === Number(result.lat) && latLon()[1] === Number(result.lon)}
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
      </div>
      <div class="flex grow w-full" />
      <div class="flex justify-end gap-2">
        <Button type="submit" size="sm" disabled={props.disabled}>
          <Show
            when={!props.disabled}
            fallback={
              <>
                Creating...
                <Loader2 class="size-4 animate-spin" />
              </>
            }
          >
            Create Warehouse
          </Show>
        </Button>
      </div>
    </form>
  );
}

import { Button } from "@/components/ui/button";
import {
  NumberField,
  NumberFieldDecrementTrigger,
  NumberFieldGroup,
  NumberFieldIncrementTrigger,
  NumberFieldInput,
} from "@/components/ui/number-field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { TextField, TextFieldInput } from "@/components/ui/text-field";
import { createAreaMatchingFacility, getAreas } from "@/lib/api/areas";
import { addStorage, getStorageTypes } from "@/lib/api/storages";
import { A, createAsync, useAction, useSubmission } from "@solidjs/router";
import { createForm, formOptions } from "@tanstack/solid-form";
import ArrowLeft from "lucide-solid/icons/arrow-left";
import Loader2 from "lucide-solid/icons/loader-2";
import Plus from "lucide-solid/icons/plus";
import { Show, Suspense } from "solid-js";
import { toast } from "solid-sonner";

export default function NewStoragePage() {
  return (
    <div class="container flex flex-row grow py-0">
      <div class="w-full flex flex-col gap-4">
        <div class="sticky top-12 z-10 flex items-center gap-4 justify-between w-full bg-background pb-4">
          <div class="flex items-center gap-4">
            <Button size="sm" variant="outline" class="bg-background" as={A} href="/storages" type="button">
              <ArrowLeft class="size-4" />
              Storages
            </Button>
            <h1 class="font-semibold leading-none">New Storage</h1>
          </div>
        </div>
        <Form />
      </div>
    </div>
  );
}

const formOpts = formOptions({
  defaultValues: {
    name: "",
    description: "",
    bounding_box: {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      depth: 0,
    },
    capacity: 0,
    barcode: "",
    typeId: "",
    warehouseAreaId: "",
  },
});

const Form = () => {
  const addStorageAction = useAction(addStorage);
  const isAddingStorage = useSubmission(addStorage);

  const storageTypes = createAsync(() => getStorageTypes(), { deferStream: true });
  const areas = createAsync(() => getAreas(), { deferStream: true });

  const createAreaAction = useAction(createAreaMatchingFacility);
  const isCreatingArea = useSubmission(createAreaMatchingFacility);

  const form = createForm(() => ({
    ...formOpts,
    onSubmit: async ({ value }) => {
      // Always submit x/y as 0
      value.bounding_box.x = 0;
      value.bounding_box.y = 0;
      toast.promise(addStorageAction(value), {
        loading: "Adding storage...",
        success: "Storage added",
        error: "Failed to add storage",
      });
    },
  }));

  const variantOptions = [
    { value: "horizontal", label: "Horizontal" },
    { value: "vertical", label: "Vertical" },
  ];

  return (
    <form
      class="w-full grow flex flex-col gap-6 pb-10"
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <form.Field
        name="name"
        validators={{
          onChange: ({ value }) => (!value ? "Name is required" : undefined),
        }}
      >
        {(field) => (
          <TextField>
            <label for={field().name} class="block font-medium mb-1">
              Name
            </label>
            <TextFieldInput
              id={field().name}
              name={field().name}
              value={field().state.value}
              onBlur={field().handleBlur}
              onInput={(e) => field().handleChange(e.currentTarget.value)}
              required
            />
            <Show when={field().state.meta.errors[0]}>
              <p class="text-red-500 text-sm">{field().state.meta.errors[0]}</p>
            </Show>
          </TextField>
        )}
      </form.Field>

      <form.Field name="description">
        {(field) => (
          <TextField>
            <label for={field().name} class="block font-medium mb-1">
              Description
            </label>
            <TextFieldInput
              as="textarea"
              id={field().name}
              name={field().name}
              value={field().state.value}
              onBlur={field().handleBlur}
              onInput={(e) => field().handleChange(e.currentTarget.value)}
              rows={2}
            />
          </TextField>
        )}
      </form.Field>
      <Suspense fallback={<Skeleton class="w-full h-9" />}>
        <Show when={storageTypes()}>
          {(types) => (
            <form.Field
              name="typeId"
              validators={{
                onChange: ({ value }) => (!value ? "Type is required" : undefined),
              }}
            >
              {(field) => (
                <div>
                  <label class="block font-medium mb-1">Type</label>
                  <Select
                    value={field().state.value}
                    onChange={(value) => {
                      if (!value) return;
                      field().handleChange(value);
                    }}
                    options={types().map((t) => t.id)}
                    placeholder="Select a type…"
                    itemComponent={(props) => {
                      const opt = types().find((t) => t.id === props.item.rawValue);
                      return <SelectItem item={props.item}>{opt?.name ?? props.item.rawValue}</SelectItem>;
                    }}
                  >
                    <SelectTrigger aria-label="Type" class="w-full">
                      <SelectValue<string>>
                        {(state) => {
                          const opt = types().find((t) => t.id === state.selectedOption());
                          return opt?.name ?? "Select a type…";
                        }}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent />
                  </Select>
                  <Show when={field().state.meta.errors[0]}>
                    <p class="text-red-500 text-sm">{field().state.meta.errors[0]}</p>
                  </Show>
                </div>
              )}
            </form.Field>
          )}
        </Show>
      </Suspense>
      <Suspense fallback={<Skeleton class="w-full h-9" />}>
        <Show when={areas()}>
          {(_areas) => (
            <Show
              when={_areas().length > 0}
              fallback={
                <div class="flex flex-col items-center justify-center gap-4 w-full border rounded-lg background-muted-foreground/5 dark:background-muted/30 p-10">
                  <span class="text-sm text-muted-foreground">No areas have been created yet.</span>
                  <Button
                    size="sm"
                    // this button should create a new area for the facility (same size as the facility, for now)
                    type="button"
                    onClick={() => {
                      toast.promise(createAreaAction(), {
                        loading: "Creating area...",
                        success: "Area created",
                        error: "Failed to create area",
                      });
                    }}
                    disabled={isCreatingArea.pending}
                  >
                    <Show
                      when={isCreatingArea.pending}
                      fallback={
                        <>
                          <Plus class="size-4" />
                          Create Area
                        </>
                      }
                    >
                      <Loader2 class="size-4 animate-spin" />
                      <span class="sr-only md:not-sr-only">Creating</span>
                    </Show>
                  </Button>
                </div>
              }
            >
              <form.Field
                name="warehouseAreaId"
                validators={{
                  onChange: ({ value }) => (!value ? "Warehouse Area is required" : undefined),
                }}
              >
                {(field) => (
                  <div>
                    <label class="block font-medium mb-1">Warehouse Area</label>
                    <Select
                      value={field().state.value}
                      onChange={(value) => {
                        if (!value) return;
                        field().handleChange(value);
                      }}
                      options={_areas().map((o) => o.area.id)}
                      placeholder="Select a warehouse…"
                      itemComponent={(props) => {
                        const opt = _areas().find((o) => o.area.id === props.item.rawValue);
                        return (
                          <SelectItem class="capitalize" item={props.item}>
                            {opt?.area.name ?? props.item.rawValue}
                          </SelectItem>
                        );
                      }}
                    >
                      <SelectTrigger aria-label="Warehouse" class="w-full">
                        <SelectValue<string>>
                          {(state) => {
                            const opt = _areas().find((o) => o.area.id === state.selectedOption());
                            return opt?.area.name ?? "Select a warehouse…";
                          }}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent />
                    </Select>
                    <Show when={field().state.meta.errors[0]}>
                      <p class="text-red-500 text-sm">{field().state.meta.errors[0]}</p>
                    </Show>
                  </div>
                )}
              </form.Field>
            </Show>
          )}
        </Show>
      </Suspense>

      <div class="grid grid-cols-3 gap-4">
        <form.Field name="bounding_box.width">
          {(field) => (
            <NumberField class="w-full" value={field().state.value} onRawValueChange={field().handleChange}>
              <label for={field().name} class="block font-medium mb-1">
                Width
              </label>
              <NumberFieldGroup>
                <NumberFieldInput id={field().name} name={field().name} onBlur={field().handleBlur} />
                <NumberFieldIncrementTrigger />
                <NumberFieldDecrementTrigger />
              </NumberFieldGroup>
            </NumberField>
          )}
        </form.Field>
        <form.Field name="bounding_box.height">
          {(field) => (
            <NumberField class="w-full" value={field().state.value} onRawValueChange={field().handleChange}>
              <label for={field().name} class="block font-medium mb-1">
                Height
              </label>
              <NumberFieldGroup>
                <NumberFieldInput id={field().name} name={field().name} onBlur={field().handleBlur} />
                <NumberFieldIncrementTrigger />
                <NumberFieldDecrementTrigger />
              </NumberFieldGroup>
            </NumberField>
          )}
        </form.Field>
        <form.Field name="bounding_box.depth">
          {(field) => (
            <NumberField class="w-full" value={field().state.value} onRawValueChange={field().handleChange}>
              <label for={field().name} class="block font-medium mb-1">
                Depth
              </label>
              <NumberFieldGroup>
                <NumberFieldInput id={field().name} name={field().name} onBlur={field().handleBlur} />
                <NumberFieldIncrementTrigger />
                <NumberFieldDecrementTrigger />
              </NumberFieldGroup>
            </NumberField>
          )}
        </form.Field>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <form.Field name="capacity">
          {(field) => (
            <NumberField class="w-full" value={field().state.value} onRawValueChange={field().handleChange}>
              <label for={field().name} class="block font-medium mb-1">
                Capacity
              </label>
              <NumberFieldGroup>
                <NumberFieldInput id={field().name} name={field().name} onBlur={field().handleBlur} />
                <NumberFieldIncrementTrigger />
                <NumberFieldDecrementTrigger />
              </NumberFieldGroup>
            </NumberField>
          )}
        </form.Field>
        <form.Field name="barcode">
          {(field) => (
            <TextField>
              <label for={field().name} class="block font-medium mb-1">
                Barcode
              </label>
              <TextFieldInput
                id={field().name}
                name={field().name}
                value={field().state.value}
                onBlur={field().handleBlur}
                onInput={(e) => field().handleChange(e.currentTarget.value)}
              />
            </TextField>
          )}
        </form.Field>
      </div>

      <Button type="submit" size="sm" disabled={isAddingStorage.pending} class="w-max">
        <Show
          when={isAddingStorage.pending}
          fallback={
            <>
              <Plus class="size-4" />
              Add
            </>
          }
        >
          <Loader2 class="size-4 animate-spin" />
          Adding
        </Show>
      </Button>
    </form>
  );
};

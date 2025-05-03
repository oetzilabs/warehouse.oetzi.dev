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
import { createForm } from "@tanstack/solid-form";
import ChevronLeft from "lucide-solid/icons/chevron-left";
import ChevronRight from "lucide-solid/icons/chevron-right";
import Loader2 from "lucide-solid/icons/loader-2";
import { createSignal, Show } from "solid-js";
import { minLength, number, pipe, string } from "valibot";
import { Card } from "../ui/card";

export type CreateWarehouseFormProps = {
  onSubmit: (values: any) => void;
  disabled?: boolean;
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
      storageConfig: {
        floors: 1,
        sectionsPerFloor: 1,
        shelvesPerSection: 1,
        boxesPerShelf: 1,
      },
    },
  }));

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
        <div class="flex flex-col gap-4">
          <form.Field
            name="address"
            validators={{ onChange: pipe(string(), minLength(5)) }}
            children={(field) => (
              <TextField onChange={(e) => field().setValue(e)}>
                <TextFieldLabel>
                  Address <span class="text-red-500">*</span>
                </TextFieldLabel>
                <TextFieldInput value={field().state.value} placeholder="123 Warehouse St." />
              </TextField>
            )}
          />
          <Card class="h-[400px] w-full bg-muted">
            {/* Map component will go here */}
            <div class="w-full h-full flex items-center justify-center">Map Component (Coming Soon)</div>
          </Card>
        </div>
      ),
    },
    {
      title: "Storage Configuration",
      component: (
        <div class="flex flex-col gap-4">
          <form.Field
            name="storageConfig.floors"
            validators={{ onChange: pipe(number()) }}
            children={(field) => (
              <div class="flex flex-col gap-1.5">
                <NumberField value={field().state.value} onRawValueChange={(val) => field().setValue(val)}>
                  <NumberFieldLabel>Number of Floors</NumberFieldLabel>
                  <NumberFieldGroup>
                    <NumberFieldInput min={1} />
                    <NumberFieldIncrementTrigger />
                    <NumberFieldDecrementTrigger />
                  </NumberFieldGroup>
                </NumberField>
              </div>
            )}
          />
          <form.Field
            name="storageConfig.sectionsPerFloor"
            validators={{ onChange: pipe(number()) }}
            children={(field) => (
              <div class="flex flex-col gap-1.5">
                <NumberField value={field().state.value} onRawValueChange={(val) => field().setValue(val)}>
                  <NumberFieldLabel>Sections per Floor</NumberFieldLabel>
                  <NumberFieldGroup>
                    <NumberFieldInput min={1} />
                    <NumberFieldIncrementTrigger />
                    <NumberFieldDecrementTrigger />
                  </NumberFieldGroup>
                </NumberField>
              </div>
            )}
          />
          <form.Field
            name="storageConfig.shelvesPerSection"
            validators={{ onChange: pipe(number()) }}
            children={(field) => (
              <div class="flex flex-col gap-1.5">
                <NumberField value={field().state.value} onRawValueChange={(val) => field().setValue(val)}>
                  <NumberFieldLabel>Shelves per Section</NumberFieldLabel>
                  <NumberFieldGroup>
                    <NumberFieldInput min={1} />
                    <NumberFieldIncrementTrigger />
                    <NumberFieldDecrementTrigger />
                  </NumberFieldGroup>
                </NumberField>
              </div>
            )}
          />
          <form.Field
            name="storageConfig.boxesPerShelf"
            validators={{ onChange: pipe(number()) }}
            children={(field) => (
              <div class="flex flex-col gap-1.5">
                <NumberField value={field().state.value} onRawValueChange={(val) => field().setValue(val)}>
                  <NumberFieldLabel>Boxes per Shelf</NumberFieldLabel>
                  <NumberFieldGroup>
                    <NumberFieldInput min={1} />
                    <NumberFieldIncrementTrigger />
                    <NumberFieldDecrementTrigger />
                  </NumberFieldGroup>
                </NumberField>
              </div>
            )}
          />
        </div>
      ),
    },
  ];

  return (
    <form
      class="w-full flex flex-col gap-4"
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

      <div class="flex justify-end grow gap-2">
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

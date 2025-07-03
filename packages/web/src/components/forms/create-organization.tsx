import { Button } from "@/components/ui/button";
import { TextField, TextFieldInput, TextFieldLabel, TextFieldTextArea } from "@/components/ui/text-field";
import { createForm, formOptions } from "@tanstack/solid-form";
import { type OrganizationCreate } from "@warehouseoetzidev/core/src/drizzle/sql/schema";
import ChevronRight from "lucide-solid/icons/chevron-right";
import Loader2 from "lucide-solid/icons/loader-2";
import Save from "lucide-solid/icons/save";
import FileUp from "lucide-solid/icons/upload";
import { Show } from "solid-js";
import { toast } from "solid-sonner";

export type CreateOrganizationFormProps = {
  onSubmit: (values: OrganizationCreate) => void;
  disabled?: boolean;
  defaultValues: OrganizationCreate;
};
export const CreateOrganizationForm = (props: CreateOrganizationFormProps) => {
  const options = formOptions({
    defaultValues: props.defaultValues,
  });
  const form = createForm(() => ({
    ...options,
    onSubmit: (state) => {
      props.onSubmit(state.value);
    },
  }));

  return (
    <form class="w-full flex flex-col gap-2 grow">
      <div class="w-full flex flex-col gap-4 h-content max-h-[600px] overflow-y-auto py-4">
        <form.Field
          name="name"
          children={(field) => (
            <TextField
              id={field().name}
              name={field().name}
              value={field().state.value}
              onChange={(value) => field().setValue(value)}
              onBlur={field().handleBlur}
            >
              <TextFieldLabel>
                Company Name <span class="text-red-500">*</span>
              </TextFieldLabel>
              <TextFieldInput placeholder={props.defaultValues.name} required />
            </TextField>
          )}
        />
        <form.Field
          name="description"
          children={(field) => (
            <TextField
              id={field().name}
              name={field().name}
              value={field().state.value ?? ""}
              onChange={(value) => field().setValue(value)}
              onBlur={field().handleBlur}
            >
              <TextFieldLabel>Description</TextFieldLabel>
              <TextFieldTextArea
                autoResize
                placeholder={`What does ${form.state.values.name.length > 0 ? form.state.values.name : "your company"} do?`}
              />
            </TextField>
          )}
        />
      </div>
      <div class="flex grow w-full" />
      <div class="w-full flex flex-row gap-2 items-center justify-between">
        <div class="w-max flex flex-row gap-2">
          {/* <Button size="sm" variant="outline" type="button">
            <FileUp class="size-4" />
            Import Data
          </Button> */}
        </div>
        <div class="w-max">
          <Button
            size="sm"
            type="button"
            disabled={props.disabled}
            onClick={() => {
              form.handleSubmit();
            }}
          >
            <Show
              when={props.disabled}
              fallback={
                <>
                  Save
                  <Save class="size-4" />
                </>
              }
            >
              <>
                Saving...
                <Loader2 class="size-4" />
              </>
            </Show>
          </Button>
        </div>
      </div>
    </form>
  );
};

import { Button } from "@/components/ui/button";
import { TextField, TextFieldInput, TextFieldLabel, TextFieldTextArea } from "@/components/ui/text-field";
import { createForm } from "@tanstack/solid-form";
import { type DocumentStorageCreate } from "@warehouseoetzidev/core/src/drizzle/sql/schema";
import Loader2 from "lucide-solid/icons/loader-2";
import { Show } from "solid-js";
import { minLength, pipe, string } from "valibot";

export type CreateDocumentStorageFormProps = {
  onSubmit: (values: DocumentStorageCreate) => void;
  disabled?: boolean;
  fallback?: any;
};

export default function CreateDocumentStorageForm(props: CreateDocumentStorageFormProps) {
  const form = createForm(() => ({
    defaultValues: {
      name: "",
      description: "",
    } as DocumentStorageCreate,
  }));

  return (
    <form
      class="w-full flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <div class="flex flex-col gap-4">
        <form.Field
          name="name"
          validators={{ onChange: pipe(string(), minLength(3)) }}
          children={(field) => (
            <TextField value={field().state.value} onChange={(e) => field().setValue(e)}>
              <TextFieldLabel>
                Storage Name <span class="text-red-500">*</span>
              </TextFieldLabel>
              <TextFieldInput placeholder="Main Document Storage" />
            </TextField>
          )}
        />
        <form.Field
          name="description"
          children={(field) => (
            <TextField value={field().state.value} onChange={(e) => field().setValue(e)}>
              <TextFieldLabel>Description</TextFieldLabel>
              <TextFieldTextArea placeholder="Description of your document storage" autoResize />
            </TextField>
          )}
        />
        <form.Field
          name="location"
          children={(field) => (
            <TextField value={field().state.value} onChange={(e) => field().setValue(e)}>
              <TextFieldLabel>Physical Location</TextFieldLabel>
              <TextFieldInput placeholder="e.g. Building A, Room 101" />
            </TextField>
          )}
        />
      </div>

      <div class="flex justify-end grow gap-2">
        <Button
          type="submit"
          disabled={props.disabled}
          onClick={() => {
            props.onSubmit(form.state.values);
          }}
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
            Create Document Storage
          </Show>
        </Button>
      </div>
    </form>
  );
}

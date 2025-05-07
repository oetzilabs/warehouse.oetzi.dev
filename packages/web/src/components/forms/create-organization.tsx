import { Button } from "@/components/ui/button";
import { TextField, TextFieldInput, TextFieldLabel, TextFieldTextArea } from "@/components/ui/text-field";
import { A } from "@solidjs/router";
import { createForm } from "@tanstack/solid-form";
import { type OrganizationCreate } from "@warehouseoetzidev/core/src/drizzle/sql/schema";
import ChevronRight from "lucide-solid/icons/chevron-right";
import Loader2 from "lucide-solid/icons/loader-2";
import FileUp from "lucide-solid/icons/upload";
import { Show } from "solid-js";
import { toast } from "solid-sonner";
import { email, minLength, nullable, pipe, regex, string } from "valibot";

export type CreateOrganizationFormProps = {
  onSubmit: (values: OrganizationCreate) => void;
  disabled?: boolean;
};
export default function CreateOrganizationForm(props: CreateOrganizationFormProps) {
  const form = createForm(() => ({
    defaultValues: {
      name: "",
      description: "",
      website: "",
      email: "",
      phone: "",
      location: "",
    } as OrganizationCreate,
    onSubmit: (values) => {
      props.onSubmit(values.value);
    },
  }));

  return (
    <form class="w-full flex flex-col gap-2 grow">
      <div class="w-full flex flex-col gap-4 h-content max-h-[600px] overflow-y-auto">
        <form.Field
          name="name"
          validators={{ onChange: pipe(string(), minLength(3)), onBlur: pipe(string(), minLength(3)) }}
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
              <TextFieldInput placeholder="Warehouse 1" required />
            </TextField>
          )}
        />
        <form.Field
          name="description"
          validators={{
            onChange: nullable(string()),
            onBlur: nullable(string()),
          }}
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
        <div class="w-full flex flex-row items-center gap-2">
          <div class="w-4 bg-muted-foreground/20 h-px" />
          <div class="w-max flex flex-row items-center gap-1">
            <span class="w-max text-xs font-medium text-muted-foreground">Additional</span>
            <span class="w-max text-xs font-medium text-muted-foreground">Information</span>
          </div>
          <div class="w-[calc(100%-1rem)] bg-muted-foreground/20 h-px" />
        </div>
        <form.Field
          name="website"
          validators={{
            onChange: nullable(string()),
            onBlur: nullable(string()),
          }}
          children={(field) => (
            <TextField
              id={field().name}
              name={field().name}
              value={field().state.value ?? ""}
              onChange={(value) => field().setValue(value)}
              onBlur={field().handleBlur}
            >
              <TextFieldLabel>Website</TextFieldLabel>
              <TextFieldInput placeholder="https://example.com" />
            </TextField>
          )}
        />
        <form.Field
          name="email"
          validators={{
            onChange: nullable(pipe(string(), email())),
            onBlur: nullable(pipe(string(), email())),
          }}
          children={(field) => (
            <TextField
              id={field().name}
              name={field().name}
              value={field().state.value ?? ""}
              onChange={(value) => field().setValue(value)}
              onBlur={field().handleBlur}
            >
              <TextFieldLabel>Email</TextFieldLabel>
              <TextFieldInput placeholder="info@warehouse.oetzi.dev" />
            </TextField>
          )}
        />
        <form.Field
          name="phone"
          validators={{
            onChange: nullable(pipe(string(), regex(/^\+(?:[0-9]){6,14}[0-9]$/))),
            onBlur: nullable(pipe(string(), regex(/^\+(?:[0-9]){6,14}[0-9]$/))),
          }}
          children={(field) => (
            <TextField
              id={field().name}
              name={field().name}
              value={field().state.value ?? ""}
              onChange={(value) => field().setValue(value)}
              onBlur={field().handleBlur}
            >
              <TextFieldLabel>Phone</TextFieldLabel>
              <TextFieldInput placeholder="+49 1234 567 890" />
            </TextField>
          )}
        />
        <form.Field
          name="location"
          validators={{
            onChange: pipe(string(), minLength(3)),
            onBlur: pipe(string(), minLength(3)),
          }}
          children={(field) => (
            <TextField
              id={field().name}
              name={field().name}
              value={field().state.value ?? ""}
              onChange={(value) => field().setValue(value)}
              onBlur={field().handleBlur}
            >
              <TextFieldLabel>
                Location <span class="text-red-500">*</span>
              </TextFieldLabel>
              <TextFieldInput placeholder="Jane Street, London" required />
            </TextField>
          )}
        />
      </div>
      <div class="flex grow w-full" />
      <div class="w-full flex flex-row gap-2 items-center justify-between">
        <div class="w-max flex flex-row gap-2">
          <Button size="sm" variant="outline" type="button">
            <FileUp class="size-4" />
            Import Data
          </Button>
        </div>
        <div class="w-max">
          <Button
            size="sm"
            type="button"
            disabled={props.disabled}
            onClick={() => {
              form
                .validateAllFields("submit")
                .then((v) => {
                  form.handleSubmit();
                })
                .catch((err) => {
                  toast.error(err.message);
                });
            }}
          >
            <Show
              when={props.disabled}
              fallback={
                <>
                  Next
                  <ChevronRight class="size-4" />
                </>
              }
            >
              <>
                <Loader2 class="size-4" />
                Submitting...
              </>
            </Show>
          </Button>
        </div>
      </div>
    </form>
  );
}

import { TextField, TextFieldInput, TextFieldLabel } from "@/components/ui/text-field";
import { useNewCatalogForm } from "./form";

export const Basics = () => {
  const { form } = useNewCatalogForm();
  return (
    <section class="p-0 grid grid-cols-1 md:grid-cols-5 gap-8">
      <div class="flex flex-col gap-2 col-span-2">
        <h2 class="text-lg font-semibold">Basic Information</h2>
        <p class="text-muted-foreground text-sm">
          Enter the main details for your catalog, such as name and description.
        </p>
      </div>
      <div class="flex flex-col gap-4 col-span-3">
        <form.Field name="name">
          {(field) => (
            <TextField class="gap-2 flex flex-col">
              <TextFieldLabel class="capitalize pl-1">
                Name <span class="text-red-500">*</span>
              </TextFieldLabel>
              <TextFieldInput
                placeholder="Catalog name"
                value={field().state.value}
                onInput={(e) => field().handleChange(e.currentTarget.value)}
                onBlur={field().handleBlur}
              />
            </TextField>
          )}
        </form.Field>
        <form.Field name="description">
          {(field) => (
            <TextField class="gap-2 flex flex-col">
              <TextFieldLabel class="capitalize pl-1">Description</TextFieldLabel>
              <TextFieldInput
                placeholder="Description (optional)"
                value={field().state.value}
                onInput={(e) => field().handleChange(e.currentTarget.value)}
                onBlur={field().handleBlur}
              />
            </TextField>
          )}
        </form.Field>
      </div>
    </section>
  );
};

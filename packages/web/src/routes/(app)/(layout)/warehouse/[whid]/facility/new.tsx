import { Button } from "@/components/ui/button";
import { TextField, TextFieldInput, TextFieldLabel, TextFieldTextArea } from "@/components/ui/text-field";
import { getAuthenticatedUser, getSessionToken } from "@/lib/api/auth";
import { createFacility } from "@/lib/api/facilities";
import { A, useAction, useParams, useSubmission, type RouteDefinition } from "@solidjs/router";
import { createForm, formOptions } from "@tanstack/solid-form";
import { type FacilityCreate } from "@warehouseoetzidev/core/src/drizzle/sql/schemas/warehouses/warehouse_facility";
import ArrowLeft from "lucide-solid/icons/arrow-left";
import Loader2 from "lucide-solid/icons/loader-2";
import Plus from "lucide-solid/icons/plus";
import { Show } from "solid-js";
import { toast } from "solid-sonner";

export const route = {
  preload: () => {
    const user = getAuthenticatedUser({ skipOnboarding: true });
    const sessionToken = getSessionToken();
    return { user, sessionToken };
  },
} as RouteDefinition;

export default function NewFacilityPage() {
  const params = useParams();
  const createFacilityAction = useAction(createFacility);
  const isCreatingFacility = useSubmission(createFacility);

  const formOps = formOptions({
    defaultValues: {
      name: "",
      description: "",
      warehouse_id: params.whid,
      bounding_box: {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
      },
    } satisfies Parameters<typeof createFacilityAction>[0],
  });

  const form = createForm(() => ({
    ...formOps,
  }));

  return (
    <div class="container flex flex-row grow py-0 relative">
      <div class="w-full flex flex-col gap-4">
        <div class="sticky top-12 z-10 flex items-center gap-4 justify-between w-full bg-background pb-4">
          <div class="flex flex-row items-center gap-4">
            <Button as={A} href={`/warehouse/${params.whid}`} variant="outline" class="bg-background" size="sm">
              <ArrowLeft class="size-4" />
              Back
            </Button>
            <h1 class="text-sm font-semibold leading-none">New Facility</h1>
          </div>
          <div class="flex items-center gap-4">
            <Button
              size="sm"
              onClick={() => {
                toast.promise(createFacilityAction(form.state.values), {
                  loading: "Creating facility...",
                  success: "Facility created",
                  error: "Failed to create facility",
                });
              }}
            >
              <Show when={isCreatingFacility.pending} fallback={<Plus class="size-4" />}>
                <Loader2 class="size-4 animate-spin" />
              </Show>
              Add
            </Button>
          </div>
        </div>
        <form class="w-full flex flex-col gap-4">
          <form.Field name="name">
            {(field) => (
              <TextField value={field().state.value} onChange={(e) => field().setValue(e)} class="gap-2 flex flex-col">
                <TextFieldLabel class="capitalize pl-1">
                  Name <span class="text-red-500">*</span>
                </TextFieldLabel>
                <TextFieldInput class="h-9" placeholder="Facility Name" />
              </TextField>
            )}
          </form.Field>
          <form.Field name="description">
            {(field) => (
              <TextField value={field().state.value} onChange={(e) => field().setValue(e)} class="gap-2 flex flex-col">
                <TextFieldLabel class="capitalize pl-1">Description</TextFieldLabel>
                <TextFieldTextArea placeholder="Facility Description" autoResize />
              </TextField>
            )}
          </form.Field>
        </form>
      </div>
    </div>
  );
}

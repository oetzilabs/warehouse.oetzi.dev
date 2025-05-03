import OnboardingDialog from "@/components/OnboardingDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentOrganization } from "@/lib/api/organizations";
import { createWarehouse } from "@/lib/api/warehouses";
import { A, createAsync, useAction, useSubmission } from "@solidjs/router";
import { clientOnly } from "@solidjs/start";
import { Show, Suspense } from "solid-js";
import { toast } from "solid-sonner";
import { Button } from "../../../../../components/ui/button";

const Form = clientOnly(() => import("@/components/forms/create-warehouse"));

export default function WarehouseStepPage() {
  const currentOrganization = createAsync(() => getCurrentOrganization(), { deferStream: true });
  const createWarehouseAction = useAction(createWarehouse);
  const isCreatingWarehouse = useSubmission(createWarehouse);

  return (
    <Suspense
      fallback={
        <div class="flex w-full flex-col gap-4 py-2 h-full grow">
          <Skeleton class="w-full h-2" animate />
          <Skeleton class="w-full h-8" animate />
          <Skeleton class="w-full h-[400px]" animate />
        </div>
      }
    >
      <Show
        when={currentOrganization()}
        fallback={
          <OnboardingDialog
            step={2}
            amountOfSteps={3}
            description="Before you can create a warehouse, you need to set up your company first."
            image="https://picsum.photos/seed/warehouse/400/600?grayscale"
            form={
              <div class="flex w-full flex-col gap-4 py-2 h-full grow">
                <Button as={A} size="sm" href="/onboarding/step/company" class="w-max">
                  Go to organization setup
                </Button>
              </div>
            }
          />
        }
      >
        {(cO) => (
          <OnboardingDialog
            step={2}
            amountOfSteps={3}
            description={`Let's set up your first warehouse for your organization '${cO().name}'. You can add more later.`}
            image="https://picsum.photos/seed/warehouse/400/600?grayscale"
            form={
              <Form
                onSubmit={(values) => {
                  toast.promise(createWarehouseAction(values), {
                    loading: "Creating warehouse...",
                    success: "Warehouse created successfully.",
                    error: "Error creating warehouse",
                  });
                }}
                disabled={isCreatingWarehouse.pending}
                fallback={
                  <div class="flex w-full flex-col gap-4 py-2 h-full grow">
                    <Skeleton class="w-full h-2" animate />
                    <Skeleton class="w-full h-8" animate />
                    <Skeleton class="w-full h-[400px]" animate />
                  </div>
                }
              />
            }
          />
        )}
      </Show>
    </Suspense>
  );
}

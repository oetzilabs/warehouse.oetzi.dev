import OnboardingDialog from "@/components/OnboardingDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { createWarehouse } from "@/lib/api/warehouses";
import { useAction, useSubmission } from "@solidjs/router";
import { clientOnly } from "@solidjs/start";
import { toast } from "solid-sonner";

const Form = clientOnly(() => import("@/components/forms/create-warehouse"));

export default function WarehouseStepPage() {
  const createWarehouseAction = useAction(createWarehouse);
  const isCreatingWarehouse = useSubmission(createWarehouse);

  return (
    <OnboardingDialog
      step={2}
      amountOfSteps={2}
      description="Let's set up your first warehouse. You can add more later."
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
  );
}

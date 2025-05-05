import OnboardingDialog from "@/components/OnboardingDialog";
import { useBreadcrumbs } from "@/components/providers/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentOrganization } from "@/lib/api/organizations";
import { createWarehouse } from "@/lib/api/warehouses";
import { A, createAsync, useAction, useSubmission } from "@solidjs/router";
import { clientOnly } from "@solidjs/start";
import { onMount, Show, Suspense } from "solid-js";
import { toast } from "solid-sonner";

const Form = clientOnly(() => import("@/components/forms/create-warehouse"));

export default function WarehouseStepPage() {
  const { setBreadcrumbs } = useBreadcrumbs();
  onMount(() => {
    setBreadcrumbs([
      {
        label: "Onboarding",
        href: "/onboarding",
      },
      {
        label: "Warehouse",
        href: "/onboarding/step/warehouse",
      },
    ]);
  });
  const currentOrganization = createAsync(() => getCurrentOrganization(), { deferStream: true });
  const createWarehouseAction = useAction(createWarehouse);
  const isCreatingWarehouse = useSubmission(createWarehouse);

  return (
    <Suspense
      fallback={
        <div class="flex w-full flex-col gap-4 py-2 h-full grow">
          <Skeleton class="w-full h-4" />
          <Skeleton class="w-full h-8" />
        </div>
      }
    >
      <Show
        when={currentOrganization()}
        fallback={
          <OnboardingDialog
            step={[2, 3]}
            right={<img src="/images/onboarding/warehouse-2.jpg" class="w-full h-full object-cover" />}
            left={
              <div class="w-full flex flex-col gap-2 h-full grow">
                <span class="text-sm font-medium text-muted-foreground/80">
                  Before you can create a warehouse, you need to set up your company first.
                </span>
                <div class="flex w-full flex-col gap-4 py-2 h-full grow">
                  <Button as={A} size="sm" href="/onboarding/step/company" class="w-max">
                    Go to organization setup
                  </Button>
                </div>
              </div>
            }
          />
        }
      >
        {(cO) => (
          <OnboardingDialog
            step={[2, 3]}
            right={<img src="/images/onboarding/warehouse-2.jpg" class="w-full h-full object-cover" />}
            left={
              <div class="flex w-full flex-col gap-4 py-2 h-full grow">
                <span class="text-sm font-medium text-muted-foreground/80">
                  {`Let's set up your first warehouse for your organization '${cO().name}'. You can add more later.`}
                </span>
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
                      <Skeleton class="w-20 h-4 mb-3" />
                      <div class="flex flex-col gap-2">
                        <Skeleton class="w-20 h-4" />
                        <Skeleton class="w-full h-8" />
                      </div>
                      <div class="flex flex-col gap-2">
                        <Skeleton class="w-20 h-4" />
                        <Skeleton class="w-full h-16" />
                      </div>
                    </div>
                  }
                />
              </div>
            }
          />
        )}
      </Show>
    </Suspense>
  );
}

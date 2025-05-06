// import { CreateOrganizationForm } from "@/components/forms/create-organization";
import { useBreadcrumbs } from "@/components/providers/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { createOrganization, getCurrentOrganization } from "@/lib/api/organizations";
import { A, createAsync, useAction, useSubmission } from "@solidjs/router";
import { clientOnly } from "@solidjs/start";
import { onMount, Show } from "solid-js";
import { toast } from "solid-sonner";

const Form = clientOnly(() => import("@/components/forms/create-organization"));

export default function OrganizationStepPage() {
  const { setBreadcrumbs } = useBreadcrumbs();
  onMount(() => {
    setBreadcrumbs([
      {
        label: "Onboarding",
        href: "/onboarding",
      },
      {
        label: "Company",
        href: "/onboarding/step/company",
      },
    ]);
  });
  const currentOrganization = createAsync(() => getCurrentOrganization(), { deferStream: true });
  const createOrganizationAction = useAction(createOrganization);
  const isCreatingOrganization = useSubmission(createOrganization);
  const FallbackSkeleton = (
    <div class="flex w-full flex-col gap-4 py-2 h-full grow">
      <Skeleton class="w-full h-4" />
      <Skeleton class="w-full h-8" />

      <Skeleton class="w-full h-4" />
      <Skeleton class="w-full h-8" />

      <Skeleton class="w-full h-4" />
      <Skeleton class="w-full h-8" />

      <Skeleton class="w-full h-4" />
      <Skeleton class="w-full h-8" />

      <Skeleton class="w-full h-4" />
      <Skeleton class="w-full h-8" />

      <Skeleton class="w-full h-4" />
      <Skeleton class="w-full h-8" />
    </div>
  );

  return (
    <div class="w-full h-full flex items-start md:items-center md:justify-center grow">
      <div class="w-full max-w-6xl md:min-h-[450px] md:h-max h-full border-0 md:border rounded-none md:rounded-lg md:shadow-2xl shadow-none overflow-clip grow">
        <div class="grid grid-cols-1 md:grid-cols-2 w-full h-full">
          <div class="flex p-6 w-full flex-col gap-1 h-full grow">
            <div class="w-full flex flex-row items-center justify-between">
              <span class="text-xl font-medium w-max">Welcome to WareHouse.</span>
              <span class="text-xs font-medium w-max">1/3</span>
            </div>
            <div class="w-full flex flex-col gap-4">
              <span class="text-sm font-medium text-muted-foreground">Onboarding</span>
            </div>
            <div class="w-full flex flex-col gap-4 grow">
              <div class="flex flex-col gap-2 w-full grow">
                <Show when={currentOrganization()} fallback={<div class="w-full" />}>
                  {(cO) => (
                    <div class="w-full h-max flex items-center justify-between bg-muted-foreground/10 rounded-lg pl-3 py-1 pr-1 border">
                      <span class="text-sm text-muted-foreground">
                        You have already set up a company: <span class="font-bold">{cO().name}</span>
                      </span>
                      <Button
                        as={A}
                        size="sm"
                        href="/onboarding/step/warehouse"
                        class="w-max text-xs px-2 py-1 h-max"
                        variant="secondary"
                      >
                        Choose
                      </Button>
                    </div>
                  )}
                </Show>
                <span class="text-sm font-medium text-muted-foreground/80">
                  Please enter the information of your company, which will be used to prepare your workspace.
                </span>
                <Form
                  onSubmit={(values) => {
                    toast.promise(createOrganizationAction(values), {
                      loading: "Creating company...",
                      success: "Company created successfully.",
                      error: "Error creating company",
                    });
                  }}
                  disabled={isCreatingOrganization.pending}
                  fallback={FallbackSkeleton}
                />
              </div>
            </div>
          </div>
          <div class="hidden md:flex w-full bg-muted h-full overflow-clip">
            {<img src="/images/onboarding/company.jpg" class="w-full h-full object-cover" />}
          </div>
        </div>
      </div>
    </div>
  );
}

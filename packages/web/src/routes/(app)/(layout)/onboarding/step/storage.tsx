// import { CreateOrganizationForm } from "@/components/forms/create-organization";
import OnboardingDialog from "@/components/OnboardingDialog";
import { useBreadcrumbs } from "@/components/providers/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentOrganization } from "@/lib/api/organizations";
import { createDocumentStorage } from "@/lib/api/storages";
import { A, createAsync, useAction, useSubmission } from "@solidjs/router";
import { clientOnly } from "@solidjs/start";
import { onMount, Show } from "solid-js";
import { toast } from "solid-sonner";

const Form = clientOnly(() => import("@/components/forms/create-document-storage"));

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
  const createDocumentStorageAction = useAction(createDocumentStorage);
  const isCreatingDocumentStorage = useSubmission(createDocumentStorage);
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
    <OnboardingDialog
      step={1}
      amountOfSteps={3}
      banner={
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
      }
      description="Please enter the information of your company, which will be used to prepare your workspace."
      image="/images/onboarding/storage.jpg"
      form={
        <Form
          onSubmit={(values) => {
            toast.promise(createDocumentStorageAction(values), {
              loading: "Creating document storage...",
              success: "document storage created successfully.",
              error: "Error creating document storage",
            });
          }}
          disabled={isCreatingDocumentStorage.pending}
          fallback={FallbackSkeleton}
        />
      }
    />
  );
}

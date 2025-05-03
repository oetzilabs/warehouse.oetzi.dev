// import { CreateOrganizationForm } from "@/components/forms/create-organization";
import OnboardingDialog from "@/components/OnboardingDialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { createOrganization, getCurrentOrganization } from "@/lib/api/organizations";
import { A, createAsync, useAction, useSubmission } from "@solidjs/router";
import { clientOnly } from "@solidjs/start";
import { Show } from "solid-js";
import { toast } from "solid-sonner";

const Form = clientOnly(() => import("@/components/forms/create-organization"));

export default function OrganizationStepPage() {
  const currentOrganization = createAsync(() => getCurrentOrganization(), { deferStream: true });
  const createOrganizationAction = useAction(createOrganization);
  const isCreatingOrganization = useSubmission(createOrganization);
  const FallbackSkeleton = (
    <div class="flex w-full flex-col gap-4 py-2 h-full grow">
      <Skeleton class="w-full h-2" animate />
      <Skeleton class="w-full h-8" animate />

      <Skeleton class="w-full h-2" animate />
      <Skeleton class="w-full h-8" animate />

      <Skeleton class="w-full h-2" animate />
      <Skeleton class="w-full h-8" animate />

      <Skeleton class="w-full h-2" animate />
      <Skeleton class="w-full h-8" animate />

      <Skeleton class="w-full h-2" animate />
      <Skeleton class="w-full h-8" animate />

      <Skeleton class="w-full h-2" animate />
      <Skeleton class="w-full h-8" animate />
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
      image="https://picsum.photos/seed/picsum/400/600?grayscale"
      form={
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
      }
    />
  );
}

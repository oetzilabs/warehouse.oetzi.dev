// import { CreateOrganizationForm } from "@/components/forms/create-organization";
import OnboardingDialog from "@/components/OnboardingDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { createOrganization, getCurrentOrganization } from "@/lib/api/organizations";
import { createAsync, useAction, useSubmission } from "@solidjs/router";
import { clientOnly } from "@solidjs/start";
import { Show, Suspense } from "solid-js";
import { toast } from "solid-sonner";

const Form = clientOnly(() => import("@/components/forms/create-organization"));

export default function OrganizationStepPage() {
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

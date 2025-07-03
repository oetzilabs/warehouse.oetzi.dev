// import { CreateOrganizationForm } from "@/components/forms/create-organization";
import { CreateOrganizationForm } from "@/components/forms/create-organization";
import { useBreadcrumbs } from "@/components/providers/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { updateOrganizationDetails } from "@/lib/api/onboarding";
import { getCurrentOrganization } from "@/lib/api/organizations";
import { A, createAsync, useAction, useNavigate, useSubmission } from "@solidjs/router";
import { clientOnly } from "@solidjs/start";
import { onMount, Show } from "solid-js";
import { toast } from "solid-sonner";

export default function OrganizationStepPage() {
  const currentOrganization = createAsync(() => getCurrentOrganization(), { deferStream: true });
  const updateOrganizationAction = useAction(updateOrganizationDetails);
  const isUpdatingOrganization = useSubmission(updateOrganizationDetails);
  const navigate = useNavigate();

  return (
    <div class="w-full h-full flex items-start md:items-center md:justify-center grow">
      <div class="flex w-full max-w-6xl h-[600px] border-0 md:border rounded-none md:rounded-lg overflow-clip grow">
        <div class="flex flex-row w-full grow">
          <div class="flex p-6 w-full flex-col gap-1 grow">
            <div class="w-full flex flex-row items-center justify-between">
              <span class="text-xl font-medium w-max">Welcome to WareHouse.</span>
              <div class="size-[6px] bg-muted-foreground/50 rounded-full" />
            </div>
            <div class="w-full flex flex-col gap-4">
              <span class="text-sm font-medium text-muted-foreground">Onboarding</span>
            </div>
            <div class="w-full flex flex-col gap-4 grow">
              <div class="flex flex-col gap-2 w-full grow">
                <span class="text-sm font-medium text-muted-foreground/80">
                  Please enter the information of your company, which will be used to prepare your workspace.
                </span>
                <Show when={currentOrganization()} fallback={<div class="w-full" />}>
                  {(cO) => (
                    <CreateOrganizationForm
                      onSubmit={(values) => {
                        toast.promise(updateOrganizationAction({ id: cO().id, ...values }), {
                          loading: "Updating company...",
                          success: (data) => {
                            navigate("/dashboard");
                            return "Company updated successfully.";
                          },
                          error: "Error updating company",
                        });
                      }}
                      defaultValues={cO()}
                      disabled={isUpdatingOrganization.pending}
                    />
                  )}
                </Show>
              </div>
            </div>
          </div>
          <div class="hidden md:flex w-full bg-muted  grow overflow-clip">
            {<img src="/images/onboarding/company.jpg" class="w-full grow object-cover" />}
          </div>
        </div>
      </div>
    </div>
  );
}

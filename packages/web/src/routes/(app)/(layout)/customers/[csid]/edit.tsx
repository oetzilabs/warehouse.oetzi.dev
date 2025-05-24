import { CustomerForm } from "@/components/customers/customer-form";
import { Button } from "@/components/ui/button";
import { getCustomerById, updateCustomer } from "@/lib/api/customers";
import { createAsync, useAction, useNavigate, useParams } from "@solidjs/router";
import ArrowLeft from "lucide-solid/icons/arrow-left";
import Loader2 from "lucide-solid/icons/loader-2";
import { Show, Suspense } from "solid-js";
import { toast } from "solid-sonner";

export default function EditCustomerPage() {
  const params = useParams();
  const navigate = useNavigate();
  const customer = createAsync(() => getCustomerById(params.csid));
  const updateCustomerAction = useAction(updateCustomer);

  return (
    <Suspense
      fallback={
        <div class="w-full h-full flex items-center justify-center flex-col gap-2">
          <Loader2 class="size-4 animate-spin" />
          <span class="text-sm">Loading...</span>
        </div>
      }
    >
      <Show when={customer()}>
        {(customerInfo) => (
          <div class="container py-4 flex flex-col gap-4">
            <div class="flex flex-row items-center gap-4">
              <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
                <ArrowLeft class="size-4" />
                Back
              </Button>
              <h1 class="text-xl font-semibold">Edit Customer</h1>
            </div>

            <CustomerForm
              defaultValues={{
                id: customerInfo().id,
                name: customerInfo().name,
                email: customerInfo().email,
                phone: customerInfo().phone ?? "",
              }}
              onSubmit={async (values) => {
                const promise = updateCustomerAction(values);
                toast.promise(promise, {
                  loading: "Updating customer...",
                  success: "Customer updated successfully",
                  error: "Failed to update customer",
                });
                await promise;
                navigate(`/customers/${params.csid}`);
              }}
              submitText="Save Changes"
              submittingText="Saving..."
            />
          </div>
        )}
      </Show>
    </Suspense>
  );
}

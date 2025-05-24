import { SupplierForm } from "@/components/suppliers/supplier-form";
import { Button } from "@/components/ui/button";
import { getSupplierById, updateSupplier } from "@/lib/api/suppliers";
import { createAsync, useAction, useNavigate, useParams } from "@solidjs/router";
import ArrowLeft from "lucide-solid/icons/arrow-left";
import Loader2 from "lucide-solid/icons/loader-2";
import { Show, Suspense } from "solid-js";
import { toast } from "solid-sonner";

export default function EditSupplierPage() {
  const params = useParams();
  const navigate = useNavigate();
  const supplier = createAsync(() => getSupplierById(params.spid));
  const updateSupplierAction = useAction(updateSupplier);

  return (
    <Suspense
      fallback={
        <div class="w-full h-full flex items-center justify-center flex-col gap-2">
          <Loader2 class="size-4 animate-spin" />
          <span class="text-sm">Loading...</span>
        </div>
      }
    >
      <Show when={supplier()}>
        {(supplierInfo) => (
          <div class="container py-4 flex flex-col gap-4">
            <div class="flex flex-row items-center gap-4">
              <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
                <ArrowLeft class="size-4" />
                Back
              </Button>
              <h1 class="text-xl font-semibold">Edit Supplier</h1>
            </div>

            <SupplierForm
              defaultValues={{
                id: supplierInfo().id,
                name: supplierInfo().name,
                email: supplierInfo().email,
                phone: supplierInfo().phone ?? "",
              }}
              onSubmit={async (values) => {
                const promise = updateSupplierAction(values);
                toast.promise(promise, {
                  loading: "Updating supplier...",
                  success: "Supplier updated successfully",
                  error: "Failed to update supplier",
                });
                await promise;
                navigate(`/suppliers/${params.spid}`);
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

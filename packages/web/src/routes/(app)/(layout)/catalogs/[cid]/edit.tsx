import { CatalogForm } from "@/components/catalogs/catalog-form";
import { Button } from "@/components/ui/button";
import { getCatalogById, updateCatalog } from "@/lib/api/catalogs";
import { A, createAsync, useAction, useNavigate, useParams } from "@solidjs/router";
import ArrowLeft from "lucide-solid/icons/arrow-left";
import Loader2 from "lucide-solid/icons/loader-2";
import { Show, Suspense } from "solid-js";
import { toast } from "solid-sonner";

export default function EditCatalogPage() {
  const params = useParams();
  const navigate = useNavigate();
  const catalog = createAsync(() => getCatalogById(params.cid));
  const updateCatalogAction = useAction(updateCatalog);

  return (
    <div class="container py-4 flex flex-col gap-4 relative">
      <div class="flex flex-row items-center gap-4">
        <Button variant="outline" size="sm" as={A} href={`/catalogs/${params.cid}`}>
          <ArrowLeft class="size-4" />
          Back
        </Button>
        <h1 class="text-xl font-semibold">Edit Catalog</h1>
      </div>
      <Suspense
        fallback={
          <div class="w-full h-full flex items-center justify-center flex-col gap-2">
            <Loader2 class="size-4 animate-spin" />
            <span class="text-sm">Loading...</span>
          </div>
        }
      >
        <Show when={catalog()}>
          {(catalogInfo) => (
            <CatalogForm
              defaultValues={{
                id: catalogInfo().id,
                name: catalogInfo().name,
                description: catalogInfo().description ?? "",
                startDate: new Date(catalogInfo().startDate),
                endDate: new Date(catalogInfo().endDate),
                isActive: catalogInfo().isActive,
              }}
              onSubmit={async (values) => {
                const promise = updateCatalogAction(values);
                toast.promise(promise, {
                  loading: "Updating catalog...",
                  success: "Catalog updated successfully",
                  error: "Failed to update catalog",
                });
                await promise;
                navigate(`/catalogs/${params.cid}`);
              }}
              submitText="Save Changes"
              submittingText="Saving..."
            />
          )}
        </Show>
      </Suspense>
    </div>
  );
}

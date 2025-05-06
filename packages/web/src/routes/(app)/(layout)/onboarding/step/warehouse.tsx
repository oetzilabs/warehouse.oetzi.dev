import { useBreadcrumbs } from "@/components/providers/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentOrganization } from "@/lib/api/organizations";
import { createWarehouse } from "@/lib/api/warehouses";
import { cn } from "@/lib/utils";
import { A, createAsync, useAction, useSubmission } from "@solidjs/router";
import { clientOnly } from "@solidjs/start";
import { createSignal, onMount, Show, Suspense } from "solid-js";
import { toast } from "solid-sonner";
import { Transition } from "solid-transition-group";

const Form = clientOnly(() => import("@/components/forms/create-warehouse"));
const CMap = clientOnly(() => import("@/components/ClientMap"));

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
  const [visibleMap, setVisibleMap] = createSignal(false);
  const [coords, setCoords] = createSignal<[number, number]>([0, 0]);

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
          <div class="w-full h-full flex items-start md:items-center md:justify-center grow">
            <div class="w-full max-w-6xl md:min-h-[450px] md:h-max h-full border-0 md:border rounded-none md:rounded-lg md:shadow-2xl shadow-none overflow-clip grow">
              <div class="grid grid-cols-1 md:grid-cols-2 w-full h-full">
                <div class="flex p-6 w-full flex-col gap-1 h-full grow">
                  <div class="w-full flex flex-row items-center justify-between">
                    <span class="text-xl font-medium w-max">Welcome to WareHouse.</span>
                    <span class="text-xs font-medium w-max">2/3</span>
                  </div>
                  <div class="w-full flex flex-col gap-4">
                    <span class="text-sm font-medium text-muted-foreground">Onboarding</span>
                  </div>
                  <div class="w-full flex flex-col gap-4 grow">
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
                  </div>
                </div>
                <div class="hidden md:flex w-full bg-muted h-full overflow-clip">
                  <img src="/images/onboarding/warehouse-2.jpg" class="w-full h-full object-cover" />
                </div>
              </div>
            </div>
          </div>
        }
      >
        {(cO) => (
          <div class="w-full h-full flex items-start md:items-center md:justify-center grow">
            <div class="w-full max-w-6xl border-0 md:border rounded-none md:rounded-lg md:shadow-2xl shadow-none overflow-clip grow">
              <div class="w-full flex flex-row grow">
                <div class="flex p-6 w-full flex-col gap-1 grow ">
                  <div class="w-full flex flex-row items-center justify-between">
                    <span class="text-xl font-medium w-max">Welcome to WareHouse.</span>
                    <span class="text-xs font-medium w-max">2/3</span>
                  </div>
                  <div class="w-full flex flex-col gap-4">
                    <span class="text-sm font-medium text-muted-foreground">Onboarding</span>
                  </div>
                  <div class="w-full flex flex-col gap-4 grow">
                    <div class="flex w-full flex-col gap-4 py-2 h-full grow">
                      <span class="text-sm font-medium text-muted-foreground/80">
                        {`Let's set up your first warehouse for your organization '${cO().name}'. You can add more later.`}
                      </span>
                      <Form
                        showMap={(lat, lon) => {
                          setCoords([lat, lon]);
                          setVisibleMap(true);
                        }}
                        hideMap={() => {
                          setVisibleMap(false);
                        }}
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
                  </div>
                </div>
                <div class="hidden md:flex w-full flex-col bg-muted grow overflow-clip min-h-[750px]">
                  <Transition name="fade">
                    <Show when={visibleMap()}>
                      <div class="w-full border-l h-full">
                        <CMap coords={coords} />
                      </div>
                    </Show>
                  </Transition>
                  <Transition name="fade">
                    <Show when={!visibleMap()}>
                      <img src="/images/onboarding/warehouse-2.jpg" class="w-full h-full object-cover" />
                    </Show>
                  </Transition>
                </div>
              </div>
            </div>
          </div>
        )}
      </Show>
    </Suspense>
  );
}

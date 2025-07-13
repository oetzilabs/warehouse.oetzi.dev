import { DeviceForm } from "@/components/devices/device-form";
import { Button } from "@/components/ui/button";
import { getDeviceById, updateDevice } from "@/lib/api/devices";
import { A, createAsync, useAction, useNavigate, useParams } from "@solidjs/router";
import ArrowLeft from "lucide-solid/icons/arrow-left";
import Loader2 from "lucide-solid/icons/loader-2";
import { Show, Suspense } from "solid-js";
import { toast } from "solid-sonner";

export default function EditDevicePage() {
  const params = useParams();
  const navigate = useNavigate();
  const device = createAsync(() => getDeviceById(params.did));
  const updateDeviceAction = useAction(updateDevice);

  return (
    <div class="container py-4 flex flex-col gap-4 relative">
      <div class="flex flex-row items-center gap-4">
        <h1 class="text-xl font-semibold">Edit Device</h1>
      </div>
      <Suspense
        fallback={
          <div class="w-full grow flex items-center justify-center flex-col gap-2 p-10">
            <Loader2 class="size-4 animate-spin" />
            <span class="text-sm">Loading...</span>
          </div>
        }
      >
        <Show when={device()}>
          {(deviceInfo) => (
            <DeviceForm
              defaultValues={{
                ...deviceInfo(),
                type: {
                  value: deviceInfo().type.id,
                  label: deviceInfo().type.name,
                },
              }}
              onSubmit={async (values) => {
                const promise = updateDeviceAction(values);
                toast.promise(promise, {
                  loading: "Updating device...",
                  success: "Device updated successfully",
                  error: "Failed to update device",
                });
                await promise;
                navigate(`/devices/${params.did}`);
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

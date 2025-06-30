import { Button } from "@/components/ui/button";
import { TextField, TextFieldInput } from "@/components/ui/text-field";
import { triggerError, triggerSuccess } from "@/lib/api/otel";
import { useAction } from "@solidjs/router";
import { createSignal } from "solid-js";
import { toast } from "solid-sonner";

export default function OtelTrigger() {
  const triggerE = useAction(triggerError);
  const triggerS = useAction(triggerSuccess);

  const [name, setName] = createSignal("");
  return (
    <div class="flex flex-col gap-4 items-center justify-center w-full h-full">
      Otel Trigger Page
      <TextField value={name()} onChange={(e) => setName(e)}>
        <TextFieldInput placeholder="Name" />
      </TextField>
      <Button
        size="sm"
        variant="destructive"
        onClick={() => {
          toast.promise(triggerE(name()), {
            loading: "Triggering...",
            success: "Triggered",
            error: "Failed to trigger",
          });
        }}
      >
        Click me
      </Button>
      <Button
        size="sm"
        onClick={() => {
          toast.promise(triggerS(name()), {
            loading: "Triggering...",
            success: "Triggered",
            error: "Failed to trigger",
          });
        }}
      >
        Click me
      </Button>
    </div>
  );
}

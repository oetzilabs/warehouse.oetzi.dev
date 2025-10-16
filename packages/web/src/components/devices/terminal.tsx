import { Button } from "@/components/ui/button";
import RefreshIcon from "lucide-solid/icons/rotate-cw";

export type DeviceTerminalProps = {
  deviceId: string;
};

export function DeviceTerminal(props: DeviceTerminalProps) {
  return (
    <div class="flex flex-col gap-4 grow ">
      <div class="flex flex-col gap-4 grow">
        <div class="flex flex-col items-center justify-center flex-1 w-full py-10">
          <div class="flex flex-col items-center justify-center h-max w-full gap-4">
            <div class="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
              <span>Terminal connection not available.</span>
            </div>
            <Button size="sm" variant="secondary" class="py-2">
              <RefreshIcon class="size-4" />
              <span class="sr-only md:not-sr-only">Reconnect</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

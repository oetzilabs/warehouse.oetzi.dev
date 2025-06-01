import { Button } from "@/components/ui/button";
import Fullscreen from "lucide-solid/icons/maximize";
import ExitFullscreen from "lucide-solid/icons/minimize";
import { createMemo, createSignal, Show } from "solid-js";

export default function ToggleFullscreenOnElement(props: {
  element: HTMLElement;
  onFullscreenOn: () => void;
  onFullscreenOff: () => void;
}) {
  const [isFullscreen, setIsFullscreen] = createSignal(false);
  return (
    <Button
      size="icon"
      class="rounded border bg-background"
      variant="secondary"
      onClick={async () => {
        if (!props.element) {
          props.onFullscreenOff();
          setIsFullscreen(false);
          return;
        }
        // check if element is already fullscreen
        if (isFullscreen()) {
          await document.exitFullscreen();
          props.onFullscreenOff();
          setIsFullscreen(false);
          return;
        }
        await props.element.requestFullscreen();
        props.onFullscreenOn();
        setIsFullscreen(true);
      }}
    >
      <Show when={!isFullscreen()} fallback={<ExitFullscreen class="size-4" />}>
        <Fullscreen class="size-4" />
      </Show>
    </Button>
  );
}

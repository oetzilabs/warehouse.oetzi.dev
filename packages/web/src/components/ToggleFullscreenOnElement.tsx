import Fullscreen from "lucide-solid/icons/maximize";
import ExitFullscreen from "lucide-solid/icons/minimize";
import { createMemo, Show } from "solid-js";
import { Button } from "./ui/button";

export default function ToggleFullscreenOnElement(props: { element: HTMLElement }) {
  const isFullscreen = () => document.fullscreenElement === props.element;
  return (
    <Button
      size="icon"
      class="size-8 rounded border bg-background"
      variant="secondary"
      onClick={async () => {
        if (!props.element) {
          return;
        }
        // check if element is already fullscreen
        if (isFullscreen()) {
          await document.exitFullscreen();
          return;
        }
        await props.element.requestFullscreen();
      }}
    >
      <Show when={isFullscreen()} fallback={<ExitFullscreen class="size-4" />}>
        <Fullscreen class="size-4" />
      </Show>
    </Button>
  );
}

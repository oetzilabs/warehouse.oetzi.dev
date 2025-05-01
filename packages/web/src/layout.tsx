import { ParentProps } from "solid-js";
import { SidebarTrigger } from "./components/ui/sidebar";
import { cn } from "./lib/utils";

export const AppLayout = (props: ParentProps) => {
  return (
    <div
      class={cn("w-full flex flex-col h-screen overflow-clip gap-2 transition-[padding] duration-300 pt-14", {})}
      style={{
        "scrollbar-gutter": "stable both-edges",
      }}
    >
      <main class="w-full h-full flex flex-col grow relative">
        <div class="grow h-full w-full flex flex-col overflow-auto">{props.children}</div>
      </main>
    </div>
  );
};

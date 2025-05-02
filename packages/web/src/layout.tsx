import { ParentProps } from "solid-js";
import { Header } from "./components/Header";
import { cn } from "./lib/utils";

export const AppLayout = (props: ParentProps) => {
  return (
    <div
      class={cn(
        "w-full flex flex-col h-screen overflow-clip gap-2 transition-[padding] duration-300 p-4 bg-neutral-100 dark:bg-neutral-950",
        {},
      )}
      style={{
        "scrollbar-gutter": "stable both-edges",
      }}
    >
      <main class="w-full h-full flex flex-col grow relative border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-clip bg-background drop-shadow-2xl">
        <Header />
        <div class="grow h-full w-full flex flex-col overflow-auto">{props.children}</div>
      </main>
    </div>
  );
};

import { ParentProps } from "solid-js";
import { Header } from "./components/Header";
import { cn } from "./lib/utils";

export const AppLayout = (props: ParentProps) => {
  return (
    <div
      class={cn(
        "w-full flex flex-col h-screen overflow-clip gap-2 transition-[padding] duration-300 md:p-4 bg-neutral-100 dark:bg-neutral-950",
        {},
      )}
      style={{
        "scrollbar-gutter": "stable both-edges",
      }}
    >
      <main class="w-full h-full flex flex-col md:border md:border-neutral-200 md:dark:border-neutral-800 md:rounded-xl md:overflow-clip bg-background md:drop-shadow-2xl">
        <Header />
        <div class="h-[calc(100svh)] md:h-[calc(100svh-83px)] w-full">{props.children}</div>
      </main>
    </div>
  );
};

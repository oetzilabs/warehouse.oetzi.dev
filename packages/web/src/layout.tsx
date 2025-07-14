import { ParentProps } from "solid-js";
import { Header } from "./components/Header";
import { cn } from "./lib/utils";

export const AppLayout = (props: ParentProps) => {
  return (
    <div
      class={cn(
        "w-full flex flex-col h-full overflow-clip gap-2 transition-[padding] duration-300 md:p-4 bg-neutral-100 dark:bg-neutral-950",
        {},
      )}
    >
      <main class="w-full h-full flex flex-col md:border md:rounded-xl md:overflow-clip bg-background md:drop-shadow-2xl">
        <Header />
        {props.children}
      </main>
    </div>
  );
};

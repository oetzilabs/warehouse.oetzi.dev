import { Accessor, createContext, createSignal, JSX, Setter, useContext } from "solid-js";

export const SidebarContentContext = createContext<{
  content: Accessor<JSX.Element | null>;
  setContent: Setter<JSX.Element | null>;
}>();

export function SidebarContentProvider(props: { children: JSX.Element }) {
  const [content, setContent] = createSignal<JSX.Element | null>(null);
  return (
    <SidebarContentContext.Provider
      value={{
        content,
        setContent,
      }}
    >
      {props.children}
    </SidebarContentContext.Provider>
  );
}

export const useSidebarContent = () => {
  const ctx = useContext(SidebarContentContext);
  if (!ctx) {
    throw new Error("useSidebarContent must be used within a SidebarContentProvider.");
  }
  return ctx;
};

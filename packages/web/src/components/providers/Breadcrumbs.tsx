import { useLocation, useResolvedPath } from "@solidjs/router";
import {
  Accessor,
  createContext,
  createEffect,
  createMemo,
  createSignal,
  onMount,
  ParentProps,
  Setter,
  useContext,
} from "solid-js";

type BreadcrumbList = {
  label: string;
  href?: string;
  active?: boolean;
}[];

type BreadcrumbsContextType = {
  breadcrumbs: Accessor<BreadcrumbList>;
  setBreadcrumbs: Setter<BreadcrumbList>;
  reset: () => void;
  ready: Accessor<boolean>;
};

const BreadcrumbsContext = createContext<BreadcrumbsContextType>();

export const BreadcrumbsProvider = (props: ParentProps<{ defaultList: BreadcrumbList }>) => {
  const [breadcrumbs, setBreadcrumbs] = createSignal<BreadcrumbList>(props.defaultList);
  const reset = () => setBreadcrumbs(props.defaultList);
  const location = useLocation();
  const currentPath = useResolvedPath(() => location.pathname);
  const [ready, setReady] = createSignal(false);
  onMount(() => {
    setReady(true);
  });

  const list = createMemo(() => breadcrumbs().map((b) => ({ ...b, active: (b.href ?? "") === currentPath() })));

  return (
    <BreadcrumbsContext.Provider value={{ breadcrumbs: list, setBreadcrumbs, reset, ready }}>
      {props.children}
    </BreadcrumbsContext.Provider>
  );
};

export const useBreadcrumbs = () => {
  const ctx = useContext(BreadcrumbsContext);
  if (!ctx) throw new Error("BreadcrumbsContext not found");
  return ctx;
};

import { Button } from "@/components/ui/button";
import { InferQuery } from "@/lib/utils";
import { A, AccessorWithLatest } from "@solidjs/router";
import ArrowLeft from "lucide-solid/icons/arrow-left";
import Loader2 from "lucide-solid/icons/loader-2";
import { Accessor, ErrorBoundary, For, JSX, Show, Suspense } from "solid-js";

type ResolvedAccessorValue<K extends unknown, T extends AccessorWithLatest<K>> =
  T extends AccessorWithLatest<infer V> ? V : never;

type LoaderProps<K extends unknown, T extends AccessorWithLatest<K>> = {
  query: T;
  error?: JSX.Element;
  children: (data: Accessor<NonNullable<ResolvedAccessorValue<K, T>>>) => JSX.Element;
  fallback?: JSX.Element;
  initial?: Accessor<NonNullable<ResolvedAccessorValue<K, T>>>;
};

export const Loader = <K extends unknown, T extends AccessorWithLatest<K>>(props: LoaderProps<K, T>) => {
  return (
    <ErrorBoundary
      fallback={(error, reset) =>
        props.error ?? (
          <div class="w-full h-full flex items-center justify-center flex-col gap-2">
            <span class="text-sm text-red-500 font-semibold">Something went wrong</span>
            <details class="text-sm text-muted-foreground">
              <summary class="cursor-pointer">Details</summary>
              <pre class="whitespace-pre-wrap break-all">{JSON.stringify(error, null, 2)}</pre>
            </details>
            <Button size="sm" as={A} href="/dashboard">
              <ArrowLeft class="size-4" />
              Back to Dashboard
            </Button>
          </div>
        )
      }
    >
      <Suspense
        fallback={
          props.fallback ?? (
            <div class="w-full h-full flex items-center justify-center flex-col gap-2">
              <Loader2 class="size-4 animate-spin" />
              <span class="text-sm">Loading...</span>
            </div>
          )
        }
      >
        <Show when={props.query()} fallback={props.initial ? props.children(props.initial!) : undefined}>
          {(data) => props.children(data as Accessor<NonNullable<ResolvedAccessorValue<K, T>>>)}
        </Show>
      </Suspense>
    </ErrorBoundary>
  );
};

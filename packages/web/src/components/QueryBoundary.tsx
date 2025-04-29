import type { CreateQueryResult } from "@tanstack/solid-query";
import type { JSX } from "solid-js";
import { Match, Suspense, Switch } from "solid-js";
import { Button } from "./ui/button";

export interface QueryBoundaryProps<T = unknown> {
  query: CreateQueryResult<T, Error>;

  /**
   * Triggered when the data is initially loading.
   */
  loadingFallback?: JSX.Element;

  /**
   * Triggered when fetching is complete, but the returned data was falsey.
   */
  notFoundFallback?: JSX.Element;

  /**
   * Triggered when the query results in an error.
   */
  errorFallback?: JSX.Element;

  /**
   * Triggered when fetching is complete, and the returned data is not falsey.
   */
  children: (data: Exclude<T, null | false | undefined>) => JSX.Element;
}

/**
 * Convenience wrapper that handles suspense and errors for queries. Makes the results of query.data available to
 * children (as a render prop) in a type-safe way.
 */
export function QueryBoundary<T>(props: QueryBoundaryProps<T>) {
  return (
    <Suspense fallback={props.loadingFallback}>
      <Switch fallback={props.loadingFallback}>
        {/* <Match when={props.query.isFetching || props.query.isPending}>
          {props.loadingFallback ? props.loadingFallback : <Loader2 class="w-4 h-4 animate-spin" />}
        </Match> */}
        <Match when={props.query.isError}>
          {props.errorFallback ? (
            props.errorFallback
          ) : (
            <div>
              <div class="error">{props.query.error?.message}</div>
              <Button
                onClick={() => {
                  props.query.refetch();
                }}
              >
                retry
              </Button>
            </div>
          )}
        </Match>

        <Match when={!props.query.isFetching && !props.query.data}>
          {props.notFoundFallback ? props.notFoundFallback : <div>not found</div>}
        </Match>

        <Match when={props.query.data !== undefined}>
          {props.children(props.query.data as Exclude<T, null | false | undefined>)}
        </Match>
      </Switch>
    </Suspense>
  );
}

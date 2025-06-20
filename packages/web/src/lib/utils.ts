import { type InventoryInfo } from "@warehouseoetzidev/core/src/entities/inventory";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type Paths<T> = PathImpl<T, keyof T>;

type PathImpl<T, K extends keyof T> = K extends string | number
  ? T[K] extends object
    ? T[K] extends ReadonlyArray<infer E> // Handle arrays: paths are for the element type
      ? `${K}` | Join<K, Paths<E>>
      : `${K}` | Join<K, Paths<T[K]>> // Handle objects: recursive call
    : `${K}` // Handle primitives: just the key
  : never;

type Join<K, P> = K extends string | number ? (P extends string | number ? `${K}.${P}` : never) : never;

export function createAbortablePromise<T extends unknown, E extends unknown>(
  executor: (resolve: (value: T) => void, reject: (reason: E) => void, signal: AbortSignal) => void,
) {
  const controller = new AbortController();
  const signal = controller.signal;

  const promise = new Promise((resolve, reject) => {
    // Add an event listener to the signal to reject the promise if aborted
    signal.addEventListener("abort", () => {
      reject(new DOMException("Promise aborted", "AbortError"));
    });

    // Execute the provided function, passing resolve, reject, and the signal
    executor(resolve, reject, signal);
  });

  return {
    promise,
    abort: () => controller.abort(),
  };
}

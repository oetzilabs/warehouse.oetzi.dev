import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type Join<K, P> = K extends string | number ? (P extends string | number ? `${K}.${P}` : never) : never;

export type Paths<T> = T extends object
  ? {
      [K in keyof T]-?: K extends string | number ? `${K}` | Join<K, Paths<T[K]>> : never;
    }[keyof T]
  : "";

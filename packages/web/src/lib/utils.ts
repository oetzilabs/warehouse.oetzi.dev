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

export const getStorageStockStatus = (storage: any) => {
  let hasLowStock = false;
  let hasNearMinStock = false;
  let hasBelowReorder = false;
  let hasOptimalStock = false;
  let hasProducts = false;

  const checkStorage = (s: any) => {
    if (s.products?.length > 0) {
      hasProducts = true;
      s.products.forEach((p: any) => {
        if (p.stock < p.minStock) hasLowStock = true;
        else if (p.stock < p.minStock * 1.5) hasNearMinStock = true;
        else if (p.stock < (p.reorderPoint ?? 0)) hasBelowReorder = true;
        else hasOptimalStock = true;
      });
    }

    if (s.children?.length > 0) {
      s.children.forEach(checkStorage);
    }
  };

  checkStorage(storage);

  if (hasLowStock) return "low";
  if (hasNearMinStock) return "near-min";
  if (hasBelowReorder) return "below-reorder";
  if (hasOptimalStock) return "optimal";
  if (hasProducts) return "has-products";
  return "empty";
};

export type StorageStockStatus = ReturnType<typeof getStorageStockStatus>;

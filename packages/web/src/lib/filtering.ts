import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { Accessor, createMemo } from "solid-js";

dayjs.extend(isBetween);

export type DateFilter =
  | "start_of_week"
  | "start_of_month"
  | "start_of_year"
  | "previous_week"
  | "previous_month"
  | "previous_year"
  | "custom"
  | "clear";
export type SortDirection = "asc" | "desc";
export type SortVariant<T> = {
  field: string;
  label: string;
  fn: (a: T, b: T) => number;
};

export interface FilterConfig<T> {
  dateRange: {
    start: Date;
    end: Date;
    preset: DateFilter;
  };
  search: {
    term: string;
    fields?: (keyof T)[];
  };
  sort: {
    default: string;
    direction: SortDirection;
    current: string;
    variants: SortVariant<T>[];
  };
}

export type WithDates = object & {
  createdAt: Date;
  updatedAt: Date | null;
  deletedAt: Date | null;
};

export function useFilter<T extends WithDates>(data: Accessor<T[]>, config: FilterConfig<T>) {
  return createMemo(() => {
    let filtered = data();

    const { start, end, preset } = config.dateRange;
    if (preset === "start_of_week") {
      filtered = filtered.filter((item) => {
        const date = (item as any).createdAt || (item as any).date;
        return dayjs(date).isAfter(dayjs().subtract(1, "week"));
      });
    } else if (preset === "start_of_month") {
      filtered = filtered.filter((item) => {
        const date = (item as any).createdAt || (item as any).date;
        return dayjs(date).isAfter(dayjs().subtract(1, "month"));
      });
    } else if (preset === "start_of_year") {
      filtered = filtered.filter((item) => {
        const date = (item as any).createdAt || (item as any).date;
        return dayjs(date).isAfter(dayjs().subtract(1, "year"));
      });
    } else if (preset === "custom" && start && end) {
      filtered = filtered.filter((item) => {
        const date = (item as any).createdAt || (item as any).date;
        return dayjs(date).isBetween(start, end, "day", "[]");
      });
    } else if (preset === "previous_week") {
      filtered = filtered.filter((item) => {
        const date = (item as any).createdAt || (item as any).date;
        return dayjs(date).isBefore(dayjs().subtract(1, "week"));
      });
    } else if (preset === "previous_month") {
      filtered = filtered.filter((item) => {
        const date = (item as any).createdAt || (item as any).date;
        return dayjs(date).isBefore(dayjs().subtract(1, "month"));
      });
    } else if (preset === "previous_year") {
      filtered = filtered.filter((item) => {
        const date = (item as any).createdAt || (item as any).date;
        return dayjs(date).isBefore(dayjs().subtract(1, "year"));
      });
    }

    const term = config.search.term.toLowerCase();
    filtered = filtered.filter((item) => {
      if (config.search?.fields) {
        return config.search.fields.some((field) => String(item[field]).toLowerCase().includes(term));
      }
      return JSON.stringify(item).toLowerCase().includes(term);
    });

    const currentVariant = config.sort.variants.find((v) => v.field === (config.sort.current || config.sort.default));
    if (currentVariant) {
      filtered.sort((a, b) => {
        const direction = config.sort.direction === "asc" ? 1 : -1;
        return direction * currentVariant.fn(a, b);
      });
    }

    return filtered;
  });
}

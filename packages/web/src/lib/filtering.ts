import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import Fuse, { IFuseOptions } from "fuse.js"; // Import Fuse
import { Accessor, createMemo } from "solid-js";

dayjs.extend(isBetween);

export type DateFilter =
  | "today"
  | "start_of_quarter"
  | "specific_quarter"
  | "last_quarter"
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

export type FilterVariant<T> = {
  type: string;
  label: string;
  fn: (item: T) => boolean;
};

export type FilterConfig<T> = {
  disabled: Accessor<boolean>;
  dateRange: {
    start: Date;
    end: Date;
    preset: DateFilter;
  };
  search: {
    term: string;
    fields?: (keyof T)[];
    // Add Fuse.js options here
    fuseOptions?: IFuseOptions<T>;
  };
  sort: {
    default: string;
    direction: SortDirection;
    current: string;
    variants: SortVariant<T>[];
  };
  filter: {
    default: string | null;
    current: string | null;
    variants: FilterVariant<T>[];
  };
  itemKey?: keyof T; // Add this new property
};

export type WithDates = object & {
  createdAt: Date;
  updatedAt?: Date | null;
  deletedAt?: Date | null;
};
export type WithSimpleDates = object & {
  date: Date;
};

export function useFilter<T extends WithDates>(data: Accessor<T[]>, config: FilterConfig<T>) {
  const fuse = createMemo(() => {
    const list = data();
    const options: IFuseOptions<T> = {
      // Basic options - adjust as needed
      isCaseSensitive: false,
      // includeScore: true, // Uncomment to get a score for each match
      // includeMatches: true, // Uncomment to see which parts matched
      threshold: 0.4, // Adjust this threshold (0 is exact, 1 is anything)
      // location: 0, // Start location
      // distance: 100, // Max distance from location
      // maxPatternLength: 32,
      minMatchCharLength: 1,
      // Add these keys to search through nested order properties
      keys: ["order.title", "order.description", "order.status", "order.prods.product.name", "order.prods.product.sku"],
      ...config.search.fuseOptions, // Allow overriding options
    };
    return new Fuse(list, options);
  });

  return createMemo(() => {
    let filtered = [...data()]; // Create a new array to avoid mutations
    if (config.disabled()) return filtered;

    const { start, end, preset } = config.dateRange;

    // Fix date filtering by accessing the nested createdAt
    if (preset !== "clear") {
      filtered = filtered.filter((item) => {
        // Get the date based on itemKey or fallback to item's createdAt
        const date = config.itemKey ? (item[config.itemKey] as any)?.createdAt : item.createdAt;
        if (!date) return true;

        switch (preset) {
          case "start_of_week":
            return dayjs(date).isAfter(dayjs().subtract(1, "week"));
          case "start_of_month":
            return dayjs(date).isAfter(dayjs().subtract(1, "month"));
          case "start_of_year":
            return dayjs(date).isAfter(dayjs().subtract(1, "year"));
          case "previous_week":
            return dayjs(date).isBefore(dayjs().subtract(1, "week"));
          case "previous_month":
            return dayjs(date).isBefore(dayjs().subtract(1, "month"));
          case "previous_year":
            return dayjs(date).isBefore(dayjs().subtract(1, "year"));
          case "custom":
            return start && end ? dayjs(date).isBetween(start, end, "day", "[]") : true;
          default:
            return true;
        }
      });
    }

    const term = config.search.term.toLowerCase();
    // Use Fuse.js for searching
    if (term) {
      // Fuse.js search returns an array of result objects
      // We map these back to your original data objects
      filtered = fuse()
        .search(term)
        .map((result) => result.item);
    }

    // Completely revamped sorting logic
    const currentVariant = config.sort.variants.find((v) => v.field === config.sort.current);
    if (currentVariant) {
      filtered.sort((a, b) => {
        const result = currentVariant.fn(a, b);
        // Ensure we're returning -1, 0, or 1 for consistent sorting
        if (result === 0) return 0;
        const direction = config.sort.direction === "asc" ? 1 : -1;
        return result > 0 ? direction : -direction;
      });
    }

    // Custom Filtering
    if (config.filter.variants.length > 0) {
      const currentFilter = config.filter.current;
      if (currentFilter) {
        filtered = filtered.filter((item) =>
          config.filter.variants
            .filter((filterFn) => filterFn.type === currentFilter)
            .every((filterFn) => filterFn.fn(item)),
        );
        console.log(filtered);
      }
    }

    return filtered;
  });
}

export function useSimpleDateFilter<T extends WithSimpleDates>(data: Accessor<T[]>, config: FilterConfig<T>) {
  // Create a memoized Fuse instance
  const fuse = createMemo(() => {
    const list = data(); // Fuse works on the list itself
    const options: IFuseOptions<T> = {
      // Basic options - adjust as needed
      isCaseSensitive: false,
      // includeScore: true, // Uncomment to get a score for each match
      // includeMatches: true, // Uncomment to see which parts matched
      threshold: 0.4, // Adjust this threshold (0 is exact, 1 is anything)
      // location: 0, // Start location
      // distance: 100, // Max distance from location
      // maxPatternLength: 32,
      minMatchCharLength: 1,
      keys: config.search.fields ? config.search.fields.map(String) : Object.keys(list[0] || {}), // Use specified fields or all keys
      ...config.search.fuseOptions, // Allow overriding options
    };
    return new Fuse(list, options);
  });

  return createMemo(() => {
    let filtered = data();
    if (config.disabled()) return filtered;

    const { start, end, preset } = config.dateRange;
    if (preset === "today") {
      filtered = filtered.filter((item) => {
        const date = (item as any).date || (item as any).date;
        return dayjs(date).isSame(dayjs(), "day");
      });
    } else if (preset === "start_of_week") {
      filtered = filtered.filter((item) => {
        const date = (item as any).date || (item as any).date;
        return dayjs(date).isAfter(dayjs().subtract(1, "week"));
      });
    } else if (preset === "start_of_month") {
      filtered = filtered.filter((item) => {
        const date = item.date;
        return dayjs(date).isAfter(dayjs().subtract(1, "month"));
      });
    } else if (preset === "start_of_year") {
      filtered = filtered.filter((item) => {
        const date = item.date;
        return dayjs(date).isAfter(dayjs().subtract(1, "year"));
      });
    } else if (preset === "custom" && start && end) {
      filtered = filtered.filter((item) => {
        const date = item.date;
        return dayjs(date).isBetween(start, end, "day", "[]");
      });
    } else if (preset === "previous_week") {
      filtered = filtered.filter((item) => {
        const date = item.date;
        return dayjs(date).isBefore(dayjs().subtract(1, "week"));
      });
    } else if (preset === "previous_month") {
      filtered = filtered.filter((item) => {
        const date = item.date;
        return dayjs(date).isBefore(dayjs().subtract(1, "month"));
      });
    } else if (preset === "previous_year") {
      filtered = filtered.filter((item) => {
        const date = item.date;
        return dayjs(date).isBefore(dayjs().subtract(1, "year"));
      });
    }

    const term = config.search.term.toLowerCase();
    // Use Fuse.js for searching
    if (term) {
      // Fuse.js search returns an array of result objects
      // We map these back to your original data objects
      filtered = fuse()
        .search(term)
        .map((result) => result.item);
    }

    const currentVariant = config.sort.variants.find((v) => v.field === (config.sort.current || config.sort.default));
    if (currentVariant) {
      filtered.sort((a, b) => {
        const result = currentVariant.fn(a, b);
        return config.sort.direction === "asc" ? result : -result;
      });
    }

    if (config.filter.variants.length > 0) {
      const currentFilter = config.filter.current;
      if (currentFilter) {
        filtered = filtered.filter((item) =>
          config.filter.variants
            .filter((filterFn) => filterFn.type === currentFilter)
            .every((filterFn) => filterFn.fn(item)),
        );
        console.log(filtered);
      }
    }

    return filtered;
  });
}

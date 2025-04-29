export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const REVALIDATION_INTERVAL = {
  short: 2000,
  medium: 5000,
  long: 10000,
} as const;

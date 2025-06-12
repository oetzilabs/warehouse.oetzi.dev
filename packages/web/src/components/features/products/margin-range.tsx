import type { ProductSupplierInfo } from "@warehouseoetzidev/core/src/entities/products";

type MarginRangeProps = {
  suppliers: ProductSupplierInfo[];
  sellingPrice: number;
};

export const MarginRange = (props: MarginRangeProps) => {
  const latestPrices = props.suppliers.map((supplier) => {
    const latest = supplier.priceHistory.sort((a, b) => b.effectiveDate.getTime() - a.effectiveDate.getTime())[0];
    return latest?.supplierPrice ?? 0;
  });

  // Get unique prices (remove duplicates)
  const uniquePrices = [...new Set(latestPrices)];

  // If only one unique price, show single margin
  if (uniquePrices.length === 1) {
    const margin = ((props.sellingPrice - uniquePrices[0]) / props.sellingPrice) * 100;
    return `${margin.toFixed(1)}`;
  }

  // Otherwise calculate range as before
  const lowestPrice = Math.min(...latestPrices);
  const highestPrice = Math.max(...latestPrices);

  const lowestMargin = ((props.sellingPrice - highestPrice) / props.sellingPrice) * 100;
  const highestMargin = ((props.sellingPrice - lowestPrice) / props.sellingPrice) * 100;

  return `${lowestMargin.toFixed(1)}% - ${highestMargin.toFixed(1)}`;
};

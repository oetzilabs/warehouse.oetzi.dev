import { action, json, query } from "@solidjs/router";
import { BrandLive, BrandService } from "@warehouseoetzidev/core/src/entities/brands";
import { InventoryLive, InventoryService } from "@warehouseoetzidev/core/src/entities/inventory";
import { OrganizationLive, OrganizationService } from "@warehouseoetzidev/core/src/entities/organizations";
import {
  OrganizationProductInfo,
  PriceHistory,
  ProductLive,
  ProductService,
} from "@warehouseoetzidev/core/src/entities/products";
import { ProductNotFound } from "@warehouseoetzidev/core/src/entities/products/errors";
import {
  ProductLabelsLive,
  ProductLabelsService,
  ProductLabelWithoutProductInfo,
} from "@warehouseoetzidev/core/src/entities/products/labels";
import { NewProductFormData } from "@warehouseoetzidev/core/src/entities/products/schemas";
import { SupplierLive } from "@warehouseoetzidev/core/src/entities/suppliers";
import { Effect } from "effect";
import { run, runWithSession } from "./utils";

export const getProducts = query(() => {
  "use server";
  return run(
    "@query/products",
    Effect.gen(function* (_) {
      const productsService = yield* ProductService;
      const products = yield* productsService.findByOrganizationId();
      return json(products);
    }).pipe(Effect.provide(ProductLive)),
    json([] as OrganizationProductInfo[]),
  );
}, "products");

export const getProductLabels = query(() => {
  "use server";
  return run(
    "@query/labels",
    Effect.gen(function* (_) {
      const productLabelsService = yield* ProductLabelsService;
      const labels = yield* productLabelsService.findAllWithoutProducts();
      return json(labels);
    }).pipe(Effect.provide(ProductLabelsLive)),
    json([] as ProductLabelWithoutProductInfo),
  );
}, "labels");

export const getProductById = query((pid: string) => {
  "use server";
  return run(
    "@query/product-by-id",
    Effect.gen(function* (_) {
      const productService = yield* ProductService;
      const orgService = yield* OrganizationService;
      const product = yield* productService.findById(pid);
      const orgP = yield* orgService.findProductById(pid);
      const stock = yield* productService.getStockCount(product.id);

      return json({ ...product, isInSortiment: orgP.deletedAt === null, stock });
    }).pipe(Effect.provide(ProductLive), Effect.provide(OrganizationLive)),
    (errors) => json(errors),
  );
}, "product-by-id");

export const deleteProduct = action((id: string) => {
  "use server";
  return run(
    "@action/delete-product",
    Effect.gen(function* (_) {
      const productService = yield* ProductService;
      const orgService = yield* OrganizationService;
      const product = yield* productService.findById(id);
      const result = yield* orgService.removeProduct(product.id);
      return json(result);
    }).pipe(Effect.provide(ProductLive), Effect.provide(OrganizationLive)),
    (errors) => json(errors),
  );
});

export const downloadProductSheet = action(
  (
    pid: string,
    options: {
      size: "A4" | "A5";
      type: "full" | "conditions" | "labels" | "certifications" | "map";
    },
  ) => {
    "use server";
    return runWithSession(
      "@action/download-product-sheet",
      Effect.fn(
        function* (session) {
          const productService = yield* ProductService;
          const product = yield* productService.findById(pid);
          const orgService = yield* OrganizationService;
          const org = yield* orgService.findById(session.current_organization_id);

          const pdf = yield* productService.generatePDF(product, org, {
            type: options.type === "full" ? "full" : [options.type],
            page: { size: options.size, orientation: "portrait" },
          });

          return json({
            pdf: pdf.toString("base64"),
            name: product.name,
          });
        },
        (effect) =>
          effect.pipe(Effect.provide(ProductLive), Effect.provide(OrganizationLive), Effect.provide(SupplierLive)),
      ),
      (errors) => json(errors),
    );
  },
);

export const addLabelsToProduct = action((id: string, labels: string[]) => {
  "use server";
  return run(
    "@action/add-labels-to-product",
    Effect.gen(function* (_) {
      const service = yield* ProductService;
      const product = yield* service.findById(id);
      const prodlabels = product.labels.map((l) => l.label.id);
      const toAdd = labels.filter((l) => !prodlabels.includes(l));
      for (const label of toAdd) {
        yield* service.addLabel(id, label);
      }

      const labelsToRemove = prodlabels.filter((l) => !labels.includes(l));
      for (const label of labelsToRemove) {
        yield* service.removeLabel(id, label);
      }

      return json(true, {
        revalidate: [getProductById.keyFor(id), getProducts.key],
      });
    }).pipe(Effect.provide(ProductLive)),
    json(false, {
      revalidate: [getProductById.keyFor(id), getProducts.key],
    }),
  );
});

export const removeLabelsFromProduct = action((id: string, labelId: string) => {
  "use server";
  return run(
    "@action/remove-labels-from-product",
    Effect.gen(function* (_) {
      const service = yield* ProductService;
      const product = yield* service.findById(id);
      if (!product) {
        return yield* Effect.fail(new ProductNotFound({ id }));
      }

      yield* service.removeLabel(id, labelId);

      return json(true, {
        revalidate: [getProductById.keyFor(id), getProducts.key],
      });
    }).pipe(Effect.provide(ProductLive)),
    json(false, {
      revalidate: [getProductById.keyFor(id), getProducts.key],
    }),
  );
});

export const getProductBrands = query(() => {
  "use server";
  return run(
    "@query/product-brands",
    Effect.gen(function* (_) {
      const brandsService = yield* BrandService;
      const brands = yield* brandsService.all();
      return json(brands);
    }).pipe(Effect.provide(BrandLive)),
    json([]),
  );
}, "brands");

export const assignBrand = action((id: string, brandId: string) => {
  "use server";
  return run(
    "@action/assign-brand",
    Effect.gen(function* (_) {
      const service = yield* ProductService;
      const product = yield* service.findById(id);
      if (!product) {
        return yield* Effect.fail(new ProductNotFound({ id }));
      }

      const result = yield* service.update(product.id, { id: product.id, brand_id: brandId });
      return json(result, {
        revalidate: [getProductById.keyFor(id), getProducts.key],
      });
    }).pipe(Effect.provide(ProductLive)),
    (errors) =>
      json(errors, {
        revalidate: [getProductById.keyFor(id), getProducts.key],
      }),
  );
});

export const updateProductStock = action(
  (
    id: string,
    {
      minimumStock,
      maximumStock,
      reorderPoint,
    }: {
      minimumStock: number;
      maximumStock: number;
      reorderPoint: number;
    },
  ) => {
    "use server";
    return run(
      "@action/update-product-stock",
      Effect.gen(function* (_) {
        const orgService = yield* OrganizationService;
        const productService = yield* ProductService;
        const product = yield* productService.findById(id);

        const result = yield* orgService.updateProduct(product.id, { minimumStock, maximumStock, reorderPoint });
        return json(result, {
          revalidate: [getProductById.keyFor(id), getProducts.key],
        });
      }).pipe(Effect.provide(OrganizationLive), Effect.provide(ProductLive)),
      (errors) =>
        json(errors, {
          revalidate: [getProductById.keyFor(id), getProducts.key],
        }),
    );
  },
);

export const reAddProduct = action((id: string) => {
  "use server";
  return run(
    "@action/re-add-product",
    Effect.gen(function* (_) {
      const service = yield* ProductService;
      const product = yield* service.findById(id);
      const orgService = yield* OrganizationService;
      const p = yield* orgService.reAddProduct(product.id);
      return json(p, {
        revalidate: [getProductById.keyFor(id), getProducts.key],
      });
    }).pipe(Effect.provide(ProductLive), Effect.provide(OrganizationLive)),
    (errors) =>
      json(errors, {
        revalidate: [getProductById.keyFor(id), getProducts.key],
      }),
  );
});

export const getLatestPricesByProductId = query((id: string) => {
  "use server";
  return run(
    "@query/latest-prices-by-product-id",
    Effect.gen(function* (_) {
      const productService = yield* ProductService;
      const product = yield* productService.findById(id);
      const currentPrices = yield* productService.getPriceHistory(product.id);
      return json(currentPrices);
    }).pipe(Effect.provide(ProductLive)),
    json({
      latestSellingPrice: {
        organizationId: "",
        productId: "",
        effectiveDate: new Date(),
        sellingPrice: 0,
        currency: "",
      },
      latestPurchasePrices: [
        {
          supplierId: "",
          productId: "",
          effectiveDate: new Date(),
          supplierPrice: 0,
          currency: "",
        },
      ],
    } as PriceHistory),
  );
}, "product-by-id");

export const clearBrand = action((id: string) => {
  "use server";
  return run(
    "",
    Effect.gen(function* (_) {
      const service = yield* ProductService;
      const product = yield* service.findById(id);
      if (!product) {
        return yield* Effect.fail(new ProductNotFound({ id }));
      }

      const result = yield* service.update(product.id, { id: product.id, brand_id: null });

      return json(result, {
        revalidate: [getProductById.keyFor(id), getProducts.key],
      });
    }).pipe(Effect.provide(ProductLive)),
    (errors) =>
      json(errors, {
        revalidate: [getProductById.keyFor(id), getProducts.key],
      }),
  );
});

export const getProductStock = query((id: string) => {
  "use server";
  return run(
    "@query/product-stock-by-id",
    Effect.gen(function* (_) {
      const inventoryService = yield* InventoryService;
      const stock = yield* inventoryService.getStockForProducts([id]);

      return json(stock[0].stock);
    }).pipe(Effect.provide(InventoryLive)),
    json(0),
  );
}, "product-stock-by-id");

export const createProduct = action((data: NewProductFormData) => {
  "use server";
  return run(
    "@action/create-product",
    Effect.gen(function* (_) {
      const { product, ...additional } = data;
      const service = yield* ProductService;

      const result = yield* service.create(product, additional);
      return json(result, {
        revalidate: [getProductById.keyFor(result.id), getProducts.key],
      });
    }).pipe(Effect.provide(ProductLive)),
    (errors) =>
      json(errors, {
        revalidate: [getProductById.key, getProducts.key],
      }),
  );
});

import { action, json, query, redirect } from "@solidjs/router";
import { ProductLive, ProductService } from "@warehouseoetzidev/core/src/entities/products";
import { ProductNotDeleted, ProductNotFound } from "@warehouseoetzidev/core/src/entities/products/errors";
import { ProductLabelsLive, ProductLabelsService } from "@warehouseoetzidev/core/src/entities/products/labels";
import { WarehouseLive, WarehouseService } from "@warehouseoetzidev/core/src/entities/warehouses";
import { WarehouseNotFound } from "@warehouseoetzidev/core/src/entities/warehouses/errors";
import { Cause, Chunk, Effect, Exit } from "effect";
import { withSession } from "./session";

export const getProducts = query(async () => {
  "use server";
  const auth = await withSession();
  if (!auth) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const user = auth[0];
  if (!user) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const session = auth[1];
  if (!session) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const orgId = session.current_organization_id;
  if (!orgId) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const products = await Effect.runPromiseExit(
    Effect.gen(function* (_) {
      const productsService = yield* _(ProductService);
      const products = yield* productsService.findByOrganizationId(orgId);
      return products;
    }).pipe(Effect.provide(ProductLive)),
  );
  return Exit.match(products, {
    onSuccess: (prods) => {
      return json(prods);
    },
    onFailure: (cause) => {
      console.log(cause);
      const causes = Cause.failures(cause);
      const errors = Chunk.toReadonlyArray(causes).map((c) => {
        return c.message;
      });
      throw new Error(`Some error(s) occurred: ${errors.join(", ")}`);
    },
  });
}, "order-by-warehouse-id");

export const getProductLabels = query(async () => {
  "use server";
  const auth = await withSession();
  if (!auth) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const user = auth[0];
  if (!user) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const labels = await Effect.runPromise(
    Effect.gen(function* (_) {
      const productLabelsService = yield* _(ProductLabelsService);
      const labels = yield* productLabelsService.findAllWithoutProducts();
      return labels;
    }).pipe(Effect.provide(ProductLabelsLive)),
  );
  return labels;
}, "labels");

export const getProductById = query(async (pid: string) => {
  "use server";
  const auth = await withSession();
  if (!auth) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const user = auth[0];
  if (!user) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const session = auth[1];
  if (!session) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const product = await Effect.runPromise(
    Effect.gen(function* (_) {
      const productService = yield* _(ProductService);
      const product = yield* productService.findById(pid);
      if (!product) {
        return yield* Effect.fail(new ProductNotFound({ id: pid }));
      }
      return product;
    }).pipe(Effect.provide(ProductLive), Effect.provide(WarehouseLive)),
  );
  return product;
}, "product-by-id");

export const deleteProduct = action(async (id: string) => {
  "use server";
  const auth = await withSession();
  if (!auth) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const user = auth[0];
  if (!user) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const session = auth[1];
  if (!session) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const whid = session.current_warehouse_id;
  if (!whid) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const product = await Effect.runPromise(
    Effect.gen(function* (_) {
      const productService = yield* _(ProductService);
      const warehouseService = yield* _(WarehouseService);
      const wh = yield* warehouseService.findById(whid);
      if (!wh) {
        return yield* Effect.fail(new WarehouseNotFound({ id: whid }));
      }
      const product = yield* productService.findById(id);
      if (!product) {
        return yield* Effect.fail(new ProductNotFound({ id }));
      }
      const p = yield* productService.safeRemove(product.id);
      if (!p) {
        return yield* Effect.fail(new ProductNotDeleted({ id }));
      }
      // remove the product from the warehouse
      // yield* warehouseService.removeProduct(wh.id, product.id);
      return p;
    }).pipe(Effect.provide(ProductLive), Effect.provide(WarehouseLive)),
  );
  return json(product, {
    revalidate: [getProductById.keyFor(product.id), getProducts.key],
    // headers: {
    //   Location: `/warehouse/${whid}/products`,
    // },
    // status: 303,
  });
});

export const downloadProductSheet = action(async (pid: string) => {
  "use server";
  const auth = await withSession();
  if (!auth) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const user = auth[0];
  if (!user) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const session = auth[1];
  if (!session) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const productExit = await Effect.runPromiseExit(
    Effect.gen(function* (_) {
      const productService = yield* _(ProductService);
      const product = yield* productService.findById(pid);
      if (!product) {
        return yield* Effect.fail(new ProductNotFound({ id: pid }));
      }
      const pdf = yield* productService.generatePDF(product);
      return {
        pdf,
        name: product.name,
      };
    }).pipe(Effect.provide(ProductLive)),
  );

  return Exit.match(productExit, {
    onSuccess: (data) => {
      return new Response(data.pdf, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename=${data.name}.pdf`,
        },
      });
    },
    onFailure: (cause) => {
      console.log(cause);
      const causes = Cause.failures(cause);
      const errors = Chunk.toReadonlyArray(causes).map((c) => {
        return c.message;
      });
      throw new Error(`Some error(s) occurred: ${errors.join(", ")}`);
    },
  });
});

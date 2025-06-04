import { action, json, query, redirect } from "@solidjs/router";
import { BrandLive, BrandService } from "@warehouseoetzidev/core/src/entities/brands";
import { OrganizationLive, OrganizationService } from "@warehouseoetzidev/core/src/entities/organizations";
import {
  OrganizationNotFound,
  OrganizationProductNotAdded,
  OrganizationProductNotFound,
} from "@warehouseoetzidev/core/src/entities/organizations/errors";
import { ProductLive, ProductService } from "@warehouseoetzidev/core/src/entities/products";
import { ProductNotFound } from "@warehouseoetzidev/core/src/entities/products/errors";
import { ProductLabelsLive, ProductLabelsService } from "@warehouseoetzidev/core/src/entities/products/labels";
import { SupplierLive, SupplierService } from "@warehouseoetzidev/core/src/entities/suppliers";
import { SupplierNotFound } from "@warehouseoetzidev/core/src/entities/suppliers/errors";
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
  const orgId = session.current_organization_id;
  if (!orgId) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const product = await Effect.runPromise(
    Effect.gen(function* (_) {
      const orgService = yield* _(OrganizationService);
      const org = yield* orgService.findById(orgId);
      if (!org) {
        return yield* Effect.fail(new OrganizationNotFound({ id: orgId }));
      }
      const productService = yield* _(ProductService);
      const product = yield* productService.findById(pid);
      if (!product) {
        return yield* Effect.fail(new ProductNotFound({ id: pid }));
      }
      const orgP = yield* orgService.findProductById(orgId, pid);
      if (!orgP) {
        return yield* Effect.fail(new OrganizationProductNotFound({ productId: pid, organizationId: orgId }));
      }

      const stock = yield* productService.getStockCount(product.id, orgId);

      return { ...product, isInSortiment: orgP.deletedAt === null, stock };
    }).pipe(Effect.provide(ProductLive), Effect.provide(OrganizationLive)),
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
  const orgId = session.current_organization_id;
  if (!orgId) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }

  const product = await Effect.runPromise(
    Effect.gen(function* (_) {
      const productService = yield* _(ProductService);
      const orgService = yield* _(OrganizationService);
      const org = yield* orgService.findById(orgId);
      if (!org) {
        return yield* Effect.fail(new OrganizationNotFound({ id: orgId }));
      }
      const product = yield* productService.findById(id);
      if (!product) {
        return yield* Effect.fail(new ProductNotFound({ id }));
      }
      const p = yield* orgService.removeProduct(org.id, product.id);
      // remove the product from the warehouse
      // yield* warehouseService.removeProduct(wh.id, product.id);
      return p;
    }).pipe(Effect.provide(ProductLive), Effect.provide(OrganizationLive)),
  );
  return json(product, {
    revalidate: [getProductById.keyFor(id), getProducts.key],
  });
});

export const downloadProductSheet = action(
  async (
    pid: string,
    options: {
      size: "A4" | "A5";
      type: "full" | "conditions" | "labels" | "certifications" | "map";
    },
  ) => {
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
    const productExit = await Effect.runPromiseExit(
      Effect.gen(function* (_) {
        const productService = yield* _(ProductService);
        const product = yield* productService.findById(pid);
        if (!product) {
          return yield* Effect.fail(new ProductNotFound({ id: pid }));
        }
        const orgService = yield* _(OrganizationService);
        const org = yield* orgService.findById(orgId);
        if (!org) {
          return yield* Effect.fail(new OrganizationNotFound({ id: orgId }));
        }

        const pdf = yield* productService.generatePDF(product, org, {
          type: options.type === "full" ? "full" : [options.type],
          page: { size: options.size, orientation: "portrait" },
        });

        return yield* Effect.succeed({
          pdf: pdf.toString("base64"),
          name: product.name,
        });
      }).pipe(Effect.provide(ProductLive), Effect.provide(OrganizationLive), Effect.provide(SupplierLive)),
    );

    return Exit.match(productExit, {
      onSuccess: (data) => {
        return json(data);
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
  },
);

export const reAddProduct = action(async (id: string) => {
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
  const product = await Effect.runPromise(
    Effect.gen(function* (_) {
      const orgService = yield* _(OrganizationService);
      const org = yield* orgService.findById(orgId);
      if (!org) {
        return yield* Effect.fail(new OrganizationNotFound({ id: orgId }));
      }
      const productService = yield* _(ProductService);
      const product = yield* productService.findById(id);
      if (!product) {
        return yield* Effect.fail(new ProductNotFound({ id }));
      }

      const p = yield* orgService.addProduct(org.id, product.id);
      if (!p) {
        return yield* Effect.fail(new OrganizationProductNotAdded({ productId: id, organizationId: orgId }));
      }

      return p;
    }).pipe(Effect.provide(ProductLive), Effect.provide(OrganizationLive)),
  );
  return json(product, {
    revalidate: [getProductById.keyFor(id), getProducts.key],
  });
});

export const addLabelsToProduct = action(async (id: string, labels: string[]) => {
  "use server";
  const auth = await withSession();
  if (!auth) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const [user, session] = auth;
  if (!session.current_organization_id) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }

  const result = await Effect.runPromise(
    Effect.gen(function* (_) {
      const service = yield* _(ProductService);
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

      return true;
    }).pipe(Effect.provide(ProductLive)),
  );
  return json(result, {
    revalidate: [getProductById.keyFor(id), getProducts.key],
  });
});

export const removeLabelsFromProduct = action(async (id: string, labelId: string) => {
  "use server";
  const auth = await withSession();
  if (!auth) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const [user, session] = auth;
  if (!session.current_organization_id) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }

  const result = await Effect.runPromise(
    Effect.gen(function* (_) {
      const service = yield* _(ProductService);
      const product = yield* service.findById(id);
      if (!product) {
        return yield* Effect.fail(new ProductNotFound({ id }));
      }

      yield* service.removeLabel(id, labelId);

      return true;
    }).pipe(Effect.provide(ProductLive)),
  );
  return json(result, {
    revalidate: [getProductById.keyFor(id), getProducts.key],
  });
});

export const getProductBrands = query(async () => {
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
  const brands = await Effect.runPromise(
    Effect.gen(function* (_) {
      const brandsService = yield* _(BrandService);
      const brands = yield* brandsService.all();
      return brands;
    }).pipe(Effect.provide(BrandLive)),
  );
  return brands;
}, "brands");

export const assignBrand = action(async (id: string, brandId: string) => {
  "use server";
  const auth = await withSession();
  if (!auth) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const [user, session] = auth;
  if (!session.current_organization_id) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }

  const result = await Effect.runPromise(
    Effect.gen(function* (_) {
      const service = yield* _(ProductService);
      const product = yield* service.findById(id);
      if (!product) {
        return yield* Effect.fail(new ProductNotFound({ id }));
      }

      return yield* service.update(product.id, { id: product.id, brand_id: brandId });
    }).pipe(Effect.provide(ProductLive)),
  );
  return json(result, {
    revalidate: [getProductById.keyFor(id), getProducts.key],
  });
});

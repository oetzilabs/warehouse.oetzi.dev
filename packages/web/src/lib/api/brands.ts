import { action, json } from "@solidjs/router";
import { BrandLive, BrandService } from "@warehouseoetzidev/core/src/entities/brands";
import { Effect } from "effect";
import { getProductBrands } from "./products";
import { run } from "./utils";

export const createBrand = action((data: { name: string; description: string }) => {
  "use server";
  return run(
    "@action/create-brand",
    Effect.gen(function* (_) {
      const service = yield* BrandService;
      const code = yield* service.generateCode(data.name);
      const result = yield* service.create({ ...data, code });
      // connect the brand to the organization

      return json(result, {
        revalidate: [getProductBrands.key],
      });
    }).pipe(Effect.provide(BrandLive)),
    (e) =>
      json(
        {
          name: "@action/create-brand",
          message: e.message,
        },
        {
          status: 400,
          statusText: "Bad Request",
        },
      ),
  );
});

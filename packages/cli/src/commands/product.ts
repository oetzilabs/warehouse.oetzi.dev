import { Args, Command, Options } from "@effect/cli";
import { FacilityService } from "@warehouseoetzidev/core/src/entities/facilities";
import { OrganizationId } from "@warehouseoetzidev/core/src/entities/organizations/id";
import { ProductService } from "@warehouseoetzidev/core/src/entities/products";
import { StorageService } from "@warehouseoetzidev/core/src/entities/storages";
import { WarehouseService } from "@warehouseoetzidev/core/src/entities/warehouses";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { Cause, Console, Effect, Exit, Layer, Option } from "effect";
import { formatOption, keysOption, orgOption, output } from "./shared";

dayjs.extend(localizedFormat);

const productIdOption = Options.text("id").pipe(Options.withDescription("The product ID"));

const findByNameOption = Options.text("name").pipe(
  Options.withDescription("Find an supplier by name"),
  Options.optional,
);

const findByDescriptionOption = Options.text("description").pipe(
  Options.withDescription("Find an supplier by description"),
  Options.optional,
);

export const productCommand = Command.make("product").pipe(
  Command.withSubcommands([
    Command.make(
      "find",
      {
        name: findByNameOption,
        description: findByDescriptionOption,
        format: formatOption,
        keys: keysOption,
      },
      Effect.fn("@warehouse/cli/product.find")(function* ({ name, description, format, keys }) {
        const repo = yield* ProductService;
        const n = Option.getOrUndefined(name);
        const d = Option.getOrUndefined(description);
        const products = yield* repo.findBy({ name: n, description: d });
        return yield* output(products, format, keys);
      }),
    ),
    Command.make(
      "list",
      {
        org: orgOption,
        format: formatOption,
        keys: keysOption,
      },
      Effect.fn("@warehouse/cli/product.list")(function* ({ org, format, keys }) {
        const repo = yield* ProductService;
        const prods = yield* repo.findByOrganizationId().pipe(Effect.provide(Layer.succeed(OrganizationId, org)));
        return yield* output(prods, format, keys);
      }),
    ),
    Command.make(
      "list-all",
      {
        format: formatOption,
        keys: keysOption,
      },
      Effect.fn("@warehouse/cli/product.list")(function* ({ format, keys }) {
        const repo = yield* ProductService;
        const products = yield* repo.all();
        return yield* output(products, format, keys);
      }),
    ),
    Command.make(
      "show",
      { productId: productIdOption, format: formatOption, keys: keysOption },
      Effect.fn("@warehouse/cli/product.show")(function* ({ productId, format, keys }) {
        const repo = yield* ProductService;
        const product = yield* repo.findByIdWithoutOrg(productId);
        return yield* output(product, format, keys);
      }),
    ),
    Command.make(
      "locate",
      { org: orgOption, productId: productIdOption, format: formatOption, keys: keysOption },
      Effect.fn("@warehouse/cli/product.locate")(function* ({ productId, format, keys, org }) {
        const repo = yield* ProductService;
        const product = yield* repo.findById(productId).pipe(Effect.provide(Layer.succeed(OrganizationId, org)));
        if (!product) return yield* output([], format, keys);
        const storages = product.space.flatMap((s) => s.storage);
        const storageSet = new Set(storages.map((s) => s.id));
        const filteredStorages = Array.from(storageSet);
        if (!filteredStorages.length) return yield* output([], format, keys);
        const storageRepo = yield* StorageService;
        const facService = yield* FacilityService;
        const whService = yield* WarehouseService;

        const locations = yield* Effect.all(filteredStorages.map((s) => storageRepo.locate(s))).pipe(
          Effect.provide(Layer.succeed(OrganizationId, org)),
        );
        const ls = yield* Effect.all(
          locations.flatMap(
            Effect.fn(function* (l) {
              const area = l[0].area;
              const ss = l.map((ll) => ({ id: ll.id, name: ll.name, barcode: ll.barcode ?? "N/A" }));
              if (!area) return ss;
              const fc = yield* facService.findById(area.warehouse_facility_id);
              const wh = yield* whService.findById(fc.warehouse_id);
              return [
                { id: fc.warehouse_id, name: wh.name, barcode: "N/A" },
                { id: fc.id, name: fc.name, barcode: "N/A" },
              ].concat(ss);
            }),
          ),
        ).pipe(Effect.provide(Layer.succeed(OrganizationId, org)));
        const locaWithProd: { id: string; name: string; barcode?: string }[][] = ls.map((l) =>
          l.concat({ id: product.id, name: product.name, barcode: product.barcode }),
        );

        return yield* Effect.all(
          locaWithProd.map((l) =>
            output(l.map((ll) => `'${ll.name}:${ll.barcode ?? "N/A"}'`).join(" -> "), format, keys),
          ),
        );

        // yield* output(locaWithProd, format, keys);
      }),
    ),
  ]),
);

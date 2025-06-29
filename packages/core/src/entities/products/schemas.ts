import { Schema } from "effect";

export const NewProductFormSchema = Schema.mutable(
  Schema.Struct({
    product: Schema.mutable(
      Schema.Struct({
        name: Schema.String,
        barcode: Schema.String,
        sku: Schema.String,
        description: Schema.String,
        dimensions: Schema.Struct({
          depth: Schema.Number,
          width: Schema.Number,
          height: Schema.Number,
          unit: Schema.Union(Schema.Literal("cm"), Schema.Literal("in")),
        }),
        weight: Schema.Struct({
          value: Schema.Number,
          unit: Schema.Union(Schema.Literal("kg"), Schema.Literal("lb")),
        }),
        customsTariffNumber: Schema.String,
        countryOfOrigin: Schema.String,
        brand_id: Schema.NullOr(Schema.String),
      }),
    ),
    price: Schema.mutable(Schema.Struct({ sellingPrice: Schema.Number, currency: Schema.String })),
    labels: Schema.mutable(Schema.Array(Schema.String)),
    certificates: Schema.mutable(Schema.Array(Schema.String)),
    conditions: Schema.mutable(Schema.Array(Schema.String)),
    suppliers: Schema.mutable(
      Schema.Array(
        Schema.Struct({
          supplier: Schema.String,
          purchasePrice: Schema.Number,
          currency: Schema.String,
        }),
      ),
    ),
    images: Schema.mutable(Schema.Array(Schema.instanceOf(File))),
  }),
);

export type NewProductFormData = Schema.Schema.Type<typeof NewProductFormSchema>;

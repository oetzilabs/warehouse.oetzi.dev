import { Schema } from "effect";

export const ProductPDFSchema = Schema.Struct({
  sku: Schema.String,
  name: Schema.String,
  description: Schema.NullOr(Schema.String),
  suppliers: Schema.Array(
    Schema.Struct({
      supplier: Schema.Struct({
        name: Schema.String,
        email: Schema.NullOr(Schema.String),
      }),
    }),
  ),
  stco: Schema.Array(
    Schema.Struct({
      condition: Schema.Struct({
        name: Schema.String,
        temperatureMin: Schema.NullOr(Schema.Number),
        temperatureMax: Schema.NullOr(Schema.Number),
        humidityMin: Schema.NullOr(Schema.Number),
        humidityMax: Schema.NullOr(Schema.Number),
        lightLevelMin: Schema.NullOr(Schema.Number),
        lightLevelMax: Schema.NullOr(Schema.Number),
      }),
    }),
  ),
  certs: Schema.Array(
    Schema.Struct({
      cert: Schema.Struct({
        name: Schema.String,
        certificationNumber: Schema.NullOr(Schema.String),
      }),
    }),
  ),
  labels: Schema.Array(
    Schema.Struct({
      label: Schema.Struct({
        name: Schema.String,
      }),
    }),
  ),
});

export type ProductPDF = typeof ProductPDFSchema.Type;

export const OrderPDFSchema = Schema.Struct({
  barcode: Schema.String,
  createdAt: Schema.Date,
  updatedAt: Schema.NullOr(Schema.Date),
  products: Schema.Array(
    Schema.Struct({
      product: Schema.Struct({
        name: Schema.String,
        sku: Schema.String,
        sellingPrice: Schema.Number,
        currency: Schema.String,
        organizations: Schema.Array(
          Schema.Struct({
            tg: Schema.NullOr(
              Schema.Struct({
                name: Schema.String,
                crs: Schema.Array(
                  Schema.Struct({
                    tr: Schema.Struct({
                      rate: Schema.Number,
                    }),
                  }),
                ),
              }),
            ),
          }),
        ),
      }),
      quantity: Schema.Number,
    }),
  ),
});

export type OrderPDF = typeof OrderPDFSchema.Type;

export const SalePDFSchema = Schema.Struct({
  barcode: Schema.String,
  createdAt: Schema.Date,
  updatedAt: Schema.NullOr(Schema.Date),
  customer: Schema.Struct({
    name: Schema.String,
    email: Schema.String,
  }),
  status: Schema.String,
  note: Schema.NullOr(Schema.String),
  items: Schema.Array(
    Schema.Struct({
      product: Schema.Struct({
        name: Schema.String,
        sku: Schema.String,
        currency: Schema.String,
        organizations: Schema.Array(
          Schema.Struct({
            tg: Schema.NullOr(
              Schema.Struct({
                name: Schema.String,
                crs: Schema.Array(
                  Schema.Struct({
                    tr: Schema.Struct({
                      rate: Schema.Number,
                    }),
                  }),
                ),
              }),
            ),
          }),
        ),
      }),
      quantity: Schema.Number,
      price: Schema.Number,
    }),
  ),
});

export type SalePDF = typeof SalePDFSchema.Type;

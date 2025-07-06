import { Schema } from "effect";

export const NewCatalogFormSchema = Schema.mutable(
  Schema.Struct({
    name: Schema.String,
    description: Schema.String,
    startDate: Schema.Date,
    endDate: Schema.Date,
    isActive: Schema.Boolean,
    products: Schema.mutable(
      Schema.Array(
        Schema.Struct({
          id: Schema.String,
          discount: Schema.Number,
          variant: Schema.Union(Schema.Literal("action"), Schema.Literal("display")),
        }),
      ),
    ),
  }),
);

export type NewCatalogFormData = Schema.Schema.Type<typeof NewCatalogFormSchema>;

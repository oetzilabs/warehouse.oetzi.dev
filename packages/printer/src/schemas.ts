import { Schema } from "effect";

const TextItem = Schema.Struct({
  content: Schema.String,
  font: Schema.optional(Schema.Literal("a", "b", "c", "A", "B", "C")),
  align: Schema.optional(Schema.Literal("lt", "ct", "rt", "LT", "CT", "RT")),
  style: Schema.optional(
    Schema.Literal(
      "",
      "b",
      "B",
      "normal",
      "i",
      "u",
      "u2",
      "iu",
      "iu2",
      "bu",
      "bu2",
      "bi",
      "biu",
      "biu2",
      "NORMAL",
      "I",
      "U",
      "U2",
      "IU",
      "IU2",
      "BU",
      "BU2",
      "BI",
      "BIU",
      "BIU2",
    ),
  ),
  size: Schema.optional(Schema.mutable(Schema.Tuple(Schema.Number, Schema.Number))),
});

export type TextItem = typeof TextItem.Type;

const BarrcodeVariants = Schema.Union(
  Schema.Struct({
    type: Schema.Literal("CODE128", "code128"),
    // CODE128 can encode a wide range of ASCII characters; validate
    // it's printable ASCII and has a reasonable maximum length.
    code: Schema.String.pipe(Schema.pattern(/^[\x20-\x7E]+$/), Schema.minLength(1), Schema.maxLength(128)),
  }),
  Schema.Struct({
    type: Schema.Literal("CODE39", "code39"),
    // CODE39 supports A-Z, 0-9, space and - . $ / + %
    code: Schema.String.pipe(Schema.pattern(/^[A-Z0-9 \-\.\$\/\+%]+$/), Schema.minLength(1), Schema.maxLength(48)),
  }),
  Schema.Struct({
    type: Schema.Literal("EAN13", "ean13"),
    code: Schema.String.pipe(Schema.minLength(13), Schema.maxLength(13)),
  }),
  Schema.Struct({
    type: Schema.Literal("EAN8", "ean8"),
    code: Schema.String.pipe(Schema.minLength(8), Schema.maxLength(8)),
  }),
  Schema.Struct({
    type: Schema.Literal("ITF", "itf"),
    // ITF (Interleaved 2 of 5) encodes digits and requires an even
    // number of digits (2..12). Enforce pairs of digits up to 12.
    code: Schema.String.pipe(Schema.pattern(/^(?:\d{2}){1,6}$/)),
  }),
  Schema.Struct({
    type: Schema.Literal("NW7", "nw7"),
    // NW-7 / Codabar allows digits, A-D start/stop and - $ : / . + and space
    code: Schema.String.pipe(Schema.pattern(/^[0-9A-D \-\$:\/\.\+]+$/), Schema.minLength(1), Schema.maxLength(12)),
  }),
  Schema.Struct({
    type: Schema.Literal("UPC-A", "upc-a", "upc_a"),
    code: Schema.String.pipe(Schema.minLength(11), Schema.maxLength(12)),
  }),
  Schema.Struct({
    type: Schema.Literal("UPC-E", "upc-e", "upc_e"),
    code: Schema.String.pipe(Schema.minLength(7), Schema.maxLength(8)),
  }),
  Schema.Struct({
    type: Schema.Literal("CODE93", "code93"),
    // Code 93 encodes uppercase letters, digits, space and these
    // special characters: - . $ / + %
    // Enforce only those characters using a regex and keep length
    // constraints to a reasonable maximum.
    code: Schema.String.pipe(
      // allow one or more of A-Z, 0-9, space and - . $ / + %
      Schema.pattern(/^[A-Z0-9 \-\.\$\/\+%]+$/),
      Schema.minLength(1),
      Schema.maxLength(48),
    ),
  }),
);

const BarcodeDataSchema = Schema.Struct({ width: Schema.Number, height: Schema.Number }).pipe(
  Schema.extend(BarrcodeVariants),
);

export type BarcodeData = typeof BarcodeDataSchema.Type;

const CustomTableData = Schema.Struct({
  columns: Schema.mutable(Schema.Array(Schema.Any)),
  options: Schema.optional(
    Schema.Struct({
      encoding: Schema.String,
      size: Schema.mutable(Schema.Tuple(Schema.Number, Schema.Number)),
    }),
  ),
});

export type CustomTableData = typeof CustomTableData.Type;

const PrintJobSchema = Schema.Struct({
  text: Schema.optional(Schema.Array(TextItem)),
  imagePath: Schema.optional(Schema.String),
  qrContent: Schema.optional(Schema.String),
  barcodeData: Schema.optional(Schema.Array(BarcodeDataSchema)),
  tableData: Schema.optional(Schema.mutable(Schema.Array(Schema.Union(Schema.String, Schema.Number)))),
  customTableData: Schema.optional(CustomTableData),
});

export type PrintJob = Schema.Schema.Type<typeof PrintJobSchema>;

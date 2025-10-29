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

const BarcodeData = Schema.Struct({
  code: Schema.Union(Schema.Number, Schema.String),
  type: Schema.Literal(
    "UPC_A",
    "UPC-A",
    "UPC-E",
    "UPC_E",
    "EAN13",
    "EAN8",
    "CODE39",
    "ITF",
    "NW7",
    "CODE93",
    "CODE128",
    "upc-a",
    "upc_a",
    "upc-e",
    "upc_e",
    "ean13",
    "ean8",
    "code39",
    "itf",
    "nw7",
    "code93",
    "code128",
  ),
  width: Schema.Number,
  height: Schema.Number,
});

const CustomTableData = Schema.Struct({
  columns: Schema.mutable(Schema.Array(Schema.Any)),
  options: Schema.optional(
    Schema.Struct({
      encoding: Schema.String,
      size: Schema.mutable(Schema.Tuple(Schema.Number, Schema.Number)),
    }),
  ),
});

const PrintJobSchema = Schema.Struct({
  text: Schema.optional(Schema.Array(TextItem)),
  imagePath: Schema.optional(Schema.String),
  qrContent: Schema.optional(Schema.String),
  barcodeData: Schema.optional(Schema.Array(BarcodeData)),
  tableData: Schema.optional(Schema.mutable(Schema.Array(Schema.Union(Schema.String, Schema.Number)))),
  customTableData: Schema.optional(CustomTableData),
});

export type PrintJob = Schema.Schema.Type<typeof PrintJobSchema>;

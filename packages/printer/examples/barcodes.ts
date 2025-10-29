import { BunContext, BunRuntime } from "@effect/platform-bun";
import { BarcodeType } from "@node-escpos/core";
import { Effect } from "effect";
import { PrinterLive, PrinterService } from "../src/index.js";

type Barcode = {
  type: BarcodeType;
  code: string;
};

const program = Effect.gen(function* () {
  const printer = yield* PrinterService;
  const usb = yield* printer.usb();

  // Test all barcode types
  const barcodeTypes: Barcode[] = [
    { type: "UPC-A", code: "012345678901" },
    { type: "UPC-E", code: "01234567" },
    { type: "EAN13", code: "012345678901" },
    { type: "EAN8", code: "0123456" },
    { type: "CODE39", code: "BARCODE-39" },
    { type: "ITF", code: "0123456789" },
    { type: "NW7", code: "0123456" },
    { type: "CODE93", code: "CODE-93" },
    { type: "code128", code: "Code128Test" },
  ];

  yield* printer.print(usb, {
    barcodeData: barcodeTypes.map(({ type, code }) => ({
      type,
      code,
      width: 2,
      height: 50,
    })),
  });
}).pipe(Effect.provide([PrinterLive, BunContext.layer]), Effect.scoped);

BunRuntime.runMain(program);

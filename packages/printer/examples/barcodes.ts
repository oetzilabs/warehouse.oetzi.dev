import { BunContext, BunRuntime } from "@effect/platform-bun";
import { BarcodeType } from "@node-escpos/core";
import { Effect } from "effect";
import { PrinterLive, PrinterService } from "../src/index.js";

type Barcode = {
  type: BarcodeType;
  code: string;
};

const program = Effect.gen(function* () {
  const printerService = yield* PrinterService;
  const usb = yield* printerService.usb();

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

  let printer = yield* printerService.print(usb, {
    text: [
      {
        content: "BARCODE TEST:",
        font: "a",
        align: "lt",
        style: "b",
        size: [1, 1],
      },
    ],
  });

  for (const barcode of barcodeTypes) {
    printer = yield* printerService.print(printer, {
      text: [
        {
          content: `${barcode.type}: ${barcode.code}`,
          font: "a",
          align: "lt",
          style: "NORMAL",
          size: [1, 1],
        },
      ],
      barcodeData: [
        {
          type: barcode.type,
          code: barcode.code,
          width: 2,
          height: 50,
        },
      ],
    });
  }
  yield* Effect.addFinalizer(() => Effect.promise(() => printer.close()));
}).pipe(Effect.provide([PrinterLive, BunContext.layer]), Effect.scoped);

BunRuntime.runMain(program);

import { BunContext, BunRuntime } from "@effect/platform-bun";
import { Effect } from "effect";
import { PrinterLive, PrinterService } from "../src/index.js";
import { BarcodeData, PrintJob } from "../src/schemas";

const program = Effect.gen(function* () {
  const printerService = yield* PrinterService;
  let printer = yield* printerService.usb();

  // Test all barcode types
  const barcodeTypes: Omit<BarcodeData, "width" | "height">[] = [
    { type: "UPC-A", code: "012345678901" },
    { type: "EAN13", code: "012345678901" },
    { type: "EAN8", code: "0123456" },
    { type: "ITF", code: "0123456789" },
    { type: "NW7", code: "0123456" },
    { type: "CODE39", code: "S-0123-E" },
    // broken:
    // { type: "CODE128", code: "A" },
    // { type: "UPC-E", code: "0123456" },
    // { type: "CODE93", code: "ABC-1234-/+" },
  ];

  printer = yield* printerService.print(printer, {
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

  // Print each barcode sequentially, threading the `printer` state
  printer = yield* Effect.reduce(barcodeTypes, printer, (pr, barcode) =>
    printerService.print(pr, {
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
    }),
  );
}).pipe(Effect.provide([PrinterLive, BunContext.layer]), Effect.scoped);

BunRuntime.runMain(program);

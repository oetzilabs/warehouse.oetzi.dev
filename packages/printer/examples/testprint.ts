import { BunContext, BunRuntime } from "@effect/platform-bun";
// import { NodeContext, NodeRuntime } from "@effect/platform-node";
import { Effect } from "effect";
import { PrinterLive, PrinterService } from "../src/index.js";

const program = Effect.gen(function* () {
  const printerService = yield* PrinterService;
  let usbPrinter = yield* printerService.usb();

  usbPrinter = yield* printerService.print(usbPrinter, {
    text: [
      // Header with company info
      {
        content: "================",
        font: "a",
        align: "ct",
        style: "b",
        size: [2, 2],
      },
      {
        content: "OETZI WAREHOUSE SYSTEM",
        font: "a",
        align: "ct",
        style: "b",
        size: [2, 2],
      },
      {
        content: "COMPREHENSIVE PRINTER TEST",
        font: "a",
        align: "ct",
        style: "b",
        size: [1, 1],
      },
      {
        content: "================",
        font: "a",
        align: "ct",
        style: "b",
        size: [2, 2],
      },
      {
        content: "",
        font: "a",
        align: "lt",
        style: "NORMAL",
        size: [1, 1],
      },

      // Font size tests
      {
        content: "FONT SIZE TESTS:",
        font: "a",
        align: "lt",
        style: "b",
        size: [1, 1],
      },
      {
        content: "Small text (1x1)",
        font: "a",
        align: "lt",
        style: "NORMAL",
        size: [1, 1],
      },
      {
        content: "Medium text 2x1",
        font: "a",
        align: "lt",
        style: "NORMAL",
        size: [2, 1],
      },
      {
        content: "Large text 2x2",
        font: "a",
        align: "lt",
        style: "NORMAL",
        size: [2, 2],
      },
      {
        content: "Extra Large 3x3",
        font: "a",
        align: "lt",
        style: "NORMAL",
        size: [3, 3],
      },
      {
        content: "",
        font: "a",
        align: "lt",
        style: "NORMAL",
        size: [1, 1],
      },

      // Style tests
      {
        content: "STYLE TESTS:",
        font: "a",
        align: "lt",
        style: "b",
        size: [1, 1],
      },
      {
        content: "Normal text",
        font: "a",
        align: "lt",
        style: "NORMAL",
        size: [1, 1],
      },
      {
        content: "Bold text",
        font: "a",
        align: "lt",
        style: "b",
        size: [1, 1],
      },
      {
        content: "Underlined text",
        font: "a",
        align: "lt",
        style: "u",
        size: [1, 1],
      },
      {
        content: "Bold and Underlined",
        font: "a",
        align: "lt",
        style: "bu",
        size: [1, 1],
      },
      {
        content: "",
        font: "a",
        align: "lt",
        style: "NORMAL",
        size: [1, 1],
      },

      // Alignment tests
      {
        content: "ALIGNMENT TESTS:",
        font: "a",
        align: "lt",
        style: "b",
        size: [1, 1],
      },
      {
        content: "Left aligned text",
        font: "a",
        align: "lt",
        style: "NORMAL",
        size: [1, 1],
      },
      {
        content: "Center aligned text",
        font: "a",
        align: "ct",
        style: "NORMAL",
        size: [1, 1],
      },
      {
        content: "Right aligned text",
        font: "a",
        align: "rt",
        style: "NORMAL",
        size: [1, 1],
      },
      {
        content: "",
        font: "a",
        align: "lt",
        style: "NORMAL",
        size: [1, 1],
      },

      // Font tests
      {
        content: "FONT TESTS:",
        font: "a",
        align: "lt",
        style: "b",
        size: [1, 1],
      },
      {
        content: "Font A - Standard",
        font: "a",
        align: "lt",
        style: "NORMAL",
        size: [1, 1],
      },
      {
        content: "Font B - Compressed",
        font: "b",
        align: "lt",
        style: "NORMAL",
        size: [1, 1],
      },
      {
        content: "",
        font: "a",
        align: "lt",
        style: "NORMAL",
        size: [1, 1],
      },

      // Sample receipt data
      {
        content: "--------------------------------",
        font: "a",
        align: "ct",
        style: "b",
        size: [1, 1],
      },
      {
        content: "SAMPLE RECEIPT",
        font: "a",
        align: "ct",
        style: "b",
        size: [2, 2],
      },
      {
        content: "--------------------------------",
        font: "a",
        align: "ct",
        style: "b",
        size: [1, 1],
      },
      {
        content: "Date: 2025-10-27 14:30:00",
        font: "a",
        align: "lt",
        style: "NORMAL",
        size: [1, 1],
      },
      {
        content: "Receipt #: TEST-001234",
        font: "a",
        align: "lt",
        style: "NORMAL",
        size: [1, 1],
      },
      {
        content: "Cashier: Test User",
        font: "a",
        align: "lt",
        style: "NORMAL",
        size: [1, 1],
      },
      {
        content: "",
        font: "a",
        align: "lt",
        style: "NORMAL",
        size: [1, 1],
      },
      {
        content: "ITEMS PURCHASED:",
        font: "a",
        align: "lt",
        style: "b",
        size: [1, 1],
      },
      {
        content: "Product A            x2   $10.00",
        font: "a",
        align: "lt",
        style: "NORMAL",
        size: [1, 1],
      },
      {
        content: "Product B            x1   $25.50",
        font: "a",
        align: "lt",
        style: "NORMAL",
        size: [1, 1],
      },
      {
        content: "Product C            x3   $15.75",
        font: "a",
        align: "lt",
        style: "NORMAL",
        size: [1, 1],
      },
      {
        content: "",
        font: "a",
        align: "lt",
        style: "NORMAL",
        size: [1, 1],
      },
      {
        content: "SUBTOTAL:                 $51.25",
        font: "a",
        align: "rt",
        style: "b",
        size: [1, 1],
      },
      {
        content: "TAX (10%):                 $5.13",
        font: "a",
        align: "rt",
        style: "NORMAL",
        size: [1, 1],
      },
      {
        content: "TOTAL:                    $56.38",
        font: "a",
        align: "rt",
        style: "b",
        size: [1, 1],
      },
      {
        content: "",
        font: "a",
        align: "lt",
        style: "NORMAL",
        size: [1, 1],
      },
      {
        content: "Payment: Credit Card",
        font: "a",
        align: "lt",
        style: "NORMAL",
        size: [1, 1],
      },
      {
        content: "Change: $0.00",
        font: "a",
        align: "lt",
        style: "NORMAL",
        size: [1, 1],
      },
      {
        content: "",
        font: "a",
        align: "lt",
        style: "NORMAL",
        size: [1, 1],
      },

      // Barcode section
      {
        content: "BARCODE TEST:",
        font: "a",
        align: "lt",
        style: "b",
        size: [1, 1],
      },
      {
        content: "Product SKU: TEST123456",
        font: "a",
        align: "ct",
        style: "NORMAL",
        size: [1, 1],
      },
      {
        content: "",
        font: "a",
        align: "lt",
        style: "NORMAL",
        size: [1, 1],
      },

      // QR Code section
      {
        content: "QRCODE TEST:",
        font: "a",
        align: "lt",
        style: "b",
        size: [1, 1],
      },
      {
        content: "Scan for more info:",
        font: "a",
        align: "ct",
        style: "NORMAL",
        size: [1, 1],
      },
      {
        content: "",
        font: "a",
        align: "lt",
        style: "NORMAL",
        size: [1, 1],
      },

      // Special characters test
      {
        content: "SPECIAL CHARACTERS:",
        font: "a",
        align: "lt",
        style: "b",
        size: [1, 1],
      },
      {
        content: "ABC abc 123 !@#$%^&*()",
        font: "a",
        align: "lt",
        style: "NORMAL",
        size: [1, 1],
      },
      {
        content: "Symbols: €£¥§¶†‡•…‰‹›",
        font: "a",
        align: "lt",
        style: "NORMAL",
        size: [1, 1],
      },
      {
        content: "",
        font: "a",
        align: "lt",
        style: "NORMAL",
        size: [1, 1],
      },

      // Footer
      {
        content: "================================",
        font: "a",
        align: "ct",
        style: "b",
        size: [1, 1],
      },
      {
        content: "THANK YOU FOR YOUR BUSINESS!",
        font: "a",
        align: "ct",
        style: "b",
        size: [1, 1],
      },
      {
        content: "www.oetzi.dev",
        font: "a",
        align: "ct",
        style: "NORMAL",
        size: [1, 1],
      },
      {
        content: "support@oetzi.dev",
        font: "a",
        align: "ct",
        style: "NORMAL",
        size: [1, 1],
      },
      {
        content: "================================",
        font: "a",
        align: "ct",
        style: "b",
        size: [1, 1],
      },
      {
        content: "",
        font: "a",
        align: "lt",
        style: "NORMAL",
        size: [1, 1],
      },
      {
        content: "",
        font: "a",
        align: "lt",
        style: "NORMAL",
        size: [1, 1],
      },
      {
        content: "",
        font: "a",
        align: "lt",
        style: "NORMAL",
        size: [1, 1],
      },
    ],
    qrContent: "https://warehouse.oetzi.dev",
    barcodeData: [
      {
        code: "S-0123-E",
        type: "CODE39",
        width: 2,
        height: 40,
      },
    ],
  });
  // yield* Effect.addFinalizer(() => Effect.promise(() => usbPrinter.close()));
}).pipe(Effect.provide([PrinterLive, BunContext.layer]), Effect.scoped);

BunRuntime.runMain(program);

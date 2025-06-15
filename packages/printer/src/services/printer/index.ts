import { join } from "path";
import { setTimeout } from "timers/promises";
import { Alignment, BarcodeType, CustomTableItem, FontFamily, Image, Printer, StyleString } from "@node-escpos/core";
import USB from "@node-escpos/usb-adapter";
import { Console, Effect } from "effect";
import ipp from "ipp";
import mdns from "multicast-dns";
import usb from "usb";
import { PrinterNotConnected, PrinterNotFound, PrintOperationError } from "./errors";

type MDNSDevice = {
  type: "mDNS_IPP";
  name: string;
  host: string;
  port: number;
  addresses: string[];
  txtRecord?: string[];
};

export class PrinterService extends Effect.Service<PrinterService>()("@warehouse/printers", {
  effect: Effect.gen(function* (_) {
    const device = (options = { encoding: "GB18030" }) =>
      Effect.gen(function* (_) {
        const findDevice = Effect.try({
          try: () => {
            const usbDevice = new USB();
            return usbDevice;
          },
          catch: (error) => new PrinterNotFound({ message: "No printer device found" }),
        });

        const usbDevice = yield* findDevice;

        const acquire = Effect.async<Printer<[]>, PrinterNotConnected>((resume) => {
          usbDevice.open((err) => {
            if (err) {
              resume(Effect.fail(new PrinterNotConnected({ message: "Failed to connect to printer" })));
            } else {
              try {
                const printer = new Printer(usbDevice, options);
                resume(Effect.succeed(printer));
              } catch (error) {
                resume(Effect.fail(new PrinterNotConnected({ message: "Failed to initialize printer" })));
              }
            }
          });
        });

        const release = (printer: Printer<[]>) =>
          Effect.sync(() => {
            try {
              usbDevice.close();
            } catch (err) {
              console.error("Error closing device:", err);
            }
          });

        return yield* Effect.acquireRelease(acquire, release);
      });
    const print = (
      printer: Printer<[]>,
      {
        text,
        imagePath,
        qrContent,
        barcodeData,
        tableData,
        customTableData,
      }: {
        text?: {
          content: string;
          font?: FontFamily;
          align?: Alignment;
          style?: StyleString;
          size?: [number, number];
        }[];
        imagePath?: string;
        qrContent?: string;
        barcodeData?: { code: number; type: string; width: number; height: number };
        tableData?: string[];
        customTableData?: {
          columns: CustomTableItem[];
          options?: { encoding: string; size: [number, number] };
        };
      },
    ) =>
      Effect.try({
        try: () =>
          Effect.gen(function* (_) {
            // Basic text printing
            if (text) {
              for (const t of text) {
                printer
                  .font(t.font ?? ("a" as FontFamily))
                  .align(t.align || ("ct" as Alignment))
                  .style(t.style || ("bu" as StyleString))
                  .size(...(t.size || [1, 1]))
                  .text(t.content);
              }
            }

            // Barcode printing
            if (barcodeData) {
              printer.barcode(barcodeData.code, barcodeData.type as BarcodeType, {
                width: barcodeData.width,
                height: barcodeData.height,
              });
            }

            // Table printing
            if (tableData) {
              printer.table(tableData);
            }

            // Custom table printing
            if (customTableData) {
              printer.tableCustom(customTableData.columns, customTableData.options);
            }

            // QR code printing
            if (qrContent) {
              yield* Effect.promise(() => printer.qrimage(qrContent));
            }

            // Image printing
            if (imagePath) {
              const image = yield* Effect.promise(() => Image.load(imagePath));
              yield* Effect.promise(() => printer.image(image, "s8"));
            }

            yield* Effect.promise(() => printer.cut().close());
          }),
        catch: (error) =>
          new PrintOperationError({
            message: "Print operation failed",
            cause: error,
          }),
      });

    return {
      device,
      print,
    } as const;
  }),
}) {}

export const PrinterLive = PrinterService.Default;

import { Adapter } from "@node-escpos/adapter";
import Bluetooth from "@node-escpos/bluetooth-adapter";
import { Alignment, BarcodeType, FontFamily, Image, Printer, PrinterOptions, StyleString } from "@node-escpos/core";
import Network from "@node-escpos/network-adapter";
import Serial from "@node-escpos/serialport-adapter";
import Server from "@node-escpos/server";
import USB from "@node-escpos/usb-adapter";
import { Effect } from "effect";
import { PrinterNotConnected, PrinterNotFound, PrintOperationError } from "./errors";
import { PrintJob } from "./schemas";

export class PrinterService extends Effect.Service<PrinterService>()("@warehouse/printers", {
  effect: Effect.gen(function* () {
    const usb = Effect.fn(function* (options: PrinterOptions = { encoding: "GB18030" }) {
      const usbDevice = yield* Effect.try({
        try: () => new USB(),
        catch: (error) => new PrinterNotFound({ message: "No printer device found" }),
      });

      const acquire = Effect.async<Printer<[]>, PrinterNotConnected>((resume) => {
        usbDevice.open((err) => {
          if (err) {
            resume(Effect.fail(new PrinterNotConnected({ message: "Failed to connect to printer", cause: err })));
          } else {
            try {
              const printer = new Printer(usbDevice, options);
              resume(Effect.succeed(printer));
            } catch (error) {
              resume(Effect.fail(new PrinterNotConnected({ message: "Failed to initialize printer", cause: err })));
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

    const network = Effect.fn(function* (
      parameters: {
        address: string;
        port?: number;
        timeout?: number;
      },
      options: PrinterOptions = { encoding: "GB18030" },
    ) {
      const device = yield* Effect.try({
        try: () => new Network(parameters.address, parameters.port, parameters.timeout),
        catch: (error) => new PrinterNotFound({ message: "No printer device found" }),
      });
      const acquire = Effect.async<Printer<[]>, PrinterNotConnected>((resume) => {
        device.open((err) => {
          if (err) {
            resume(Effect.fail(new PrinterNotConnected({ message: "Failed to connect to printer", cause: err })));
          } else {
            try {
              const printer = new Printer(device, options);
              resume(Effect.succeed(printer));
            } catch (error) {
              resume(Effect.fail(new PrinterNotConnected({ message: "Failed to initialize printer", cause: err })));
            }
          }
        });
      });

      const release = (printer: Printer<[]>) =>
        Effect.sync(() => {
          try {
            device.close();
          } catch (err) {
            console.error("Error closing device:", err);
          }
        });

      return yield* Effect.acquireRelease(acquire, release);
    });

    const bluetooth = Effect.fn(function* (
      parameters: { address: string; options?: any },
      options: PrinterOptions = { encoding: "GB18030" },
    ) {
      const device = yield* Effect.try({
        try: () => new Bluetooth(parameters.address, parameters.options),
        catch: (error) => new PrinterNotFound({ message: "No printer device found" }),
      });
      const acquire = Effect.async<Printer<[]>, PrinterNotConnected>((resume) => {
        device.open((err) => {
          if (err) {
            resume(Effect.fail(new PrinterNotConnected({ message: "Failed to connect to printer", cause: err })));
          } else {
            try {
              const printer = new Printer(device, options);
              resume(Effect.succeed(printer));
            } catch (error) {
              resume(Effect.fail(new PrinterNotConnected({ message: "Failed to initialize printer", cause: err })));
            }
          }
        });
      });

      const release = (printer: Printer<[]>) =>
        Effect.sync(() => {
          try {
            device.close();
          } catch (err) {
            console.error("Error closing device:", err);
          }
        });

      return yield* Effect.acquireRelease(acquire, release);
    });

    const serial = Effect.fn(function* (
      parameters: { port: string; options?: any },
      options: PrinterOptions = { encoding: "GB18030" },
    ) {
      const device = yield* Effect.try({
        try: () => new Serial(parameters.port, parameters.options),
        catch: (error) => new PrinterNotFound({ message: "No printer device found" }),
      });
      const acquire = Effect.async<Printer<[]>, PrinterNotConnected>((resume) => {
        device.open((err) => {
          if (err) {
            resume(Effect.fail(new PrinterNotConnected({ message: "Failed to connect to printer", cause: err })));
          } else {
            try {
              const printer = new Printer(device, options);
              resume(Effect.succeed(printer));
            } catch (error) {
              resume(Effect.fail(new PrinterNotConnected({ message: "Failed to initialize printer", cause: err })));
            }
          }
        });
      });

      const release = (printer: Printer<[]>) =>
        Effect.sync(() => {
          try {
            device.close();
          } catch (err) {
            console.error("Error closing device:", err);
          }
        });

      return yield* Effect.acquireRelease(acquire, release);
    });

    const print = (
      printer: Printer<[]>,
      { text, imagePath, qrContent, barcodeData, tableData, customTableData }: PrintJob,
    ) =>
      Effect.gen(function* () {
        // Basic text printing
        if (text) {
          for (const t of text) {
            printer = yield* Effect.try({
              try: () =>
                printer
                  .font(t.font ?? ("a" as FontFamily))
                  .align(t.align || ("ct" as Alignment))
                  .style(t.style || ("bu" as StyleString))
                  .size(...(t.size || [1, 1]))
                  .text(t.content),
              catch: (error) =>
                Effect.fail(
                  new PrintOperationError({
                    message: "Failed to print text",
                    cause: error,
                    operation: "text",
                    value: t.content,
                  }),
                ),
            });
          }
        }

        // Barcode printing
        if (barcodeData) {
          printer = yield* Effect.try({
            try: () =>
              printer.barcode(barcodeData.code, barcodeData.type as BarcodeType, {
                width: barcodeData.width,
                height: barcodeData.height,
              }),
            catch: (error) =>
              Effect.fail(
                new PrintOperationError({
                  message: "Failed to print barcode",
                  cause: error,
                  operation: "barcode",
                  value: barcodeData,
                }),
              ),
          });
        }

        // Table printing
        if (tableData) {
          printer = yield* Effect.try({
            try: () => printer.table(tableData),
            catch: (error) =>
              Effect.fail(
                new PrintOperationError({
                  message: "Failed to print table",
                  cause: error,
                  operation: "table",
                  value: tableData,
                }),
              ),
          });
        }

        // Custom table printing
        if (customTableData) {
          printer = yield* Effect.try({
            try: () => printer.tableCustom(customTableData.columns, customTableData.options),
            catch: (error) =>
              Effect.fail(
                new PrintOperationError({
                  message: "Failed to print custom table",
                  cause: error,
                  operation: "customTable",
                  value: customTableData,
                }),
              ),
          });
        }

        // QR code printing
        if (qrContent) {
          printer = yield* Effect.tryPromise({
            try: () => printer.qrimage(qrContent),
            catch: (error) =>
              new PrintOperationError({
                message: "Failed to print QR code",
                cause: error,
                operation: "qrCode",
                value: qrContent,
              }),
          });
        }

        // Image printing
        if (imagePath) {
          const image = yield* Effect.promise(() => Image.load(imagePath));
          printer = yield* Effect.tryPromise({
            try: () => printer.image(image, "s8"),
            catch: (error) =>
              new PrintOperationError({
                message: "Failed to print image",
                cause: error,
                operation: "image",
                value: imagePath,
              }),
          });
        }

        printer = yield* Effect.tryPromise({
          try: () => printer.cut().close(),
          catch: (error) =>
            new PrintOperationError({
              message: "Failed to print",
              cause: error,
              operation: "print",
            }),
        });
      });

    // This server will be used sometime, for now it's not needed
    const server = Effect.fn(function* (port: number, hostname: string, device: Adapter<[]>) {
      const server = yield* Effect.try({
        try: () => new Server(device),
        catch: (error) => new PrinterNotFound({ message: "No printer device found" }),
      });
      const acquire = Effect.async<Server<[]>, PrinterNotConnected>((resume) => {
        device.open((e) => {
          if (e) {
            resume(Effect.fail(new PrinterNotConnected({ message: "Failed to connect to printer", cause: e })));
          } else {
            server.listen(port, hostname, () => {
              const sad = server.address();
              if (sad) {
                if (typeof sad === "string") {
                  console.log("Your printer is running at", sad);
                  resume(Effect.succeed(server));
                } else {
                  console.log("Your printer is running at", sad.port);
                  resume(Effect.succeed(server));
                }
              }
            });
          }
        });
      });
      const release = (server: Server<[]>) =>
        Effect.sync(() => {
          try {
            server.close();
            device.close();
          } catch (err) {
            console.error("Error closing device:", err);
          }
        });

      return yield* Effect.acquireRelease(acquire, release);
    });

    return {
      usb,
      network,
      bluetooth,
      serial,
      print,
      // server,
    } as const;
  }),
}) {}

export const PrinterLive = PrinterService.Default;

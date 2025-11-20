import { FileSystem, Path } from "@effect/platform";
import { BunContext } from "@effect/platform-bun";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { Adapter } from "@node-escpos/adapter";
import { Alignment, BarcodeType, FontFamily, Image, Printer, PrinterOptions, StyleString } from "@node-escpos/core";
import Network from "@node-escpos/network-adapter";
import Serial from "@node-escpos/serialport-adapter";
import Server from "@node-escpos/server";
import USB from "@node-escpos/usb-adapter";
import { Console, Duration, Effect } from "effect";
import mdns from "multicast-dns";
import {
  ImageNotFound,
  ImageNotLoaded,
  PrinterBluetoothBindingError,
  PrinterBluetoothCountError,
  PrinterFailedToClose,
  PrinterFailedToGetBluetoothAdapter,
  PrinterFailedToGetBluetoothAdress,
  PrinterFailedToGetUSBDevices,
  PrinterNotConnected,
  PrinterNotFound,
  PrintOperationError,
} from "./errors";
import { PrintJob } from "./schemas";

type NetworkPrinter = {
  name: string;
  type: string;
  host?: string;
  port?: number;
  addresses: string[];
  txt?: Record<string, string>;
};

export class PrinterService extends Effect.Service<PrinterService>()("@warehouse/printers", {
  effect: Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;
    const bluetooth_discover = Effect.fn(function* () {
      const simpleble = yield* Effect.tryPromise({
        try: () => import("simpleble"),
        catch: (error) =>
          new PrinterBluetoothBindingError({
            message: "Failed to load Bluetooth bindings",
            cause: error,
          }),
      });
      const bindings = yield* Effect.tryPromise({
        try: () => simpleble.SimpleBLE.load(),
        catch: (error) =>
          new PrinterBluetoothBindingError({
            message: "Failed to load Bluetooth bindings",
            cause: error,
          }),
      });
      const count = yield* Effect.try({
        try: () => bindings.simpleble_adapter_get_count(),
        catch: (error) =>
          new PrinterBluetoothCountError({ message: "Failed to discover Bluetooth printers", cause: error }),
      });
      if (count === 0) {
        return yield* Effect.fail(
          new PrinterBluetoothCountError({
            message: "No Bluetooth printers found",
          }),
        );
      }
      const adapter = yield* Effect.try({
        try: () => bindings.simpleble_adapter_get_handle(0),
        catch: (error) =>
          new PrinterFailedToGetBluetoothAdapter({
            message: "Failed to discover Bluetooth printer adapters",
            cause: error,
          }),
      });

      const address = yield* Effect.try({
        try: () => bindings.simpleble_adapter_address(adapter),
        catch: (error) =>
          new PrinterFailedToGetBluetoothAdress({
            message: "Failed to discover Bluetooth printer address",
            cause: error,
          }),
      });
      // import Bluetooth from "@node-escpos/bluetooth-adapter";
      const Bluetooth = yield* Effect.promise(() => import("@node-escpos/bluetooth-adapter").then((m) => m.default));
      return yield* Effect.try({
        try: () => new Bluetooth(address, {}),
        catch: (error) => new PrinterNotFound({ message: "Failed to discover Bluetooth printers", type: "bluetooth" }),
      });
    });

    const network_discover = Effect.fn(function* (timeout = 2000) {
      return yield* Effect.async<NetworkPrinter[]>((resume) => {
        const mdns_client = mdns();
        const printers = new Map<string, NetworkPrinter>();

        const targets = ["_ipp._tcp.local", "_printer._tcp.local"];

        // Query for both IPP and generic printers
        for (const name of targets) {
          mdns_client.query({ questions: [{ name, type: "PTR" }] });
        }

        mdns_client.on("response", (response) => {
          for (const answer of response.answers) {
            if (answer.type === "PTR" && targets.includes(answer.name)) {
              const full_name = answer.data;
              printers.set(full_name, {
                name: full_name,
                type: answer.name,
                addresses: [],
              });

              // Request SRV/TXT records for details
              mdns_client.query([{ name: full_name, type: "SRV" }]);
              mdns_client.query([{ name: full_name, type: "TXT" }]);
            }

            if (answer.type === "SRV") {
              const service = printers.get(answer.name);
              if (service) {
                service.host = answer.data.target;
                service.port = answer.data.port;
                mdns_client.query([{ name: service.host, type: "A" }]);
                mdns_client.query([{ name: service.host, type: "AAAA" }]);
              }
            }

            if (answer.type === "A" || answer.type === "AAAA") {
              for (const [key, p] of printers.entries()) {
                if (p.host === answer.name && !p.addresses.includes(answer.data)) {
                  p.addresses.push(answer.data);
                }
              }
            }

            if (answer.type === "TXT") {
              const txt: Record<string, string> = {};
              for (const entry of answer.data) {
                const str = entry.toString();
                const [k, v] = str.split("=");
                if (k && v) txt[k] = v;
              }
              const p = printers.get(answer.name);
              if (p) p.txt = txt;
            }
          }
        });

        setTimeout(() => {
          mdns_client.destroy();
          resume(Effect.succeed(Array.from(printers.values())));
        }, timeout);
      });
    });

    const discover = Effect.fn(function* (timeout: number = 2000, with_bluetooth: boolean = false) {
      return yield* Effect.all({
        usb: Effect.try({
          try: () =>
            USB.findPrinter().flatMap((p) =>
              p.portNumbers.map((port) => ({
                type: "usb",
                name: `USB Printer (${p.deviceDescriptor?.iProduct ? `Product ${p.deviceDescriptor.iProduct}` : "Unknown Device"})`,
                description: `VID: ${p.deviceDescriptor?.idVendor?.toString(16).padStart(4, "0").toUpperCase() || "Unknown"}, PID: ${p.deviceDescriptor?.idProduct?.toString(16).padStart(4, "0").toUpperCase() || "Unknown"}`,
                port: port,
                device: p,
              })),
            ),
          catch: (error) =>
            new PrinterFailedToGetUSBDevices({ message: "Failed to discover USB printers", cause: error }),
        }),
        serial: Effect.promise(() => Serial.list()).pipe(
          Effect.map((p) =>
            p.map((p) => ({
              type: "serial",
              name: `Serial Printer (${p.manufacturer || "Unknown"})`,
              description: `Port: ${p.path}, Baud: ${p.baudRate || "Auto"}`,
              port: p.path,
              device: p,
            })),
          ),
        ),
        network: network_discover(timeout).pipe(
          Effect.map((p) =>
            p.map((printer) => ({
              type: "network",
              name: printer.name,
              description: `Host: ${printer.host || "Unknown"}, Port: ${printer.port || "Default"}`,
              addresses: printer.addresses,
              device: printer,
            })),
          ),
        ),
        ...(with_bluetooth
          ? {
              bluetooth: bluetooth_discover().pipe(
                Effect.map((p) =>
                  p.device !== null
                    ? [
                        {
                          type: "bluetooth",
                          name: p.device.peripheral.id,
                          description: p.device.characteristic.descriptors
                            .map((d) => `${d.name}: ${d.type} (${d.uuid})`)
                            .join(", "),
                          addresses: p.device.peripheral.address,
                          device: p,
                        },
                      ]
                    : [],
                ),
              ),
            }
          : {}),
      });
    });

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
        Effect.tryPromise({
          try: () => printer.close(),
          catch: (error) => new PrinterFailedToClose({ message: "Failed to close printer", cause: error }),
        }).pipe(
          Effect.catchTags({
            PrinterFailedToClose: (error) => Console.log(error),
          }),
        );

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
      // import Bluetooth from "@node-escpos/bluetooth-adapter";
      const Bluetooth = yield* Effect.promise(() => import("@node-escpos/bluetooth-adapter").then((m) => m.default));
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
        printer = yield* flush(printer);
        // Basic text printing
        if (text) {
          printer = yield* Effect.reduce(text, printer, (pr, t) =>
            Effect.try({
              try: () =>
                pr
                  .font(t.font ?? ("a" as FontFamily))
                  .align(t.align || ("ct" as Alignment))
                  .style(t.style || ("bu" as StyleString))
                  .size(...(t.size || [1, 1]))
                  .text(t.content),
              catch: (error) =>
                new PrintOperationError({
                  message: "Failed to print text",
                  cause: error,
                  operation: "text",
                  value: t.content,
                }),
            }),
          );
        }

        // Barcode printing
        if (barcodeData) {
          printer = yield* Effect.reduce(barcodeData, printer, (pr, barcode) =>
            Effect.try({
              try: () =>
                pr
                  .barcode(barcode.code, barcode.type, {
                    width: barcode.width,
                    height: barcode.height,
                  })
                  .feed(2),
              catch: (error) =>
                new PrintOperationError({
                  message: "Failed to print barcode",
                  cause: error,
                  operation: "barcode",
                  value: barcode,
                }),
            }),
          );
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
            try: () => printer.image(image, "s24"),
            catch: (error) =>
              new PrintOperationError({
                message: "Failed to print image",
                cause: error,
                operation: "image",
                value: imagePath,
              }),
          });
        }

        // yield* Effect.sleep(Duration.millis(200));

        printer = yield* Effect.try({
          try: () => printer.cut(),
          catch: (error) =>
            new PrintOperationError({
              message: "Failed to print",
              cause: error,
              operation: "print",
            }),
        });
        return printer;
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

    const flush = Effect.fn(function* (printer: Printer<[]>) {
      return yield* Effect.tryPromise({
        try: () => printer.flush(),
        catch: (error) =>
          new PrintOperationError({
            message: "Failed to clear printer",
            cause: error,
            operation: "clear",
          }),
      });
    });

    return {
      discover,
      usb,
      network,
      bluetooth,
      serial,
      print,
      flush,
      // server,
    } as const;
  }),
  dependencies: [BunContext.layer],
}) {}

export const PrinterLive = PrinterService.Default;

import { setTimeout } from "timers/promises";
import { and, eq, ilike } from "drizzle-orm";
import { Console, Effect } from "effect";
import ipp from "ipp";
import mdns from "mdns"; // For discovering network printers via mDNS
import { BreakLine, CharacterSet, PrinterTypes, ThermalPrinter } from "node-thermal-printer";
import usb from "usb";
import { literal, object, safeParse, string, union, type InferInput } from "valibot";
import { DatabaseLive, DatabaseService } from "../../drizzle/sql";
import { TB_device_types, TB_devices } from "../../drizzle/sql/schema";
import { prefixed_cuid2 } from "../../utils/custom-cuid2-valibot";
import {
  PrinterInvalidId,
  PrinterNotConnected,
  PrinterNotCreated,
  PrinterNotDeleted,
  PrinterNotFound,
  PrinterNotUpdated,
  PrinterOrganizationInvalidId,
  PrinterTypeInvalidId,
} from "./errors";

const PrinterCreateSchema = object({
  name: string(),
  model: string(),
  connectionUrl: string(),
  type: union([literal("network"), literal("serial"), literal("usb"), literal("thermal")]),
});

const PrinterUpdateSchema = object({
  ...PrinterCreateSchema.entries,
  id: string(),
});

export class PrinterService extends Effect.Service<PrinterService>()("@warehouse/printers", {
  effect: Effect.gen(function* (_) {
    const database = yield* _(DatabaseService);
    const db = yield* database.instance;

    const create = (userInput: InferInput<typeof PrinterCreateSchema>, organizationId: string) =>
      Effect.gen(function* (_) {
        const parsedOrganizationId = safeParse(prefixed_cuid2, organizationId);
        if (!parsedOrganizationId.success) {
          return yield* Effect.fail(new PrinterOrganizationInvalidId({ organizationId }));
        }

        const type_id = yield* Effect.promise(() =>
          db.query.TB_device_types.findFirst({ where: ilike(TB_device_types.name, `%${userInput.type}%`) }),
        );
        if (!type_id) {
          return yield* Effect.fail(new PrinterTypeInvalidId({ type: userInput.type }));
        }

        const [printer] = yield* Effect.promise(() =>
          db
            .insert(TB_devices)
            .values({
              ...userInput,
              organization_id: parsedOrganizationId.output,
              type_id: type_id.id,
            })
            .returning(),
        );

        if (!printer) {
          return yield* Effect.fail(new PrinterNotCreated({}));
        }

        return printer;
      });

    const findById = (id: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new PrinterInvalidId({ id }));
        }

        const printer = yield* Effect.promise(() =>
          db.query.TB_devices.findFirst({
            where: (devices, operations) => operations.and(operations.eq(devices.id, parsedId.output)),
            with: {
              type: true,
            },
          }),
        );

        if (!printer) {
          return yield* Effect.fail(new PrinterNotFound({ id }));
        }

        return printer;
      });

    const update = (input: InferInput<typeof PrinterUpdateSchema>) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, input.id);
        if (!parsedId.success) {
          return yield* Effect.fail(new PrinterInvalidId({ id: input.id }));
        }

        const [updated] = yield* Effect.promise(() =>
          db
            .update(TB_devices)
            .set({ ...input, updatedAt: new Date() })
            .where(eq(TB_devices.id, parsedId.output))
            .returning(),
        );

        if (!updated) {
          return yield* Effect.fail(new PrinterNotUpdated({ id: input.id }));
        }

        return updated;
      });

    const remove = (id: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new PrinterInvalidId({ id }));
        }

        const [deleted] = yield* Effect.promise(() =>
          db.delete(TB_devices).where(eq(TB_devices.id, parsedId.output)).returning(),
        );

        if (!deleted) {
          return yield* Effect.fail(new PrinterNotDeleted({ id }));
        }

        return deleted;
      });

    const safeRemove = (id: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new PrinterInvalidId({ id }));
        }

        const [updated] = yield* Effect.promise(() =>
          db.update(TB_devices).set({ deletedAt: new Date() }).where(eq(TB_devices.id, parsedId.output)).returning(),
        );

        if (!updated) {
          return yield* Effect.fail(new PrinterNotDeleted({ id }));
        }

        return updated;
      });

    const findByOrganizationId = (organizationId: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, organizationId);
        if (!parsedId.success) {
          return yield* Effect.fail(new PrinterOrganizationInvalidId({ organizationId }));
        }

        return yield* Effect.promise(() =>
          db.query.TB_devices.findMany({
            where: (devices, operations) => operations.and(operations.eq(devices.organization_id, parsedId.output)),
            with: {
              type: true,
            },
          }),
        );
      });

    const local = (type: PrinterTypes, intf: string, width: number) =>
      Effect.gen(function* (_) {
        const printer = new ThermalPrinter({
          type, // Printer type: 'star' or 'epson'
          width: width,
          interface: intf,
          // Printer character set
          characterSet: CharacterSet.PC852_LATIN2,
          // Removes special characters - default: false
          removeSpecialCharacters: false,
          // Break line after WORD or CHARACTERS. Disabled with NONE - default: WORD
          breakLine: BreakLine.WORD,
          options: {
            // Connection timeout (ms) [applicable only for network printers] - default: 3000
            timeout: 5000,
          },
        });
        return printer;
      });

    const print = (device: ThermalPrinter, text: string) =>
      Effect.gen(function* (_) {
        const isConnected = yield* Effect.promise(() => device.isPrinterConnected());
        if (!isConnected) {
          return yield* Effect.fail(new PrinterNotConnected({}));
        }
        yield* Effect.sync(() => device.print(text));
        return yield* Effect.promise(() => device.execute());
      });

    // Helper to promisify ipp.Printer discovery
    const discoverIppPrinter = (host: string, port: number) =>
      Effect.async<any, Error>((resume) => {
        const uri = `ipp://${host}:${port}`;
        const printer = new ipp.Printer(`${uri}`);
        const data = ipp.serialize({
          operation: "Get-Printer-Attributes",
          "operation-attributes-tag": {
            "attributes-charset": "utf-8",
            "attributes-natural-language": "en",
            "printer-uri": uri,
          },
        });

        ipp.request(uri, data, (err: Error | null, res: any) => {
          if (err) {
            resume(Effect.fail(err));
          } else {
            resume(
              Effect.succeed({
                host,
                port,
                attributes: res,
                uri,
              }),
            );
          }
        });
      });

    const findLocal = ({ excludeNetwork = false, excludeUsb = false }) =>
      Effect.gen(function* (_) {
        const usbdevices: any[] = [];
        const networkdevices: any[] = [];

        if (!excludeUsb) {
          const devices = usb.getDeviceList();
          // You might want to filter devices based on their class (e.g., printer class 7)
          for (const device of devices.filter((device) => device.deviceDescriptor.bDeviceClass === 9)) {
            const manufacturer = yield* Effect.async<string | undefined, Error>((resume) => {
              try {
                device.open();
              } catch (error) {
                if (error instanceof Error) {
                  resume(Effect.fail(error));
                } else {
                  resume(Effect.fail(new Error("Unknown error")));
                }
              }
              device.getStringDescriptor(device.deviceDescriptor.iManufacturer, (err, value) => {
                if (err) {
                  resume(Effect.fail(err));
                } else {
                  resume(Effect.succeed(value));
                }
              });
              try {
                device.close();
              } catch (error) {
                if (error instanceof Error) {
                  resume(Effect.fail(error));
                } else {
                  resume(Effect.fail(new Error("Unknown error")));
                }
              }
            });
            const product = yield* Effect.async<string | undefined, Error>((resume) => {
              try {
                device.open();
              } catch (error) {
                if (error instanceof Error) {
                  resume(Effect.fail(error));
                } else {
                  resume(Effect.fail(new Error("Unknown error")));
                }
              }
              device.getStringDescriptor(device.deviceDescriptor.iProduct, (err, value) => {
                if (err) {
                  resume(Effect.fail(err));
                } else {
                  resume(Effect.succeed(value));
                }
              });
              try {
                device.close();
              } catch (error) {
                if (error instanceof Error) {
                  resume(Effect.fail(error));
                } else {
                  resume(Effect.fail(new Error("Unknown error")));
                }
              }
            });
            usbdevices.push({
              busNumber: device.busNumber,
              deviceAddress: device.deviceAddress,
              vendorId: device.deviceDescriptor.idVendor,
              productId: device.deviceDescriptor.idProduct,
              // Can be retrieved by opening the device and reading strings
              manufacturer: manufacturer ?? "Unknown",
              // Can be retrieved by opening the device and reading strings
              product: product ?? "Unknown",
            });
          }
        }

        if (!excludeNetwork) {
          // 1. Scan for common IPP ports on local network segments (basic example, not exhaustive)
          // In a real-world scenario, you might want to get network interfaces and scan subnets.
          const commonIppPorts = [631, 80]; // Common IPP ports
          const commonLocalIps = ["127.0.0.1", "192.168.0.1"]; // Example IPs

          for (const ip of commonLocalIps) {
            for (const port of commonIppPorts) {
              yield* Console.log(`Checking IPP on ${ip}:${port}...`);
              const printerInfo = yield* discoverIppPrinter(ip, port);
              if (printerInfo) {
                networkdevices.push({
                  type: "IPP",
                  host: printerInfo.host,
                  port: printerInfo.port,
                  attributes: printerInfo.attributes,
                });
                yield* Console.log(`Found IPP printer at ${ip}:${port} with attributes:`, printerInfo.attributes);
              }
            }
          }

          // 2. Discover via mDNS/Bonjour (if supported by printers)
          yield* Effect.async<void, Error>((resume) => {
            try {
              const browser = mdns.createBrowser(mdns.tcp("ipp"));

              browser.on("serviceUp", (service: any) => {
                networkdevices.push({
                  type: "mDNS_IPP",
                  name: service.name,
                  host: service.host,
                  port: service.port,
                  addresses: service.addresses,
                  txtRecord: service.txtRecord,
                });
              });

              browser.on("error", (error: any) => {
                resume(Effect.fail(new Error(`mDNS browser error: ${error}`)));
              });

              browser.start();

              setTimeout(5000).then(() => {
                browser.stop();
                resume(Effect.succeed(void 0));
              });
            } catch (error) {
              resume(Effect.fail(new Error(`Error discovering network devices via mDNS: ${error}`)));
            }
          });
        }

        return {
          usb: usbdevices,
          network: networkdevices,
        };
      });

    const populateLocal = (orgId: string) =>
      Effect.gen(function* (_) {
        const { usb, network } = yield* findLocal({ excludeNetwork: true });
        for (const device of usb) {
          yield* Console.log(`Creating USB device ${device.product}`);
          yield* create(
            {
              model: device.product,
              connectionUrl: device.uri,
              name: `${device.product} (${device.manufacturer})`,
              type: "thermal",
            },
            orgId,
          );
        }
        for (const device of network) {
          yield* create(
            {
              model: device.attributes["printer-make-and-model"],
              connectionUrl: device.uri,
              name: device.attributes["printer-name"],
              type: "network",
            },
            orgId,
          );
        }
      });

    return {
      create,
      findById,
      update,
      remove,
      safeRemove,
      findByOrganizationId,
      local,
      print,
      findLocal,
      populateLocal,
    } as const;
  }),
  dependencies: [DatabaseLive],
}) {}

export const PrinterLive = PrinterService.Default;

// Type exports
export type PrinterInfo = NonNullable<Awaited<Effect.Effect.Success<ReturnType<PrinterService["findById"]>>>>;

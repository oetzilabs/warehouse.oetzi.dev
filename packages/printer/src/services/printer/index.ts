import { setTimeout } from "timers/promises";
import { Console, Effect } from "effect";
import ipp from "ipp";
import mdns from "multicast-dns"; // For discovering network printers via mDNS
import { BreakLine, CharacterSet, PrinterTypes, ThermalPrinter } from "node-thermal-printer";
import usb from "usb";

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
        const usbdevices = [];
        const networkdevices = [];

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
              const dns = mdns();
              const devices = new Map<string, Partial<MDNSDevice>>();
              const networkdevices: MDNSDevice[] = [];

              // Step 1: query for _ipp._tcp.local PTRs
              dns.query([{ name: "_ipp._tcp.local", type: "PTR" }]);

              dns.on("response", (res) => {
                for (const answer of res.answers) {
                  // PTR to discover service instance name
                  if (answer.type === "PTR" && answer.name === "_ipp._tcp.local") {
                    const serviceName = answer.data as string;
                    if (!devices.has(serviceName)) {
                      devices.set(serviceName, { name: serviceName, type: "mDNS_IPP" });
                      dns.query([{ name: serviceName, type: "SRV" }]);
                      dns.query([{ name: serviceName, type: "TXT" }]);
                    }
                  }

                  // SRV to get host and port
                  if (answer.type === "SRV") {
                    const entry = devices.get(answer.name);
                    if (entry) {
                      entry.host = answer.data.target;
                      entry.port = answer.data.port;
                      dns.query([{ name: entry.host, type: "A" }]);
                      dns.query([{ name: entry.host, type: "AAAA" }]);
                    }
                  }

                  // A / AAAA record for address
                  if ((answer.type === "A" || answer.type === "AAAA") && devices) {
                    // find matching entry by host
                    for (const entry of devices.values()) {
                      if (entry.host === answer.name) {
                        entry.addresses ??= [];
                        entry.addresses.push(answer.data);
                      }
                    }
                  }

                  // TXT record
                  if (answer.type === "TXT") {
                    const entry = devices.get(answer.name);
                    if (entry && Array.isArray(answer.data)) {
                      entry.txtRecord = answer.data.map((buf: Buffer | string) =>
                        typeof buf === "string" ? buf : buf.toString(),
                      );
                    }
                  }
                }
              });

              // Timeout and finalize results
              // wait 5 seconds then stop
              setTimeout(5000).then(() => {
                dns.destroy();
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

    return {
      local,
      findLocal,
    } as const;
  }),
}) {}

export const PrinterLive = PrinterService.Default;

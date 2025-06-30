import path from "path";
import bwipjs from "bwip-js";
import dayjs from "dayjs";
import { Console, Effect } from "effect";
import PdfPrinter from "pdfmake";
import {
  Content,
  ContentTable,
  ContentText,
  CustomTableLayout,
  TableCell,
  TableLayout,
  TDocumentDefinitions,
} from "pdfmake/interfaces";
import QRCode from "qrcode";
import { CustomerOrderInfo } from "../orders";
import { OrganizationInfo } from "../organizations";
import { ProductInfo } from "../products";
import { SaleInfo } from "../sales";
import {
  BorderConfig,
  Cell,
  default_styles,
  getTableLayout,
  Image,
  placeholderImage,
  Row,
  Table,
  Text,
} from "./components";

export type PaperSize = "A4" | "A5";
export type PaperOrientation = "portrait" | "landscape";
type HeaderVariant = "small" | "big";

export class PDFService extends Effect.Service<PDFService>()("@warehouse/pdf", {
  effect: Effect.gen(function* (_) {
    const generateQRCode = Effect.fn("@warehouse/pdf/generateQRCode")(function* (text: string) {
      const qrDataUrl = yield* Effect.promise(() => QRCode.toDataURL(text));
      return qrDataUrl; // Return the complete data URL instead of splitting
    });

    const getLogoElement = (size: number, image?: string) => {
      if (image) {
        return {
          image: image,
          width: size,
          height: size,
          fit: [size, size] as [number, number],
          margin: [5, 5, 5, 5] as [number, number, number, number],
        };
      }
      return {
        canvas: [
          {
            type: "rect",
            x: 0,
            y: 0,
            w: size,
            h: size,
            lineWidth: 0.5, // This is the stroke width
            lineColor: "#222222", // This is the stroke color
            color: "#222222", // This is the fill color
          },
        ],
        margin: [5, 5, 5, 5] as [number, number, number, number], // Apply margin to the canvas element itself
      };
    };

    const generateBarcode = Effect.fn("@warehouse/pdf/generateBarcode")(function* (text: string) {
      return yield* Effect.async<string, Error>((resume) => {
        bwipjs.toBuffer(
          {
            bcid: "code128",
            text,
            scale: 2,
            height: 8,
            includetext: true,
            textxalign: "center",
          },
          (err, png) => {
            if (err) resume(Effect.fail(typeof err === "string" ? new Error(err) : err));
            resume(Effect.succeed("data:image/png;base64," + png.toString("base64")));
          },
        );
      });
    });

    const getPaperDimensions = (size: PaperSize, orientation: PaperOrientation): [number, number] => {
      const dimensions = {
        A4: [595, 842] as [number, number], // width, height in points
        A5: [420, 595] as [number, number],
      };
      const [width, height] = dimensions[size];
      return orientation === "portrait" ? [width, height] : [height, width];
    };

    const fonts = {
      Helvetica: {
        normal: "Helvetica",
        bold: "Helvetica-Bold",
        italics: "Helvetica-Oblique",
        bolditalics: "Helvetica-BoldOblique",
      },
    };

    type PageTableCell = TableCell & {
      border?: [boolean, boolean, boolean, boolean];
      borderColor?: string[];
    };

    const base = Effect.fn("@warehouse/pdf/base")(function* (options: {
      paper: { size: PaperSize; orientation: PaperOrientation };
      header: {
        variant: "small" | "big";
        content: TableCell[];
      };
      content: TableCell[];
      footer?: TableCell[];
      info: {
        title: string;
        author: string;
        subject: string;
        keywords: string;
      };
    }) {
      const dimensions = getPaperDimensions(options.paper.size, options.paper.orientation);
      const margins = 40;
      const result = {
        pageSize: { width: dimensions[0], height: dimensions[1] },
        pageOrientation: options.paper.orientation,
        pageMargins: [margins / 2, margins / 2, margins / 2, margins / 2],
        content: [
          {
            table: {
              widths: ["*"],
              heights: "auto",
              body: [[...options.header.content], ...options.content, ...(options.footer ? options.footer : [])],
            },
            layout: getTableLayout({ width: 0.5 }, { fillOpacity: (i, node) => 0 }),
          },
        ],
        styles: default_styles,
        info: options.info,
      } as TDocumentDefinitions;
      return result;
    });

    const product = Effect.fn("@warehouse/pdf/product")(function* (
      data: any,
      organization: OrganizationInfo,
      contents: ("conditions" | "labels" | "certifications" | "map" | "information" | "suppliers")[],
      config: {
        page: {
          size: "A4" | "A5";
          orientation: "portrait" | "landscape";
        };
      },
    ) {
      const qr = yield* generateQRCode(data.sku);
      const barcodeData = yield* generateBarcode(data.sku);

      const basePdf = yield* base({
        paper: config.page,
        header: {
          variant: config.page.size === "A4" ? "big" : "small",
          content: [
            Cell([
              Image(organization.image ?? placeholderImage, 50, {
                margin: [5, 5, 5, 5],
              }),
              {
                stack:
                  config.page.size === "A4"
                    ? [
                        Text(organization.name, "header", { margin: [0, 0, 0, 5] }),
                        Text(organization.website ?? "No website", "subheader", { lineHeight: 1.4 }),
                        Text(organization.phone ?? "No phone number", "subheader", { lineHeight: 1.4 }),
                      ]
                    : [
                        Text(organization.name, "smallHeaderTitle", { margin: [0, 0, 0, 5] }),
                        Text(organization.website ?? "No website", "smallHeaderText", { lineHeight: 1.4 }),
                        Text(organization.phone ?? "No phone number", "smallHeaderText", { lineHeight: 1.4 }),
                      ],
                margin: [15, 5, 5, 5],
              },
              Image(qr, 50),
            ]),
          ],
        },
        content: [
          [
            {
              stack: [
                Table([
                  contents.includes("information")
                    ? Row([
                        Text("Product Information.", "sectionHeader", {
                          margin: [0, 0, 0, 5],
                        }),
                        Text(`Name: ${data.name}`, "normalText"),
                        Text(`SKU: ${data.sku}`, "normalText"),
                        Text(`Description: ${data.description}`, "normalText"),
                      ])
                    : null,
                  contents.includes("suppliers")
                    ? Row([
                        Text("Suppliers.", "sectionHeader", {
                          margin: [0, 0, 0, 5],
                        }),
                        ...data.suppliers.map((s) => [Text(`${s.supplier.name} (${s.supplier.email})`, "normalText")]),
                      ])
                    : null,
                  contents.includes("conditions") && data.stco.map((sc) => sc.condition).length > 0
                    ? [
                        {
                          stack: [
                            Text("Conditions.", "sectionHeader", {
                              margin: [0, 0, 0, 5],
                            }),
                            ...data.stco
                              .map((sc) => sc.condition)
                              .map((condition) =>
                                Table(
                                  [
                                    [Text(condition.name, "tableHeader"), Text("Value", "tableHeader")],
                                    ...Object.entries({
                                      "Min Temperature": (condition.temperatureMin ?? 0).toFixed(2),
                                      "Max Temperature": (condition.temperatureMax ?? 0).toFixed(2),
                                      "Min Humidity": (condition.humidityMin ?? 0).toFixed(2),
                                      "Max Humidity": (condition.humidityMax ?? 0).toFixed(2),
                                      "Min Light Level": (condition.lightLevelMin ?? 0).toFixed(2),
                                      "Max Light Level": (condition.lightLevelMax ?? 0).toFixed(2),
                                    }).map(([key, value]) => [Text(key, "tableCell"), Text(value, "tableCell")]),
                                  ],
                                  {
                                    widths: ["*", "*"],
                                    layout: getTableLayout(undefined, {
                                      fillColor: (i, node) => {
                                        if (i === 0) return "#f8f9fa";
                                        if (i === node.table.body.length - 1) return "#f8f9fa";
                                        return null;
                                      },
                                    }),
                                  },
                                ),
                              ),
                          ],
                          border: [false, false, false, true],
                          borderColor: Array(4).fill("#222222"),
                        },
                      ]
                    : null,
                  contents.includes("certifications") && data.certs.length > 0
                    ? Row([
                        Text("Certificates.", "sectionHeader", { margin: [0, 0, 0, 5] }),
                        ...data.certs
                          .map((c) => c.cert)
                          .map((cert) => Text(`${cert.name}: ${cert.certificationNumber}`, "normalText")),
                      ])
                    : null,
                  contents.includes("labels") && data.labels.length > 0
                    ? Row([
                        Text("Product Labels.", "sectionHeader", { margin: [0, 0, 0, 5] }),
                        ...data.labels.map((label) => Text(label.label.name, "normalText", { margin: [0, 2, 0, 2] })),
                      ])
                    : null,
                ]),
              ],
              border: [true, false, true, true],
              borderColor: Array(4).fill("#222222"),
            },
          ],
        ],
        footer: [[Image(barcodeData, 250, { alignment: "center", margin: [0, 10, 0, 10] })]],
        info: {
          title: "Product Sheet",
          author: "warehouse.oetzi.dev",
          subject: `Product sheet for ${data.name} (${data.sku})`,
          keywords: `product,warehouse,${data.name},${data.sku}`,
        },
      });

      return yield* Effect.async<Buffer<ArrayBuffer>, Error>((resume) => {
        const pdfDoc = new PdfPrinter(fonts).createPdfKitDocument(basePdf);
        const chunks: Uint8Array[] = [];
        pdfDoc.on("data", (chunk) => chunks.push(chunk));
        pdfDoc.on("end", () => resume(Effect.succeed(Buffer.concat(chunks))));
        pdfDoc.on("error", (error) => resume(Effect.fail(error)));
        pdfDoc.end();
      });
    });

    const order = Effect.fn("@warehouse/pdf/order")(function* (
      data: any,
      organization: OrganizationInfo,
      config: {
        page: {
          size: "A4" | "A5";
          orientation: "portrait" | "landscape";
        };
      },
    ) {
      if (!data.barcode) {
        return yield* Effect.fail(new Error("Barcode is missing"));
      }
      const qr = yield* generateQRCode(data.barcode);
      const barcodeData = yield* generateBarcode(data.barcode);

      const basePdf = yield* base({
        paper: config.page,
        header: {
          variant: config.page.size === "A4" ? "big" : "small",
          content: [
            Cell([
              Image(
                organization.image ??
                  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB0AAAAeCAYAAADQBxWhAAAAAXNSR0IArs4c6QAABWBJREFUSEuNV01MU1kU/krLj/wkUH5Kkb+RdkzYOJHNuHKljAksdJyEbiABduOan4EFo4uxJoSFMa5MfNXoKAYTMDILQ2JZDBMpO5nE15YWpOXHMpgWKFjyJue0r32v71W8C3i979z73fOdc757nsHj8UhmsxmFhYUwAJCgGMoJzbPGWrky9ay2OTw8xE5kBwa/3y993t2FzW5HaWmpzkLFFJ2I9vnaSNlkm8ZiMYiiiPLychhCoZBUVFSEYDAI+/d2lBSXqLY8GUeJomMtAXv7ewzY1NyE+EE8CWqttSKyE8H6x4/scXFxsdaXr6LnBt7f32fA+voGVFaaEQ6HCTQsWa21HMxPkU88abPZcOrUKS2vOtTxlGY+OXFwcACv1wfav6qqivfbSIKGJKvVmgbY3t7G5uYmAxPtuYYSTGMjAfHDOLxeLywWC6qrq5MmEhDeUIFKkGDgPNna2gKB2+12FBQUpBeok0jJd2YtGR8dHTGlBFZTU6M6U4rekFRrtWr229zaRCQSYeD8/PwcwMkSkxOanhNfvjBgZWUlLDUWfpmxkRAOb8j01iaXZiULnWp3dxd2mx2mfFP2azWrEpA4TiTLoqIclJyZkQl6Fr0aTF4TCoUQi0bRYrfBmJeXs1CPj485hmVlZairq8uZCxrQVKw19b++HsLeXoypNjCXSkINoIiKH0SUlJTg9OnTGgeVJ0jHVJm9Gs5SAGtra4jH4wycPYhSyvSGhoYcIcjELRNT4l8uNuWOWVmyuhbE4dEX2G22tBVRShne0Nh4okLSom/wVBsakstEIoGWlhb4fD6YTCY0NTXpx1BHTLSgOZRF3lF2PBBYQSwaQ2lZGZqbm3Mkjb5u6nuqr2vpjel1MBBANBrlTNWC6ou+HD5d0JNulWBwFcfHCZz57gz8K34YjUY1vbkwUzqoEAdlIafqVSceq6urLHGky/LwekUUFBSisbExZ21qSoZk+OLFi3j16pXiElcfly7gS5cvYeHvBb723G432trauDzuOJ0YGhri+nz37h3U5ac+Of3aSAp+WHrkEvB+eRmCIOhK18joCJaXlzE1NcWHGx8f5//RaAwORxeePHmCiYkJBAIBTE5OppoevRZDob2E5HA48PTp08xJU4ckGaSkIUrzjEYseTzo6+vD7OwsFhcX8eLFCz4seTk8PIz79+/rCojsDSdSOBSSJAPg6HLgt+FhDAwO8oZE0+jIKA7icTidt7keaTidTn5Pnt67d48ZEISH8HiW0Nvbi7t37zKoTHN2XqWz95HLhd9v3oTbPY9waJ2pPn++Dbdv/8GeVFRUMGBPTw9cLhemp6fR2dkJp/MO/l1+j4eCwErT5XDgkeBCbC+mutq0iWSAdOPXG5ifn8eDBw9w9uxZtLe3Y2lpCXNzc/jxwgWVvNEtceWnK2z75s2blKcCdwTEFoWIWlqSR77Eq2tUHWTaU4obxemv2VkYTSY8e/Ynnj+fxOvXrzMZreCJPG5tbWUHkvQK8ChiTdRS1+f1ibBYajPtilJ7KSEoIwXBBZ/Pi7GxMZw79wPaL19CR2enpv4I9Pov17mg5UQi0Fu3buHx48fpgyYbMy+oM6lONWbsqSiKUn9/P6hWr/18DTPTM9yedHd3pzOa4kgcDQ4OsEdXr17Fy5cv+bKWs55sZK+V91umBa3nOLMiUVF1ObowODAAUfRyRspCMTMzw57QXEdHB96+dXMNyokkZzOJAynSwj8LWW1KUt32qdn+ILJc0p1s8PtXpM+7/6k/K04SYJX8q7sIVSwU+9CtJHpTnxWeRY9krjSjqLAQVK/0J9mA0Pi2j6SM/dfllz+gdnbwP3BGCEixd7+qAAAAAElFTkSuQmCC",
                50,
                {
                  margin: [5, 5, 5, 5],
                },
              ),
              {
                stack:
                  config.page.size === "A4"
                    ? [
                        Text(organization.name, "header", { margin: [0, 0, 0, 5] }),
                        Text(organization.website ?? "No website", "subheader", { lineHeight: 1.4 }),
                        Text(organization.phone ?? "No phone number", "subheader", { lineHeight: 1.4 }),
                      ]
                    : [
                        Text(organization.name, "smallHeaderTitle", { margin: [0, 0, 0, 5] }),
                        Text(organization.website ?? "No website", "smallHeaderText", { lineHeight: 1.4 }),
                        Text(organization.phone ?? "No phone number", "smallHeaderText", { lineHeight: 1.4 }),
                      ],
                margin: [15, 5, 5, 5],
              },
              Image(qr, 50),
            ]),
          ],
        },
        content: [
          [
            Table(
              [
                Row([
                  Text("Orders.", "sectionHeader", {
                    margin: [0, 0, 0, 5],
                  }),
                  // Order dates and preferred times in one clean table
                  Table(
                    [
                      [
                        Text("Created", "tableHeader"),
                        Text(dayjs(data.createdAt).format("DD.MM.YYYY HH:mm"), "tableCell", {
                          margin: [0, 0, 5, 5],
                        }),
                        Text("Updated", "tableHeader"),
                        Text(data.updatedAt ? dayjs(data.updatedAt).format("DD.MM.YYYY HH:mm") : "N/A", "tableCell", {
                          margin: [0, 0, 5, 5],
                        }),
                      ],
                      [{ text: "", colSpan: 4, margin: [0, 5] }],
                      // [
                      //   Text("Pickup Times", "tableHeader", { colSpan: 2 }),
                      //   {},
                      //   Text("Delivery Times", "tableHeader", { colSpan: 2 }),
                      //   {},
                      // ],
                      // ...Array.from(
                      //   {
                      //     length: data.customer.pdt.length,
                      //   },
                      //   (_, i) => [
                      //     // Pickup time column
                      //     data.customer.pdt[i]
                      //       ? Text(dayjs(data.customer.pdt[i].schedule.scheduleStart).format("dddd"), "tableCell")
                      //       : {},
                      //     data.customer.pdt[i]
                      //       ? Text(
                      //           `${dayjs(data.customer.pdt[i].schedule.scheduleStart).format("HH:mm")} - ${dayjs(data.custSched[i].schedule.scheduleEnd).format("HH:mm")}`,
                      //           "tableCell",
                      //         )
                      //       : {},
                      //     // Delivery time column
                      //     data.oco.some((o) => o.customer.pdt[i])
                      //       ? Text(dayjs(data.oco[0].customer.pdt[i].startTime).format("dddd"), "tableCell")
                      //       : {},
                      //     data.oco.some((o) => o.customer.pdt[i])
                      //       ? Text(
                      //           data.oco
                      //             .filter((o) => o.customer.pdt[i])
                      //             .map(
                      //               (o) =>
                      //                 `${dayjs(o.customer.pdt[i].startTime).format("HH:mm")} - ${dayjs(o.customer.pdt[i].endTime).format("HH:mm")}`,
                      //             )
                      //             .join(", "),
                      //           "tableCell",
                      //         )
                      //       : {},
                      //   ],
                      // ),
                    ],
                    {
                      widths: ["auto", "*", "auto", "*"],
                      layout: getTableLayout(undefined, {
                        fillColor: (i) => (i === 0 || i === 2 ? "#f8f9fa" : null),
                        paddingLeft: () => 0,
                        paddingRight: () => 0,
                        paddingTop: () => 0,
                        paddingBottom: () => 0,
                      }),
                    },
                  ),
                  // Add some spacing
                  { text: "", margin: [0, 15, 0, 10] },
                  // Products table
                  Row(
                    [
                      Table(
                        [
                          // Header
                          [
                            Text("Product", "tableHeader", {
                              margin: [0, 0, 5, 5],
                            }),
                            Text("Qty", "tableHeader", {
                              margin: [0, 0, 5, 5],
                            }),
                            Text("Price", "tableHeader", {
                              margin: [0, 0, 5, 5],
                            }),
                            Text("Tax", "tableHeader", {
                              margin: [0, 0, 5, 5],
                            }),
                            Text("Total", "tableHeader", {
                              margin: [0, 0, 5, 5],
                            }),
                          ],
                          // Products
                          ...data.products.map((prod) => [
                            {
                              stack: [
                                Text(prod.product.name, "tableCell"),
                                Text(prod.product.sku, "smallText", { margin: [0, 2, 0, 0] }),
                                ...(prod.product.organizations[0].tg
                                  ? [
                                      Text(
                                        `${prod.product.organizations[0].tg.name} (${prod.product.organizations[0].tg.crs[0]?.tr.rate ?? 0}%)`,
                                        "smallText",
                                      ),
                                    ]
                                  : []),
                              ],
                              margin: [0, 0, 5, 5],
                            },
                            Text(`${prod.quantity.toString()}x`, "tableCell", {
                              margin: [0, 0, 5, 5],
                            }),
                            Text(`${prod.product.sellingPrice.toFixed(2)} ${prod.product.currency}`, "tableCell", {
                              margin: [0, 0, 5, 5],
                            }),
                            {
                              stack:
                                prod.product.organizations[0].tg?.crs.map((cr) =>
                                  Text(
                                    `${((prod.product.sellingPrice * prod.quantity * (cr.tr.rate ?? 0)) / 100).toFixed(2)} ${prod.product.currency}`,
                                    "tableCell",
                                    {
                                      margin: [0, 0, 5, 5],
                                    },
                                  ),
                                ) ?? [],
                            },
                            Text(
                              `${(prod.product.sellingPrice * prod.quantity).toFixed(2)} ${prod.product.currency}`,
                              "tableCell",
                              {
                                margin: [0, 0, 5, 5],
                              },
                            ),
                          ]),
                          // Spacing before totals
                          [{ text: "", colSpan: 5, margin: [0, 5] }, {}, {}, {}, {}],
                          // Totals by currency
                          ...Object.entries(
                            data.products.reduce(
                              (acc, prod) => {
                                const currency = prod.product.currency!;
                                if (!acc[currency]) acc[currency] = 0;
                                acc[currency] += prod.product.sellingPrice * prod.quantity;
                                return acc;
                              },
                              {} as Record<string, number>,
                            ),
                          ).map(([currency, total]) => [
                            {},
                            {},
                            {},
                            Text("Total", "tableHeader", {
                              margin: [0, 0, 5, 5],
                            }),
                            Text(`${total.toFixed(2)} ${currency}`, "tableHeader", {
                              margin: [0, 0, 5, 5],
                            }),
                          ]),
                        ],
                        {
                          widths: ["*", "auto", "auto", "auto", "auto"],
                          layout: getTableLayout(undefined, {
                            fillColor: (i, node) => {
                              if (i === 0) return "#f8f9fa";
                              if (i === node.table.body.length - 1) return "#f8f9fa";
                              return null;
                            },
                            paddingLeft: () => 0,
                            paddingRight: () => 0,
                            paddingTop: () => 0,
                            paddingBottom: () => 0,
                          }),
                        },
                      ),
                    ],
                    {
                      border: {
                        tuple: [false, true, false, false],
                        color: ["#222222", "#222222", "#222222", "#222222"],
                        style: "solid",
                      },
                    },
                  ),
                ]),
              ],
              {
                widths: ["*"],
              },
            ),
          ],
        ],
        footer: [[Image(barcodeData, 200, { alignment: "center", margin: [0, 10, 0, 10] })]],
        info: {
          title: "Order Invoice",
          author: "warehouse.oetzi.dev",
          subject: `Invoice for ${data.barcode}`,
          keywords: `product,warehouse,${data.barcode}`,
        },
      });

      return yield* Effect.async<Buffer<ArrayBuffer>, Error>((resume) => {
        const pdfDoc = new PdfPrinter(fonts).createPdfKitDocument(basePdf);
        const chunks: Uint8Array[] = [];
        pdfDoc.on("data", (chunk) => chunks.push(chunk));
        pdfDoc.on("end", () => resume(Effect.succeed(Buffer.concat(chunks))));
        pdfDoc.on("error", (error) => resume(Effect.fail(error)));
        pdfDoc.end();
      });
    });

    const sale = Effect.fn("@warehouse/pdf/sale")(function* (
      data: any,
      organization: OrganizationInfo,
      config: {
        page: {
          size: "A4" | "A5";
          orientation: "portrait" | "landscape";
        };
      },
    ) {
      if (!data.barcode) {
        return yield* Effect.fail(new Error("Barcode is missing"));
      }
      const qr = yield* generateQRCode(data.barcode);
      const barcodeData = yield* generateBarcode(data.barcode);

      const basePdf = yield* base({
        paper: config.page,
        header: {
          variant: config.page.size === "A4" ? "big" : "small",
          content: [
            Cell([
              Image(organization.image ?? placeholderImage, 50, {
                margin: [5, 5, 5, 5],
              }),
              {
                stack:
                  config.page.size === "A4"
                    ? [
                        Text(organization.name, "header", { margin: [0, 0, 0, 5] }),
                        Text(organization.website ?? "No website", "subheader", { lineHeight: 1.4 }),
                        Text(organization.phone ?? "No phone number", "subheader", { lineHeight: 1.4 }),
                      ]
                    : [
                        Text(organization.name, "smallHeaderTitle", { margin: [0, 0, 0, 5] }),
                        Text(organization.website ?? "No website", "smallHeaderText", { lineHeight: 1.4 }),
                        Text(organization.phone ?? "No phone number", "smallHeaderText", { lineHeight: 1.4 }),
                      ],
                margin: [15, 5, 5, 5],
              },
              Image(qr, 50),
            ]),
          ],
        },
        content: [
          [
            Table(
              [
                Row([
                  Text("Sale.", "sectionHeader", {
                    margin: [0, 0, 0, 5],
                  }),
                  // Sale dates and customer info
                  Table(
                    [
                      [
                        Text("Created", "tableHeader"),
                        Text(dayjs(data.createdAt).format("DD.MM.YYYY HH:mm"), "tableCell", {
                          margin: [5, 0, 5, 5],
                        }),
                        Text("Updated", "tableHeader"),
                        Text(data.updatedAt ? dayjs(data.updatedAt).format("DD.MM.YYYY HH:mm") : "N/A", "tableCell", {
                          margin: [5, 0, 5, 5],
                        }),
                      ],
                      [{ text: "", colSpan: 4, margin: [0, 5] }],
                      [
                        Text("Customer", "tableHeader"),
                        Text(data.customer.name, "tableCell", {
                          margin: [5, 0, 5, 5],
                        }),
                        Text("Email", "tableHeader"),
                        Text(data.customer.email, "tableCell", {
                          margin: [5, 0, 5, 5],
                        }),
                      ],
                      [
                        Text("Status", "tableHeader"),
                        Text(data.status.toUpperCase(), "tableCell", {
                          margin: [5, 0, 5, 5],
                        }),
                        Text("Note", "tableHeader"),
                        Text(data.note ?? "-", "tableCell", {
                          margin: [5, 0, 5, 5],
                        }),
                      ],
                    ],
                    {
                      widths: ["auto", "*", "auto", "*"],
                      layout: getTableLayout(undefined, {
                        fillColor: (i) => (i === 0 || i === 2 ? "#f8f9fa" : null),
                      }),
                    },
                  ),
                  // Add some spacing
                  { text: "", margin: [0, 15, 0, 10] },
                  // Products table
                  Row([
                    Table(
                      [
                        // Header
                        [
                          Text("Product", "tableHeader", {
                            margin: [0, 0, 5, 5],
                          }),
                          Text("Qty", "tableHeader", {
                            margin: [0, 0, 5, 5],
                          }),
                          Text("Price", "tableHeader", {
                            margin: [0, 0, 5, 5],
                          }),
                          Text("Tax", "tableHeader", {
                            margin: [0, 0, 5, 5],
                          }),
                          Text("Total", "tableHeader", {
                            margin: [0, 0, 5, 5],
                          }),
                        ],
                        // Products
                        ...data.items.map((item) => [
                          {
                            stack: [
                              Text(item.product.name, "tableCell"),
                              Text(item.product.sku, "smallText"),
                              ...(item.product.organizations[0].tg
                                ? [
                                    Text(
                                      `${item.product.organizations[0].tg.name} (${item.product.organizations[0].tg.crs[0]?.tr.rate ?? 0}%)`,
                                      "smallText",
                                    ),
                                  ]
                                : []),
                            ],
                          },
                          Text(`${item.quantity}x`, "tableCell", {
                            margin: [0, 0, 5, 5],
                          }),
                          Text(`${item.price.toFixed(2)} ${item.product.currency}`, "tableCell", {
                            margin: [0, 0, 5, 5],
                          }),
                          {
                            stack:
                              item.product.organizations[0].tg?.crs.map((cr) =>
                                Text(
                                  `${((item.price * item.quantity * (cr.tr.rate ?? 0)) / 100).toFixed(2)} ${item.product.currency}`,
                                  "tableCell",
                                  {
                                    margin: [0, 0, 5, 5],
                                  },
                                ),
                              ) ?? [],
                          },
                          Text(`${(item.price * item.quantity).toFixed(2)} ${item.product.currency}`, "tableCell", {
                            margin: [0, 0, 5, 5],
                          }),
                        ]),
                        // Spacing before totals
                        [{ text: "", colSpan: 5, margin: [0, 5] }],
                        // Totals by currency
                        ...Object.entries(
                          data.items.reduce(
                            (acc, item) => {
                              const currency = item.product.currency!;
                              if (!acc[currency]) acc[currency] = 0;
                              acc[currency] += item.price * item.quantity;
                              return acc;
                            },
                            {} as Record<string, number>,
                          ),
                        ).map(([currency, total]) => [
                          {},
                          {},
                          {},
                          Text("Total", "tableHeader"),
                          Text(`${total.toFixed(2)} ${currency}`, "tableHeader"),
                        ]),
                      ],
                      {
                        widths: ["*", "auto", "auto", "auto", "auto"],
                        layout: getTableLayout(undefined, {
                          fillColor: (i, node) => {
                            if (i === 0) return "#f8f9fa";
                            if (i === node.table.body.length - 1) return "#f8f9fa";
                            return null;
                          },
                        }),
                      },
                    ),
                  ]),
                ]),
              ],
              {
                widths: ["*"],
              },
            ),
          ],
        ],
        footer: [[Image(barcodeData, 200, { alignment: "center", margin: [0, 10, 0, 10] })]],
        info: {
          title: "Sale Receipt",
          author: "warehouse.oetzi.dev",
          subject: `Receipt for sale ${data.barcode}`,
          keywords: `sale,warehouse,${data.barcode}`,
        },
      });

      return yield* Effect.async<Buffer<ArrayBuffer>, Error>((resume) => {
        const pdfDoc = new PdfPrinter(fonts).createPdfKitDocument(basePdf);
        const chunks: Uint8Array[] = [];
        pdfDoc.on("data", (chunk) => chunks.push(chunk));
        pdfDoc.on("end", () => resume(Effect.succeed(Buffer.concat(chunks))));
        pdfDoc.on("error", (error) => resume(Effect.fail(error)));
        pdfDoc.end();
      });
    });

    return {
      product,
      sale,
      order,
    } as const;
  }),
}) {}

export const PDFLive = PDFService.Default;

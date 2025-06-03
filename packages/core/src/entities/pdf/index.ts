import path from "path";
import bwipjs from "bwip-js";
import { Effect } from "effect";
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
import { OrganizationInfo } from "../organizations";
import { ProductInfo } from "../products";

export type PaperSize = "A4" | "A5";
export type PaperOrientation = "portrait" | "landscape";
type HeaderVariant = "small" | "big";

type BorderConfig = {
  width?: number;
  color?: string;
  style?: "solid" | "dashed";
};

const getTableLayout = (
  borderConfig: BorderConfig = {
    width: 0.5,
    color: "#222222",
  },
  tc: CustomTableLayout = {
    paddingLeft: (i, node) => 0,
    paddingRight: (i, node) => 0,
    paddingTop: (i, node) => 0,
    paddingBottom: (i, node) => 0,
    fillColor: "#222222",
    fillOpacity: 1,
    defaultBorder: true,
  },
): TableLayout => ({
  hLineWidth: (i, node) => borderConfig.width ?? 0.5,
  vLineWidth: (i, node) => borderConfig.width ?? 0.5,
  hLineColor: (i, node) => borderConfig.color ?? "#222222",
  vLineColor: (i, node) => borderConfig.color ?? "#222222",
  hLineStyle: (i, node) => (borderConfig.style === "dashed" ? { dash: { length: 4 } } : null),
  vLineStyle: (i, node) => (borderConfig.style === "dashed" ? { dash: { length: 4 } } : null),
  defaultBorder: tc.defaultBorder ?? false,
  fillColor: tc.fillColor ?? "#000000",
  fillOpacity: tc.fillOpacity ?? ((i, node) => 0),
  paddingLeft: tc.paddingLeft ?? ((i, node) => 0),
  paddingRight: tc.paddingRight ?? ((i, node) => 0),
  paddingTop: tc.paddingTop ?? ((i, node) => 0),
  paddingBottom: tc.paddingBottom ?? ((i, node) => 0),
});

export class PDFService extends Effect.Service<PDFService>()("@warehouse/pdf", {
  effect: Effect.gen(function* (_) {
    const generateQRCode = (text: string) =>
      Effect.gen(function* (_) {
        const qrDataUrl = yield* Effect.promise(() => QRCode.toDataURL(text));
        const qrImageData = qrDataUrl.split(",")[1];
        return qrImageData; // Return base64 string directly
      });
    const getLogoElement = (size: number, image?: string) => {
      if (image) {
        return {
          image: image,
          width: size,
          height: size,
          fit: [size, size],
          margin: [5, 5, 5, 5],
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
        margin: [5, 5, 5, 5], // Apply margin to the canvas element itself
      };
    };

    const generateBarcode = (text: string) =>
      Effect.async<string, Error>((resume) => {
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

    const base = (options: {
      paper: { size: PaperSize; orientation: PaperOrientation };
      header: {
        variant: "small" | "big";
        content: TableCell[][];
      };
      content: TableCell[][];
      footer?: TableCell[][];
    }) =>
      Effect.gen(function* (_) {
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
                body: [
                  // Each item needs to be in its own array to represent a row
                  ...options.header.content,
                  ...options.content,
                  ...(options.footer ? options.footer : []),
                ],
              },
              layout: getTableLayout(
                {
                  width: 0.5,
                },
                {
                  fillOpacity: (i, node) => 0,
                },
              ),
            },
          ],
          styles: {
            header: {
              fontSize: 14,
              bold: true,
              font: "Helvetica",
            },
            subheader: {
              fontSize: 8,
              color: "#555555",
              font: "Helvetica",
            },
            sectionHeader: {
              fontSize: 10,
              bold: true,
              font: "Helvetica",
            },
            normalText: {
              fontSize: 8,
              font: "Helvetica",
              lineHeight: 1.4,
            },
            tableHeader: {
              fontSize: 10,
              bold: true,
              font: "Helvetica",
              color: "#495057",
            },
            tableCell: {
              fontSize: 9,
              font: "Helvetica",
              color: "#212529",
            },
            smallHeaderLogo: {
              fontSize: 8,
              font: "Helvetica",
              alignment: "center",
            },
            smallHeaderTitle: {
              fontSize: 10,
              bold: true,
              font: "Helvetica",
            },
            smallHeaderText: {
              fontSize: 8,
              color: "grey",
              font: "Helvetica",
            },
          },
        } as TDocumentDefinitions;
        return result;
      });

    const product = (
      data: ProductInfo,
      organization: OrganizationInfo,
      contents: ("conditions" | "labels" | "certifications" | "map" | "information" | "suppliers")[],
      config: {
        page: {
          size: "A4" | "A5";
          orientation: "portrait" | "landscape";
        };
      },
    ) =>
      Effect.gen(function* (_) {
        const qr = yield* generateQRCode(data.sku);
        const barcodeData = yield* generateBarcode(data.sku);

        const basePdf = yield* base({
          paper: config.page,
          header: {
            variant: config.page.size === "A4" ? "big" : "small",
            content: [
              [
                {
                  columns: [
                    {
                      width: config.page.size === "A4" ? 50 : 30,
                      ...getLogoElement(config.page.size === "A4" ? 50 : 30, organization.image ?? undefined),
                    },
                    {
                      width: "*",
                      stack:
                        config.page.size === "A4"
                          ? [
                              { text: organization.name, style: "header", margin: [0, 0, 0, 5] },
                              { text: organization.website, style: "subheader", lineHeight: 1.4 },
                              { text: organization.phone, style: "subheader", lineHeight: 1.4 },
                            ]
                          : [
                              { text: organization.name, style: "smallHeaderTitle", margin: [0, 0, 0, 5] },
                              { text: organization.website, style: "smallHeaderText", lineHeight: 1.4 },
                              { text: organization.phone, style: "smallHeaderText", lineHeight: 1.4 },
                            ],
                      margin: [15, 5, 5, 5],
                    },
                    {
                      width: config.page.size === "A4" ? 50 : 30,
                      image: `data:image/png;base64,${qr}`,
                      fit: config.page.size === "A4" ? [50, 50] : [30, 30],
                    },
                  ].filter(Boolean),
                  border: [true, true, true, true],
                  borderColor: Array(4).fill("#222222"),
                },
              ],
            ],
          },
          content: [
            [
              {
                stack: [
                  {
                    table: {
                      widths: ["*"],
                      body: [
                        contents.includes("information")
                          ? [
                              {
                                stack: [
                                  { text: "Product Information.", style: "sectionHeader", margin: [0, 0, 0, 5] },
                                  { text: `Name: ${data.name}`, style: "normalText" },
                                  { text: `SKU: ${data.sku}`, style: "normalText" },
                                  { text: `Description: ${data.description}`, style: "normalText" },
                                  // subtitle ? { text: subtitle, style: "normalText", margin: [0, 0, 0, 0] } : null,
                                ].filter(Boolean),
                                border: [false, false, false, true],
                                borderColor: Array(4).fill("#222222"),
                              },
                            ]
                          : null,
                        contents.includes("suppliers")
                          ? [
                              {
                                stack: [
                                  { text: "Suppliers.", style: "sectionHeader", margin: [0, 0, 0, 5] },
                                  ...data.suppliers.map((s) => ({
                                    text: `${s.supplier.name} (${s.supplier.email})`,
                                    style: "normalText",
                                  })),
                                ],
                                border: [false, false, false, true],
                                borderColor: Array(4).fill("#222222"),
                              },
                            ]
                          : null,
                        ...(contents.includes("conditions") && data.stco.map((sc) => sc.condition).length > 0
                          ? [
                              [
                                {
                                  stack: [
                                    { text: "Conditions.", style: "sectionHeader", margin: [0, 0, 0, 5] },
                                    ...data.stco
                                      .map((sc) => sc.condition)
                                      .map((condition) => ({
                                        table: {
                                          widths: ["*", "*"],
                                          body: [
                                            [
                                              { text: condition.name, style: "tableHeader" },
                                              { text: "Value", style: "tableHeader" },
                                            ],
                                            ...Object.entries({
                                              "Min Temperature": (condition.temperatureMin ?? 0).toFixed(2),
                                              "Max Temperature": (condition.temperatureMax ?? 0).toFixed(2),
                                              "Min Humidity": (condition.humidityMin ?? 0).toFixed(2),
                                              "Max Humidity": (condition.humidityMax ?? 0).toFixed(2),
                                              "Min Light Level": (condition.lightLevelMin ?? 0).toFixed(2),
                                              "Max Light Level": (condition.lightLevelMax ?? 0).toFixed(2),
                                            }).map(([key, value]) => [
                                              { text: key, style: "tableCell" },
                                              { text: value, style: "tableCell" },
                                            ]),
                                          ],
                                        },
                                        layout: getTableLayout({ color: "#e9ecef" }),
                                      })),
                                  ],
                                  border: [false, false, false, true],
                                  borderColor: Array(4).fill("#222222"),
                                },
                              ],
                            ]
                          : []),
                        ...(contents.includes("certifications") && data.certs.length > 0
                          ? [
                              [
                                {
                                  stack: [
                                    { text: "Certificates.", style: "sectionHeader", margin: [0, 0, 0, 5] },
                                    ...data.certs
                                      .map((c) => c.cert)
                                      .map((cert) => ({
                                        text: `${cert.name}: ${cert.certificationNumber}`,
                                        style: "normalText",
                                      })),
                                  ],
                                  border: [false, false, false, true],
                                  borderColor: Array(4).fill("#222222"),
                                },
                              ],
                            ]
                          : []),
                        ...(contents.includes("labels") && data.labels.length > 0
                          ? [
                              [
                                {
                                  stack: [
                                    { text: "Product Labels.", style: "sectionHeader", margin: [0, 0, 0, 5] },
                                    ...data.labels.map((label) => ({
                                      text: label.label.name,
                                      style: "normalText",
                                      margin: [0, 2, 0, 2],
                                    })),
                                  ],
                                  border: [false, false, false, true],
                                  borderColor: Array(4).fill("#222222"),
                                },
                              ],
                            ]
                          : []),
                      ].filter(Boolean),
                    },
                    layout: getTableLayout(undefined, {
                      paddingBottom: (i, node) => 10,
                      paddingLeft: (i, node) => 10,
                      paddingRight: (i, node) => 10,
                      paddingTop: (i, node) => 10,
                      defaultBorder: false,
                    }),
                  },
                ],
                border: [true, false, true, true],
                borderColor: Array(4).fill("#222222"),
              },
            ],
          ],
          footer: [
            [
              {
                image: barcodeData,
                width: 250,
                alignment: "center",
                margin: [0, 10, 0, 10],
              },
            ],
          ],
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
    } as const;
  }),
}) {}

export const PDFLive = PDFService.Default;

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

    const createBasePDF = ({
      paper,
      showQR = true,
      product,
      organization,
      headerVariant = "big",
    }: {
      paper: { size: PaperSize; orientation: PaperOrientation };
      showQR?: boolean;
      product: { name: string; sku: string; description: string };
      organization: { name: string; address: string; contact: string; image?: string };
      headerVariant?: HeaderVariant;
    }) =>
      Effect.gen(function* (_) {
        const qrCodeData = showQR ? yield* generateQRCode(product.sku) : null;
        const [pageWidth, pageHeight] = getPaperDimensions(paper.size, paper.orientation);
        const margins = 40;

        const getLogoElement = (size: number) => {
          if (organization.image) {
            return {
              image: organization.image,
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

        return {
          pageSize: { width: pageWidth, height: pageHeight },
          pageOrientation: paper.orientation,
          pageMargins: [margins / 2, margins / 2, margins / 2, margins / 2],
          content: [
            {
              table: {
                widths: ["*"],
                heights: "auto",
                body: [
                  // Header row
                  [
                    {
                      columns: [
                        {
                          width: headerVariant === "big" ? 50 : 30,
                          ...getLogoElement(headerVariant === "big" ? 50 : 30),
                        },
                        {
                          width: "*",
                          stack:
                            headerVariant === "big"
                              ? [
                                  { text: organization.name, style: "header", margin: [0, 0, 0, 5] },
                                  { text: organization.address, style: "subheader", lineHeight: 1.4 },
                                  { text: organization.contact, style: "subheader", lineHeight: 1.4 },
                                ]
                              : [
                                  { text: organization.name, style: "smallHeaderTitle", margin: [0, 0, 0, 5] },
                                  { text: organization.address, style: "smallHeaderText", lineHeight: 1.4 },
                                  { text: organization.contact, style: "smallHeaderText", lineHeight: 1.4 },
                                ],
                          margin: [15, 5, 5, 5],
                        },
                        showQR
                          ? {
                              width: headerVariant === "big" ? 50 : 30,
                              image: `data:image/png;base64,${qrCodeData}`,
                              fit: headerVariant === "big" ? [50, 50] : [30, 30],
                            }
                          : null,
                      ].filter(Boolean),
                      border: [true, true, true, true],
                      borderColor: Array(4).fill("#222222"),
                    },
                  ],
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
      });

    const createProductInfoPDF = ({
      organization,
      product,
      suppliers,
      certificates,
      labels,
      conditions,
      paper = { size: "A4" as PaperSize, orientation: "portrait" as PaperOrientation },
    }: {
      organization: { name: string; address: string; contact: string };
      product: { name: string; sku: string; description: string };
      suppliers: Array<{ name: string; contact: string }>;
      certificates: Array<{ name: string; number: string }>;
      conditions: Array<{ name: string; values: Record<string, string> }>;
      labels: Array<{ name: string; value: string }>;
      paper?: { size: PaperSize; orientation: PaperOrientation };
    }) =>
      Effect.gen(function* (_) {
        const basePdf = yield* createBasePDF({
          paper,
          headerVariant: "big",
          organization,
          product,
        });

        const barcodeData = yield* generateBarcode(product.sku);

        // Update basePdf's content to include product info in table format
        ((basePdf.content as Content[])[0] as ContentTable).table.body.push([
          {
            stack: [
              {
                table: {
                  widths: ["*"],
                  body: [
                    // Title row
                    [
                      {
                        stack: [
                          { text: "Product Information.", style: "sectionHeader", margin: [0, 0, 0, 5] },
                          { text: `Name: ${product.name}`, style: "normalText" },
                          { text: `SKU: ${product.sku}`, style: "normalText" },
                          { text: `Description: ${product.description}`, style: "normalText" },
                          // subtitle ? { text: subtitle, style: "normalText", margin: [0, 0, 0, 0] } : null,
                        ].filter(Boolean),
                        border: [false, false, false, true],
                        borderColor: Array(4).fill("#222222"),
                      },
                    ],
                    [
                      {
                        stack: [
                          { text: "Suppliers.", style: "sectionHeader", margin: [0, 0, 0, 5] },
                          ...suppliers.map((s) => ({
                            text: `${s.name} (${s.contact})`,
                            style: "normalText",
                          })),
                        ],
                        border: [false, false, false, true],
                        borderColor: Array(4).fill("#222222"),
                      },
                    ],
                    ...(conditions.length > 0
                      ? [
                          [
                            {
                              stack: [
                                { text: "Conditions.", style: "sectionHeader", margin: [0, 0, 0, 5] },
                                ...conditions.map((condition) => ({
                                  table: {
                                    widths: ["*", "*"],
                                    body: [
                                      [
                                        { text: condition.name, style: "tableHeader" },
                                        { text: "Value", style: "tableHeader" },
                                      ],
                                      ...Object.entries(condition.values).map(([key, value]) => [
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
                    ...(certificates.length > 0
                      ? [
                          [
                            {
                              stack: [
                                { text: "Certificates.", style: "sectionHeader", margin: [0, 0, 0, 5] },
                                ...certificates.map((cert) => ({
                                  text: `${cert.name}: ${cert.number}`,
                                  style: "normalText",
                                })),
                              ],
                              border: [false, false, false, true],
                              borderColor: Array(4).fill("#222222"),
                            },
                          ],
                        ]
                      : []),
                    ...(labels.length > 0
                      ? [
                          [
                            {
                              stack: [
                                { text: "Product Labels.", style: "sectionHeader", margin: [0, 0, 0, 5] },
                                ...labels.map((label) => ({
                                  text: label.name,
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
                    [
                      {
                        image: barcodeData,
                        width: 250,
                        alignment: "center",
                      },
                    ],
                  ],
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
        ]);

        const pdf = yield* Effect.async<Buffer<ArrayBuffer>, Error>((resume) => {
          const pdfDoc = new PdfPrinter(fonts).createPdfKitDocument(basePdf);
          const chunks: Uint8Array[] = [];
          pdfDoc.on("data", (chunk) => chunks.push(chunk));
          pdfDoc.on("end", () => resume(Effect.succeed(Buffer.concat(chunks))));
          pdfDoc.on("error", (error) => resume(Effect.fail(error)));
          pdfDoc.end();
        });
        return pdf;
      });

    const createProductConditionsPDF = ({
      paper,
      product,
      organization,
      conditions,
    }: {
      paper: { size: PaperSize; orientation: PaperOrientation };
      product: { name: string; sku: string; description: string };
      organization: { name: string; address: string; contact: string };
      conditions: Array<{ name: string; values: Record<string, string> }>;
    }) =>
      Effect.gen(function* (_) {
        const basePdf = yield* createBasePDF({
          paper,
          headerVariant: "small",
          organization,
          product,
        });

        ((basePdf.content as Content[])[0] as ContentTable).table.body.push([
          {
            stack: [
              {
                table: {
                  widths: ["*"],
                  body: [
                    [
                      {
                        stack: [
                          { text: "Product Conditions.", style: "sectionHeader", margin: [0, 0, 0, 5] },
                          ...conditions.map((c) => ({
                            stack: [
                              { text: c.name, style: "normalText", bold: true },
                              ...Object.entries(c.values).map(([k, v]) => ({
                                text: `${k}: ${v}`,
                                style: "normalText",
                              })),
                            ],
                            margin: [0, 5, 0, 5],
                          })),
                        ],
                        border: [false, false, false, true],
                        borderColor: Array(4).fill("#222222"),
                      },
                    ],
                  ],
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
        ]);

        return yield* Effect.async<Buffer<ArrayBuffer>, Error>((resume) => {
          const pdfDoc = new PdfPrinter(fonts).createPdfKitDocument(basePdf);
          const chunks: Uint8Array[] = [];
          pdfDoc.on("data", (chunk) => chunks.push(chunk));
          pdfDoc.on("end", () => resume(Effect.succeed(Buffer.concat(chunks))));
          pdfDoc.on("error", (error) => resume(Effect.fail(error)));
          pdfDoc.end();
        });
      });

    const createProductLabelsPDF = ({
      paper,
      product,
      organization,
      labels,
    }: {
      paper: { size: PaperSize; orientation: PaperOrientation };
      product: { name: string; sku: string; description: string };
      organization: { name: string; address: string; contact: string };
      labels: Array<any>; // Replace with proper type
    }) =>
      Effect.gen(function* (_) {
        const basePdf = yield* createBasePDF({
          paper,
          headerVariant: "small",
          organization,
          product,
        });

        ((basePdf.content as Content[])[0] as ContentTable).table.body.push([
          {
            stack: [
              {
                table: {
                  widths: ["*"],
                  body: [
                    [
                      {
                        stack: [
                          { text: "Product Labels.", style: "sectionHeader", margin: [0, 0, 0, 5] },
                          ...labels.map((label) => ({
                            text: label.name,
                            style: "normalText",
                            margin: [0, 2, 0, 2],
                          })),
                        ],
                        border: [false, false, false, true],
                        borderColor: Array(4).fill("#222222"),
                      },
                    ],
                  ],
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
        ]);

        return yield* Effect.async<Buffer<ArrayBuffer>, Error>((resume) => {
          const pdfDoc = new PdfPrinter(fonts).createPdfKitDocument(basePdf);
          const chunks: Uint8Array[] = [];
          pdfDoc.on("data", (chunk) => chunks.push(chunk));
          pdfDoc.on("end", () => resume(Effect.succeed(Buffer.concat(chunks))));
          pdfDoc.on("error", (error) => resume(Effect.fail(error)));
          pdfDoc.end();
        });
      });

    const createProductCertificationsPDF = ({
      paper,
      product,
      organization,
      certificates,
    }: {
      paper: { size: PaperSize; orientation: PaperOrientation };
      product: { name: string; sku: string; description: string };
      organization: { name: string; address: string; contact: string };
      certificates: Array<{ name: string; number: string }>;
    }) =>
      Effect.gen(function* (_) {
        const basePdf = yield* createBasePDF({
          paper,
          headerVariant: "small",
          organization,
          product,
        });

        ((basePdf.content as Content[])[0] as ContentTable).table.body.push([
          {
            stack: [
              {
                table: {
                  widths: ["*"],
                  body: [
                    [
                      {
                        stack: [
                          { text: "Product Certifications.", style: "sectionHeader", margin: [0, 0, 0, 5] },
                          ...certificates.map((cert) => ({
                            text: `${cert.name}: ${cert.number}`,
                            style: "normalText",
                            margin: [0, 2, 0, 2],
                          })),
                        ],
                        border: [false, false, false, true],
                        borderColor: Array(4).fill("#222222"),
                      },
                    ],
                  ],
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
        ]);

        return yield* Effect.async<Buffer<ArrayBuffer>, Error>((resume) => {
          const pdfDoc = new PdfPrinter(fonts).createPdfKitDocument(basePdf);
          const chunks: Uint8Array[] = [];
          pdfDoc.on("data", (chunk) => chunks.push(chunk));
          pdfDoc.on("end", () => resume(Effect.succeed(Buffer.concat(chunks))));
          pdfDoc.on("error", (error) => resume(Effect.fail(error)));
          pdfDoc.end();
        });
      });

    const createProductMapPDF = ({
      paper,
      product,
      organization,
      map,
    }: {
      paper: { size: PaperSize; orientation: PaperOrientation };
      product: { name: string; sku: string; description: string };
      organization: { name: string; address: string; contact: string };
      map: {
        metadata: Record<string, string>;
        items: Array<any>; // Replace with proper type
      };
    }) =>
      Effect.gen(function* (_) {
        const basePdf = yield* createBasePDF({
          paper,
          headerVariant: "small",
          organization,
          product,
        });

        ((basePdf.content as Content[])[0] as ContentTable).table.body.push([
          {
            stack: [
              {
                table: {
                  widths: ["*"],
                  body: [
                    [
                      {
                        stack: [
                          { text: "Product Location.", style: "sectionHeader", margin: [0, 0, 0, 5] },
                          ...Object.entries(map.metadata).map(([k, v]) => ({
                            text: `${k}: ${v}`,
                            style: "normalText",
                            margin: [0, 2, 0, 2],
                          })),
                          // TODO: Add map visualization
                        ],
                        border: [false, false, false, true],
                        borderColor: Array(4).fill("#222222"),
                      },
                    ],
                  ],
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
        ]);

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
      createProductInfoPDF,
      createProductConditionsPDF,
      createProductLabelsPDF,
      createProductCertificationsPDF,
      createProductMapPDF,
    } as const;
  }),
}) {}

export const PDFLive = PDFService.Default;

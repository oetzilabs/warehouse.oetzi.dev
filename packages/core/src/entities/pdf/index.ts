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
      Courier: {
        normal: "Courier",
        bold: "Courier-Bold",
        italics: "Courier-Oblique",
        bolditalics: "Courier-BoldOblique",
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
                lineWidth: 0.5,
                lineColor: "#222222",
                fillColor: "#222222",
              },
            ],
            stack: [
              {
                text: "LOGO",
                style: "smallHeaderLogo",
                margin: [5, 5, 5, 5],
              },
            ],
          };
        };

        return {
          pageSize: { width: pageWidth, height: pageHeight },
          pageOrientation: paper.orientation,
          pageMargins: [margins / 2, margins / 2, margins / 2, margins / 2],
          content: [
            // Outer border box
            // {
            //   canvas: [
            //     {
            //       type: "rect",
            //       x: margins / 2,
            //       y: margins / 2,
            //       w: pageWidth - margins,
            //       h: pageHeight - margins,
            //       lineWidth: 0.5,
            //       lineColor: "#222222",
            //     },
            //   ],
            //   absolutePosition: { x: 0, y: 0 },
            // },
            // Main content table
            {
              table: {
                widths: ["*"],
                heights: (row) => (row === 0 ? 80 : "auto"),
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
                                  { text: organization.name, style: "header", margin: [5, 5, 5, 5] },
                                  { text: organization.address, style: "subheader" },
                                ]
                              : [
                                  { text: organization.name, style: "smallHeaderTitle", margin: [2, 2, 2, 2] },
                                  { text: organization.contact, style: "smallHeaderText" },
                                ],
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
              font: "Courier",
            },
            subheader: {
              fontSize: 8,
              color: "grey",
              font: "Courier",
            },
            sectionHeader: {
              fontSize: 10,
              bold: true,
              font: "Courier",
            },
            normalText: {
              fontSize: 8,
              font: "Courier",
              lineHeight: 1.2,
            },
            tableHeader: {
              fontSize: 10,
              bold: true,
              font: "Courier",
              color: "#495057",
            },
            tableCell: {
              fontSize: 9,
              font: "Courier",
              color: "#212529",
            },
            smallHeaderLogo: {
              fontSize: 8,
              font: "Courier",
              alignment: "center",
            },
            smallHeaderTitle: {
              fontSize: 10,
              bold: true,
              font: "Courier",
            },
            smallHeaderText: {
              fontSize: 8,
              color: "grey",
              font: "Courier",
            },
          },
        } as TDocumentDefinitions;
      });

    const createProductInfoPDF = ({
      organization,
      product,
      suppliers,
      certificates,
      conditions,
      paper = { size: "A4" as PaperSize, orientation: "portrait" as PaperOrientation },
    }: {
      organization: { name: string; address: string; contact: string };
      product: { name: string; sku: string; description: string };
      suppliers: Array<{ name: string; contact: string }>;
      certificates: Array<{ name: string; number: string }>;
      conditions: Array<{ name: string; values: Record<string, string> }>;
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
                          { text: "Product Information", style: "sectionHeader", margin: [0, 0, 0, 5] },
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
                          { text: "Suppliers Information", style: "sectionHeader", margin: [0, 0, 0, 5] },
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
                                { text: "Conditions", style: "sectionHeader", margin: [0, 0, 0, 5] },
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
                                { text: "Certificates", style: "sectionHeader", margin: [0, 0, 0, 5] },
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
        const qrCodeData = yield* generateQRCode(product.sku);
        const barcodeData = yield* generateBarcode(product.sku);

        const printer = new PdfPrinter(fonts);

        const docDefinition: TDocumentDefinitions = {
          pageSize: paper.size,
          pageOrientation: paper.orientation,
          content: [
            { text: "Product Conditions", style: "header" },
            { text: `${product.name} (${product.sku})`, style: "subheader" },
            ...conditions.map((c) => ({
              stack: [
                { text: c.name, style: "sectionHeader" },
                ...Object.entries(c.values).map(([k, v]) => ({
                  text: `${k}: ${v}`,
                  style: "normalText",
                })),
              ],
              margin: [0, 10] as [number, number],
            })),
          ],
          styles: {
            header: {
              fontSize: 16,
              bold: true,
              font: "Courier",
            },
            subheader: {
              fontSize: 8,
              color: "grey",
              font: "Courier",
            },
            sectionHeader: {
              fontSize: 14,
              bold: true,
              font: "Courier",
            },
            normalText: {
              fontSize: 12,
              font: "Courier",
              lineHeight: 1.2,
            },
            tableHeader: {
              fontSize: 10,
              bold: true,
              font: "Courier",
              color: "#495057",
            },
            tableCell: {
              fontSize: 9,
              font: "Courier",
              color: "#212529",
            },
          },
        };

        return yield* Effect.async<Buffer<ArrayBuffer>, Error>((resume) => {
          const pdfDoc = printer.createPdfKitDocument(docDefinition);
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
        const printer = new PdfPrinter(fonts);
        const docDefinition: TDocumentDefinitions = {
          pageSize: paper.size,
          pageOrientation: paper.orientation,
          content: [
            { text: "Product Labels", style: "header" },
            { text: `${product.name} (${product.sku})`, style: "subheader" },
            ...labels.map(
              (label) =>
                ({
                  text: label.name,
                  style: "normalText",
                  margin: [0, 5],
                }) as ContentText,
            ),
          ],
          styles: {
            header: {
              fontSize: 16,
              bold: true,
              font: "Courier",
            },
            subheader: {
              fontSize: 8,
              color: "grey",
              font: "Courier",
            },
            sectionHeader: {
              fontSize: 12,
              bold: true,
              font: "Courier",
            },
            normalText: {
              fontSize: 10,
              font: "Courier",
              lineHeight: 1.2,
            },
            tableHeader: {
              fontSize: 10,
              bold: true,
              font: "Courier",
              color: "#495057",
            },
            tableCell: {
              fontSize: 9,
              font: "Courier",
              color: "#212529",
            },
          },
        };

        return yield* Effect.async<Buffer<ArrayBuffer>, Error>((resume) => {
          const pdfDoc = printer.createPdfKitDocument(docDefinition);
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
        const printer = new PdfPrinter(fonts);
        const docDefinition: TDocumentDefinitions = {
          pageSize: paper.size,
          pageOrientation: paper.orientation,
          content: [
            { text: "Product Certifications", style: "header" },
            { text: `${product.name} (${product.sku})`, style: "subheader" },
            ...certificates.map(
              (cert) =>
                ({
                  text: `${cert.name}: ${cert.number}`,
                  style: "normalText",
                  margin: [0, 5],
                }) as import("pdfmake/interfaces").ContentText,
            ),
          ],
          styles: {
            header: {
              fontSize: 16,
              bold: true,
              font: "Courier",
            },
            subheader: {
              fontSize: 8,
              color: "grey",
              font: "Courier",
            },
            sectionHeader: {
              fontSize: 12,
              bold: true,
              font: "Courier",
            },
            normalText: {
              fontSize: 10,
              font: "Courier",
              lineHeight: 1.2,
            },
            tableHeader: {
              fontSize: 10,
              bold: true,
              font: "Courier",
              color: "#495057",
            },
            tableCell: {
              fontSize: 9,
              font: "Courier",
              color: "#212529",
            },
          },
        };

        return yield* Effect.async<Buffer<ArrayBuffer>, Error>((resume) => {
          const pdfDoc = printer.createPdfKitDocument(docDefinition);
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
        const printer = new PdfPrinter(fonts);
        const docDefinition: TDocumentDefinitions = {
          pageSize: paper.size,
          pageOrientation: paper.orientation,
          content: [
            { text: "Product Location Map", style: "header" },
            { text: `${product.name} (${product.sku})`, style: "subheader" },
            ...Object.entries(map.metadata).map(([k, v]) => ({
              text: `${k}: ${v}`,
              style: "normalText",
            })),
            // TODO: Add actual map visualization
          ],
          styles: {
            header: {
              fontSize: 16,
              bold: true,
              font: "Courier",
            },
            subheader: {
              fontSize: 8,
              color: "grey",
              font: "Courier",
            },
            sectionHeader: {
              fontSize: 12,
              bold: true,
              font: "Courier",
            },
            normalText: {
              fontSize: 10,
              font: "Courier",
              lineHeight: 1.2,
            },
            tableHeader: {
              fontSize: 10,
              bold: true,
              font: "Courier",
              color: "#495057",
            },
            tableCell: {
              fontSize: 9,
              font: "Courier",
              color: "#212529",
            },
          },
        };

        return yield* Effect.async<Buffer<ArrayBuffer>, Error>((resume) => {
          const pdfDoc = printer.createPdfKitDocument(docDefinition);
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

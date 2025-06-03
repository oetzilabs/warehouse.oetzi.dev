import bwipjs from "bwip-js";
import { Effect } from "effect";
import PdfPrinter from "pdfmake";
import { ContentText, TDocumentDefinitions } from "pdfmake/interfaces";
import QRCode from "qrcode";

export type PaperSize = "A4" | "A5";
export type PaperOrientation = "portrait" | "landscape";
type HeaderVariant = "small" | "big";

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

    const createBasePDF = ({
      paper,
      title,
      subtitle,
      showQR = true,
      product,
      organization,
      headerVariant = "big",
    }: {
      paper: { size: PaperSize; orientation: PaperOrientation };
      title: string;
      subtitle?: string;
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
              },
            ],
            stack: [
              {
                text: "LOGO",
                style: "smallHeaderLogo",
                margin: [0, 0, 0, 0],
                // Apply border properties here, to the cell
                borderColor: ["#222222", "#222222", "#222222", "#222222"],
                border: [0, 0, 0, 1],
                lineWidth: [0, 0, 0, 1],
              },
            ],
          };
        };

        const getBigHeader = () => ({
          columns: [
            {
              width: 50,
              ...getLogoElement(50),
            },
            {
              width: "*",
              stack: [
                { text: organization.name, style: "header" },
                { text: organization.address, style: "subheader" },
              ],
            },
            showQR
              ? {
                  width: 50,
                  image: `data:image/png;base64,${qrCodeData}`,
                  fit: [50, 50],
                }
              : null,
          ].filter(Boolean),
          margin: [0, 0, 0, 10],
          borderColor: ["#222222"],
          border: [0, 0, 0, 1],
        });

        const getSmallHeader = () => ({
          columns: [
            {
              width: 30,
              ...getLogoElement(30),
            },
            {
              width: "*",
              stack: [
                { text: organization.name, style: "smallHeaderTitle" },
                { text: organization.contact, style: "smallHeaderText" },
              ],
            },
            showQR
              ? {
                  width: 30,
                  image: `data:image/png;base64,${qrCodeData}`,
                  fit: [30, 30],
                }
              : null,
          ].filter(Boolean),
          margin: [0, 0, 0, 10],
          borderColor: ["#222222"],
          border: [0, 0, 0, 1],
        });

        return {
          pageSize: { width: pageWidth, height: pageHeight },
          pageOrientation: paper.orientation,
          pageMargins: [margins, margins, margins, margins],
          content: [
            // Border
            {
              canvas: [
                {
                  type: "rect",
                  x: margins / 2,
                  y: margins / 2,
                  w: pageWidth - margins,
                  h: pageHeight - margins,
                  lineWidth: 0.5,
                  lineColor: "#222222",
                },
              ],
              absolutePosition: { x: 0, y: 0 },
            },
            // Header based on variant
            headerVariant === "big" ? getBigHeader() : getSmallHeader(),
            {
              canvas: [
                {
                  type: "line",
                  x1: -(margins / 2),
                  y1: 5,
                  x2: pageWidth - margins * 1.5,
                  y2: 5,
                  lineWidth: 0.5,
                  lineColor: "#222222",
                },
              ],
            },
            { text: title, style: "sectionHeader", margin: [0, margins / 2, 0, margins / 2] },
            subtitle ? { text: subtitle, style: "normalText", margin: [0, margins / 2, 0, margins / 2] } : null,
          ].filter(Boolean),
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
          title: "Product Information",
          organization,
          product,
        });

        const barcodeData = yield* generateBarcode(product.sku);

        basePdf.content = [
          ...(Array.isArray(basePdf.content) ? basePdf.content : [basePdf.content]),
          {
            stack: [
              { text: `Name: ${product.name}`, style: "normalText" },
              { text: `SKU: ${product.sku}`, style: "normalText" },
              { text: `Description: ${product.description}`, style: "normalText" },
            ],
            margin: [0, 0, 0, 20],
          },
          { text: "Suppliers Information", style: "sectionHeader", margin: [0, 0, 0, 8] },
          {
            stack: suppliers.map((s) => ({
              text: `${s.name} (${s.contact})`,
              style: "normalText",
            })),
            margin: [0, 0, 0, 20],
          },
          ...(conditions.length > 0
            ? [
                {
                  text: "Conditions",
                  style: "sectionHeader",
                  margin: [0, 0, 0, 8] as [number, number, number, number],
                },
                ...conditions.map((condition) => ({
                  table: {
                    widths: ["*", "*"],
                    headerRows: 1,
                    body: [
                      [
                        { text: condition.name, style: "tableHeader", fillColor: "#f8f9fa" },
                        { text: "Value", style: "tableHeader", fillColor: "#f8f9fa" },
                      ],
                      ...Object.entries(condition.values).map(([key, value]) => [
                        { text: key, style: "tableCell" },
                        { text: value, style: "tableCell" },
                      ]),
                    ],
                  },
                  layout: {
                    hLineWidth: () => 1,
                    vLineWidth: () => 1,
                    hLineColor: () => "#e9ecef",
                    vLineColor: () => "#e9ecef",
                    paddingLeft: () => 8,
                    paddingRight: () => 8,
                    paddingTop: () => 8,
                    paddingBottom: () => 8,
                  },
                  margin: [0, 0, 0, 15] as [number, number, number, number],
                })),
              ]
            : []),
          ...(certificates.length > 0
            ? [
                {
                  text: "Certificates",
                  style: "sectionHeader",
                  margin: [0, 20, 0, 8] as [number, number, number, number],
                },
                ...certificates.map((cert) => ({
                  text: `${cert.name}: ${cert.number}`,
                  style: "normalText",
                })),
              ]
            : []),
          {
            image: barcodeData,
            width: 250,
            alignment: "center",
            margin: [0, 20, 0, 0],
          },
        ];

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

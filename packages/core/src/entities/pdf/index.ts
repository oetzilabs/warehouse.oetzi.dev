import bwipjs from "bwip-js";
import { Effect } from "effect";
import PdfPrinter from "pdfmake";
import { TDocumentDefinitions } from "pdfmake/interfaces";
import QRCode from "qrcode";

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

    const createProductInfoPDF = ({
      organization,
      product,
      suppliers,
      certificates,
      conditions,
    }: {
      organization: { name: string; address: string; contact: string };
      product: { name: string; sku: string; description: string };
      suppliers: Array<{ name: string; contact: string }>;
      certificates: Array<{ name: string; number: string }>;
      conditions: Array<{ name: string; values: Record<string, string> }>;
    }) =>
      Effect.gen(function* (_) {
        const qrCodeData = yield* generateQRCode(product.sku);
        const barcodeData = yield* generateBarcode(product.sku);

        const fonts = {
          Courier: {
            normal: "Courier",
            bold: "Courier-Bold",
            italics: "Courier-Oblique",
            bolditalics: "Courier-BoldOblique",
          },
        };

        const printer = new PdfPrinter(fonts);

        const docDefinition: TDocumentDefinitions = {
          pageSize: "A4",
          pageMargins: [40, 40, 40, 40],
          content: [
            {
              columns: [
                {
                  width: "*",
                  stack: [
                    { text: organization.name, style: "header" },
                    { text: organization.address, style: "subheader" },
                  ],
                },
                {
                  width: 50, // reduced from 100
                  image: `data:image/png;base64,${qrCodeData}`,
                  fit: [50, 50], // reduced from [100, 100]
                },
              ],
            },
            { canvas: [{ type: "line", x1: 0, y1: 5, x2: 515, y2: 5, lineWidth: 1, lineColor: "#CCCCCC" }] },
            { text: "Product Information", style: "sectionHeader", margin: [0, 20, 0, 8] },
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
            { canvas: [{ type: "line", x1: 0, y1: 5, x2: 515, y2: 5, lineWidth: 1, lineColor: "#CCCCCC" }] },
            {
              image: barcodeData,
              width: 250,
              alignment: "center",
              margin: [0, 20, 0, 0],
            },
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
        const pdf = yield* Effect.async<Buffer<ArrayBuffer>, Error>((resume) => {
          const pdfDoc = printer.createPdfKitDocument(docDefinition);
          const chunks: Uint8Array[] = [];
          pdfDoc.on("data", (chunk) => chunks.push(chunk));
          pdfDoc.on("end", () => resume(Effect.succeed(Buffer.concat(chunks))));
          pdfDoc.on("error", (error) => resume(Effect.fail(error)));
          pdfDoc.end();
        });
        return pdf;
      });

    return {
      createProductInfoPDF,
    } as const;
  }),
}) {}

export const PDFLive = PDFService.Default;

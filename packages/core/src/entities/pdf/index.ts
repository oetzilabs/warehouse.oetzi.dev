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
      supplier,
      certificates,
      conditions,
    }: {
      organization: { name: string; address: string; contact: string };
      product: { name: string; sku: string; description: string };
      supplier: { name: string; contact: string };
      certificates: Array<{ name: string; number: string }>;
      conditions: Array<{ type: string; value: string }>;
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
                  width: 100,
                  image: `data:image/png;base64,${qrCodeData}`,
                  fit: [100, 100],
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
            { text: "Supplier Information", style: "sectionHeader", margin: [0, 0, 0, 8] },
            { text: `Supplier: ${supplier.name}`, style: "normalText", margin: [0, 0, 0, 20] },
            conditions.length > 0
              ? [
                  { text: "Conditions", style: "sectionHeader", margin: [0, 0, 0, 8] },
                  ...conditions.map((c) => ({
                    text: `${c.type}: ${c.value}`,
                    style: "normalText",
                  })),
                ]
              : [],
            certificates.length > 0
              ? [
                  { text: "Certificates", style: "sectionHeader", margin: [0, 20, 0, 8] },
                  ...certificates.map((cert) => ({
                    text: `${cert.name}: ${cert.number}`,
                    style: "normalText",
                  })),
                ]
              : [],
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
          },
        };

        return yield* Effect.promise(
          () =>
            new Promise<Buffer>((resolve, reject) => {
              const pdfDoc = printer.createPdfKitDocument(docDefinition);
              const chunks: Uint8Array[] = [];
              pdfDoc.on("data", (chunk) => chunks.push(chunk));
              pdfDoc.on("end", () => resolve(Buffer.concat(chunks)));
              pdfDoc.on("error", reject);
              pdfDoc.end();
            }),
        );
      });

    return {
      createProductInfoPDF,
    } as const;
  }),
}) {}

export const PDFLive = PDFService.Default;

import bwipjs from "bwip-js";
import { Effect } from "effect";
import { PDFDocument, PDFFont, PDFPage, rgb, StandardFonts } from "pdf-lib";
import QRCode from "qrcode";
import { PDFGenerationError } from "./errors";

export class PDFService extends Effect.Service<PDFService>()("@warehouse/pdf", {
  effect: Effect.gen(function* (_) {
    const generateQRCode = (text: string) =>
      Effect.gen(function* (_) {
        const qrDataUrl = yield* Effect.promise(() => QRCode.toDataURL(text));
        const qrImageData = qrDataUrl.split(",")[1];
        return Buffer.from(qrImageData, "base64");
      });

    const generateBarcode = (text: string) =>
      Effect.async<Buffer, Error>((resume) => {
        bwipjs.toBuffer(
          {
            bcid: "code128",
            text,
            scale: 2, // reduced from 3
            height: 8, // reduced from 10
            includetext: true,
            textxalign: "center",
          },
          (err, png) => {
            if (err) resume(Effect.fail(typeof err === "string" ? new Error(err) : err));
            resume(Effect.succeed(png));
          },
        );
      });

    // Helper to draw a horizontal line
    const drawHorizontalLine = (page: PDFPage, x: number, y: number, width: number = 500) => {
      page.drawLine({
        start: { x, y },
        end: { x: width + x, y },
        thickness: 1,
        color: rgb(0.8, 0.8, 0.8),
      });
    };

    // Helper to wrap text
    const wrapText = (text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] => {
      const words = text.split(" ");
      const lines: string[] = [];
      let currentLine = words[0];

      for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = font.widthOfTextAtSize(currentLine + " " + word, fontSize);
        if (width < maxWidth) {
          currentLine += " " + word;
        } else {
          lines.push(currentLine);
          currentLine = word;
        }
      }
      lines.push(currentLine);
      return lines;
    };

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
        const pdfDoc = yield* Effect.promise(() => PDFDocument.create());
        const page = pdfDoc.addPage([595, 842]); // A4 size
        const font = yield* Effect.promise(() => pdfDoc.embedFont(StandardFonts.CourierBold));
        const regularFont = yield* Effect.promise(() => pdfDoc.embedFont(StandardFonts.Courier));

        // Convert 15mm to points (1mm = 2.83465pt)
        const MARGIN = 15 * 2.83465;
        const pageWidth = page.getWidth();
        const usableWidth = pageWidth - 2 * MARGIN;

        // Adjust coordinates for margins
        const startX = MARGIN;
        let startY = page.getHeight() - MARGIN;

        // Generate and embed QR code
        const qrCode = yield* generateQRCode(product.sku);
        const qrImage = yield* Effect.promise(() => pdfDoc.embedPng(qrCode));
        const qrDims = qrImage.scale(0.3); // Made QR code a bit smaller

        // QR Code (Right side) - Adjusted positioning
        page.drawImage(qrImage, {
          x: pageWidth - MARGIN - qrDims.width,
          y: startY - qrDims.height + 20, // Added offset to align with organization name
          width: qrDims.width,
          height: qrDims.height,
        });

        // Header - Organization Info (Left side)
        page.drawText(organization.name, {
          x: startX,
          y: startY,
          font,
          size: 16,
          color: rgb(0.2, 0.2, 0.2),
        });

        // Organization details
        page.drawText(organization.address, {
          x: startX,
          y: startY - 20,
          font: regularFont,
          size: 8,
          color: rgb(0.4, 0.4, 0.4),
        });

        // Horizontal line
        drawHorizontalLine(page, 40, startY - 40, usableWidth);

        let yPos = startY - 80;

        // Product Information Section
        page.drawText("Product Information", {
          x: startX,
          y: yPos,
          font,
          size: 10,
          color: rgb(0.2, 0.2, 0.2),
        });

        // Product details with text wrapping
        const maxWidth = usableWidth - 20; // Leave some padding
        yPos -= 30;

        // Name with wrapping
        const nameLines = wrapText(`Name: ${product.name}`, regularFont, 10, maxWidth);
        for (const line of nameLines) {
          page.drawText(line, {
            x: startX,
            y: yPos,
            font: regularFont,
            size: 10,
            color: rgb(0.3, 0.3, 0.3),
          });
          yPos -= 15;
        }

        // SKU (usually short, no need to wrap)
        page.drawText(`SKU: ${product.sku}`, {
          x: startX,
          y: yPos,
          font: regularFont,
          size: 10,
          color: rgb(0.3, 0.3, 0.3),
        });
        yPos -= 15;

        // Description with wrapping
        const descLines = wrapText(`Description: ${product.description}`, regularFont, 10, maxWidth);
        for (const line of descLines) {
          page.drawText(line, {
            x: startX,
            y: yPos,
            font: regularFont,
            size: 10,
            color: rgb(0.3, 0.3, 0.3),
          });
          yPos -= 15;
        }

        // Supplier Information
        page.drawText("Supplier Information", {
          x: startX,
          y: yPos,
          font,
          size: 12, // reduced from 16
          color: rgb(0.2, 0.2, 0.2),
        });

        yPos -= 20; // reduced from 30
        page.drawText(`Supplier: ${supplier.name}`, {
          x: startX,
          y: yPos,
          font: regularFont,
          size: 10, // reduced from 12
          color: rgb(0.3, 0.3, 0.3),
        });

        // Certificates Section
        if (certificates.length > 0) {
          yPos -= 40;
          page.drawText("Conditions", {
            x: startX,
            y: yPos,
            font,
            size: 16,
            color: rgb(0.2, 0.2, 0.2),
          });

          yPos -= 20;
          conditions.forEach((condition) => {
            page.drawText(`${condition.type}: ${condition.value}`, {
              x: startX,
              y: yPos,
              font: regularFont,
              size: 10,
              color: rgb(0.3, 0.3, 0.3),
            });
            yPos -= 20;
          });
        } else {
          yPos -= 20;
          page.drawText("No conditions specified", {
            x: startX,
            y: yPos,
            font: regularFont,
            size: 10,
            color: rgb(0.3, 0.3, 0.3),
          });
        }

        // Certificates Section
        if (certificates.length > 0) {
          yPos -= 40;
          page.drawText("Certificates", {
            x: startX,
            y: yPos,
            font,
            size: 16,
            color: rgb(0.2, 0.2, 0.2),
          });

          yPos -= 20;
          certificates.forEach((cert) => {
            page.drawText(`${cert.name}: ${cert.number}`, {
              x: startX,
              y: yPos,
              font: regularFont,
              size: 10,
              color: rgb(0.3, 0.3, 0.3),
            });
            yPos -= 20;
          });
        }

        // Generate and add barcode at the bottom
        const barcode = yield* generateBarcode(product.sku);
        const barcodeImage = yield* Effect.promise(() => pdfDoc.embedPng(barcode));
        const targetWidth = Math.min(250, usableWidth);
        const scale = targetWidth / barcodeImage.width;
        const scaledHeight = barcodeImage.height * scale;

        // Position barcode with proper bottom margin
        page.drawImage(barcodeImage, {
          x: (pageWidth - targetWidth) / 2,
          y: MARGIN, // Changed: Position directly from bottom margin
          width: targetWidth,
          height: scaledHeight,
        });

        // Add some padding above the barcode
        const paddingAboveBarcode = 20; // 20 points padding
        if (yPos > MARGIN + scaledHeight + paddingAboveBarcode) {
          // Draw a line above the barcode if there's space
          drawHorizontalLine(page, 40, MARGIN + scaledHeight + paddingAboveBarcode, usableWidth);
        }

        return yield* Effect.promise(() => pdfDoc.save());
      });

    return {
      createProductInfoPDF,
    } as const;
  }),
}) {}

export const PDFLive = PDFService.Default;

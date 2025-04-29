import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Parsers } from "@zomoetzidev/core/src/entities/parsers";
import Jimp from "jimp";
import pdf2pic from "pdf2pic";
import { Resource } from "sst";

const s3client = new S3Client({
  region: "eu-central-1",
});

const createPdfImage = async (file: Uint8Array, pagenuber: number) => {
  const fileBuffer = Buffer.from(file);
  const pdfImage = pdf2pic.fromBuffer(fileBuffer, {
    density: 100,
    format: "png",
    width: 794,
    height: 1123,
  });
  const b = await pdfImage(pagenuber, { responseType: "buffer" });
  return b.buffer;
};

// Function to align two images
async function alignImages(image1: Jimp, image2: Jimp): Promise<Jimp> {
  const diff = Jimp.diff(image1, image2, 0.1); // Threshold for considering pixel different

  if (diff.percent > 0.1) {
    // Threshold for considering images different
    // Rotate image2 incrementally to find the best alignment
    let bestAlignment = image2;
    let bestPercent = diff.percent;

    for (let angle = -5; angle <= 5; angle++) {
      const rotatedImage = image2.rotate(angle);

      const newDiff = Jimp.diff(image1, rotatedImage, 0.1); // Threshold for considering pixel different

      if (newDiff.percent < bestPercent) {
        bestAlignment = rotatedImage;
        bestPercent = newDiff.percent;
      }
    }

    return bestAlignment;
  }

  return image2;
}

// Function to find best matching image from PDF with images from the database
async function findBestMatchingImage(pdfImage: Jimp, dbImages: Jimp[]) {
  let bestMatchIndex: number = -1;
  let bestMatchDistance = Number.MAX_VALUE;

  for (let i = 0; i < dbImages.length; i++) {
    const alignedImage = await alignImages(pdfImage, dbImages[i]);

    // Compare alignedImage with dbImages[i]
    const distance = Jimp.distance(pdfImage, alignedImage);

    if (distance < bestMatchDistance) {
      bestMatchIndex = i;
      bestMatchDistance = distance;
    }
  }

  return bestMatchIndex;
}

const cache = new Map<string, Buffer>();

export const detectParser = async (first_pdf: Buffer, pagesnumber: number, templateImages: Parsers.Frontend[]) => {
  const pdf_images = await Promise.all(
    Array.from({ length: pagesnumber }).map((_, x) => createPdfImage(first_pdf, x + 1)),
  );
  const pdf_images_filtered = await Promise.all(pdf_images.filter(Boolean).map((x) => Jimp.read(x!)));

  if (!pdf_images_filtered.length) {
    return null;
  }

  let matching_parser = null;

  let local_buffer: Array<[Buffer, Jimp]> = [];

  for (let i = 0; i < templateImages.length; i++) {
    const templateImage = templateImages[i];
    const imagePath = templateImage.image;
    if (!imagePath) {
      console.error("No image for template", templateImage);
      continue;
    }
    let b: Buffer | undefined = undefined;
    if (!cache.has(imagePath)) {
      const getObjectCommand = new GetObjectCommand({
        Bucket: Resource.NorthstarMainBucket.name,
        Key: imagePath,
      });
      const response = await s3client.send(getObjectCommand);

      if (response.$metadata.httpStatusCode !== 200) {
        return null;
      }

      const templateBody = await response.Body?.transformToByteArray();
      if (!templateBody) {
        return null;
      }
      const templateBuffer = Buffer.from(templateBody);
      cache.set(imagePath, templateBuffer);
      b = templateBuffer;
    } else {
      const templateBuffer = cache.get(imagePath)!;
      b = templateBuffer;
    }
    local_buffer.push([b, await Jimp.read(b)]);
  }

  for (let i = 0; i < pdf_images_filtered.length; i++) {
    const diff = await findBestMatchingImage(
      pdf_images_filtered[i],
      local_buffer.map((x) => x[1]),
    );

    if (diff !== -1) {
      matching_parser = {
        parser: templateImages[diff].id,
        image: local_buffer[diff][0],
      };
    }
  }

  return matching_parser;
};

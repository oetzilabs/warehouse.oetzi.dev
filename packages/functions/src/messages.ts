import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Attachments } from "@zomoetzidev/core/src/entities/attachments";
import { Message } from "@zomoetzidev/core/src/entities/messages";
import { VFS } from "@zomoetzidev/core/src/entities/paths";
import JSZip from "jszip";
import { Resource } from "sst";
import { ApiHandler } from "./utils";

export const attachment = ApiHandler(async (e) => {
  const id = e.pathParameters?.id;
  if (!id)
    return {
      statusCode: 400,
      body: "Missing id parameter",
    };
  const attachments = await Attachments.findById(id);
  if (!attachments)
    return {
      statusCode: 404,
      body: "Attachment not found",
    };

  const s3 = new S3Client({
    region: "eu-central-1",
  });

  const filepath = VFS.bucket().attachments.attachment(attachments.id).file.path;
  const res = await s3.send(
    new GetObjectCommand({
      Bucket: Resource.NorthstarMainBucket.name,
      Key: filepath,
    }),
  );

  if (!res.Body)
    return {
      statusCode: 404,
      body: "Attachment not found",
    };

  const buffer = await res.Body.transformToByteArray();
  const base64 = Buffer.from(buffer).toString("base64");

  return {
    body: base64,
    isBase64Encoded: true,
    statusCode: 200,
  };
});

export const allattachment_zip = ApiHandler(async (e) => {
  const mid = e.pathParameters?.mid;
  if (!mid)
    return {
      statusCode: 400,
      body: "Missing mid parameter",
    };
  const message = await Message.findById(mid);
  if (!message)
    return {
      statusCode: 404,
      body: "Message not found",
    };
  const attachments = message.attachments;

  const s3 = new S3Client({
    region: "eu-central-1",
  });

  const zip = new JSZip();

  for (const attachment of attachments) {
    const filepath = VFS.bucket().attachments.attachment(attachment.id).file.path;
    const res = await s3.send(
      new GetObjectCommand({
        Bucket: Resource.NorthstarMainBucket.name,
        Key: filepath,
      }),
    );

    if (!res.Body) {
      continue;
    }

    const buffer = await res.Body.transformToByteArray();
    const base64 = Buffer.from(buffer).toString("base64");
    zip.file(attachment.name, base64, { base64: true });
  }

  const base64 = await zip.generateAsync({ type: "base64" });

  return {
    body: base64,
    isBase64Encoded: true,
    statusCode: 200,
  };
});

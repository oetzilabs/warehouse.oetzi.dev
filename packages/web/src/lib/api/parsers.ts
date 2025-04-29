import crypto from "node:crypto";
import { basename } from "node:path";
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { AnalyzeDocumentCommand, TextractClient } from "@aws-sdk/client-textract";
import { action, cache, redirect } from "@solidjs/router";
import { Block, TreeNode } from "@zomoetzidev/core/src/drizzle/sql/schema";
// import { Bus } from "@zomoetzidev/core/src/entities/event_bus";
import { Parsers } from "@zomoetzidev/core/src/entities/parsers";
import { VFS } from "@zomoetzidev/core/src/entities/paths";
import { createPdfImage } from "@zomoetzidev/core/src/entities/pdfimages";
import { User } from "@zomoetzidev/core/src/entities/users";
import { Resource } from "sst";
import { convertToTree, withSession } from "./utils";

export const getAllParsers = cache(async () => {
  "use server";
  const [session] = await withSession();
  if (!session) {
    return redirect("/auth/login");
  }

  if (!session.session.current_organization_id) {
    throw redirect("/setup/organization");
  }

  const isAdmin = await User.hasRole(session.user.id, "admin");

  if (!isAdmin) {
    throw new Error("You are not authorized to access this content.");
  }

  const parsers = await Parsers.all();

  return parsers;
}, "all-parsers");

export const getParserById = cache(async (id: string) => {
  "use server";
  const [session] = await withSession();
  if (!session) {
    return redirect("/auth/login");
  }

  if (!session.session.current_organization_id) {
    throw redirect("/setup/organization");
  }

  const isAdmin = await User.hasRole(session.user.id, "admin");

  if (!isAdmin) {
    throw new Error("You are not authorized to access this content.");
  }

  const parser = await Parsers.findById(id);

  if (!parser) {
    throw new Error("Parser not found.");
  }

  return parser;
}, "get-parser-by-id");

export const getDocumentsByParserId = cache(async (id: string) => {
  "use server";
  const [session] = await withSession();
  if (!session) {
    return redirect("/auth/login");
  }

  if (!session.session.current_organization_id) {
    throw redirect("/setup/organization");
  }

  const isAdmin = await User.hasRole(session.user.id, "admin");

  if (!isAdmin) {
    throw new Error("You are not authorized to access this content.");
  }

  const parser = await Parsers.findById(id);

  if (!parser) {
    throw new Error("Parser not found.");
  }

  return parser.dossiers;
}, "get-documents-by-parser-id");

export const removeParser = action(async (id: string) => {
  "use server";
  const [session] = await withSession();
  if (!session) {
    return redirect("/auth/login");
  }

  if (!session.session.current_organization_id) {
    throw redirect("/setup/organization");
  }

  const isAdmin = await User.hasRole(session.user.id, "admin");

  if (!isAdmin) {
    throw new Error("You are not authorized to access this content.");
  }

  const parser = await Parsers.findById(id);

  if (!parser) {
    throw new Error("Parser not found.");
  }

  const softDeletedParser = await Parsers.softDelete({ id: parser.id });

  return softDeletedParser;
});

export const undoRemoveParser = action(async (id: string) => {
  "use server";
  const [session] = await withSession();
  if (!session) {
    return redirect("/auth/login");
  }

  if (!session.session.current_organization_id) {
    throw redirect("/setup/organization");
  }

  const isAdmin = await User.hasRole(session.user.id, "admin");

  if (!isAdmin) {
    throw new Error("You are not authorized to access this content.");
  }

  const parser = await Parsers.findById(id);

  if (!parser) {
    throw new Error("Parser not found.");
  }

  const undoDeletedParser = await Parsers.update({ id: parser.id, deletedAt: null });

  return undoDeletedParser;
});

export const getParserBySlug = cache(async (slug: string) => {
  "use server";
  const [session] = await withSession();
  if (!session) {
    return redirect("/auth/login");
  }

  if (!session.session.current_organization_id) {
    throw redirect("/setup/organization");
  }

  const isAdmin = await User.hasRole(session.user.id, "admin");

  if (!isAdmin) {
    throw new Error("You are not authorized to access this content.");
  }

  const parser = await Parsers.findBySlug(slug);

  if (!parser) {
    throw new Error("Parser not found.");
  }

  return parser;
}, "get-parser-by-slug");

const slugify = (str: string) => {
  const slug = str
    .toLowerCase()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w-]+/g, "") // Remove all non-word characters
    .replace(/-+/g, "-"); // Replace multiple - with single -

  return slug;
};

export const setParserName = action(async (data: { id: string; name: string }) => {
  "use server";
  const [session] = await withSession();
  if (!session) {
    return redirect("/auth/login");
  }

  if (!session.session.current_organization_id) {
    throw redirect("/setup/organization");
  }

  const isAdmin = await User.hasRole(session.user.id, "admin");

  if (!isAdmin) {
    throw new Error("You are not authorized to access this content.");
  }

  const parser = await Parsers.findById(data.id);

  if (!parser) {
    throw new Error("Parser not found.");
  }

  const s3Client = new S3Client({
    region: "eu-central-1",
  });

  const updatedParser = await Parsers.update({
    id: parser.id,
    name: data.name,
    slug: slugify(data.name),
  });

  return updatedParser;
});

export const setParserTemplatePage = action(async (id: string, page: number) => {
  "use server";
  const [session] = await withSession();
  if (!session) {
    return redirect("/auth/login");
  }

  if (!session.session.current_organization_id) {
    throw redirect("/setup/organization");
  }

  const isAdmin = await User.hasRole(session.user.id, "admin");

  if (!isAdmin) {
    throw new Error("You are not authorized to access this content.");
  }

  const parser = await Parsers.findById(id);

  if (!parser) {
    throw new Error("Parser not found.");
  }
  if (!parser.file) {
    throw new Error("Parser file not found.");
  }

  const s3 = new S3Client({
    region: "eu-central-1",
  });

  const getObjectCommand = new GetObjectCommand({
    Bucket: Resource.NorthstarMainBucket.name,
    Key: VFS.bucket().parsers.parser(parser.id).file.path,
  });

  const response = await s3.send(getObjectCommand);
  const body = response.Body;
  const isOk = response.$metadata.httpStatusCode === 200;
  if (!body || !isOk) {
    return new Response("Not Found", {
      status: 404,
    });
  }
  const imagePdf = await body.transformToByteArray();
  const buffer = new Uint8Array(imagePdf);
  const pdfImage = await createPdfImage(buffer, page);

  if (!pdfImage) {
    throw new Error("Error creating image");
  }

  const base = basename(parser.file);

  const newTemplateImage = new PutObjectCommand({
    Bucket: Resource.NorthstarMainBucket.name,
    Key: VFS.bucket().parsers.parser(parser.id).thumbnail.path,
    ContentType: "image/png",
    Body: pdfImage,
  });

  const response2 = await s3.send(newTemplateImage);
  if (response2.$metadata.httpStatusCode !== 200) {
    throw new Error("Error uploading template image");
  }

  const updatedParser = await Parsers.update({
    id: parser.id,
    image: VFS.bucket().parsers.parser(parser.id).thumbnail.path,
    selectedPage: page,
  });

  return updatedParser;
});

export const createParser = action(async (data: { name: string }) => {
  "use server";
  const [session] = await withSession();
  if (!session) {
    return redirect("/auth/login");
  }

  const isAdmin = await User.hasRole(session.user.id, "admin");

  if (!isAdmin) {
    throw new Error("You are not authorized to access this content.");
  }

  const parser = await Parsers.create(
    {
      name: data.name,
      slug: slugify(data.name),
    },
    session.user.id,
  );

  return parser;
});

export const setParserFile = action(async (data: FormData) => {
  "use server";
  const [session] = await withSession();
  if (!session) {
    return redirect("/auth/login");
  }

  const isAdmin = await User.hasRole(session.user.id, "admin");

  if (!isAdmin) {
    throw new Error("You are not authorized to access this content.");
  }

  const parser = await Parsers.findById(data.get("id") as string);
  const file = data.get("file") as File;

  if (!parser) {
    throw new Error("Parser not found.");
  }

  const s3 = new S3Client({
    region: "eu-central-1",
  });

  const putObjectCommand = new PutObjectCommand({
    Bucket: Resource.NorthstarMainBucket.name,
    Key: VFS.bucket().parsers.parser(parser.id).file.path,
    ContentType: "application/pdf",
    Body: file,
  });

  const response = await s3.send(putObjectCommand);
  const isOk = response.$metadata.httpStatusCode === 200;
  if (!isOk) {
    return new Response("Not Found", {
      status: 404,
    });
  }
  const buffer = await file.arrayBuffer();
  const b = new Uint8Array(buffer);
  const filehash = crypto.createHash("sha256").update(b).digest("hex");

  const updatedParser = await Parsers.update({
    id: parser.id,
    file: VFS.bucket().parsers.parser(parser.id).file.path,
    hash: response.ChecksumSHA256 ?? filehash,
  });

  return updatedParser;
});

export const gatherOCRData = action(async (id: string) => {
  "use server";
  const [session] = await withSession();
  if (!session) {
    return redirect("/auth/login");
  }

  const isAdmin = await User.hasRole(session.user.id, "admin");

  if (!isAdmin) {
    throw new Error("You are not authorized to access this content.");
  }

  const parser = await Parsers.findById(id);

  if (!parser) {
    throw new Error("Parser not found.");
  }

  // await Bus.publish("parser.ocr", {
  //   parserId: parser.id,
  // });

  return true;
});

export const addParserToSystem = action(async (data: { name: string }) => {
  "use server";
  const [session] = await withSession();
  if (!session) {
    return redirect("/auth/login");
  }

  const isAdmin = await User.hasRole(session.user.id, "admin");

  if (!isAdmin) {
    throw new Error("You are not authorized to access this content.");
  }

  const parser = await Parsers.create(
    {
      name: data.name,
      slug: slugify(data.name),
    },
    session.user.id,
  );

  return parser;
});

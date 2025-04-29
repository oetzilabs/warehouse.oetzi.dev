import { GetObjectCommand, HeadObjectCommand, NotFound, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Contact } from "@zomoetzidev/core/src/entities/contacts";
import { Dossiers } from "@zomoetzidev/core/src/entities/dossiers";
import { getFileTree } from "@zomoetzidev/core/src/entities/filetree";
import { Parsers } from "@zomoetzidev/core/src/entities/parsers";
import { VFS } from "@zomoetzidev/core/src/entities/paths";
import { createPdfImage } from "@zomoetzidev/core/src/entities/pdfimages";
import { StatusCodes } from "http-status-codes";
import pdf2pic from "pdf2pic";
import { Resource } from "sst";
import { z } from "zod";
import { ApiHandler } from "./utils";

const files = new Map<string, Uint8Array>();

const s3 = new S3Client({
  region: "eu-central-1",
});

const existsOnS3 = async (dossier: Dossiers.Frontend) => {
  if (!dossier.organization) return false;
  let isOnS3Already = false;
  try {
    const cmd = new HeadObjectCommand({
      Bucket: Resource.NorthstarMainBucket.name,
      Key: VFS.bucket()
        .organization(dossier.organization.id)
        .uploads.dossier_collection(dossier.collection_id)
        .dossier(dossier.id).thumbnail.path,
    });

    const response2 = await s3.send(cmd);
    const isOnS3 = response2.$metadata.httpStatusCode === 200;
    if (isOnS3) {
      isOnS3Already = true;
    }
    return isOnS3Already;
  } catch (e) {
    console.log("not found:", e instanceof NotFound);
    return false;
  }
};

export const parser = ApiHandler(async (e) => {
  const id = e.pathParameters?.id;
  if (!id) {
    return {
      headers: {
        "Content-Type": "text/plain",
      },
      status: 400,
      body: "Missing id",
    };
  }
  const sPage = e.queryStringParameters?.page;
  let page = Number(sPage);

  if (isNaN(page)) {
    page = 1;
  }

  if (page < 1) {
    page = 1;
  }

  const parser = await Parsers.findById(id);

  if (!parser) {
    return {
      headers: {
        "Content-Type": "text/plain",
      },
      status: 404,
      body: "Not Found",
    };
  }

  if (files.has(parser.id)) {
    console.log("use cache for parser", parser.id);
    const img = await createPdfImage(files.get(parser.id)!, page);
    return {
      body: img!.toString("base64"),
      isBase64Encoded: true,
      statusCode: 200,
      headers: {
        "Content-Type": "image/png",
      },
    };
  }

  const getObjectCommand = new GetObjectCommand({
    Bucket: Resource.NorthstarMainBucket.name,
    Key: VFS.bucket().parsers.parser(parser.id).file.path,
  });

  const response = await s3.send(getObjectCommand);
  const body = response.Body;
  const isOk = response.$metadata.httpStatusCode === 200;
  if (!body || !isOk) {
    return {
      headers: {
        "Content-Type": "text/plain",
      },
      status: 500,
      body: "Internal Server Error",
    };
  }
  const imagePdf = await body.transformToByteArray();
  const buffer = new Uint8Array(imagePdf);
  files.set(parser.id, buffer);
  const pdfImage = await createPdfImage(buffer, page);

  if (!pdfImage) {
    return {
      headers: {
        "Content-Type": "text/plain",
      },
      status: 500,
    };
  }

  return {
    body: pdfImage.toString("base64"),
    isBase64Encoded: true,
    statusCode: 200,
    headers: {
      "Content-Type": "image/png",
    },
  };
});

export const document = ApiHandler(async (e) => {
  const id = e.pathParameters?.id;
  if (!id) {
    return {
      headers: {
        "Content-Type": "text/plain",
      },
      status: 400,
      body: "Missing id",
    };
  }
  const sPage = e.queryStringParameters?.page;
  const override_param = e.queryStringParameters?.override;
  let page = Number(sPage);
  let override = z.coerce.boolean().parse(override_param);

  if (isNaN(page)) {
    page = 1;
  }

  if (page < 1) {
    page = 1;
  }

  // const fileTree = (await getFileTree(process.cwd())).filter((f) => f.includes("opt"));
  // for (const file of fileTree) {
  //   console.log(file);
  // }

  const doc = await Dossiers.findById(id);

  if (!doc) {
    return {
      headers: {
        "Content-Type": "text/plain",
      },
      status: 404,
      body: "Not Found",
    };
  }

  if (!doc.organization)
    return {
      headers: {
        "Content-Type": "text/plain",
      },
      status: StatusCodes.PRECONDITION_REQUIRED,
      body: "The dossier is not part of an Organization",
    };

  if (files.has(doc.id)) {
    console.log("use cache for doc", doc.id);
    try {
      const img = await createPdfImage(files.get(doc.id)!, page);
      return {
        body: img!.toString("base64"),
        isBase64Encoded: true,
        statusCode: 200,
        headers: {
          "Content-Type": "image/png",
        },
      };
    } catch (e) {
      console.log("error", e);
      return {
        headers: {
          "Content-Type": "text/plain",
        },
        status: 500,
        body: "Internal Server Error. We were not able to create the pdf image",
      };
    }
  }

  const isOnS3Already = await existsOnS3(doc);
  let pdfImage: Uint8Array | undefined;
  if (!isOnS3Already) {
    console.log("not on s3");

    const getObjectCommand = new GetObjectCommand({
      Bucket: Resource.NorthstarMainBucket.name,
      Key: VFS.bucket().organization(doc.organization.id).uploads.dossier_collection(doc.collection_id).dossier(doc.id)
        .file.path,
    });

    const response = await s3.send(getObjectCommand);
    const body = response.Body;
    const isOk = response.$metadata.httpStatusCode === 200;
    if (!body || !isOk) {
      return {
        headers: {
          "Content-Type": "text/plain",
        },
        status: 500,
        body: "Internal Server Error",
      };
    }
    const buffer = await body.transformToByteArray();
    files.set(doc.id, buffer);

    pdfImage = await createPdfImage(buffer, page);

    if (!pdfImage) {
      return {
        headers: {
          "Content-Type": "text/plain",
        },
        body: "Internal Server Error - createPdfImage",
        statusCode: 500,
      };
    }

    // save to s3
    const put = new PutObjectCommand({
      Bucket: Resource.NorthstarMainBucket.name,
      Key: VFS.bucket().organization(doc.organization.id).uploads.dossier_collection(doc.collection_id).dossier(doc.id)
        .thumbnail.path,
      Body: pdfImage,
      ContentType: "image/png",
    });

    const response2 = await s3.send(put);

    if (response2.$metadata.httpStatusCode !== 200) {
      return {
        headers: {
          "Content-Type": "text/plain",
        },
        status: 500,
      };
    }

    return {
      body: Buffer.from(pdfImage).toString("base64"),
      isBase64Encoded: true,
      statusCode: 200,
      headers: {
        "Content-Type": "image/png",
      },
    };
  } else if (isOnS3Already && override) {
    console.log("on s3");
    console.log("override");

    let cmd = new GetObjectCommand({
      Bucket: Resource.NorthstarMainBucket.name,
      Key: VFS.bucket().organization(doc.organization.id).uploads.dossier_collection(doc.collection_id).dossier(doc.id)
        .file.path, // get the pdf
    });

    const response = await s3.send(cmd);
    const body = response.Body;
    const isOk = response.$metadata.httpStatusCode === 200;
    if (!body || !isOk) {
      return {
        headers: {
          "Content-Type": "text/plain",
        },
        status: 500,
        body: "Internal Server Error",
      };
    }
    const buffer = await body.transformToByteArray();

    pdfImage = await createPdfImage(buffer, page);

    // save to s3
    const put = new PutObjectCommand({
      Bucket: Resource.NorthstarMainBucket.name,
      Key: VFS.bucket().organization(doc.organization.id).uploads.dossier_collection(doc.collection_id).dossier(doc.id)
        .thumbnail.path,
      Body: pdfImage,
      ContentType: "image/png",
    });

    const response2 = await s3.send(put);

    if (response2.$metadata.httpStatusCode !== 200) {
      return {
        headers: {
          "Content-Type": "text/plain",
        },
        status: 500,
      };
    }
    return {
      body: Buffer.from(pdfImage).toString("base64"),
      isBase64Encoded: true,
      statusCode: 200,
      headers: {
        "Content-Type": "image/png",
      },
    };
  } else if (isOnS3Already) {
    console.log("on s3");
    console.log("not override");
    const thumbnailPath = VFS.bucket()
      .organization(doc.organization.id)
      .uploads.dossier_collection(doc.collection_id)
      .dossier(doc.id).thumbnail.path;
    console.log("thumbnail path", thumbnailPath);
    const getObjectCommand = new GetObjectCommand({
      Bucket: Resource.NorthstarMainBucket.name,
      Key: thumbnailPath,
    });

    const response = await s3.send(getObjectCommand);
    const body = response.Body;
    if (!body) {
      return {
        headers: {
          "Content-Type": "text/plain",
        },
        body: "Internal Server Error: Could not retrieve the thumbnail",
        status: 500,
      };
    }
    pdfImage = await body.transformToByteArray();

    return {
      body: Buffer.from(pdfImage).toString("base64"),
      isBase64Encoded: true,
      statusCode: 200,
      headers: {
        "Content-Type": "image/png",
      },
    };
  }

  if (!pdfImage) {
    return {
      headers: {
        "Content-Type": "text/plain",
      },
      status: 500,
    };
  }

  return {
    body: Buffer.from(pdfImage).toString("base64"),
    isBase64Encoded: true,
    statusCode: 200,
    headers: {
      "Content-Type": "image/png",
    },
  };
});

export const contact = ApiHandler(async (e) => {
  const id = e.pathParameters?.id;
  if (!id) {
    return {
      headers: {
        "Content-Type": "text/plain",
      },
      status: 400,
      body: "Missing id",
    };
  }

  const contact = await Contact.findById(id);

  if (!contact) {
    return {
      headers: {
        "Content-Type": "text/plain",
      },
      status: 404,
      body: "Not Found",
    };
  }

  if (files.has(contact.id)) {
    console.log("use cache for contact", contact.id);
    return {
      body: Buffer.from(files.get(contact.id)!).toString("base64"),
      isBase64Encoded: true,
      statusCode: 200,
      headers: {
        "Content-Type": "image/png",
      },
    };
  }

  const getObjectCommand = new GetObjectCommand({
    Bucket: Resource.NorthstarMainBucket.name,
    Key: VFS.bucket().contacts.contact(contact.id).image.path,
  });

  const response = await s3.send(getObjectCommand);
  const body = response.Body;
  const isOk = response.$metadata.httpStatusCode === 200;
  if (!body || !isOk) {
    // contact has no image
    return {
      headers: {
        "Content-Type": "text/plain",
      },
      status: StatusCodes.NOT_FOUND,
      body: "This contact has no image",
    };
  }
  const buffer = await body.transformToByteArray();
  files.set(contact.id, buffer);
  return {
    body: Buffer.from(buffer).toString("base64"),
    isBase64Encoded: true,
    statusCode: 200,
    headers: {
      "Content-Type": "image/png",
    },
  };
});

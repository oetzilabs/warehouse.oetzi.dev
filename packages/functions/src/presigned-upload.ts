import { createHash } from "node:crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl, S3RequestPresigner } from "@aws-sdk/s3-request-presigner";
import { Dossiers } from "@zomoetzidev/core/src/entities/dossiers";
import { Organization } from "@zomoetzidev/core/src/entities/organizations";
import { VFS } from "@zomoetzidev/core/src/entities/paths";
import { StatusCodes } from "http-status-codes";
import { Resource } from "sst";
import { ApiHandler, error, getUser, json } from "./utils";

export const handler = ApiHandler(async (_event) => {
  const authtoken = _event.headers["Authorization"] || _event.headers["authorization"];
  if (!authtoken) {
    return error("No Authorization header", StatusCodes.UNAUTHORIZED);
  }
  const user = await getUser(authtoken.split(" ")[1]);

  if (!user) {
    return error("User not found", StatusCodes.NOT_FOUND);
  }

  const body = JSON.parse(_event.body ?? "{ files: [], collection_id: '', org_slug: '' }");
  const collection_id = body.collection_id;
  const org_slug = body.org_slug;
  const files: Array<{ name: string; size: number }> = body.files;

  if (!collection_id) {
    return error("No collection_id provided", StatusCodes.BAD_REQUEST);
  }

  if (!org_slug) {
    return error("No org_slug provided", StatusCodes.BAD_REQUEST);
  }

  if (!files) {
    return error("No files provided", StatusCodes.BAD_REQUEST);
  }

  const org = await Organization.findBySlug(org_slug);

  if (!org) {
    return error("Organization not found", StatusCodes.NOT_FOUND);
  }

  const urls = [];
  const s3Client = new S3Client({
    region: "eu-central-1",
  });
  for (let i = 0; i < files.length; i++) {
    const hash = await createHash("sha256").update(files[i].name).digest("hex");
    const [[dossier]] = await Dossiers.create(
      [
        {
          filename: files[i].name,
          hash,
          organization_id: org.id,
          collection_id,
          status: "uploaded",
        },
      ],
      user.id,
    );

    const command = new PutObjectCommand({
      Bucket: Resource.NorthstarMainBucket.name,
      Key: VFS.bucket().organization(org.id).uploads.dossier_collection(collection_id).dossier(dossier.id).file.path,
    });

    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 60 * 15, // 15 minutes
    });

    urls.push({
      id: dossier.id,
      filename: files[i].name,
      url: signedUrl,
    });
  }

  return json({
    urls: urls,
  });
});

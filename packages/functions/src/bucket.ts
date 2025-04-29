import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Dossiers } from "@zomoetzidev/core/src/entities/dossiers";
import { Organization } from "@zomoetzidev/core/src/entities/organizations";
import { VFS } from "@zomoetzidev/core/src/entities/paths";
import { createPdfImage } from "@zomoetzidev/core/src/entities/pdfimages";
import { WebsocketCore } from "@zomoetzidev/core/src/entities/websocket";
import { Resource } from "sst";

const s3 = new S3Client({
  region: "eu-central-1",
});

// this is a lambda function that is triggered by an s3 event when a file is put
export const filecreated_put = async (_event: any) => {
  console.log("filecreated_put", _event);
  // get the bucket key
  const ob = _event.Records[0].s3.object;
  const key = ob.key;
  const vfs_parts = VFS.parse(key);
  if (!vfs_parts.success) {
    console.error("Invalid path", vfs_parts.message);
    return;
  }

  console.log("VFS parts", vfs_parts);

  const dossier_id = vfs_parts.dossier;
  const organization_id = vfs_parts.organization;
  if (!dossier_id) {
    console.log("No dossier id");
    return;
  }
  const doc = await Dossiers.findById(dossier_id);
  if (!doc) {
    console.log("No Dossier found");
    return;
  }
  if (!organization_id) {
    console.log("No organization id");
    return;
  }
  const org = await Organization.findById(organization_id);
  if (!org) {
    console.log("Organization not found");
    return;
  }
  const updatedDoc = await Dossiers.update({ id: dossier_id, filelocation: key });
  const d = await Dossiers.findById(updatedDoc.id);
  await WebsocketCore.sendMessageToUsersInOrganization(organization_id, {
    action: "document-create",
    payload: {
      dossiers: [d],
    },
  });
  console.log("Document has been PUT and UPDATED");

  const get_pdf_file = new GetObjectCommand({
    Bucket: Resource.NorthstarMainBucket.name,
    Key: VFS.bucket().organization(org.id).uploads.dossier_collection(doc.collection_id).dossier(doc.id).file.path,
  });

  const response = await s3.send(get_pdf_file);
  const body = response.Body;

  if (body) {
    const buffer = await body.transformToByteArray();
    const pdfImage = await createPdfImage(buffer, 1);

    if (pdfImage) {
      const put = new PutObjectCommand({
        Bucket: Resource.NorthstarMainBucket.name,
        Key: VFS.bucket().organization(org.id).uploads.dossier_collection(doc.collection_id).dossier(doc.id).thumbnail
          .path,
        Body: pdfImage,
        ContentType: "image/png",
      });
      await s3.send(put);
    }
  }

  console.log("Document thumbnail has been added");
  return;
};

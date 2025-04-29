import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import * as Textract from "@aws-sdk/client-textract";
import { Block, TreeNode } from "@zomoetzidev/core/src/drizzle/sql/schema";
import { Dossiers } from "@zomoetzidev/core/src/entities/dossiers";
// import { Bus } from "@zomoetzidev/core/src/entities/event_bus";
import { Parsers } from "@zomoetzidev/core/src/entities/parsers";
import { VFS } from "@zomoetzidev/core/src/entities/paths";
import { createPdfImage } from "@zomoetzidev/core/src/entities/pdfimages";
import { User } from "@zomoetzidev/core/src/entities/users";
import { WebsocketCore } from "@zomoetzidev/core/src/entities/websocket";
// import { prefixed_cuid2 } from "@zomoetzidev/core/utils/custom-cuid2-zod";
import { SQSHandler } from "aws-lambda";
import { Resource } from "sst";
import { z } from "zod";
import { detectParser } from "./utils";

const withTextract = false;

const textractClient = new Textract.Textract({
  region: "eu-central-1",
});

const s3Client = new S3Client({
  region: "eu-central-1",
});

export function convertToTree(blocks: Block[]): TreeNode[] {
  const map: { [id: string]: TreeNode } = {};
  const rootNodes: TreeNode[] = [];

  // Create nodes
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    map[block.Id] = { block, children: [] };
  }

  // Connect parent-child relationships
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (block.Relationships) {
      for (let j = 0; j < block.Relationships.length; j++) {
        const relationship: {
          Ids: Array<string>;
          Type: string;
        } = block.Relationships[j];
        for (let k = 0; k < relationship.Ids.length; k++) {
          const childId = relationship.Ids[k];
          if (map[childId]) {
            map[block.Id].children.push(map[childId]);
          }
        }
      }
    }
  }

  // Find root nodes (nodes with no parents)
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (!block.Relationships || !block.Relationships.find((relationship) => relationship.Type === "PARENT")) {
      rootNodes.push(map[block.Id]);
    }
  }

  return rootNodes;
}

// export const uploaded = Bus.subscribe("pdf.uploaded", async (evt) => {
//   const schema = z.object({
//     userId: z.string(),
//     files: z.array(prefixed_cuid2),
//   });
//   const parsed = schema.safeParse(evt);
//   if (!parsed.success) throw new Error("Invalid event");
//   const data = parsed.data;
//   const user = await User.findById(data.userId);
//   if (!user) throw new Error(`User ${data.userId} not found`);

//   const files = data.files;

//   const promises: Array<Promise<void>> = [];
//   for (let i = 0; i < files.length; i++) {
//     const promise = new Promise<void>(async (resolve, reject) => {
//       const document = await Dossiers.findById(files[i]);

//       if (!document) {
//         console.error(`File ${files[i]} not found, skipping`);
//         return reject();
//       }

//       if (!document.organization_id) {
//         console.error(`Document ${document.id} is not connected to an organization, skipping`);
//         return reject();
//       }

//       let updatedDoc = await Dossiers.update({
//         id: document.id,
//         status: "sending_to_ocr",
//       });

//       await WebsocketCore.sendMessageToUsersInOrganization(document.organization_id, {
//         action: "document-update",
//         payload: {
//           id: updatedDoc.id,
//           status: updatedDoc.status,
//           filename: updatedDoc.filename,
//         },
//       });
//       return resolve();

//       // if (withTextract) {
//       //   const response = await textractClient
//       //     .send(
//       //       new Textract.StartDocumentAnalysisCommand({
//       //         DocumentLocation: {
//       //           S3Object: {
//       //             Bucket: Resource.NorthstarMainBucket.name,
//       //             Name: VFS.bucket()
//       //               .organization(document.organization_id)
//       //               .uploads.dossier_collection(document.collection_id)
//       //               .dossier(document.id).file.path,
//       //           },
//       //         },
//       //         NotificationChannel: {
//       //           SNSTopicArn: Resource["textract-results-sns"].topicArn,
//       //           RoleArn: process.env.SNS_ROLE_ARN!,
//       //         },
//       //         FeatureTypes: ["TABLES", "FORMS"],
//       //       })
//       //     )
//       //     .catch(async (e) => {
//       //       console.error("[ERROR]: Error in textract", e);
//       //       updatedDoc = await Dossiers.update({
//       //         id: document.id,
//       //         status: "error_ocr",
//       //       });

//       //       if (!document.organization_id) {
//       //         console.error("Document not connected to an organization, skipping");
//       //         return reject("Document not connected to an organization");
//       //       }

//       //       await WebsocketCore.sendMessageToUsersInOrganization(document.organization_id, {
//       //         action: "document-update",
//       //         payload: {
//       //           id: updatedDoc.id,
//       //           status: updatedDoc.status,
//       //           filename: updatedDoc.filename,
//       //         },
//       //       });
//       //       return null;
//       //     });

//       //   if (!response) {
//       //     console.error("No response from textract");
//       //     return reject("No response from textract");
//       //   }
//       //   if (!response.JobId) {
//       //     console.error("No JobId in response from textract");
//       //     return reject("No JobId in response from textract");
//       //   }

//       //   updatedDoc = await Dossiers.update({
//       //     id: document.id,
//       //     status: "processing_ocr",
//       //     ocr_job_id: response.JobId,
//       //   });

//       //   await WebsocketCore.sendMessageToUsersInOrganization(document.organization_id, {
//       //     action: "document-update",
//       //     payload: {
//       //       id: updatedDoc.id,
//       //       status: updatedDoc.status,
//       //       filename: updatedDoc.filename,
//       //     },
//       //   });
//       // }
//     });
//     promises.push(promise);
//   }
//   await Promise.allSettled(promises).catch((e) => {
//     console.error(e);
//   });
// });

// export const uploadedSinglePage = Bus.subscribe("pdf.uploaded-single-page", async (evt) => {
//   const schema = z.object({
//     userId: z.string(),
//     files: z.array(prefixed_cuid2),
//   });
//   const parsed = schema.safeParse(evt);
//   if (!parsed.success) throw new Error("Invalid event");
//   const data = parsed.data;
//   const user = await User.findById(data.userId);
//   if (!user) throw new Error(`User ${data.userId} not found`);

//   const files = data.files;

//   const parsers = await Parsers.all();

//   const promises: Array<Promise<void>> = [];
//   for (let i = 0; i < files.length; i++) {
//     const promise = new Promise<void>(async (resolve, reject) => {
//       const document = await Dossiers.findById(files[i]);

//       if (!document) {
//         console.error(`File ${files[i]} not found, skipping`);
//         return reject();
//       }

//       if (!document.organization_id) {
//         console.error(`Document ${document.id} is not connected to an organization, skipping`);
//         return reject();
//       }

//       // get all the pages and convert them to images
//       // download the pdf
//       const pdf = await s3Client.send(
//         new GetObjectCommand({
//           Bucket: Resource.NorthstarMainBucket.name,
//           Key: VFS.bucket()
//             .organization(document.organization_id)
//             .uploads.dossier_collection(document.collection_id)
//             .dossier(document.id).file.path,
//         }),
//       );
//       if (pdf.$metadata.httpStatusCode !== 200) {
//         console.error("No response from s3");
//         return reject("No response from s3");
//       }

//       if (!pdf.Body) {
//         console.error("No body in documentFile");
//         return reject("No body in documentFile");
//       }

//       const docBuffer = Buffer.from(await pdf.Body?.transformToByteArray());

//       const matchAnyParser = await detectParser(docBuffer, document.page_count ?? 1, parsers);
//       if (!matchAnyParser) {
//         console.error("No parser found");
//         return reject("No parser found");
//       }
//       // store that image on s3
//       const s3Image = await s3Client.send(
//         new PutObjectCommand({
//           Bucket: Resource.NorthstarMainBucket.name,
//           Key: `${document.id}-${matchAnyParser.parser}.png`,
//           Body: matchAnyParser.image,
//         }),
//       );

//       let updatedDoc = await Dossiers.update({
//         id: document.id,
//         status: "sending_to_ocr",
//       });

//       await WebsocketCore.sendMessageToUsersInOrganization(document.organization_id, {
//         action: "document-update",
//         payload: {
//           id: updatedDoc.id,
//           status: updatedDoc.status,
//           filename: updatedDoc.filename,
//         },
//       });

//       const response = await textractClient
//         .send(
//           new Textract.AnalyzeDocumentCommand({
//             Document: {
//               Bytes: matchAnyParser.image,
//             },
//             FeatureTypes: ["TABLES", "FORMS"],
//           }),
//         )
//         .catch(async (e) => {
//           console.error("[ERROR]: Error in textract", e);
//           updatedDoc = await Dossiers.update({
//             id: document.id,
//             status: "error_ocr",
//           });

//           if (!document.organization_id) {
//             console.error("Document not connected to an organization, skipping");
//             return reject("Document not connected to an organization");
//           }

//           await WebsocketCore.sendMessageToUsersInOrganization(document.organization_id, {
//             action: "document-update",
//             payload: {
//               id: updatedDoc.id,
//               status: updatedDoc.status,
//               filename: updatedDoc.filename,
//             },
//           });
//           return null;
//         });

//       if (!response) {
//         console.error("No response from textract");
//         return reject("No response from textract");
//       }
//       if (!response.Blocks) {
//         console.error("No Blocks in response from textract");
//         return reject("No Blocks in response from textract");
//       }

//       updatedDoc = await Dossiers.update({
//         id: document.id,
//         status: "processing_ocr",
//         ocr_data: response.Blocks as any,
//       });

//       await WebsocketCore.sendMessageToUsersInOrganization(document.organization_id, {
//         action: "document-update",
//         payload: {
//           id: updatedDoc.id,
//           status: updatedDoc.status,
//           filename: updatedDoc.filename,
//         },
//       });

//       return resolve();
//     });
//     promises.push(promise);
//   }
//   await Promise.allSettled(promises).catch((e) => {
//     console.error(e);
//   });
// });

export const parsed: SQSHandler = async (evt) => {
  const records = evt.Records;
  const schema = z.object({
    JobId: z.string(),
    Status: z.enum(["SUCCEEDED", "FAILED", "IN_PROGRESS"]),
  });

  const parsers = await Parsers.all();

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const body = JSON.parse(record.body);
    const message = JSON.parse(body.Message);
    const parsed = schema.safeParse(message);
    if (!parsed.success) {
      console.error("Invalid event", message);
      continue;
    }
    const data = parsed.data;

    let jobFound = false;
    const document = await Dossiers.findByJobId(data.JobId);
    if (!document) {
      console.error(`Document not found for job ${data.JobId}`);
      return;
    }
    if (!document.organization_id) {
      console.error(`Document ${document.id} is not connected to an organization, skipping`);
      return;
    }

    if (data.Status !== "SUCCEEDED") {
      const documentFile = await s3Client.send(
        new GetObjectCommand({
          Bucket: Resource.NorthstarMainBucket.name,
          Key: VFS.bucket()
            .organization(document.organization_id)
            .uploads.dossier_collection(document.collection_id)
            .dossier(document.id).file.path,
        }),
      );
      if (documentFile.$metadata.httpStatusCode !== 200) {
        console.error("No response from s3");
        return;
      }

      if (!documentFile.Body) {
        console.error("No body in documentFile");
        return;
      }

      const docBuffer = Buffer.from(await documentFile.Body?.transformToByteArray());

      const detectedParser = await detectParser(docBuffer, document.page_count ?? 1, parsers);
      console.log("Detected parser", detectedParser);

      const updatedDoc = await Dossiers.update({
        id: document.id,
        status: "error_ocr",
      });

      await WebsocketCore.sendMessageToUsersInOrganization(document.organization_id, {
        action: "document-update",
        payload: {
          id: updatedDoc.id,
          status: updatedDoc.status,
          filename: updatedDoc.filename,
        },
      });
      continue;
    }
    while (jobFound === false) {
      const command = new Textract.GetDocumentAnalysisCommand({
        JobId: data.JobId,
      });
      const response = await textractClient.send(command);

      if (response.JobStatus === "SUCCEEDED") {
        jobFound = true;
        const result = response.Blocks;
        // check if the result has NextToken as well.

        const updatedDoc = await Dossiers.update({
          id: document.id,
          status: "processed_ocr",
          ocr_data: result as any,
        });

        await WebsocketCore.sendMessageToUsersInOrganization(document.organization_id, {
          action: "document-update",
          payload: {
            id: updatedDoc.id,
            status: updatedDoc.status,
            filename: updatedDoc.filename,
          },
        });
      } else if (response.JobStatus === "FAILED") {
        console.error("Job failed");
        const updatedDoc = await Dossiers.update({
          id: document.id,
          status: "error_ocr",
        });

        await WebsocketCore.sendMessageToUsersInOrganization(document.organization_id, {
          action: "document-update",
          payload: {
            id: updatedDoc.id,
            status: updatedDoc.status,
            filename: updatedDoc.filename,
          },
        });
        return;
      } else if (response.JobStatus === "IN_PROGRESS") {
        console.log("Job is still processing");
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
  }
};

// export const ocr = Bus.subscribe("parser.ocr", async (evt) => {
//   const schema = z.object({
//     parserId: z.string(),
//   });
//   const parsed = schema.safeParse(evt);
//   if (!parsed.success) throw new Error("Invalid event");
//   const data = parsed.data;

//   const parser = await Parsers.findById(data.parserId);

//   if (!parser) {
//     console.error(`Parser not found for job ${data.parserId}`);
//     return;
//   }

//   const s3Client = new S3Client({
//     region: "eu-central-1",
//   });

//   const getObjectCommand = new GetObjectCommand({
//     Bucket: Resource.NorthstarMainBucket.name,
//     Key: VFS.bucket().parsers.parser(parser.id).file.path,
//   });

//   const response = await s3Client.send(getObjectCommand);

//   const body = response.Body;
//   const isOk = response.$metadata.httpStatusCode === 200;
//   if (!body || !isOk) {
//     throw new Error("Not Found");
//   }
//   const imagePng = await body.transformToByteArray();

//   const command = new Textract.AnalyzeDocumentCommand({
//     Document: {
//       Bytes: imagePng,
//     },
//     FeatureTypes: ["TABLES", "FORMS"],
//   });

//   const result = await textractClient.send(command);

//   const ocrData = result.Blocks ?? [];

//   await Parsers.update({
//     id: parser.id,
//     ocr: ocrData as Block[],
//     tree: convertToTree(ocrData as Block[]) as any,
//   });
// });

// export const template = Bus.subscribe("parser.template.page", async (evt) => {
//   const schema = z.object({
//     parserId: z.string(),
//     page: z.number(),
//   });
//   const parsed = schema.safeParse(evt);
//   if (!parsed.success) throw new Error("Invalid event");
//   const data = parsed.data;

//   const parser = await Parsers.findById(data.parserId);

//   if (!parser) {
//     console.error(`Parser not found for job ${data.parserId}`);
//     return;
//   }

//   const s3 = new S3Client({
//     region: "eu-central-1",
//   });

//   const getObjectCommand = new GetObjectCommand({
//     Bucket: Resource.NorthstarMainBucket.name,
//     Key: VFS.bucket().parsers.parser(parser.id).file.path,
//   });

//   const response = await s3.send(getObjectCommand);
//   const body = response.Body;
//   const isOk = response.$metadata.httpStatusCode === 200;
//   if (!body || !isOk) {
//     console.error("Not Found");
//     return;
//   }
//   const imagePdf = await body.transformToByteArray();
//   const buffer = new Uint8Array(imagePdf);
//   const pdfImage = await createPdfImage(buffer, data.page);

//   if (!pdfImage) {
//     console.error("Could not create image");
//     return;
//   }

//   if (!parser.file) {
//     console.error("No file for parser");
//     return;
//   }

//   const newTemplateImage = new PutObjectCommand({
//     Bucket: Resource.NorthstarMainBucket.name,
//     Key: VFS.bucket().parsers.parser(parser.id).thumbnail.path,
//     ContentType: "image/png",
//     Body: pdfImage,
//   });

//   const response2 = await s3.send(newTemplateImage);
//   if (response2.$metadata.httpStatusCode !== 200) {
//     console.log("Error uploading image", response2);
//   }

//   await Parsers.update({
//     id: parser.id,
//     image: VFS.bucket().parsers.parser(parser.id).thumbnail.path,
//     selectedPage: data.page,
//   });
// });

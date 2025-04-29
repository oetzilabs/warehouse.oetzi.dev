// import { ManagedPolicy, PolicyStatement, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
// import { EventBus, Queue, toCdkDuration, Topic } from "sst";
// import { Layers } from "./Layers";
// import { allSecrets } from "./Secrets";

// export const textract_queue_parsed = new sst.aws.Queue("textract-queue-parsed", {
//   cdk: {
//     queue: {
//       visibilityTimeout: toCdkDuration("15 minutes"),
//     },
//   },
//   consumer: {
//     function: {
//       handler: "packages/functions/src/events/pdf.parsed",
//       timeout: "15 minutes",
//       bind: [
//         ...allSecrets
//         bucket,
//         auth,
//       ],
//       permissions: ["textract:GetDocumentAnalysis"],
//     },
//   },
// });

// export const textract_parser_ocr_queue = new sst.aws.Queue("textract-parser-ocr-queue", {
//   cdk: {
//     queue: {
//       visibilityTimeout: toCdkDuration("15 minutes"),
//     },
//   },
//   consumer: {
//     function: {
//       handler: "packages/functions/src/events/pdf.ocr",
//       timeout: "15 minutes",
//       bind: [
//         ...allSecrets,
//         bucket,
//         auth,
//         secrets.GOOGLE_CLIENT_ID,
//         ws,
//         secrets.DATABASE_PROVIDER,
//         secrets.WITH_EMAIL,
//         secrets.DOC_PARSER_API_KEY,
//       ],
//       permissions: ["textract:AnalyzeDocument", "s3"],
//     },
//   },
// });

// export const textract_parser_template_queue = new sst.aws.Queue("textract-parser-template-queue", {
//   cdk: {
//     queue: {
//       visibilityTimeout: toCdkDuration("15 minutes"),
//     },
//   },
//   consumer: {
//     function: {
//       handler: "packages/functions/src/events/pdf.template",
//       timeout: "15 minutes",
//       bind: [
//         ...allSecrets,
//         bucket,
//         auth,
//       ],
//       permissions: ["s3"],
//     },
//   },
// });

// export const textract_results_sns = new sst.aws.SnsTopic("textract-results-sns", {
//   subscribers: {
//     textract_result: {
//       queue: textract_queue_parsed,
//       type: "queue",
//     },
//   },
// });

// const sns_role = new Role(`${textract_results_sns.id}-role`, {
//   assumedBy: new ServicePrincipal("textract.amazonaws.com"),
//   managedPolicies: [ManagedPolicy.fromAwsManagedPolicyName("service-role/AmazonSNSRole")],
// });

// sns_role.addToPolicy(
//   new PolicyStatement({
//     actions: ["sns:Publish"],
//     resources: [textract_results_sns.topicArn],
//   })
// );

// export const textract_queue_uploaded = new sst.aws.Queue("textract-queue", {
//   cdk: {
//     queue: {
//       visibilityTimeout: toCdkDuration("15 minutes"),
//     },
//   },
//   consumer: {
//     function: {
//       handler: "packages/functions/src/events/pdf.uploaded",
//       timeout: "15 minutes",
//       environment: {
//         SNS_ROLE_ARN: sns_role.roleArn,
//       },
//       nodejs: {
//         install: ["opencv4nodejs", "node-gyp"],
//       },
//       bind: [
//         ...allSecrets,
//         bucket,
//         auth,
//       ],
//       permissions: ["textract:AnalyzeDocument", "textract:StartDocumentAnalysis", "sns", "s3"],
//     },
//   },
// });

// export const customer_message_queue = new sst.aws.Queue("customer-message-queue", {
//   cdk: {
//     queue: {
//       visibilityTimeout: toCdkDuration("15 minutes"),
//     },
//   },
//   consumer: {
//     function: {
//       handler: "packages/functions/src/events/mail.customer",
//       timeout: "15 minutes",
//       bind: [
//         ...allSecrets,
//         bucket,
//         auth,
//       ],
//       permissions: ["s3", "ses"],
//     },
//   },
// });

// export const message_reply_queue = new sst.aws.Queue("message-reply-queue", {
//   cdk: {
//     queue: {
//       visibilityTimeout: toCdkDuration("15 minutes"),
//     },
//   },
//   consumer: {
//     function: {
//       handler: "packages/functions/src/events/mail.replyToMessage",
//       timeout: "15 minutes",
//       bind: [
//         ...allSecrets,
//         bucket,
//         auth,
//       ],
//       permissions: ["s3", "ses"],
//     },
//   },
// });

// export const textract_event_bus = new EventBus("textract-event-bus", {
//   defaults: {
//     function: {
//       runtime: "nodejs20.x",
//       bind: [
//         ...allSecrets,
//         bucket,
//         auth,
//       ],
//       copyFiles: [
//         {
//           from: "packages/core/src/drizzle",
//           to: "drizzle",
//         },
//       ],
//       layers: [Layers.ghostscript, Layers.graphicsmagick],
//     },
//     retries: 0,
//   },
//   rules: {
//     classic_upload: {
//       pattern: {
//         source: ["zomoetzidev/app"],
//         detailType: ["pdf.uploaded"],
//       },
//       targets: {
//         queue: textract_queue_uploaded,
//       },
//     },
//     classic_parsed: {
//       pattern: {
//         source: ["zomoetzidev/app"],
//         detailType: ["pdf.parsed"],
//       },
//       targets: {
//         queue: textract_queue_parsed,
//       },
//     },
//     parser_ocr: {
//       pattern: {
//         source: ["zomoetzidev/app"],
//         detailType: ["parser.ocr"],
//       },
//       targets: {
//         queue: textract_parser_ocr_queue,
//       },
//     },
//     parser_template_page: {
//       pattern: {
//         source: ["zomoetzidev/app"],
//         detailType: ["parser.template.page"],
//       },
//       targets: {
//         queue: textract_parser_template_queue,
//       },
//     },
//     customer_message: {
//       pattern: {
//         source: ["zomoetzidev/app"],
//         detailType: ["customer.message"],
//       },
//       targets: {
//         queue: customer_message_queue,
//       },
//     },
//     message_reply: {
//       pattern: {
//         source: ["zomoetzidev/app"],
//         detailType: ["messagetopic.reply"],
//       },
//       targets: {
//         queue: message_reply_queue,
//       },
//     },
//     // email_received: {
//     //   pattern: {
//     //     source: ["email_received"],
//     //     detailType: ["email"],
//     //   },
//     //   targets: {
//     //     convert_email_to_pngs: "packages/functions/src/textract/convert.main",
//     //   },
//     // },
//   },
// });

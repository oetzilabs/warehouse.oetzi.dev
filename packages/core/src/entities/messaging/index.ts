import { FileSystem, Path } from "@effect/platform";
import { Console, Effect, Schema } from "effect";
import NodeMailer from "nodemailer";
import { DatabaseLive, DatabaseService } from "../../drizzle/sql/service";
import { WarehouseConfig, WarehouseConfigLive } from "../config";
import {
  MessageNodeMailerError,
  MessageNodeMailerSendError,
  MessageTemplateNotFound,
  MessageTemplateNotLoaded,
} from "./errors";

const MessageTemplatesSchema = Schema.Struct({
  "verify-email": Schema.Struct({
    data: Schema.Struct({
      name: Schema.String,
      email: Schema.String,
    }),
  }),
  "reset-password": Schema.Struct({
    data: Schema.Struct({
      name: Schema.String,
      email: Schema.String,
      password: Schema.String,
    }),
  }),
});

type MessageTemplates = typeof MessageTemplatesSchema.Type;

const MessageSchema = Schema.Struct({
  to: Schema.String,
  subject: Schema.String,
  text: Schema.String,
  html: Schema.String,
});

export class MessagingService extends Effect.Service<MessagingService>()("@warehouse/messaging", {
  effect: Effect.gen(function* (_) {
    const db = yield* DatabaseService;
    const whConfig = yield* WarehouseConfig;
    const config = yield* whConfig.getConfig;

    const create = Effect.fn("@warehouse/messaging/create")(function* <Template extends keyof MessageTemplates>(
      template: Template,
      data: MessageTemplates[Template]["data"],
    ) {
      const path = yield* Path.Path;
      const fs = yield* FileSystem.FileSystem;

      const dirname = yield* path.fromFileUrl(new URL(".", import.meta.url));

      const templateFolder = path.join(dirname, "templates");
      const folderExists = yield* fs.exists(templateFolder);

      if (!folderExists) {
        return yield* Effect.fail(
          new MessageTemplateNotLoaded({ cause: new Error(`Template folder not found`), template }),
        );
      }
      const files = yield* fs.readDirectory(templateFolder);

      const templates = files.filter((file) => file.endsWith(".js") || file.endsWith(".ts"));
      if (templates.length === 0) {
        return yield* Effect.fail(new MessageTemplateNotLoaded({ cause: new Error(`No templates found`), template }));
      }

      const templateFile = templates.find((file) => file.endsWith(`${template}.js`) || file.endsWith(`${template}.ts`));
      if (!templateFile) {
        return yield* Effect.fail(
          new MessageTemplateNotLoaded({ cause: new Error(`Template ${template} not found`), template }),
        );
      }

      const p = path.join(dirname, "templates", templateFile);

      const messageTemplate = yield* Effect.tryPromise({
        try: (signal) => import(p).then((mod) => mod.default),
        catch: (cause) => Effect.fail(new MessageTemplateNotLoaded({ cause, template })),
      });
      return yield* Effect.promise<typeof MessageSchema.Type>(() => messageTemplate(data));
    });

    const send = Effect.fn("@warehouse/messaging/send")(function* (message: typeof MessageSchema.Type) {
      const transporter = NodeMailer.createTransport(config.EmailTransportConfig);
      const info = yield* Effect.tryPromise({
        try: (signal) =>
          transporter.sendMail({
            ...message,
            from: config.EmailTransportConfig.name,
            sender: config.EmailTransportConfig.auth.user,
          }),
        catch: (cause) => Effect.fail(new MessageNodeMailerSendError({ cause })),
      });
      return info;
    });

    return {
      create,
      send,
    };
  }),
  dependencies: [DatabaseLive, WarehouseConfigLive],
}) {}

export const MessagingLive = MessagingService.Default;

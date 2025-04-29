import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { render } from "@jsx-email/render";
import { Attachments } from "@zomoetzidev/core/src/entities/attachments";
import { Bus } from "@zomoetzidev/core/src/entities/event_bus";
import { Logs } from "@zomoetzidev/core/src/entities/logs";
import { MessageTopic } from "@zomoetzidev/core/src/entities/message_topics";
import { Message } from "@zomoetzidev/core/src/entities/messages";
import { Organization } from "@zomoetzidev/core/src/entities/organizations";
import { VFS } from "@zomoetzidev/core/src/entities/paths";
import { User } from "@zomoetzidev/core/src/entities/users";
import { WebsocketCore } from "@zomoetzidev/core/src/entities/websocket";
import ContactOrganizationEmail from "@zomoetzidev/mail/emails/templates/ContactOrganizationEmail";
import ReplyToMessageTopicEmail from "@zomoetzidev/mail/emails/templates/ReplyToMessageTopicEmail";
import Nodemailer from "nodemailer";
import { Resource } from "sst";
import { z } from "zod";

export const customer = Bus.subscribe("customer.message", async (d) => {
  const nodemailer = Nodemailer.createTransport({
    host: Resource.EmailHost.value,
    port: z.coerce.number().parse(Resource.EmailPort.value),
    secure: process.env.IS_LOCAL ? false : true,
    auth: {
      user: Resource.EmailUsername.value,
      pass: Resource.EmailPassword.value,
    },
  });

  const organization = await Organization.findById(d.organization_id);

  if (!organization) {
    throw new Error("Organization does not exist");
  }

  if (!organization.email) {
    throw new Error("Organization does not have an email");
  }

  const email = ContactOrganizationEmail({
    app_url: d.app_url,
    assetsUrl: d.app_url + "/assets/email",
    app: Resource.App.name,
    stage: Resource.App.stage,
    organization_slug: organization.slug,
    organization: organization.name,
    message_slug: "123412341234",
    messages: d.message.split("\n").filter((m) => m.length > 0),
    sender: d.sender,
  });

  const html = await render(email, { pretty: true });
  const text = await render(email, { pretty: true, plainText: true });
  const info = await nodemailer
    .sendMail({
      from: Resource.EmailFrom.value,
      to: organization.email,
      subject: `New message from ${d.sender} to your organization: ${organization.name}`,
      html: html,
      text: text,
    })
    .catch((err) => {
      console.error("error sending email", err);
      return null;
    });
  if (!info) {
    await Logs.create({
      type: "email-error",
      url: "/messages",
      user_id: d.user_id,
      additional: {
        error: "error sending email",
        html,
        text,
      },
    });
    return;
  }
  const message_topic = await User.createMessageTopic(
    d.user_id,
    organization.owner.id,
    `New message to ${organization.name}`,
  );
  const connectedToOrganization = await Organization.connectToMessageTopic(organization.id, message_topic.id);
  if (!connectedToOrganization) {
    throw new Error("Could not connect to message topic");
  }
  const { message, user_message } = await User.createMessage(d.user_id, message_topic.id, d.message, undefined);
  await Logs.create({
    type: "[events]email-sent:publish",
    url: "/messages",
    user_id: d.user_id,
    additional: {
      info,
      message_id: message.id,
      user_message: user_message,
    } as any,
  });
});

export const replyToMessage = Bus.subscribe("messagetopic.reply", async (d) => {
  const mt = await MessageTopic.findById(d.message_topic_id);
  if (!mt) {
    throw new Error("Message topic not found");
  }
  const nodemailer = Nodemailer.createTransport({
    host: Resource.EmailHost.value,
    port: z.coerce.number().parse(Resource.EmailPort),
    secure: process.env.IS_LOCAL ? false : true,
    auth: {
      user: Resource.EmailUsername.value,
      pass: Resource.EmailPassword.value,
    },
  });

  const organization = await Organization.findById(d.organization_id);

  if (!organization) {
    throw new Error("Organization does not exist");
  }

  if (!organization.email) {
    throw new Error("Organization does not have an email");
  }

  const email = ReplyToMessageTopicEmail({
    app_url: d.app_url,
    assetsUrl: d.app_url + "/assets/email",
    app: Resource.App.name,
    stage: Resource.App.stage,
    messages: d.message.split("\n").filter((m) => m.length > 0),
    message_topic_slug: mt.slug,
    sender: d.sender,
    organization: organization.name,
    organization_slug: organization.slug,
  });

  const html = render(email, { pretty: true });
  const text = render(email, { pretty: true, plainText: true });

  const attachment_ids = d.attachments;

  const attachments: Nodemailer.SendMailOptions["attachments"] = [];
  const s3 = new S3Client({
    region: "eu-central-1",
  });
  for (const id of attachment_ids) {
    const attachment = await Attachments.findById(id);
    if (!attachment) {
      await Logs.create({
        type: "email-error:attachment-not-found",
        url: "/messages",
        user_id: d.user_id,
        additional: {
          error: "attachment not found",
          id,
        },
      });
      continue;
    }
    const o = new GetObjectCommand({
      Bucket: Resource.NorthstarMainBucket.name,
      Key: VFS.bucket().attachments.attachment(attachment.id).file.path,
    });
    const data = await s3.send(o);
    if (!data.Body) {
      continue;
    }
    const buffer = Buffer.from(await data.Body.transformToByteArray());
    attachments.push({
      filename: attachment.name,
      content: buffer,
    });
  }

  const info = await nodemailer
    .sendMail({
      from: Resource.EmailFrom.value,
      to: organization.owner.email,
      subject: `${d.sender} replied to your message`,
      html: html,
      text: text,
      attachments,
    })
    .catch((err) => {
      console.error("error sending email", err);
      return null;
    });
  if (!info) {
    await Logs.create({
      type: "email-error",
      url: "/messages",
      user_id: d.user_id,
      additional: {
        error: "error sending email",
        html,
        text,
      },
    });
    return;
  }

  const u_con_id = mt.receiver.email === d.sender ? mt.owner.id : mt.receiver.id;

  const connections = await WebsocketCore.getConnections(u_con_id);
  if (connections.length > 0) {
    await Logs.create({
      type: "[events]messagereply-error:ws-connection-not-found",
      url: "/messages",
      user_id: d.user_id,
      additional: {
        receiver: mt.receiver.id,
      } as any,
    });
    return;
  }

  for (let i = 0; i < connections.length; i++) {
    const connection = connections[i];
    console.log("sending message reply via ws", connection.connectionId, d.user_id);

    await WebsocketCore.sendMessageToConnection(
      {
        action: "customer-reply",
        payload: { topic_id: mt.id, message_id: d.message_id, revalidate_id: u_con_id },
      },
      connection.connectionId,
    );

    await Logs.create({
      type: "[events]messagereply-sent-via-ws",
      url: "/messages",
      user_id: d.user_id,
      additional: {
        connection,
      } as any,
    });
  }

  await Logs.create({
    type: "[events]email-sent:replied",
    url: "/messages",
    user_id: d.user_id,
    additional: {
      info,
      message_id: d.message_id,
      user_message: d.user_message,
    } as any,
  });
});

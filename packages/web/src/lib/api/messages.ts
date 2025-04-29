import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { action, cache, redirect } from "@solidjs/router";
import { Attachments } from "@zomoetzidev/core/src/entities/attachments";
import { VFS } from "@zomoetzidev/core/src/entities/paths";
import { User, UserMessageTopicsList } from "@zomoetzidev/core/src/entities/users";
import { Resource } from "sst";
import { withSession } from "./utils";

export const getMessageTopics = cache(async () => {
  "use server";
  const [session] = await withSession();
  if (!session) {
    return redirect("/auth/login");
  }
  if (!session.user) {
    return redirect("/auth/login");
  }
  if (!session.user.id) {
    return redirect("/auth/login");
  }
  const inbox = await User.getReceivedMessageTopics(session.user.id);
  const sent = await User.getMessageTopics(session.user.id);
  const drafts = await User.getDraftedMessageTopics(session.user.id);
  const trash = await User.getDeletedMessageTopics(session.user.id);
  const archived = await User.getArchivedMessageTopics(session.user.id);

  return {
    inbox,
    sent,
    drafts,
    trash,
    archived,
  } as {
    [name: string]: UserMessageTopicsList;
  };
}, "messages");

export const removeMessageTopic = action(async (id: string) => {
  "use server";
  const [session] = await withSession();
  if (!session) {
    return redirect("/auth/login");
  }
  if (!session.user) {
    return redirect("/auth/login");
  }
  if (!session.user.id) {
    return redirect("/auth/login");
  }
  return await User.softDeleteMessageTopic(session.user.id, id);
});

export const setMessageTopicMessagesAsRead = action(async (topic_id: string) => {
  "use server";
  const [session] = await withSession();
  if (!session) {
    return redirect("/auth/login");
  }
  if (!session.user) {
    return redirect("/auth/login");
  }
  if (!session.user.id) {
    return redirect("/auth/login");
  }
  await User.setMessageTopicMessagesAsRead(session.user.id, topic_id);
  return true;
});

export const addMessageToMesageTopic = action(async (topic_id: string, message: string, attachments: string[]) => {
  "use server";
  const [session] = await withSession();
  if (!session) {
    return redirect("/auth/login");
  }
  if (!session.user) {
    return redirect("/auth/login");
  }
  if (!session.user.id) {
    return redirect("/auth/login");
  }
  await User.addMessageToMessageTopic({
    user_id: session.user.id,
    message_topic_id: topic_id,
    message,
    attachments,
  });

  return true;
});

export const removeAttachment = action(async (id: string) => {
  "use server";
  const [session] = await withSession();
  if (!session) {
    return redirect("/auth/login");
  }
  if (!session.user) {
    return redirect("/auth/login");
  }
  if (!session.user.id) {
    return redirect("/auth/login");
  }
  const a = await Attachments.findById(id);
  if (!a) {
    throw new Error("Attachment not found");
  }
  const s3 = new S3Client({
    region: "eu-central-1",
  });
  const fp = VFS.bucket().attachments.attachment(a.id).file.path;
  const command = new DeleteObjectCommand({
    Bucket: Resource.NorthstarMainBucket.name,
    Key: fp,
  });
  console.log(fp);
  const result = await s3.send(command);
  await Attachments.remove(a.id);

  return true;
});

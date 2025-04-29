import { Organizations } from "@/components/settings/Organization";
import { action, cache, redirect } from "@solidjs/router";
import { Dossiers } from "@warehouseoetzidev/core/src/entities/dossiers";
// import { Bus } from "@warehouseoetzidev/core/src/entities/event_bus";
import { Organization } from "@warehouseoetzidev/core/src/entities/organizations";
import { WebsocketCore } from "@warehouseoetzidev/core/src/entities/websocket";
import { withSession } from "./utils";

export const getDocumentById = cache(async (slug: string, did: string) => {
  "use server";
  const [session] = await withSession();
  if (!session) {
    return redirect("/auth/login");
  }

  if (!session.session.current_organization_id) {
    throw redirect("/setup/organization");
  }

  const organization = await Organization.findBySlug(slug);

  if (!organization) {
    throw new Error("Organization does not exist");
  }

  const hasUser = await Organization.hasUser(organization.id, session.user.id);

  if (!hasUser) {
    throw new Error("User does not have access to this organization");
  }

  const doc = await Dossiers.findById(did);

  if (!doc) {
    throw new Error("Document does not exist");
  }

  const hasDocument = await Organization.hasDocument(organization.id, doc.id);

  if (!hasDocument) {
    throw new Error("This document is not in this organization");
  }

  return doc;
}, "document-by-id");
export const getDocumentPositions = cache(async (document_id: string) => {
  "use server";
  const [session] = await withSession();
  if (!session) {
    return redirect("/auth/login");
  }

  if (!session.session.current_organization_id) {
    throw redirect("/setup/organization");
  }

  const doc = await Dossiers.findById(document_id);

  if (!doc) {
    throw new Error("Document does not exist");
  }

  return doc.positions.filter((p) => p.deletedAt === null);
}, "document-positions");

export const newTransitPosition = action(async (document_id: string) => {
  "use server";
  const [session] = await withSession();
  if (!session) {
    return redirect("/auth/login");
  }

  if (!session.session.current_organization_id) {
    throw redirect("/setup/organization");
  }

  const doc = await Dossiers.findById(document_id);

  if (!doc) {
    throw new Error("Document does not exist");
  }

  const positions = await Dossiers.countTransitPositions(doc.id);

  const newPosition = positions + 1;

  const position = await Dossiers.createTransitPosition(doc.id, session.user.id, newPosition);

  if (!position) {
    throw new Error("Couldn't create position");
  }

  return position;
});

export const deleteTransitPosition = action(async (document_id: string, position_id: string) => {
  "use server";
  const [session] = await withSession();
  if (!session) {
    return redirect("/auth/login");
  }

  if (!session.session.current_organization_id) {
    throw redirect("/setup/organization");
  }

  const doc = await Dossiers.findById(document_id);

  if (!doc) {
    throw new Error("Document does not exist");
  }

  const transitPosition = await Dossiers.getTransitPosition(doc.id, position_id);

  if (!transitPosition) {
    throw new Error("Position does not exist or is not a transit position");
  }

  const deleted = await Dossiers.deleteTransitPosition(doc.id, position_id);

  if (!deleted) {
    throw new Error("Couldn't delete position");
  }

  return deleted;
});

export const deleteDocument = action(async (document_id: string) => {
  "use server";
  const [session] = await withSession();
  if (!session) {
    return redirect("/auth/login");
  }

  if (!session.session.current_organization_id) {
    throw redirect("/setup/organization");
  }

  const doc = await Dossiers.findById(document_id);

  if (!doc) {
    throw new Error("Document does not exist");
  }

  const deleted = await Dossiers.softDelete(doc.id);

  if (!deleted) {
    throw new Error("Couldn't delete document");
  }

  await WebsocketCore.sendMessageToUsersInOrganization(session.session.current_organization_id, {
    action: "document-create",
    payload: {
      deleted,
    },
  });

  return deleted;
});

export const deleteDocumentsBulk = action(async (document_ids: string[]) => {
  "use server";
  const [session] = await withSession();
  if (!session) {
    return redirect("/auth/login");
  }

  if (!session.session.current_organization_id) {
    throw redirect("/setup/organization");
  }

  const deleted = await Dossiers.softDeleteBulk(document_ids);

  if (!deleted) {
    throw new Error("Couldn't delete documents");
  }
  await WebsocketCore.sendMessageToUsersInOrganization(session.session.current_organization_id, {
    action: "document-create",
    payload: {
      deleted,
    },
  });

  return deleted;
});

export const forceDeleteDocument = action(async (document_id: string) => {
  "use server";
  const [session] = await withSession();
  if (!session) {
    return redirect("/auth/login");
  }

  if (!session.session.current_organization_id) {
    throw redirect("/setup/organization");
  }

  const doc = await Dossiers.findById(document_id);

  if (!doc) {
    throw new Error("Document does not exist");
  }

  const deleted = await Dossiers.forceDelete(doc.id);

  if (!deleted) {
    throw new Error("Couldn't delete document");
  }

  await WebsocketCore.sendMessageToUsersInOrganization(session.session.current_organization_id, {
    action: "document-create",
    payload: {
      deleted,
    },
  });

  return deleted;
});

export const forceDeleteDocumentsBulk = action(async (document_ids: string[]) => {
  "use server";
  const [session] = await withSession();
  if (!session) {
    return redirect("/auth/login");
  }

  if (!session.session.current_organization_id) {
    throw redirect("/setup/organization");
  }

  const deleted = await Dossiers.forceDeleteBulk(document_ids);

  if (!deleted) {
    throw new Error("Couldn't delete documents");
  }

  await WebsocketCore.sendMessageToUsersInOrganization(session.session.current_organization_id, {
    action: "document-create",
    payload: {
      deleted,
    },
  });

  return deleted;
});

export const getDocumentsByUserId = cache(async (user_id: string) => {
  "use server";
  const [session] = await withSession();
  if (!session) {
    return redirect("/auth/login");
  }

  if (!session.session.current_organization_id) {
    throw redirect("/setup/organization");
  }

  const documents = await Dossiers.findManyByUserId(user_id);

  return documents;
}, "documents-by-user-id");

export const undoDeleteDocument = action(async (document_id: string) => {
  "use server";
  const [session] = await withSession();
  if (!session) {
    return redirect("/auth/login");
  }

  if (!session.session.current_organization_id) {
    throw redirect("/setup/organization");
  }

  const undone = await Dossiers.update({
    id: document_id,
    deletedAt: null,
  });

  if (!undone) {
    throw new Error("Couldn't undo delete document");
  }

  await WebsocketCore.sendMessageToUsersInOrganization(session.session.current_organization_id, {
    action: "document-undo-delete",
    payload: {
      undone,
    },
  });

  return undone;
});

export const rerunWorkflowForDocument = action(async (document_id: string) => {
  "use server";
  const [session] = await withSession();
  if (!session) {
    return redirect("/auth/login");
  }

  if (!session.session.current_organization_id) {
    throw redirect("/setup/organization");
  }

  const doc = await Dossiers.findById(document_id);

  if (!doc) {
    throw new Error("Document does not exist");
  }

  // we are going to parse the OCR_DATA and do the transit postions from there.
  // so we reset the status to processing_ocr
  await Dossiers.update({
    id: document_id,
    status: "processing_ocr",
  });

  await WebsocketCore.sendMessageToUsersInOrganization(session.session.current_organization_id, {
    action: "document-update",
    payload: {
      id: document_id,
      status: "processing_ocr",
      filename: doc.filename,
    },
  });

  //! dont restart the pdf.uploaded event, that will be expensive on textract. Each page costs about $0.065 per page.
  //! Only parse the OCR_DATA and do the transit postions.
  return true;
});

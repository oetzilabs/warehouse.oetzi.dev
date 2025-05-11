import { Schema } from "effect";

export class DocumentStorageOfferInvalidId extends Schema.TaggedError<DocumentStorageOfferInvalidId>()(
  "DocumentStorageOfferInvalidId",
  {
    id: Schema.String,
  },
) {}

export class DocumentStorageOfferNotFound extends Schema.TaggedError<DocumentStorageOfferNotFound>()(
  "DocumentStorageOfferNotFound",
  {
    id: Schema.String,
  },
) {}

export class DocumentStorageOfferCreateFailed extends Schema.TaggedError<DocumentStorageOfferCreateFailed>()(
  "DocumentStorageOfferCreateFailed",
  {
    organizationId: Schema.String,
  },
) {}

export class DocumentStorageOfferUpdateFailed extends Schema.TaggedError<DocumentStorageOfferUpdateFailed>()(
  "DocumentStorageOfferUpdateFailed",
  {
    id: Schema.String,
  },
) {}

export class DocumentStorageOfferDeleteFailed extends Schema.TaggedError<DocumentStorageOfferDeleteFailed>()(
  "DocumentStorageOfferDeleteFailed",
  {
    id: Schema.String,
  },
) {}

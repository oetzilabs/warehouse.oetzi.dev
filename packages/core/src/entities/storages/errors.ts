import { Data } from "effect";

export class StorageInvalidId extends Data.TaggedError("StorageInvalidId")<{ id: string }> {}
export class StorageNotCreated extends Data.TaggedError("StorageNotCreated")<{}> {}
export class StorageNotFound extends Data.TaggedError("StorageNotFound")<{ id: string }> {}
export class StorageNotUpdated extends Data.TaggedError("StorageNotUpdated")<{ id: string }> {}
export class StorageNotDeleted extends Data.TaggedError("StorageNotDeleted")<{ id: string }> {}

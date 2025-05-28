import { Schema } from "effect";

export class AccountingOrganizationInvalidId extends Schema.TaggedError<AccountingOrganizationInvalidId>()(
  "AccountingOrganizationInvalidId",
  {
    organizationId: Schema.String,
  },
) {}

export class AccountingDateRangeInvalid extends Schema.TaggedError<AccountingDateRangeInvalid>()(
  "AccountingDateRangeInvalid",
  {
    message: Schema.String,
  },
) {}

import { migrate } from "@zomoetzidev/core/src/drizzle/sql";
import { DocTypes } from "@zomoetzidev/core/src/entities/doc_types";
import { Parsers } from "@zomoetzidev/core/src/entities/parsers";
import { VatCodes } from "@zomoetzidev/core/src/entities/vatCodes";
import { ApiHandler, json } from "./utils";

export const handler = ApiHandler(async (_evt) => {
  await migrate().catch((e) => {
    // full error
    console.error(JSON.stringify(e, null, 2));
    throw e;
  });

  return json({
    body: "Migrated!",
  });
});

export const seed_vat_codes = ApiHandler(async (_evt) => {
  const vatCodes = await VatCodes.create(VatCodes.DEFAULT_VAT_CODES);
  return json(vatCodes);
});

export const seed_doc_types = ApiHandler(async (_evt) => {
  const docTypes = await DocTypes.create(DocTypes.DEFAULT_DOC_TYPES);
  return json(docTypes);
});

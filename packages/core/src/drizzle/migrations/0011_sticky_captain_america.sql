CREATE TABLE "warehouse"."organizations_documents" (
	"organization_id" varchar NOT NULL,
	"document_id" varchar NOT NULL,
	CONSTRAINT "organizations_documents_organization_id_document_id_pk" PRIMARY KEY("organization_id","document_id")
);
--> statement-breakpoint
ALTER TABLE "warehouse"."organizations_documents" ADD CONSTRAINT "organizations_documents_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "warehouse"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."organizations_documents" ADD CONSTRAINT "organizations_documents_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "warehouse"."documents"("id") ON DELETE cascade ON UPDATE no action;
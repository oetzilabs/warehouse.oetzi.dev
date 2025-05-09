CREATE TABLE "document_storage_feature_feature_sets" (
	"feature_id" varchar NOT NULL,
	"feature_set_id" varchar NOT NULL
);
--> statement-breakpoint
ALTER TABLE "document_storage_feature_feature_sets" ADD CONSTRAINT "document_storage_feature_feature_sets_feature_id_document_feature_id_fk" FOREIGN KEY ("feature_id") REFERENCES "warehouse"."document_feature"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_storage_feature_feature_sets" ADD CONSTRAINT "document_storage_feature_feature_sets_feature_set_id_feature_sets_id_fk" FOREIGN KEY ("feature_set_id") REFERENCES "warehouse"."feature_sets"("id") ON DELETE no action ON UPDATE no action;
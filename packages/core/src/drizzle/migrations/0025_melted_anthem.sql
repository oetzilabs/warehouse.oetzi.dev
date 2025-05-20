ALTER TABLE "warehouse"."certifications" RENAME TO "certificates";--> statement-breakpoint
ALTER TABLE "warehouse"."products_to_certifications" DROP CONSTRAINT "products_to_certifications_certification_id_certifications_id_fk";
--> statement-breakpoint
ALTER TABLE "warehouse"."products_to_certifications" ADD CONSTRAINT "products_to_certifications_certification_id_certificates_id_fk" FOREIGN KEY ("certification_id") REFERENCES "warehouse"."certificates"("id") ON DELETE no action ON UPDATE no action;
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TextField, TextFieldInput } from "@/components/ui/text-field";
import { assignBrand, getProductBrands } from "@/lib/api/products";
import { cn } from "@/lib/utils";
import { A, createAsync, useAction, useSubmission } from "@solidjs/router";
import { type ProductInfo } from "@warehouseoetzidev/core/src/entities/products";
import dayjs from "dayjs";
import Fuse from "fuse.js";
import ArrowUpRight from "lucide-solid/icons/arrow-up-right";
import Loader2 from "lucide-solid/icons/loader-2";
import Plus from "lucide-solid/icons/plus";
import X from "lucide-solid/icons/x";
import { Accessor, createSignal, For, Show, Suspense } from "solid-js";
import { toast } from "solid-sonner";

type SuppliersProps = {
  product: Accessor<ProductInfo>;
};

export const Suppliers = (props: SuppliersProps) => {
  return (
    <div class="flex flex-col border rounded-lg overflow-clip">
      <div class="flex flex-row items-center gap-4 justify-between border-b bg-muted-foreground/5 dark:bg-muted/30 p-4 ">
        <h2 class="font-medium">Suppliers</h2>
        <div class="flex flex-row items-center gap-2">
          <Button variant="outline" size="sm" class="bg-background">
            <Plus class="size-4" />
            Add Supplier
          </Button>
        </div>
      </div>
      <For
        each={props.product().suppliers}
        fallback={
          <div class="flex flex-col items-center justify-center p-8">
            <span class="text-sm text-muted-foreground">No suppliers added.</span>
          </div>
        }
      >
        {(supplier) => (
          <div class="flex flex-col gap-4 p-4">
            <div class="flex flex-row items-center justify-between">
              <div class="flex flex-col gap-1">
                <div class="flex flex-row items-center gap-2">
                  <span class="text-sm font-medium">{supplier.supplier.name}</span>
                  <span
                    class={cn("text-xs px-2 py-0.5 rounded-full select-none", {
                      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400":
                        supplier.supplier.status === "active",
                      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400":
                        supplier.supplier.status === "under_review",
                      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400":
                        supplier.supplier.status === "blacklisted",
                      "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400":
                        supplier.supplier.status === "inactive",
                    })}
                  >
                    {supplier.supplier.status}
                  </span>
                </div>
                <Show when={supplier.supplier.code}>
                  <span class="text-xs text-muted-foreground">Code: {supplier.supplier.code}</span>
                </Show>
              </div>
              <div class="flex items-center gap-2">
                <Button size="icon" variant="outline" class="size-6 bg-background plce-self-start">
                  <X class="!size-3" />
                </Button>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="flex flex-col gap-2">
                <span class="text-xs font-medium">Contact Information</span>
                <div class="flex flex-col gap-1">
                  <Show when={supplier.supplier.email}>
                    <span class="text-xs text-muted-foreground">Email: {supplier.supplier.email}</span>
                  </Show>
                  <Show when={supplier.supplier.phone}>
                    <span class="text-xs text-muted-foreground">Phone: {supplier.supplier.phone}</span>
                  </Show>
                  <Show when={supplier.supplier.website}>
                    <a
                      href={supplier.supplier.website!}
                      target="_blank"
                      rel="noopener noreferrer"
                      class="text-xs text-primary hover:underline"
                    >
                      {supplier.supplier.website}
                    </a>
                  </Show>
                  <Show when={supplier.supplier.tax_id}>
                    <span class="text-xs text-muted-foreground">Tax ID: {supplier.supplier.tax_id}</span>
                  </Show>
                </div>
              </div>
              <div class="flex flex-col gap-2">
                <span class="text-xs font-medium">Payment Information</span>
                <div class="flex flex-col gap-1">
                  <Show when={supplier.supplier.payment_terms}>
                    <span class="text-xs text-muted-foreground">Payment Terms: {supplier.supplier.payment_terms}</span>
                  </Show>
                  <Show when={supplier.supplier.bank_details}>
                    <span class="text-xs text-muted-foreground whitespace-pre-line">
                      Bank Details: {supplier.supplier.bank_details}
                    </span>
                  </Show>
                </div>
              </div>
            </div>

            <Show when={supplier.supplier.contacts?.length > 0}>
              <div class="flex flex-col gap-2">
                <span class="text-xs font-medium">Contacts</span>
                <div class="grid grid-cols-2 gap-4">
                  <For each={supplier.supplier.contacts}>
                    {(contact) => (
                      <div class="flex flex-col gap-1 p-2 border rounded-md">
                        <div class="flex items-center justify-between">
                          <span class="text-xs font-medium">{contact.name}</span>
                          <span class="text-xs text-muted-foreground capitalize">{contact.type}</span>
                        </div>
                        <Show when={contact.position}>
                          <span class="text-xs text-muted-foreground">{contact.position}</span>
                        </Show>
                        <Show when={contact.email || contact.phone || contact.mobile}>
                          <div class="flex flex-col gap-0.5">
                            <Show when={contact.email}>
                              <span class="text-xs text-muted-foreground">{contact.email}</span>
                            </Show>
                            <Show when={contact.phone}>
                              <span class="text-xs text-muted-foreground">Tel: {contact.phone}</span>
                            </Show>
                            <Show when={contact.mobile}>
                              <span class="text-xs text-muted-foreground">Mob: {contact.mobile}</span>
                            </Show>
                          </div>
                        </Show>
                      </div>
                    )}
                  </For>
                </div>
              </div>
            </Show>

            <Show when={supplier.supplier.notes?.length > 0}>
              <div class="flex flex-col gap-2">
                <span class="text-xs font-medium">Notes</span>
                <div class="grid grid-cols-1 gap-2">
                  <For each={supplier.supplier.notes}>
                    {(note) => (
                      <div class="flex flex-col gap-1 p-2 border rounded-md">
                        <div class="flex items-center justify-between">
                          <span class="text-xs font-medium">{note.title}</span>
                          <span class="text-xs text-muted-foreground capitalize">{note.type}</span>
                        </div>
                        <span class="text-xs text-muted-foreground whitespace-pre-line">{note.content}</span>
                      </div>
                    )}
                  </For>
                </div>
              </div>
            </Show>
            <div class="flex flex-row items-center justify-between gap-2">
              <div class="">
                <span class="text-xs text-muted-foreground">
                  <Show
                    when={supplier.supplier.updatedAt}
                    fallback={`Created ${dayjs(supplier.supplier.createdAt).fromNow()}`}
                  >
                    Updated {dayjs(supplier.supplier.updatedAt).fromNow()}
                  </Show>
                </span>
              </div>
              <div class="">
                <Button as={A} href={`/suppliers/${supplier.supplier.id}`} variant="secondary" size="sm">
                  View
                  <ArrowUpRight class="size-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </For>
    </div>
  );
};

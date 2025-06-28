import { Basics } from "@/components/forms/products/new/basics";
import { Certificates } from "@/components/forms/products/new/certificates";
import { Conditions } from "@/components/forms/products/new/conditions";
import { Labels } from "@/components/forms/products/new/labels";
import { Suppliers } from "@/components/forms/products/new/suppliers";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TextField, TextFieldInput, TextFieldLabel, TextFieldTextArea } from "@/components/ui/text-field";
import { getAuthenticatedUser, getSessionToken } from "@/lib/api/auth";
import { getCertificates } from "@/lib/api/certificates";
import { getProductBrands, getProductLabels } from "@/lib/api/products";
import { getStorageConditions } from "@/lib/api/storage_conditions";
import { getSuppliers } from "@/lib/api/suppliers";
import { cn } from "@/lib/utils";
import { A, createAsync, revalidate, RouteDefinition } from "@solidjs/router";
import { createForm, formOptions } from "@tanstack/solid-form";
import { type ProductCreate } from "@warehouseoetzidev/core/src/drizzle/sql/schemas/products/products";
import dayjs from "dayjs";
import ArrowLeft from "lucide-solid/icons/arrow-left";
import Plus from "lucide-solid/icons/plus";
import RotateCw from "lucide-solid/icons/rotate-cw";

// TODO: import other section components as you create them

export const route = {
  preload: (props) => {
    getAuthenticatedUser();
    getSessionToken();
    getSuppliers();
    getProductLabels();
    getCertificates();
    getStorageConditions();
  },
} as RouteDefinition;

export default function NewProductPage() {
  const suppliers = createAsync(() => getSuppliers(), { deferStream: true });
  const labels = createAsync(() => getProductLabels(), { deferStream: true });
  const certificates = createAsync(() => getCertificates(), { deferStream: true });
  const conditions = createAsync(() => getStorageConditions(), { deferStream: true });
  const brands = createAsync(() => getProductBrands(), { deferStream: true });
  const formOps = formOptions({
    defaultValues: {
      name: "",
      barcode: "",
      sku: "",
      description: "",
      dimensions: {
        depth: 0,
        width: 0,
        height: 0,
        unit: "cm",
      },
      weight: {
        value: 0.0,
        unit: "kg",
      },

      customsTariffNumber: "unknown",
      countryOfOrigin: "unknown",

      brand_id: null,

      labels: [],
      catalogs: [],
      certificates: [],
      conditions: [],
      suppliers: [],
    } as {
      name: string;
      barcode: string;
      sku: string;
      description: string;
      dimensions: {
        depth: number;
        width: number;
        height: number;
        unit: "cm" | "in" | (string & {});
      };
      weight: {
        value: number;
        unit: "kg" | "lb";
      };
      customsTariffNumber: string;
      countryOfOrigin: string;
      brand_id: string | null;
      labels: string[];
      catalogs: string[];
      certificates: string[];
      conditions: string[];
      suppliers: string[];
    },
  });
  const form = createForm(() => ({
    ...formOps,
  }));

  return (
    <div class="container flex flex-row grow py-4">
      <div class="w-full py-4 flex flex-col gap-4">
        <div class="flex items-center gap-4 justify-between w-full">
          <div class="flex items-center gap-4">
            <Button size="sm" variant="outline" class="bg-background" as={A} href="/products">
              <ArrowLeft class="size-4" />
              Back to Products
            </Button>
            <h1 class="font-semibold leading-none">New Product</h1>
          </div>
          <div class="flex items-center gap-4">
            <Button size="sm" onClick={() => {}}>
              <Plus class="size-4" />
              Add
            </Button>
          </div>
        </div>
        <form class="w-full grow flex flex-col">
          <Basics />
          <div class="border-b my-8" />
          <Labels />
          <div class="border-b my-8" />
          <Conditions />
          <div class="border-b my-8" />
          <Certificates />
          <div class="border-b my-8" />
          <Suppliers />
        </form>
      </div>
    </div>
  );
}

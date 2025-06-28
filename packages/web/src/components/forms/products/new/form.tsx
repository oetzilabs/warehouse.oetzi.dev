import { createForm, formOptions } from "@tanstack/solid-form";
import { createContext, JSXElement, useContext } from "solid-js";

export const formOps = formOptions({
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

    images: [],
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

    images: File[];
  },
});
export const createProductForm = createForm(() => ({
  ...formOps,
}));

export const NewProductFormContext = createContext<{
  form: typeof createProductForm;
}>({
  form: createProductForm,
});

export const useNewProductForm = () => {
  const ctx = useContext(NewProductFormContext);
  if (!ctx) {
    throw new Error("useNewProductForm must be used within a NewProductFormContext provider");
  }
  return ctx.form;
};

export const NewProductFormProvider = (props: { children: JSXElement }) => {
  return (
    <NewProductFormContext.Provider value={{ form: createProductForm }}>
      {props.children}
    </NewProductFormContext.Provider>
  );
};

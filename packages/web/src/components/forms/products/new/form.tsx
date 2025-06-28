import { createProduct } from "@/lib/api/products";
import { createForm, formOptions } from "@tanstack/solid-form";
import { type NewProductFormData } from "@warehouseoetzidev/core/src/entities/products/schemas";
import { createContext, JSXElement, useContext } from "solid-js";
import { toast } from "solid-sonner";

const formOps = formOptions({
  defaultValues: {
    product: {
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
    },
    labels: [],
    catalogs: [],
    certificates: [],
    conditions: [],
    suppliers: [],

    images: [],
  } as NewProductFormData,
});
const createProductForm = createForm(() => ({
  ...formOps,
  onSubmit: (props) => {
    toast.promise(createProduct(props.value), {
      loading: "Creating product...",
      success: "Product created successfully!",
      error: "Something went wrong while creating the product.",
    });
  },
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

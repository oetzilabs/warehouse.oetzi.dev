import { createProduct } from "@/lib/api/products";
import { useAction, useSubmission } from "@solidjs/router";
import { AnyFormApi, createForm, formOptions, SolidFormApi } from "@tanstack/solid-form";
import { type NewProductFormData } from "@warehouseoetzidev/core/src/entities/products/schemas";
import { Accessor, createContext, JSXElement, useContext } from "solid-js";
import { toast } from "solid-sonner";

export const NewProductFormContext = createContext<{
  form: ReturnType<typeof createForm<NewProductFormData, any, any, any, any, any, any, any, any, any>> | undefined;
  pending: Accessor<boolean | undefined>;
}>({
  form: undefined,
  pending: () => false,
});

export const useNewProductForm = () => {
  const ctx = useContext(NewProductFormContext);
  if (!ctx) {
    throw new Error("useNewProductForm must be used within a NewProductFormContext provider");
  }
  const form = ctx.form;
  if (form === undefined) {
    throw new Error("please provide a form to the NewProductFormProvider");
  }
  return { form, pending: ctx.pending };
};

export const NewProductFormProvider = (props: { children: JSXElement }) => {
  const createProductAction = useAction(createProduct);
  const isCreatingProduct = useSubmission(createProduct);
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
      price: {
        sellingPrice: 0.0,
        currency: "EUR",
        purchasePrice: 0.0,
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
      toast.promise(createProductAction(props.value), {
        loading: "Creating product...",
        success: "Product created successfully!",
        error: "Something went wrong while creating the product.",
      });
    },
  }));
  return (
    <NewProductFormContext.Provider value={{ form: createProductForm, pending: () => isCreatingProduct.pending }}>
      {props.children}
    </NewProductFormContext.Provider>
  );
};

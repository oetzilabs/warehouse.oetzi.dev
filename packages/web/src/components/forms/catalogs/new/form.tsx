import { createCatalog } from "@/lib/api/catalogs";
import { useAction, useSubmission } from "@solidjs/router";
import { createForm, formOptions } from "@tanstack/solid-form";
import { type NewCatalogFormData } from "@warehouseoetzidev/core/src/entities/catalogs/schemas";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import { Accessor, createContext, JSXElement, useContext } from "solid-js";
import { toast } from "solid-sonner";

dayjs.extend(isoWeek);

export const NewCatalogFormContext = createContext<{
  form: ReturnType<typeof createForm<NewCatalogFormData, any, any, any, any, any, any, any, any, any>> | undefined;
  pending: Accessor<boolean | undefined>;
}>({
  form: undefined,
  pending: () => false,
});

export const NewCatalogFormProvider = (props: { children: JSXElement }) => {
  const createCatalogAction = useAction(createCatalog);
  const isCreatingCatalog = useSubmission(createCatalog);

  const formOps = formOptions({
    defaultValues: {
      name: "",
      description: "",
      startDate: dayjs().isoWeekday(1).startOf("week").toDate(),
      endDate: dayjs().isoWeekday(1).endOf("week").toDate(),
      isActive: true,
      products: [],
    } as NewCatalogFormData,
    defaultState: {
      canSubmit: false,
    },
  });

  const form = createForm(() => ({
    ...formOps,
    onSubmit: async (state) => {
      toast.promise(createCatalogAction(state.value), {
        loading: "Creating catalog...",
        success: "Catalog created successfully",
        error: "Failed to create catalog",
      });
    },
  }));

  return (
    <NewCatalogFormContext.Provider value={{ form, pending: () => isCreatingCatalog.pending }}>
      {props.children}
    </NewCatalogFormContext.Provider>
  );
};

export const useNewCatalogForm = () => {
  const ctx = useContext(NewCatalogFormContext);
  if (!ctx) {
    throw new Error("useNewCatalogForm must be used within a NewCatalogFormProvider");
  }
  const form = ctx.form;
  if (form === undefined) {
    throw new Error("please provide a form to the NewCatalogFormProvider");
  }
  return { form, pending: ctx.pending };
};

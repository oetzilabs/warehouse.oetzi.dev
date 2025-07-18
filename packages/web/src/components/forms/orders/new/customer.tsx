import { TextField, TextFieldInput } from "@/components/ui/text-field";
import { cn } from "@/lib/utils";
import Fuse from "fuse.js";
import { createMemo, createSignal, For } from "solid-js";

type CustomerSelect = {
  value: string;
  label: string;
};

export function CustomerSelect(props: {
  value: CustomerSelect;
  onChange: (value: CustomerSelect) => void;
  customers: { id: string; name: string }[];
}) {
  const options = props.customers.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  const [search, setSearch] = createSignal("");

  const filteredOptions = createMemo(() => {
    const term = search();
    if (!term) {
      return options;
    }
    const fuse = new Fuse(options, {
      keys: ["label"],
      threshold: 0.3,
    });
    return fuse.search(term).map((d) => d.item);
  });

  return (
    <div class="flex flex-col gap-4 w-full">
      <TextField value={search()} onChange={(value) => setSearch(value)}>
        <TextFieldInput placeholder="Search customers..." />
      </TextField>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
        <For each={filteredOptions()}>
          {(customer) => (
            <div
              class={cn("w-full rounded-lg border p-4 cursor-pointer", {
                "ring-2 ring-primary": props.value.value === customer.value,
              })}
              onClick={() => {
                if (props.value.value === customer.value) {
                  props.onChange({ value: "", label: "" });
                } else {
                  props.onChange(customer);
                }
              }}
            >
              <span class="font-medium">{customer.label}</span>
            </div>
          )}
        </For>
      </div>
    </div>
  );
}

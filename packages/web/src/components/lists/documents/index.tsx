import { FilterPopover } from "@/components/filters/popover";
import { TextField, TextFieldInput } from "@/components/ui/text-field";
import { FilterConfig, useFilter } from "@/lib/filtering";
import { debounce, leadingAndTrailing } from "@solid-primitives/scheduled";
import { DocumentInfo } from "@warehouseoetzidev/core/src/entities/documents";
import dayjs from "dayjs";
import { Accessor, createSignal, For } from "solid-js";
import { createStore } from "solid-js/store";

type DocumentsListProps = {
  documents: Accessor<DocumentInfo[]>;
};

export const DocumentList = (props: DocumentsListProps) => {
  const [search, setSearch] = createSignal("");
  const [dsearch, setDSearch] = createSignal("");

  const defaultSort = {
    default: "date",
    current: "date",
    direction: "desc" as const,
    variants: [
      {
        field: "date",
        label: "Date",
        fn: (a: DocumentInfo, b: DocumentInfo) => {
          return dayjs(a.createdAt).diff(dayjs(b.createdAt));
        },
      },
      {
        field: "name",
        label: "Name",
        fn: (a: DocumentInfo, b: DocumentInfo) => {
          return a.name.localeCompare(b.name);
        },
      },
    ],
  } as FilterConfig<DocumentInfo>["sort"];

  const uniqueTypesMap = new Map<string, string>();
  props.documents().forEach((doc) => {
    if (!uniqueTypesMap.has(doc.type)) {
      uniqueTypesMap.set(doc.type, doc.type);
    }
  });

  const uniqueTypeVariants = Array.from(uniqueTypesMap.values()).map((type) => ({
    type: `document_type:${type}`,
    label: type.charAt(0).toUpperCase() + type.slice(1),
    fn: (item: DocumentInfo) => item.type === type,
  }));

  const [filterConfig, setFilterConfig] = createStore<FilterConfig<DocumentInfo>>({
    disabled: () => props.documents().length === 0,
    dateRange: {
      start: props.documents().length === 0 ? new Date() : props.documents()[0].createdAt,
      end: props.documents().length === 0 ? new Date() : props.documents()[props.documents().length - 1].createdAt,
      preset: "clear",
    },
    search: {
      term: dsearch(),
      fields: ["name", "path"],
      fuseOptions: { keys: ["name", "type", "path"] },
    },
    sort: defaultSort,
    filter: {
      default: null,
      current: null,
      variants: uniqueTypeVariants,
    },
  });

  const debouncedSearch = leadingAndTrailing(
    debounce,
    (text: string) => {
      setDSearch(text);
      setFilterConfig((prev) => ({ ...prev, search: { ...prev.search!, term: text } }));
    },
    500,
  );

  const filteredData = useFilter(props.documents, filterConfig);

  return (
    <div class="w-full flex flex-col gap-4">
      <div class="flex flex-row items-center justify-between gap-4">
        <TextField
          value={search()}
          onChange={(e) => {
            setSearch(e);
            debouncedSearch(e);
          }}
          class="w-full max-w-full"
        >
          <TextFieldInput placeholder="Search documents" class="w-full max-w-full rounded-lg px-4" />
        </TextField>
        <div class="w-max">
          <FilterPopover config={filterConfig} onChange={setFilterConfig} data={props.documents} />
        </div>
      </div>
      <For
        each={filteredData()}
        fallback={
          <div class="flex flex-col gap-4 items-center justify-center rounded-lg p-14 border text-muted-foreground">
            <span class="text-sm select-none">
              {props.documents().length === 0 ? "No documents have been added" : "No documents match your search"}
            </span>
          </div>
        }
      >
        {(doc) => (
          <div class="flex flex-col w-full bg-background border rounded-lg overflow-hidden hover:shadow-sm transition-all">
            <div class="flex flex-row items-center justify-between p-4">
              <div class="flex flex-row gap-4 items-center">
                <div class="flex flex-col gap-0.5">
                  <span class="text-sm font-medium">{doc.name}</span>
                  <span class="text-xs text-muted-foreground">
                    {dayjs(doc.updatedAt ?? doc.createdAt).format("MMM DD, YYYY - h:mm A")}
                  </span>
                </div>
              </div>
              <div class="flex flex-row items-center gap-2">
                <span class="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">{doc.type}</span>
                <span class="text-xs text-muted-foreground">{doc.path}</span>
              </div>
            </div>
          </div>
        )}
      </For>
    </div>
  );
};

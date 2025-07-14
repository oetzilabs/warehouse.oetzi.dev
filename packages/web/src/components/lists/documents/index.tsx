import { FilterPopover } from "@/components/filters/popover";
import { TextField, TextFieldInput } from "@/components/ui/text-field";
import { FilterConfig, useFilter } from "@/lib/filtering";
import { debounce, leadingAndTrailing } from "@solid-primitives/scheduled";
import { DocumentInfo } from "@warehouseoetzidev/core/src/entities/documents";
import dayjs from "dayjs";
import Fuse, { IFuseOptions } from "fuse.js";
import { Accessor, createMemo, createSignal, For } from "solid-js";
import { createStore } from "solid-js/store";
import { GenericList } from "../default";

type DocumentsListProps = {
  documents: Accessor<DocumentInfo[]>;
};

export const DocumentList = (props: DocumentsListProps) => {
  const [search, setSearch] = createSignal("");

  const renderDocumentItem = (doc: DocumentInfo) => (
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
  );

  const filteredData = createMemo(() => {
    const term = search();
    const set = props.documents();
    if (!term) {
      return set;
    }
    const options: IFuseOptions<DocumentInfo[][number]> = {
      isCaseSensitive: false,
      threshold: 0.4,
      minMatchCharLength: 1,
      keys: ["name", "description", "content", "type", "path"],
    };
    const fuse = new Fuse(set, options);
    return fuse.search(term).map((d) => d.item);
  });

  return (
    <div class="w-full flex flex-col gap-4 pb-4">
      <div class="flex flex-row items-center justify-between gap-0 w-full bg-background">
        <TextField
          value={search()}
          onChange={(e) => {
            setSearch(e);
          }}
          class="w-full max-w-full"
        >
          <TextFieldInput placeholder="Search documents" class="w-full max-w-full rounded-lg px-4" />
        </TextField>
      </div>

      <GenericList
        data={props.documents}
        filteredData={filteredData}
        renderItem={renderDocumentItem}
        emptyMessage="No documents have been added"
        noResultsMessage="No documents match your search"
        searchTerm={search}
      />
    </div>
  );
};

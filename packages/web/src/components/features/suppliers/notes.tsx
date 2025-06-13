import { Badge } from "@/components/ui/badge";
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
import { Select, SelectContent, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TextField, TextFieldInput, TextFieldLabel, TextFieldTextArea } from "@/components/ui/text-field";
import { addNote, getSupplierById, removeNote, updateNote } from "@/lib/api/suppliers";
import { revalidate, useAction, useSubmission } from "@solidjs/router";
import { createForm, formOptions } from "@tanstack/solid-form";
import { type SupplierInfo, type SupplierNoteInfo } from "@warehouseoetzidev/core/src/entities/suppliers";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import Pencil from "lucide-solid/icons/pencil";
import Plus from "lucide-solid/icons/plus";
import RotateCw from "lucide-solid/icons/rotate-cw";
import X from "lucide-solid/icons/x";
import { Accessor, createSignal, For, Show } from "solid-js";
import { toast } from "solid-sonner";

dayjs.extend(relativeTime);

type NotesProps = {
  id: Accessor<SupplierInfo["id"]>;
  list: Accessor<SupplierInfo["notes"]>;
};

export const Notes = (props: NotesProps) => {
  return (
    <div class="flex flex-col border rounded-lg overflow-clip">
      <div class="flex flex-row items-center gap-2 justify-between p-4 py-2 pr-2 border-b bg-muted-foreground/5 dark:bg-muted/30">
        <h2 class="font-medium">Notes</h2>
        <div class="flex flex-row items-center">
          <AddNoteDialog id={props.id()} />
        </div>
      </div>
      <div class="flex flex-col w-full">
        <Show when={props.list().length === 0}>
          <div class="flex flex-col gap-4 items-center justify-center p-10 col-span-full">
            <span class="text-sm text-muted-foreground">No notes have been made</span>
            <div class="flex flex-row gap-2 items-center justify-center">
              <AddNoteDialog id={props.id()} />
              <Button
                size="sm"
                variant="outline"
                class="bg-background"
                onClick={() => {
                  toast.promise(revalidate(getSupplierById.keyFor(props.id())), {
                    loading: "Refreshing supplier...",
                    success: "Refreshed supplier",
                    error: "Failed to refresh supplier",
                  });
                }}
              >
                <RotateCw class="size-4" />
                Refresh
              </Button>
            </div>
          </div>
        </Show>
        <Show when={props.list().length > 0}>
          <div class="flex flex-col gap-0">
            <For each={props.list()}>
              {(note) => (
                <div class="flex flex-col gap-2 p-4 border-b last:border-b-0">
                  <div class="flex flex-col gap-3">
                    <div class="flex flex-row items-center gap-1 justify-between">
                      <span class="font-semibold">{note.title}</span>
                      <div class="flex flex-row items-center gap-2 w-max">
                        <EditNoteDialog
                          id={note.id}
                          note={note}
                          sid={props.id()}
                          onSaved={() =>
                            toast.promise(revalidate(getSupplierById.keyFor(props.id())), {
                              loading: "Refreshing supplier...",
                              success: "Refreshed supplier",
                              error: "Failed to refresh supplier",
                            })
                          }
                        />
                        <DeleteNoteDialog
                          id={note.id}
                          noteId={note.id}
                          onDeleted={() =>
                            toast.promise(revalidate(getSupplierById.keyFor(props.id())), {
                              loading: "Refreshing supplier...",
                              success: "Refreshed supplier",
                              error: "Failed to refresh supplier",
                            })
                          }
                        />
                      </div>
                    </div>
                    <span class="text-sm text-muted-foreground">{note.content}</span>
                  </div>
                  <div class="flex flex-row items-center gap-2">
                    <Badge variant="secondary" class="text-[10px]">
                      {note.type}
                    </Badge>
                    <span class="text-sm text-muted-foreground">{dayjs(note.createdAt).fromNow()}</span>
                  </div>
                </div>
              )}
            </For>
          </div>
        </Show>
      </div>
    </div>
  );
};
const DeleteNoteDialog = (props: { id: string; noteId: string; onDeleted: () => void }) => {
  const [open, setOpen] = createSignal(false);
  const removeNoteAction = useAction(removeNote);
  const isDeletingNote = useSubmission(removeNote);

  return (
    <Dialog open={open()} onOpenChange={setOpen}>
      <DialogTrigger as={Button} size="icon" variant="outline" class="bg-background size-6">
        <X class="size-3" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Note</DialogTitle>
          <DialogDescription>Are you sure you want to delete this note?</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} type="button" size="sm">
            No, Cancel.
          </Button>
          <Button
            type="submit"
            size="sm"
            variant="destructive"
            disabled={isDeletingNote.pending}
            onClick={() => {
              if (isDeletingNote.pending) return;
              toast.promise(removeNoteAction(props.id, props.noteId), {
                loading: "Deleting note...",
                success: () => {
                  setOpen(false);
                  props.onDeleted();
                  return "Note deleted";
                },
                error: "Failed to delete note",
              });
            }}
          >
            Yes, Delete!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const EditNoteDialog = (props: {
  id: string;
  note: Omit<SupplierNoteInfo, "supplier">;
  sid: string;
  onSaved: () => void;
}) => {
  const [open, setOpen] = createSignal(false);
  const updateNoteAction = useAction(updateNote);
  const isUpdatingNote = useSubmission(updateNote);
  const options = formOptions({
    defaultValues: {
      id: props.note.id,
      title: props.note.title,
      content: props.note.content,
    },
  });
  const form = createForm(() => ({
    ...options,
    onSubmit: (state) => {
      if (isUpdatingNote.pending) return;
      toast.promise(updateNoteAction(props.sid, { ...state.value, id: props.id }), {
        loading: "Updating note...",
        success: () => {
          setOpen(false);
          props.onSaved();
          return "Note updated";
        },
        error: "Failed to update note",
      });
    },
  }));

  return (
    <Dialog open={open()} onOpenChange={setOpen}>
      <DialogTrigger as={Button} size="icon" variant="outline" class="bg-background size-6">
        <Pencil class="!size-3" />
      </DialogTrigger>
      <DialogContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          class="flex flex-col gap-4 py-2"
        >
          <DialogHeader>
            <DialogTitle>Edit Note</DialogTitle>
            <DialogDescription>Edit a note for the supplier</DialogDescription>
          </DialogHeader>
          <div class="flex flex-col gap-4">
            <form.Field name="title">
              {(field) => (
                <TextField class="gap-2 flex flex-col">
                  <TextFieldLabel class="capitalize pl-1">Title</TextFieldLabel>
                  <TextFieldInput
                    placeholder="Title"
                    class="w-full"
                    value={field().state.value}
                    onInput={(e) => field().handleChange(e.currentTarget.value)}
                    onBlur={field().handleBlur}
                  />
                </TextField>
              )}
            </form.Field>
            <form.Field name="content">
              {(field) => (
                <TextField class="gap-2 flex flex-col">
                  <TextFieldLabel class="capitalize pl-1">Content</TextFieldLabel>
                  <TextFieldTextArea
                    placeholder="Content"
                    class="w-full"
                    value={field().state.value}
                    onInput={(e) => field().handleChange(e.currentTarget.value)}
                    onBlur={field().handleBlur}
                  />
                </TextField>
              )}
            </form.Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} type="button" size="sm">
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const AddNoteDialog = (props: { id: string }) => {
  const [open, setOpen] = createSignal(false);
  const addNoteAction = useAction(addNote);
  const isAddingNote = useSubmission(addNote);
  const options = formOptions({
    defaultValues: {
      title: "",
      content: "",
      type: "general" as SupplierNoteInfo["type"],
    },
  });
  const form = createForm(() => ({
    ...options,
    onSubmit: (state) => {
      if (isAddingNote.pending) return;
      toast.promise(addNoteAction(props.id, { ...state.value, supplierId: props.id }), {
        loading: "Adding note...",
        success: () => {
          setOpen(false);
          return "Note added";
        },
        error: "Failed to add note",
      });
    },
  }));

  return (
    <Dialog open={open()} onOpenChange={setOpen}>
      <DialogTrigger as={Button} size="sm">
        <Plus class="size-4" />
        Add Note
      </DialogTrigger>
      <DialogContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          class="flex flex-col gap-4 py-2"
        >
          <DialogHeader>
            <DialogTitle>Add Note</DialogTitle>
            <DialogDescription>Add a note to the supplier</DialogDescription>
          </DialogHeader>
          <div class="flex flex-col gap-4">
            <form.Field name="title">
              {(field) => (
                <TextField class="gap-2 flex flex-col">
                  <TextFieldLabel class="capitalize pl-1">Title</TextFieldLabel>
                  <TextFieldInput
                    placeholder="Title"
                    class="w-full"
                    value={field().state.value}
                    onInput={(e) => field().handleChange(e.currentTarget.value)}
                    onBlur={field().handleBlur}
                  />
                </TextField>
              )}
            </form.Field>
            <form.Field name="content">
              {(field) => (
                <TextField class="gap-2 flex flex-col">
                  <TextFieldLabel class="capitalize pl-1">Content</TextFieldLabel>
                  <TextFieldTextArea
                    placeholder="Content"
                    class="w-full"
                    value={field().state.value}
                    onInput={(e) => field().handleChange(e.currentTarget.value)}
                    onBlur={field().handleBlur}
                  />
                </TextField>
              )}
            </form.Field>
            <form.Field name="type">
              {(field) => (
                <Select<SupplierNoteInfo["type"]>
                  value={field().state.value}
                  onChange={(value) => field().handleChange(value ?? "general")}
                  onOpenChange={field().handleBlur}
                  options={["general", "payment", "delivery", "quality", "other"]}
                  required
                  itemComponent={(props) => <SelectItem item={props.item}>{props.item.rawValue}</SelectItem>}
                >
                  <SelectLabel>Type</SelectLabel>
                  <SelectTrigger>
                    <SelectValue<SupplierNoteInfo["type"]>>
                      {(state) => state.selectedOption() || "Select type..."}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent />
                </Select>
              )}
            </form.Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} type="button" size="sm">
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Add
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

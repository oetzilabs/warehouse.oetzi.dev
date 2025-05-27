import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TextField, TextFieldInput, TextFieldLabel } from "@/components/ui/text-field";
import { cn } from "@/lib/utils";
import { createForm } from "@tanstack/solid-form";
import dayjs from "dayjs";
import { Component, For, Show } from "solid-js";

const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

interface PreferredTimeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { startTime: Date; endTime?: Date; notes?: string }) => Promise<void>;
  title: string;
  description?: string;
}

export const PreferredTimeDialog: Component<PreferredTimeDialogProps> = (props) => {
  const form = createForm(() => ({
    defaultValues: {
      selectedDay: 1, // Monday
      startTime: dayjs().format("HH:mm"),
      endTime: dayjs().add(1, "hour").format("HH:mm"),
      notes: "",
    },
    onSubmit: async (state) => {
      const date = dayjs().day(state.value.selectedDay);
      const startTime = date
        .hour(parseInt(state.value.startTime.split(":")[0]))
        .minute(parseInt(state.value.startTime.split(":")[1]))
        .toDate();
      const endTime = state.value.endTime
        ? date
            .hour(parseInt(state.value.endTime.split(":")[0]))
            .minute(parseInt(state.value.endTime.split(":")[1]))
            .toDate()
        : undefined;
      await props.onSubmit({ startTime, endTime, notes: state.value.notes });
      props.onOpenChange(false);
    },
  }));

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{props.title}</DialogTitle>
          <Show when={props.description}>
            <DialogDescription>{props.description}</DialogDescription>
          </Show>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          class="space-y-4"
        >
          <div class="flex flex-wrap gap-2">
            <For each={weekDays}>
              {(day, index) => (
                <form.Field name="selectedDay">
                  {(field) => (
                    <Button
                      type="button"
                      variant={field().state.value === index() + 1 ? "default" : "outline"}
                      class={cn("flex-1", {
                        "min-w-24": true,
                      })}
                      onClick={() => field().handleChange(index() + 1)}
                    >
                      {day}
                    </Button>
                  )}
                </form.Field>
              )}
            </For>
          </div>

          <div class="flex gap-4">
            <form.Field name="startTime">
              {(field) => (
                <TextField class="flex-1">
                  <TextFieldLabel>Start Time</TextFieldLabel>
                  <TextFieldInput
                    type="time"
                    value={field().state.value}
                    onInput={(e) => field().handleChange(e.currentTarget.value)}
                  />
                </TextField>
              )}
            </form.Field>

            <form.Field name="endTime">
              {(field) => (
                <TextField class="flex-1">
                  <TextFieldLabel>End Time (Optional)</TextFieldLabel>
                  <TextFieldInput
                    type="time"
                    value={field().state.value}
                    onInput={(e) => field().handleChange(e.currentTarget.value)}
                  />
                </TextField>
              )}
            </form.Field>
          </div>

          <form.Field name="notes">
            {(field) => (
              <TextField>
                <TextFieldLabel>Notes (Optional)</TextFieldLabel>
                <TextFieldInput
                  value={field().state.value}
                  onInput={(e) => field().handleChange(e.currentTarget.value)}
                />
              </TextField>
            )}
          </form.Field>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => props.onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Time</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
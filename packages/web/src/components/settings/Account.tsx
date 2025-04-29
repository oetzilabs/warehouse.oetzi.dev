import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Combobox, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxTrigger } from "@/components/ui/combobox";
import { TextField, TextFieldLabel, TextFieldRoot } from "@/components/ui/textfield";
import type { UserSession } from "@/lib/api/auth";
import { changeLocaleCookie, getLocale } from "@/lib/api/locale";
import { saveUser } from "@/lib/api/user";
import { sleep } from "@/utils";
import { createAsync, revalidate, useAction, useSubmission } from "@solidjs/router";
import CheckCheck from "lucide-solid/icons/check-check";
import Loader2 from "lucide-solid/icons/loader-2";
import { Match, Show, Suspense, Switch } from "solid-js";
import { toast } from "solid-sonner";
import { NotLoggedIn } from "../NotLoggedIn";

export const Account = (props: { session: UserSession }) => {
  const isSavingUser = useSubmission(saveUser);

  const locale = createAsync(() => getLocale());
  const setLocale = useAction(changeLocaleCookie);
  const isSettingLocale = useSubmission(changeLocaleCookie);
  const locales = ["en", "de"];

  return (
    <Show when={props.session} fallback={<NotLoggedIn />}>
      <div class="flex flex-col items-start gap-8 w-full">
        <div class="flex flex-col items-start gap-4 w-full">
          <span class="text-lg font-semibold">Account</span>
          <span class="text-muted-foreground text-xs">Make changes to your account here.</span>
        </div>
        <form class="flex flex-col gap-4 items-start w-full py-4" action={saveUser} method="post">
          <Show when={props.session.user}>
            {(u) => (
              <>
                <TextFieldRoot
                  class="w-max flex flex-col gap-2"
                  name="name"
                  disabled={isSavingUser.pending}
                  defaultValue={u().name}
                >
                  <TextFieldLabel class="flex flex-col gap-2">
                    User
                    <TextField
                      placeholder="Username"
                      class="w-max min-w-[600px] max-w-[600px]"
                      disabled={isSavingUser.pending}
                    />
                  </TextFieldLabel>
                </TextFieldRoot>
                <TextFieldRoot class="w-max flex flex-col gap-2" defaultValue={u().email}>
                  <TextFieldLabel class="flex flex-col gap-2">
                    Email
                    <TextField
                      id="email"
                      placeholder="Email"
                      type="email"
                      autoCapitalize="none"
                      autocomplete="email"
                      autocorrect="off"
                      class="w-max min-w-[600px] max-w-[600px]"
                      disabled
                      readOnly
                    />
                  </TextFieldLabel>
                </TextFieldRoot>
              </>
            )}
          </Show>
          <Button
            variant="default"
            size="sm"
            type="submit"
            class="w-max gap-2"
            aria-label="Save changes"
            disabled={isSavingUser.pending}
          >
            <Switch fallback={<span>Save</span>}>
              <Match when={isSavingUser.pending}>
                <span>Saving</span>
                <Loader2 class="size-4 animate-spin" />
              </Match>
              <Match when={!isSavingUser.pending && !(isSavingUser.result instanceof Error) && isSavingUser.result?.id}>
                <span>Saved</span>
                <CheckCheck class="size-4" />
              </Match>
            </Switch>
          </Button>
          <Show when={typeof isSavingUser.result !== "undefined" && !isSavingUser.result}>
            <Alert class="flex flex-col items-start gap-2 w-full bg-error">
              There was an error saving your changes.
            </Alert>
          </Show>
        </form>
        <Suspense fallback={"Loading..."}>
          <Show when={locale()}>
            {(l) => (
              <div class="flex flex-col gap-4 w-full">
                <div class="flex flex-row gap-4 items-center p-2">
                  <span class="font-bold text-lg">Language (Region)</span>
                  <Show when={isSettingLocale.pending}>
                    <span class="text-sm text-muted-foreground">Saving</span>
                    <Loader2 class="animate-spin size-4" />
                  </Show>
                </div>
                <Combobox
                  defaultValue={l().language}
                  options={locales}
                  placeholder="Choose a Language"
                  disabled={isSettingLocale.pending}
                  onChange={(v) => {
                    if (!v) return;
                    toast.promise(Promise.all([setLocale(v), sleep(150), revalidate([getLocale.key])]), {
                      loading: "Saving",
                      success: "Saved",
                      error: "Error saving",
                    });
                  }}
                  itemComponent={(props) => <ComboboxItem item={props.item}>{props.item.rawValue}</ComboboxItem>}
                  class="w-max"
                  disallowEmptySelection
                >
                  <ComboboxTrigger>
                    <ComboboxInput />
                  </ComboboxTrigger>
                  <ComboboxContent />
                </Combobox>
              </div>
            )}
          </Show>
        </Suspense>
      </div>
    </Show>
  );
};

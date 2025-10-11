import { useUser } from "@/components/providers/User";
import { Button } from "@/components/ui/button";
import { TextField, TextFieldErrorMessage, TextFieldInput, TextFieldLabel } from "@/components/ui/text-field";
import { loginViaEmail } from "@/lib/api/auth";
import { A, useAction } from "@solidjs/router";
import { createForm, formOptions } from "@tanstack/solid-form";
import ArrowRight from "lucide-solid/icons/arrow-right";
import Loader2 from "lucide-solid/icons/loader-2";
import { Show } from "solid-js";
import { toast } from "solid-sonner";
import { minLength, pipe, string } from "valibot";

export default function LoginPage() {
  const user = useUser();
  const loginAction = useAction(loginViaEmail);

  const formOps = formOptions({
    defaultValues: {
      email: "",
      password: "",
    },
    defaultState: {
      canSubmit: false,
    },
  });

  const form = createForm(() => ({
    ...formOps,
    onSubmit: async (state) => {
      toast.promise(loginAction(state.value.email, state.value.password), {
        loading: "Hold on a second, we're logging you in",
        error: "There was an error logging you in",
        success: (data) => {
          setTimeout(() => {
            window.location.href = "/";
          }, 1000);
          return "You have been logged in, redirecting to home page!";
        },
      });
    },
  }));

  return (
    <>
      <div class="flex h-full w-full pt-20">
        <div class="flex flex-col w-full grow items-center ">
          <div class="w-full max-w-xl flex flex-col gap-4 ">
            <span class="text-lg font-bold text-neutral-800 dark:text-neutral-200">Login</span>
            <form
              class="flex flex-col gap-4 w-full"
              onSubmit={(e) => {
                e.preventDefault();
                form.handleSubmit();
              }}
            >
              <form.Field name="email">
                {(field) => (
                  <TextField class="gap-2 flex flex-col">
                    <TextFieldLabel>Email</TextFieldLabel>
                    <TextFieldInput
                      placeholder="john@doe.com"
                      value={field().state.value}
                      onInput={(e) => field().handleChange(e.currentTarget.value)}
                      onBlur={field().handleBlur}
                      class="bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 focus:border-primary-500 dark:focus:border-primary-400 focus:ring-primary-500 dark:focus:ring-primary-400 text-sm rounded-md block w-full p-2 dark:text-white h-9"
                      required
                    />
                    <Show when={!field().state.meta.isValid}>
                      <TextFieldErrorMessage>{field().state.meta.errors[0]?.message}</TextFieldErrorMessage>
                    </Show>
                  </TextField>
                )}
              </form.Field>
              <form.Field name="password">
                {(field) => (
                  <TextField class="gap-2 flex flex-col">
                    <TextFieldLabel>Password</TextFieldLabel>
                    <TextFieldInput
                      placeholder="••••••••••••"
                      type="password"
                      value={field().state.value}
                      onInput={(e) => field().handleChange(e.currentTarget.value)}
                      onBlur={field().handleBlur}
                      class="bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 focus:border-primary-500 dark:focus:border-primary-400 focus:ring-primary-500 dark:focus:ring-primary-400 text-sm rounded-md block w-full p-2 dark:text-white h-9"
                      required
                    />
                    <Show when={!field().state.meta.isValid}>
                      <TextFieldErrorMessage>{field().state.meta.errors[0]?.message}</TextFieldErrorMessage>
                    </Show>
                  </TextField>
                )}
              </form.Field>
              <form.Subscribe
                selector={(state) => ({
                  canSubmit: state.canSubmit,
                  isSubmitting: state.isSubmitting,
                  errors: state.errors,
                })}
              >
                {(state) => (
                  <div class="flex w-full justify-between">
                    <Button as={A} size="sm" variant="outline" href="/signup" class="bg-background">
                      Sign Up
                    </Button>
                    <Button
                      type="submit"
                      class="w-max self-end"
                      size="sm"
                      disabled={!state().canSubmit || state().isSubmitting}
                    >
                      <Show
                        when={state().isSubmitting}
                        fallback={
                          <>
                            Login
                            <ArrowRight class="size-4" />
                          </>
                        }
                      >
                        <Loader2 class="size-4 animate-spin" />
                        Logging in...
                      </Show>
                    </Button>
                  </div>
                )}
              </form.Subscribe>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

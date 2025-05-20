import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { getAuthenticatedUser, loginViaEmail } from "@/lib/api/auth";
import { createMediaQuery } from "@kobalte/utils";
import { A, createAsync, RouteDefinition, useAction, useSubmission } from "@solidjs/router";
import ArrowRight from "lucide-solid/icons/arrow-right";
import { createSignal, Show } from "solid-js";
import { toast } from "solid-sonner";
import { TextField, TextFieldInput, TextFieldLabel } from "../../components/ui/text-field";

export const route = {
  preload: async (props) => {
    const user = await getAuthenticatedUser();
    return { user };
  },
} satisfies RouteDefinition;

export default function LoginPage() {
  const [email, setEmail] = createSignal("");
  const [password, setPassword] = createSignal("");

  const loginAction = useAction(loginViaEmail);
  const isLoggining = useSubmission(loginViaEmail);

  const doLogin = () => {
    const value = email();
    if (!value) {
      toast.error("Please enter an email");
      return;
    }
    const p = password();
    if (!p) {
      toast.error("Please enter a password");
      return;
    }
    toast.promise(loginAction(value, p), {
      loading: "Hold on a second, we're logging you in",
      error: "There was an error logging you in",
      success: "You have been logged in, redirecting to home page!",
    });
  };

  return (
    <>
      <div class="flex h-full w-full items-center justify-center">
        <div class="flex flex-col w-full  grow items-center justify-center">
          <div class="w-full max-w-xl flex flex-col border-none md:border rounded-none md:rounded-sm px-10 py-4 -mt-40 gap-4">
            <span class="text-lg font-bold text-neutral-800 dark:text-neutral-200">Login</span>
            <form
              class="flex flex-col gap-4 w-full"
              onSubmit={(e) => {
                e.preventDefault();
                doLogin();
              }}
            >
              <TextField value={email()} onChange={(value) => setEmail(value)}>
                <TextFieldLabel>Email</TextFieldLabel>
                <TextFieldInput
                  placeholder="john@doe.com"
                  class="bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 focus:border-primary-500 dark:focus:border-primary-400 focus:ring-primary-500 dark:focus:ring-primary-400 text-sm rounded-md block w-full p-2 dark:text-white h-9"
                />
              </TextField>
              <TextField value={password()} onChange={(value) => setPassword(value)}>
                <TextFieldLabel>Password</TextFieldLabel>
                <TextFieldInput
                  placeholder="••••••••••••"
                  type="password"
                  class="bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 focus:border-primary-500 dark:focus:border-primary-400 focus:ring-primary-500 dark:focus:ring-primary-400 text-sm rounded-md block w-full p-2 dark:text-white h-9"
                />
              </TextField>
              <div class="flex w-full justify-between">
                <A href="/signup" class="text-sm hover:underline">
                  Sign Up
                </A>
                <Button
                  class="w-max self-end"
                  size="sm"
                  onClick={() => {
                    doLogin();
                  }}
                  disabled={!email() || !password() || isLoggining.pending}
                >
                  Login
                  <ArrowRight class="size-4" />
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

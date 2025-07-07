import { useUser } from "@/components/providers/User";
import { Button } from "@/components/ui/button";
import { TextField, TextFieldInput, TextFieldLabel } from "@/components/ui/text-field";
import { getAuthenticatedUser, getSessionToken, loginViaEmail } from "@/lib/api/auth";
import { A, revalidate, useAction, useSubmission } from "@solidjs/router";
import ArrowRight from "lucide-solid/icons/arrow-right";
import { createSignal } from "solid-js";
import { toast } from "solid-sonner";

export default function LoginPage() {
  const user = useUser();
  const [email, setEmail] = createSignal("");
  const [password, setPassword] = createSignal("");

  const loginAction = useAction(loginViaEmail);
  const isLoggining = useSubmission(loginViaEmail);

  const doLogin = async () => {
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
      success: (data) => {
        setTimeout(() => {
          window.location.href = "/";
        }, 1000);
        return "You have been logged in, redirecting to home page!";
      },
    });
    user.reload();
  };

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
                <Button as={A} size="sm" variant="outline" href="/signup" class="bg-background">
                  Sign Up
                </Button>
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

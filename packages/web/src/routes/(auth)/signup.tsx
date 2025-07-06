import { useUser } from "@/components/providers/User";
import { Button } from "@/components/ui/button";
import { TextField, TextFieldInput, TextFieldLabel } from "@/components/ui/text-field";
import { getAuthenticatedUser, getSessionToken, signupViaEmail } from "@/lib/api/auth";
import { A, revalidate, RouteDefinition, useAction, useSubmission } from "@solidjs/router";
import ArrowRight from "lucide-solid/icons/arrow-right";
import { createSignal } from "solid-js";
import { toast } from "solid-sonner";

export const route = {
  preload: async (props) => {
    const user = await getAuthenticatedUser();
    const sessionToken = await getSessionToken();
    return { user, sessionToken };
  },
} satisfies RouteDefinition;

export default function SignUpPage() {
  const user = useUser();
  const [email, setEmail] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [password2, setPassword2] = createSignal("");

  const signupAction = useAction(signupViaEmail);
  const isSigningup = useSubmission(signupViaEmail);

  const doSignup = async () => {
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
    const p2 = password2();
    if (!p2) {
      toast.error("Please enter a password");
      return;
    }
    if (p !== p2) {
      toast.error("Passwords do not match");
      return;
    }
    toast.promise(signupAction(value, p, p2), {
      loading: "Hold on a second, we're logging you in",
      error: "There was an error logging you in",
      success: "You have been logged in, redirecting to home page!",
    });
    user.reload();
  };

  return (
    <>
      <div class="flex h-full w-full pt-20">
        <div class="flex flex-col w-full grow items-center ">
          <div class="w-full max-w-xl flex flex-col gap-4 ">
            <span class="text-lg font-bold text-neutral-800 dark:text-neutral-200">Sign Up</span>
            <form
              class="flex flex-col gap-4 w-full"
              onSubmit={(e) => {
                e.preventDefault();
                doSignup();
              }}
            >
              <TextField value={email()} onChange={(value) => setEmail(value)}>
                <TextFieldLabel>Email</TextFieldLabel>
                <TextFieldInput placeholder="john@doe.com" class="h-9" />
              </TextField>
              <TextField value={password()} onChange={(value) => setPassword(value)}>
                <TextFieldLabel>Password</TextFieldLabel>
                <TextFieldInput placeholder="••••••••••••" type="password" class="h-9" />
              </TextField>
              <TextField value={password2()} onChange={(value) => setPassword2(value)}>
                <TextFieldLabel>Verify Password</TextFieldLabel>
                <TextFieldInput
                  placeholder="••••••••••••"
                  type="password"
                  class="bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 focus:border-primary-500 dark:focus:border-primary-400 focus:ring-primary-500 dark:focus:ring-primary-400 text-sm rounded-md block w-full p-2 dark:text-white h-9"
                />
              </TextField>
              <div class="flex w-full justify-between">
                <Button as={A} size="sm" variant="outline" href="/login" class="bg-background">
                  Log In
                </Button>
                <Button
                  class="w-max"
                  size="sm"
                  onClick={() => {
                    doSignup();
                  }}
                  disabled={!email() || !password() || !password2() || isSigningup.pending}
                >
                  Sign Up
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

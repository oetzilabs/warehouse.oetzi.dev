import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { getAuthenticatedUser } from "@/lib/api/auth";
import { disable } from "@/lib/api/users";
import { revalidate, useAction, useSubmission } from "@solidjs/router";
import AlertTriangleIcon from "lucide-solid/icons/alert-triangle";
import Loader2 from "lucide-solid/icons/loader-2";
import { Match, Switch } from "solid-js";
import { toast } from "solid-sonner";
import { sleep } from "../../utils";

export const Dangerzone = () => {
  const disableUserAction = useAction(disable);
  const isDisablingUser = useSubmission(disable);

  return (
    <div class="flex flex-col items-start gap-8 w-full">
      <div class="flex flex-col items-start gap-2 w-full">
        <span class="text-lg font-semibold">Dangerzone</span>
        <span class="text-sm text-muted-foreground">Please be causious what you click on!</span>
      </div>
      <div class="gap-4 w-full flex flex-col">
        <div class="flex flex-col gap-4 w-full">
          <span class="text-lg font-semibold">Disable Account</span>
          <div class="bg-red-100 dark:bg-red-900/50 w-full p-4 rounded-md border border-red-300 dark:border-red-700 flex flex-col gap-4">
            <div class="flex flex-row gap-4">
              <AlertTriangleIcon class="size-4" />
              <div class="flex flex-col gap-4 py-1">
                <span class="text-red-500 dark:text-white text-sm">We understand. </span>
                <span class="text-red-500 dark:text-white text-sm">
                  You can disable your account and come back later if you change your mind. We appreciate you giving Zom
                  Portal a try.
                </span>
              </div>
            </div>
            <div class="flex flex-row gap-2 w-full items-center justify-between">
              <div class="flex flex-row gap-2 w-full" />
              <div class="w-max">
                <AlertDialog>
                  <AlertDialogTrigger
                    as={Button}
                    variant="destructive"
                    size="sm"
                    type="submit"
                    class="w-max"
                    disabled={isDisablingUser.pending}
                  >
                    <Switch fallback={<span>Disable Account</span>}>
                      <Match when={isDisablingUser.pending}>
                        <span>Disabling Account</span>
                        <Loader2 class="size-4 animate-spin" />
                      </Match>
                    </Switch>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you really sure, you want to disable your account?
                    </AlertDialogDescription>
                    <AlertDialogClose>Cancel</AlertDialogClose>
                    <AlertDialogAction
                      as={Button}
                      variant="destructive"
                      onClick={() => {
                        toast.promise(
                          Promise.all([disableUserAction, sleep(150), revalidate([getAuthenticatedUser.key])]),
                          {
                            loading: "Hold on a second, we're disabling your account",
                            icon: <Loader2 class="size-4 animate-spin" />,
                            error: "There was an error disabling your Account",
                            success: "Account has been disabled, redirecting to home page!",
                          },
                        );
                      }}
                    >
                      Continue
                    </AlertDialogAction>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

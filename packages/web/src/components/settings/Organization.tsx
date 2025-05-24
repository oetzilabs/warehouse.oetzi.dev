import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getAuthenticatedUser } from "@/lib/api/auth";
import { deleteOrganization, disconnectFromOrganization, setCurrentOrganization } from "@/lib/api/organizations";
import { A, createAsync, revalidate, useAction, useSubmission } from "@solidjs/router";
import dayjs from "dayjs";
import Loader2 from "lucide-solid/icons/loader-2";
import Plus from "lucide-solid/icons/plus";
import Trash from "lucide-solid/icons/trash";
import { For, Show, Suspense } from "solid-js";
import { toast } from "solid-sonner";
import { cn } from "../../lib/utils";
import { sleep } from "../../utils";
import { NotLoggedIn } from "../NotLoggedIn";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";

export const Organizations = () => {
  const user = createAsync(() => getAuthenticatedUser());

  const disconnectOrganization = useAction(disconnectFromOrganization);
  const isDisconnectingFromOrganization = useSubmission(disconnectFromOrganization);
  const setCurrentOrg = useAction(setCurrentOrganization);
  const isSettingCurrentOrganization = useSubmission(setCurrentOrganization);
  const isDeletingOrganization = useSubmission(deleteOrganization);

  const removeOrganization = useAction(deleteOrganization);

  return (
    <Show when={user()} fallback={<NotLoggedIn />}>
      {(u) => (
        <div class="flex flex-col items-start gap-8 w-full">
          <div class="flex flex-col items-start gap-4 w-full">
            <div class="flex flex-row items-center justify-between w-full gap-2">
              <div class="w-full">
                <span class="text-lg font-semibold">Organizations</span>
              </div>
              <div class="w-max">
                <A
                  href="/organizations/new"
                  class={cn(
                    buttonVariants({
                      variant: "default",
                      size: "sm",
                    }),
                    "w-max gap-2 items-center",
                  )}
                >
                  <Plus class="size-4" />
                  Create Organization
                </A>
              </div>
            </div>
            <span class="text-sm text-muted-foreground">Manage your organizations</span>
          </div>
          <div class="gap-4 w-full flex flex-col">
            <Suspense fallback={<For each={[0, 1]}>{() => <Skeleton class="w-full h-48" />}</For>}>
              <For
                each={u().organizations.map((entity) => entity.org)}
                fallback={
                  <Alert class="flex flex-col items-start gap-2 w-full bg-muted">
                    <span class="text-lg font-semibold">No organizations</span>
                    <span class="text-sm text-muted-foreground">Create a new Organization</span>
                    <A
                      class={cn(
                        buttonVariants({
                          variant: "default",
                          size: "sm",
                        }),
                        "w-max",
                      )}
                      href="/setup/organization"
                    >
                      <span>Create Organization</span>
                    </A>
                  </Alert>
                }
              >
                {(organization) => {
                  return (
                    <div class="rounded-md border border-neutral-200 dark:border-neutral-800 p-0 flex flex-col w-full">
                      <div class="flex flex-row items-center gap-2 w-full">
                        <div class="w-full flex flex-row gap-2 items-start justify-between p-2">
                          <div class="w-full flex flex-col items-start justify-start">
                            <span class="font-bold text-sm">{organization.name}</span>
                            <span class="text-xs">Created {dayjs(organization.createdAt).fromNow()}</span>
                          </div>
                          <div class="w-max flex flex-row gap-2 items-start justify-end">
                            <Show when={organization.owner && organization.owner.id === user()?.id}>
                              <Badge class="text-xs px-3 py-1.5" variant="secondary">
                                Owner
                              </Badge>
                            </Show>
                            <Show when={organization.id === u().currenOrganizationId}>
                              <Badge class="text-xs px-3 py-1.5" variant="outline">
                                Current
                              </Badge>
                            </Show>
                          </div>
                        </div>
                      </div>
                      <div class="w-full border-y border-neutral-200 dark:border-neutral-800 p-2 flex flex-col gap-4 text-sm min-h-36">
                        <div class="w-full flex flex-col items-start gap-2 p-2">
                          <span class="text-sm font-semibold">Users</span>
                          <div class="w-full grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-2 p-2">
                            <For each={organization.users.map((u) => u.user)}>
                              {(user) => (
                                <div class="flex flex-col items-start gap-2 w-full border border-neutral-200 dark:border-neutral-800 p-2 rounded-md ">
                                  <div class="w-full flex flex-col gap-2 items-start">
                                    <span class="font-medium text-sm">{user.name}</span>
                                    <span class="text-xs">{dayjs(user.createdAt).fromNow()}</span>
                                  </div>
                                </div>
                              )}
                            </For>
                          </div>
                        </div>
                      </div>
                      <div class="w-full flex items-center justify-between gap-2 p-2">
                        <div class="w-full" />
                        <div class="w-max flex items-center justify-end gap-2">
                          <A
                            class={cn(
                              buttonVariants({
                                variant: "outline",
                                size: "sm",
                              }),
                              "w-max",
                            )}
                            href={`/dashboard/o/${organization.id}`}
                          >
                            <span>Manage</span>
                          </A>
                          <div class="flex flex-col gap-2 items-end w-full py-0">
                            <Button
                              variant="secondary"
                              size="sm"
                              type="submit"
                              class="w-max"
                              aria-label="Connect to Organization"
                              disabled={
                                isSettingCurrentOrganization.pending || organization.id === u().current_organization_id
                              }
                              onClick={() => {
                                toast.promise(
                                  Promise.all([
                                    setCurrentOrg(organization.id),
                                    sleep(150),
                                    revalidate(getAuthenticatedUser.key),
                                  ]),
                                  {
                                    loading: "Connecting to organization...",
                                    success: "Connected to organization",
                                    error: "Error connecting to organization",
                                  },
                                );
                              }}
                            >
                              <span>Connect</span>
                            </Button>
                          </div>
                          <div class="flex flex-col gap-2 items-end w-full py-0">
                            <input type="hidden" name="organizationId" value={organization.id} />
                            <Button
                              variant="secondary"
                              size="sm"
                              type="submit"
                              class="w-max"
                              aria-label="Disconnect from organization"
                              disabled={isDisconnectingFromOrganization.pending || u().organizations.length === 1}
                              onClick={() => {
                                toast.promise(
                                  Promise.all([
                                    disconnectOrganization(organization.id),
                                    sleep(150),
                                    revalidate(getAuthenticatedUser.key),
                                  ]),
                                  {
                                    loading: "Disconnecting from organization...",
                                    success: "Disconnected from organization",
                                    error: "Error disconnecting from organization",
                                  },
                                );
                              }}
                            >
                              <span>Disconnect</span>
                            </Button>
                          </div>
                          <AlertDialog>
                            <AlertDialogTrigger
                              as={Button}
                              variant="destructive"
                              size="sm"
                              disabled={isDeletingOrganization.pending}
                            >
                              <Trash class="w-4 h-4" />
                              Delete
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you really sure, you want to delete this organization?
                              </AlertDialogDescription>
                              <AlertDialogClose>Cancel</AlertDialogClose>
                              <AlertDialogAction
                                as={Button}
                                variant="destructive"
                                onClick={() => {
                                  toast.promise(
                                    Promise.all([
                                      removeOrganization(organization.id),
                                      sleep(150),
                                      revalidate(getAuthenticatedUser.key),
                                    ]),
                                    {
                                      loading: "Hold on a second, we're deleting the organization",
                                      icon: <Loader2 class="size-4 animate-spin" />,
                                      error: "There was an error deleting the organization",
                                      success: "Organization has been deleted, redirecting to home page!",
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
                  );
                }}
              </For>
            </Suspense>
          </div>
        </div>
      )}
    </Show>
  );
};

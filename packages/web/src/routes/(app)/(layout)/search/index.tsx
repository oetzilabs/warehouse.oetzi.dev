import { useTranslation } from "@/components/providers/TranslationProvider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RadioGroup, RadioGroupItem, RadioGroupItemLabel } from "@/components/ui/radio-group";
import { TextField, TextFieldInput, TextFieldLabel } from "@/components/ui/text-field";
import { appSearch } from "@/lib/api/application";
import { getAuthenticatedSession } from "@/lib/api/auth";
import { getLocale } from "@/lib/api/locale";
import { filters, popularities, type SearchFilter } from "@/lib/api/search";
import { debounce, leadingAndTrailing } from "@solid-primitives/scheduled";
import { A, createAsync, revalidate, RouteDefinition, RouteLoadFuncArgs, useSearchParams } from "@solidjs/router";
import ArrowRight from "lucide-solid/icons/arrow-right";
import BadgeCheck from "lucide-solid/icons/badge-check";
import Filter from "lucide-solid/icons/filter";
import Loader2 from "lucide-solid/icons/loader-2";
import MailPlus from "lucide-solid/icons/mail-plus";
import RotateCcw from "lucide-solid/icons/rotate-ccw";
import Search from "lucide-solid/icons/search";
import Verified from "lucide-solid/icons/verified";
import X from "lucide-solid/icons/x";
import { createSignal, For, onMount, Show, Suspense } from "solid-js";
import { toast } from "solid-sonner";
import { z } from "zod";

export const route = {
  preload: async (props) => {
    const session = await getAuthenticatedSession();
    await getLocale();
    const s = new URLSearchParams(props.location.search);
    const search = await appSearch(s.get("search") ?? "", {
      type: (s.get("type") as SearchFilter["type"] | undefined) ?? "all",
      sort: (s.get("sort") as SearchFilter["sort"] | undefined) ?? "createdAt",
      order: (s.get("order") as SearchFilter["order"] | undefined) ?? "desc",
      selection: (s.get("selection") as SearchFilter["selection"] | undefined) ?? "unset",
    });
    return { search, session };
  },
} satisfies RouteDefinition;

export default function SearchPage(p: any) {
  const { t } = useTranslation();
  const [pathSearchParams, setSearchParams] = useSearchParams();

  const parsedSearch = z
    .object({
      type: z.enum(["all", "offers", "service", "organization", "location"]).optional().default("all"),
      sort: z.enum(["createdAt", "updatedAt"]).optional().default("createdAt"),
      order: z.enum(["desc", "asc"]).optional().default("desc"),
      search: z.string().default(""),
      selection: z.enum(["popular", "recommended", "unset"]).optional().default("unset"),
    })
    .parse(Object.fromEntries(new URLSearchParams(p.location.search).entries()));

  const [search, setSearch] = createSignal(
    Object.fromEntries(new URLSearchParams(p.location.search).entries()).search ?? "",
  );
  const [appSearchSearch, setAppSearchSearch] = createSignal(
    Object.fromEntries(new URLSearchParams(p.location.search).entries()).search ?? "",
  );
  const debouncedSearch = leadingAndTrailing(
    debounce,
    (v: string) => {
      setSearch(v);
      setSearchParams({ ...pathSearchParams, search: v });
    },
    300,
  );

  const [filter, setFilter] = createSignal<SearchFilter>(parsedSearch);
  const results = createAsync(() => appSearch(search(), filter()));

  // onMount(() => {
  //   const s = pathSearchParams.search;
  //   if (s) {
  //     setSearch(s);
  //     setAppSearchSearch(s);
  //   }
  // });

  return (
    <div class="flex flex-col w-full h-[calc(100dvh-49px)] bg-white dark:bg-black border-t border-neutral-200 dark:border-neutral-800">
      <div class="flex flex-row w-full h-max items-start justify-start">
        <div class="w-[250px] hidden md:flex flex-row items-center border-b border-neutral-200 dark:border-neutral-800 justify-start h-10">
          <div class="pl-2"></div>
        </div>
        <div class=" flex flex-row items-start w-full border-b border-l border-neutral-200 dark:border-neutral-800 h-10">
          <TextField
            class="w-full rounded-none px-4 h-10"
            value={appSearchSearch()}
            onChange={(value) => {
              setAppSearchSearch(value);
              debouncedSearch(value);
            }}
          >
            <TextFieldLabel class="flex flex-row items-center justify-start gap-2 w-full">
              <Search class="size-4 text-muted-foreground" />
              <TextFieldInput
                placeholder="Search"
                class="w-fit h-10 min-w-max text-sm px-0 !py-0 rounded-none focus-visible:ring-0 focus-visible:outline-none border-none shadow-none flex-1 !mt-0"
                type="text"
              />
            </TextFieldLabel>
          </TextField>
          <div class="hidden md:flex flex-row gap-2 items-center justify-end w-max pr-2 h-full">
            <div class="flex flex-row gap-2 items-center justify-end w-full">
              <Button
                size="icon"
                variant="outline"
                class="size-7"
                disabled={!search()}
                onClick={() => {
                  if (!search()) return;
                  toast.promise(revalidate(appSearch.keyFor(search(), filter())), {
                    loading: `Searching for ${search()}`,
                    success: `Search for ${search()} successful`,
                    error: `Search for ${search()} failed`,
                  });
                }}
              >
                <RotateCcw class="size-4" />
              </Button>
            </div>
          </div>
          <div class="flex md:hidden w-max flex-row items-center justify-end gap-2 pr-2">
            <div class="flex flex-row gap-2 items-center justify-end w-full">
              <DropdownMenu>
                <DropdownMenuTrigger class="size-6 text-muted-foreground">
                  <Filter class="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent class="w-max">
                  <For each={Object.keys(filters)}>
                    {(type) => (
                      <DropdownMenuCheckboxItem
                        checked={filter().type === type}
                        onChange={() => {
                          setFilter({
                            ...filter(),
                            type: type as SearchFilter["type"],
                          });
                          setSearchParams({
                            type,
                          });
                        }}
                        class="capitalize"
                      >
                        {type}
                      </DropdownMenuCheckboxItem>
                    )}
                  </For>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    class="capitalize"
                    onSelect={() => {
                      setFilter({
                        ...filter(),
                        type: "all",
                        selection: "unset",
                      });
                      setSearchParams(
                        // set all keys to undefined
                        {
                          ...Object.entries(pathSearchParams).reduce((acc, [key, value]) => {
                            acc[key] = undefined;
                            return acc;
                          }, {} as any),
                          search: appSearchSearch(),
                        },
                      );
                    }}
                  >
                    <X class="size-4" />
                    clear
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
        <div class="flex flex-col border-l border-neutral-200 dark:border-neutral-800 h-full w-[450px]"></div>
      </div>
      <div class="flex flex-row w-full h-full items-start justify-start">
        <div class="w-[250px] hidden md:flex flex-col gap-4 items-start justify-start py-4 h-full">
          <div class="w-full flex flex-col gap-2 items-start justify-start border-b border-neutral-200 dark:border-neutral-800 px-4 pb-4">
            <div class="flex flex-row gap-2 items-center justify-between w-full">
              <span class="font-bold w-full">Filters</span>
              <div class="flex flex-row gap-2 items-center justify-start w-max">
                <Button
                  size="icon"
                  variant="secondary"
                  class="size-6"
                  onClick={() => {
                    setFilter({
                      ...filter(),
                      type: "all",
                    });
                    setSearchParams(
                      // set all keys to undefined
                      {
                        ...Object.entries(pathSearchParams).reduce((acc, [key, value]) => {
                          acc[key] = undefined;
                          return acc;
                        }, {} as any),
                        search: appSearchSearch(),
                      },
                    );
                  }}
                >
                  <X class="size-3" />
                </Button>
              </div>
            </div>
            <RadioGroup
              class="bg-transparent dark:bg-transparent"
              value={filter().type}
              onChange={(v) => {
                if (!v) return;
                setFilter({
                  ...filter(),
                  type: v as SearchFilter["type"],
                });
                setSearchParams({ ...pathSearchParams, type: v });
              }}
            >
              <For each={Object.keys(filters)}>
                {(type) => (
                  <RadioGroupItem
                    value={type}
                    aria-label={`Select ${filters[type as keyof typeof filters].label}`}
                    class="text-xs py-1 h-max"
                  >
                    <RadioGroupItemLabel>{filters[type as keyof typeof filters].label}</RadioGroupItemLabel>
                  </RadioGroupItem>
                )}
              </For>
            </RadioGroup>
          </div>
          <div class="w-full flex flex-col gap-2 items-start justify-start px-4 pb-4">
            <div class="flex flex-row gap-2 items-center justify-between w-full ">
              <span class="font-bold w-full">Popularity</span>
              <div class="flex flex-row gap-2 items-center justify-start w-max ">
                <Button
                  size="icon"
                  variant="secondary"
                  class="size-6"
                  onClick={() => {
                    setFilter({
                      ...filter(),
                      selection: "unset",
                    });
                    setSearchParams(
                      // set all keys to undefined
                      {
                        ...Object.entries(pathSearchParams).reduce((acc, [key, value]) => {
                          acc[key] = undefined;
                          return acc;
                        }, {} as any),
                        search: appSearchSearch(),
                      },
                    );
                  }}
                >
                  <X class="size-3" />
                </Button>
              </div>
            </div>
            <RadioGroup
              class="bg-transparent dark:bg-transparent"
              value={filter().selection}
              onChange={(v) => {
                if (!v) return;
                setFilter({
                  ...filter(),
                  selection: v as SearchFilter["selection"],
                });
                setSearchParams({ ...pathSearchParams, selection: v });
              }}
            >
              <For each={Object.keys(popularities)}>
                {(type) => (
                  <RadioGroupItem
                    value={type}
                    aria-label={`Select ${popularities[type as keyof typeof popularities].label}`}
                    class="text-xs py-1 h-max"
                  >
                    <RadioGroupItemLabel>{popularities[type as keyof typeof popularities].label}</RadioGroupItemLabel>
                  </RadioGroupItem>
                )}
              </For>
            </RadioGroup>
          </div>
        </div>
        <div class="flex flex-col border-l border-neutral-200 dark:border-neutral-800 h-full w-full">
          <div class="flex flex-col w-full h-full items-start overflow-y-auto">
            <Suspense
              fallback={
                <div class="flex flex-col items-center justify-center w-full h-full p-10">
                  <Loader2 class="size-4 animate-spin" />
                </div>
              }
            >
              <Show when={results()}>
                {(rs) => (
                  <For
                    each={rs()}
                    fallback={
                      <div class="flex flex-col gap-2 items-center justify-center w-full bg-neutral-100 dark:bg-neutral-900 h-full text-sm text-center p-10">
                        There is currently no service or organization.
                      </div>
                    }
                  >
                    {(r) => (
                      <div class="flex flex-col items-center justify-center w-full transition-shadow overflow-clip border-b border-neutral-200 dark:border-neutral-800">
                        <div class="flex flex-col gap-4 items-center justify-center w-full">
                          <div class="flex flex-col gap-2 items-start justify-start w-full p-4 ">
                            <div class="flex flex-row gap-1 items-center justify-start w-full">
                              <div class="flex flex-col gap-1 items-start justify-start w-full pb-2">
                                <div class="flex flex-row gap-1 items-center justify-between w-full">
                                  <A
                                    href={`/${r.type}/${r.slug}/`}
                                    class="text-sm font-bold hover:underline hover:underline-offset-2 w-max"
                                  >
                                    {r.name}
                                  </A>
                                  <div class="flex flex-row gap-2 items-center justify-end w-full">
                                    <span class="text-xs font-medium text-muted-foreground bg-muted-foreground/5 p-1 px-2.5 rounded-full border border-neutral-200 dark:border-neutral-800 select-none">
                                      {r.type === "organization" ? "company" : r.type}
                                    </span>
                                    <Show
                                      when={
                                        (r.type === "organization" && r.verified) ||
                                        (r.type === "service" && r.organization?.verified)
                                      }
                                    >
                                      <div class="flex flex-row gap-1.5 text-xs font-bold text-emerald-500 bg-emerald-100 p-1 pl-1.5 pr-2.5 rounded-full border border-emerald-300 dark:border-emerald-700 select-none">
                                        <Verified class="size-4" />
                                        Verified
                                      </div>
                                    </Show>
                                    <Show
                                      when={
                                        (r.type === "organization" && r.authorized) ||
                                        (r.type === "service" && r.organization?.authorized)
                                      }
                                    >
                                      <div class="flex flex-row gap-1.5 text-xs font-bold text-emerald-500 bg-emerald-100 p-1 pl-1.5 pr-2.5 rounded-full border border-emerald-300 dark:border-emerald-700 select-none">
                                        <BadgeCheck class="size-4" />
                                        Authorized
                                      </div>
                                    </Show>
                                  </div>
                                </div>
                                <div class="flex flex-row gap-1 items-center justify-start w-full">
                                  <span class="text-xs text-muted-foreground">
                                    {r.description ?? "No description provided"}
                                  </span>
                                </div>
                                <div class="flex flex-row gap-1 items-center justify-start w-full">
                                  <span class="text-xs text-muted-foreground">
                                    {r.location ?? "No location provided"}
                                  </span>
                                </div>
                                <Show when={r.type === "organization" && r.services}>
                                  {(s) => (
                                    <div class="flex flex-row gap-1 items-center justify-start w-full">
                                      <span class="text-xs text-muted-foreground">{s().length} services</span>
                                    </div>
                                  )}
                                </Show>
                              </div>
                            </div>
                            <div class="flex flex-row gap-2 items-center justify-end w-full">
                              <Button
                                size="sm"
                                as={A}
                                variant="outline"
                                href={`/messages?new=${r.type === "organization" ? r.id : (r.organization?.id ?? "")}`}
                                class="w-max flex flex-row gap-2"
                              >
                                <MailPlus class="size-4" />
                                Send a message
                              </Button>
                              <Button as={A} href={`/${r.type}/${r.slug}/`} size="sm" class="w-max flex flex-row gap-2">
                                View
                                <ArrowRight class="size-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </For>
                )}
              </Show>
            </Suspense>
          </div>
          <div class="flex flex-row gap-4 items-center w-full justify-between border-t border-neutral-200 dark:border-neutral-800 p-2 pl-4 text-sm">
            <div class="w-full flex items-center justify-start">Can't find your service or organization?</div>
            <div class="w-max flex items-center justify-center">
              <Button
                as={A}
                href={import.meta.env.VITE_PORTAL_URL}
                size="sm"
                class="text-xs font-semibold px-4 py-1 w-max"
              >
                Click here to add yours
              </Button>
            </div>
          </div>
        </div>
        <div class="flex flex-col border-l border-neutral-200 dark:border-neutral-800 h-full w-[450px]"></div>
      </div>
    </div>
  );
}

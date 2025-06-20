import { Button } from "@/components/ui/button";
import { getCashRegisterSessions } from "@/lib/api/pos";
import { cn } from "@/lib/utils";
import { A, createAsync, useParams } from "@solidjs/router";
import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
import isoWeek from "dayjs/plugin/isoWeek";
import localizedTime from "dayjs/plugin/localizedFormat";
import relativeTime from "dayjs/plugin/relativeTime";
import ArrowLeft from "lucide-solid/icons/arrow-left";
import ArrowRight from "lucide-solid/icons/arrow-right";
import CalendarIcon from "lucide-solid/icons/calendar";
import { createSignal, For, JSXElement, Show, Suspense } from "solid-js";

dayjs.extend(relativeTime);
dayjs.extend(advancedFormat);
dayjs.extend(localizedTime);
dayjs.extend(isoWeek);

export default function PosLayout(props: { children: JSXElement }) {
  const params = useParams();
  const [weeksBack, setWeeksBack] = createSignal(0);

  const sessions = createAsync(() => getCashRegisterSessions(params.sid, weeksBack()), {
    deferStream: true,
  });

  const calculateWeeksBackFromSessionList = <T extends { createdAt: Date }>(sessions: T[], wb: number = 0) => {
    if (!sessions.length) {
      return wb;
    }
    const sorted = sessions.toSorted((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    const currentWeek = dayjs().isoWeek();
    const startWeek = dayjs(sorted[0].createdAt).isoWeek();
    if (currentWeek === startWeek) {
      return 0;
    }
    return currentWeek - startWeek;
  };
  return (
    <div class="w-full flex flex-col gap-0 h-full">
      <div class="flex flex-row w-full h-full p-4 gap-4">
        <Suspense
          fallback={
            <div class="w-1/3 h-full flex flex-col overflow-auto">
              <div class="h-full flex flex-col rounded-lg border"></div>
            </div>
          }
        >
          <Show when={sessions()}>
            {(sess) => (
              <div class="w-1/3 h-full flex flex-col overflow-auto">
                <div class="h-full flex flex-col rounded-lg border">
                  <div class="flex flex-row gap-4 w-full h-max p-4 border-b items-center justify-between">
                    <div class="w-max items-center gap-2 justify-center flex">
                      <Button
                        as={A}
                        size="sm"
                        variant={calculateWeeksBackFromSessionList(sess(), weeksBack()) === 0 ? "default" : "secondary"}
                        href="/pos"
                      >
                        Today
                      </Button>
                      <Button size="icon" variant="outline" disabled={params.sid !== undefined}>
                        <CalendarIcon class="size-4" />
                      </Button>
                    </div>
                    <div class="flex flex-row gap-2 items-center">
                      <span class="text-sm font-semibold">Week</span>
                      <span class="text-sm font-semibold">
                        {dayjs()
                          .subtract(calculateWeeksBackFromSessionList(sess(), weeksBack()), "week")
                          .startOf("week")
                          .format("WW")}
                      </span>
                      <span class="text-sm font-semibold">-</span>
                      <span class="text-sm font-semibold">
                        {dayjs()
                          .subtract(calculateWeeksBackFromSessionList(sess(), weeksBack()), "week")
                          .endOf("week")
                          .format("WW")}
                      </span>
                    </div>
                    <div class="flex flex-row items-center justify-end gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => setWeeksBack((w) => w + 1)}
                        disabled={params.sid !== undefined}
                      >
                        <ArrowLeft class="size-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => setWeeksBack((w) => Math.max(w - 1, 0))}
                        disabled={
                          calculateWeeksBackFromSessionList(sess(), weeksBack()) === 0 || params.sid !== undefined
                        }
                      >
                        <ArrowRight class="size-4" />
                      </Button>
                    </div>
                  </div>
                  <div class="flex flex-col gap-4 w-full h-full">
                    <div class="flex flex-col gap-4 w-full h-full">
                      <For
                        each={sessions()}
                        fallback={
                          <div class="flex flex-col gap-4 w-full h-full text-center grow items-center justify-center bg-muted-foreground/10 dark:bg-muted/30">
                            <span class="text-sm text-muted-foreground">No sessions found</span>
                          </div>
                        }
                      >
                        {(session) => (
                          <A
                            class={cn("flex flex-col gap-4 w-full h-max border-b", {
                              "bg-muted-foreground/10 dark:bg-muted/30": session.id === params.sid,
                              "hover:bg-muted-foreground/5 dark:hover:bg-muted/15": session.id !== params.sid,
                            })}
                            href={`/pos/${session.id}`}
                          >
                            <div class="flex flex-col gap-2 w-full h-max">
                              <div class="flex flex-row gap-2 w-full h-max text-sm items-center justify-between">
                                <div class="p-4 w-full flex flex-col gap-1">
                                  <span>{dayjs(session.createdAt).fromNow()}</span>
                                  <span>{dayjs(session.createdAt).format("LLL")}</span>
                                </div>
                                <div class="p-4 w-max flex flex-col gap-1 justify-center items-end text-right">
                                  <span class="text-right w-max">{session.items.length} Items</span>
                                  <span class="text-right w-max">{session.customer?.name}</span>
                                </div>
                              </div>
                            </div>
                          </A>
                        )}
                      </For>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Show>
        </Suspense>
        <Suspense
          fallback={
            <div class="flex flex-col grow w-full h-full">
              <div class="flex flex-row w-full h-full gap-4">
                <div class="flex flex-col w-1/2 grow gap-4 select-none touch-none"></div>
                <div class="flex flex-col w-1/2 grow gap-4"></div>
              </div>
            </div>
          }
        >
          {props.children}
        </Suspense>
      </div>
    </div>
  );
}

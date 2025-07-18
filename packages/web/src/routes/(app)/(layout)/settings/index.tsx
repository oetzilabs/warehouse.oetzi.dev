import { useDashboardFeatures } from "@/components/providers/Dashboard";
import { Switch, SwitchControl, SwitchThumb } from "@/components/ui/switch";
import { For } from "solid-js";

export default function SettingsPage() {
  return (
    <div class="flex flex-col h-full grow p-4">
      <div class="flex flex-col w-full h-full grow">
        <DashboardFeatures />
      </div>
    </div>
  );
}

const DashboardFeatures = () => {
  const { dashboardFeatures, setDashboardFeatures } = useDashboardFeatures();
  return (
    <div class="w-full flex flex-col gap-4">
      <h2 class="font-semibold text-neutral-900 dark:text-neutral-100">Dashboard Features</h2>
      <div class="flex flex-col w-full h-full border rounded-lg grow">
        <For each={Object.entries(dashboardFeatures).map(([key, value]) => ({ key, value }))}>
          {(entry) => (
            <div class="flex flex-row items-center justify-between p-4 bg-muted-foreground/5 dark:bg-muted/30 border-b last:border-b-0  transition-colors">
              <div class="flex flex-col gap-1">
                <h3 class="font-semibold text-neutral-900 dark:text-neutral-100">{entry.value.label}</h3>
                <span class="text-sm text-muted-foreground dark:text-primary-foreground">
                  {entry.value.description}
                </span>
              </div>
              <div class="flex flex-row gap-2 items-center justify-center">
                <Switch
                  defaultChecked={entry.value.enabled}
                  onChange={(checked) => {
                    setDashboardFeatures(entry.key, "enabled", checked);
                  }}
                >
                  <SwitchControl>
                    <SwitchThumb />
                  </SwitchControl>
                </Switch>
              </div>
            </div>
          )}
        </For>
      </div>
    </div>
  );
};

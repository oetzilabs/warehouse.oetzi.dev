import { cookieStorage, makePersisted } from "@solid-primitives/storage";
import { createContext, JSXElement, useContext } from "solid-js";
import { createStore, SetStoreFunction } from "solid-js/store";

const DEFAULT_DASHBOARD_FEATURES = {
  mostPopularProducts: {
    enabled: true,
    label: "Most Popular Products",
    description: "Shows the most popular products on the dashboard",
  },
  lastSoldProducts: {
    enabled: true,
    label: "Last Sold Products",
    description: "Shows the last sold products on the dashboard",
  },
};

type DashboardFeaturesT = Record<string, { enabled: boolean; label: string; description: string }>;

export const DashboardContext = createContext<{
  dashboardFeatures: DashboardFeaturesT;
  setDashboardFeatures: SetStoreFunction<DashboardFeaturesT>;
}>({
  dashboardFeatures: DEFAULT_DASHBOARD_FEATURES,
  setDashboardFeatures: () => {},
});

export const useDashboardFeatures = () => {
  const ctx = useContext(DashboardContext);
  if (!ctx) {
    throw new Error("DashboardContext not found");
  }
  return ctx;
};

export const DashboardProvider = (props: { children: JSXElement }) => {
  const [dashboardFeatures, setDashboardFeatures] = makePersisted(
    createStore<Record<string, { enabled: boolean; label: string; description: string }>>(DEFAULT_DASHBOARD_FEATURES),
    {
      name: "show-dashboard-features",
      storage: cookieStorage,
    },
  );
  return (
    <DashboardContext.Provider value={{ dashboardFeatures, setDashboardFeatures }}>
      {props.children}
    </DashboardContext.Provider>
  );
};

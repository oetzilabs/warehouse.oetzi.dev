import { Accessor, createContext, createSignal, JSXElement, Setter, Show, useContext } from "solid-js";

type OnboardingDialogProps = {
  step: [number, number] | JSXElement;
  right: JSXElement;
  left: JSXElement;
};

type OnboardingContextType = {
  step: Accessor<[number, number] | JSXElement>;
  right: Accessor<JSXElement>;
  setRight: Setter<JSXElement>;
  left: Accessor<JSXElement>;
  setLeft: Setter<JSXElement>;
};

const OnboardingContext = createContext<OnboardingContextType>();

export const useOnboardingContext = () => {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error("useOnboardingContext must be used within a OnboardingDialog");
  }
  return ctx;
};

export default function OnboardingDialog(props: OnboardingDialogProps) {
  const [step, setStep] = createSignal<[number, number] | JSXElement>(props.step);

  const [left, setLeft] = createSignal<JSXElement>(props.left);

  const [right, setRight] = createSignal<JSXElement>(props.right);

  return (
    <OnboardingContext.Provider value={{ step, right, left, setRight, setLeft }}>
      <div class="w-full h-full flex items-center justify-center grow">
        <div class="w-full max-w-6xl md:min-h-[450px] md:h-max h-full border-0 md:border rounded-none md:rounded-lg md:shadow-2xl shadow-none overflow-clip grow">
          <div class="grid grid-cols-1 md:grid-cols-2 w-full h-full">
            <div class="flex p-6 w-full flex-col gap-1 h-full grow">
              <div class="w-full flex flex-row items-center justify-between">
                <span class="text-xl font-medium w-max">Welcome to WareHouse.</span>
                <Show when={Array.isArray(step()) && (step() as [number, number])} fallback={step()}>
                  {(s) => (
                    <span class="text-xs font-medium w-max">
                      {s()[0]}/{s()[1]}
                    </span>
                  )}
                </Show>
              </div>
              <div class="w-full flex flex-col gap-4">
                <span class="text-sm font-medium text-muted-foreground">Onboarding</span>
              </div>
              <div class="w-full flex flex-col gap-4 grow">{left()}</div>
            </div>
            <div class="hidden md:flex w-full bg-muted h-full overflow-clip">{right()}</div>
          </div>
        </div>
      </div>
    </OnboardingContext.Provider>
  );
}

import { JSXElement, Show } from "solid-js";

type OnboardingDialogProps = {
  description: string;
  image: string;
  form: JSXElement;
  step: number;
  amountOfSteps: number;
  banner?: JSXElement;
};

export default function OnboardingDialog(props: OnboardingDialogProps) {
  return (
    <div class="w-full h-full flex items-center justify-center grow">
      <div class="w-full max-w-6xl md:min-h-[450px] md:h-max h-full border-0 md:border rounded-none md:rounded-lg md:shadow-2xl shadow-none overflow-clip">
        <div class="grid grid-cols-1 md:grid-cols-2 w-full h-full">
          <div class="flex p-6 w-full flex-col gap-1 h-full">
            <div class="w-full flex flex-row items-center justify-between">
              <span class="text-xl font-medium w-max">Welcome to WareHouse.</span>
              <Show
                when={props.step === -1}
                fallback={
                  <span class="text-sm font-medium w-max text-muted-foreground/50">
                    {props.step}/{props.amountOfSteps}
                  </span>
                }
              >
                <div class="size-[6px] bg-muted-foreground/50 rounded-full" />
              </Show>
            </div>
            <div class="w-full flex flex-col gap-4">
              <span class="text-sm font-medium text-muted-foreground">Onboarding</span>
            </div>
            {props.banner}
            <div class="w-full flex flex-col gap-4 grow">
              <div class="w-full flex flex-col gap-4 py-2">
                <span class="text-sm font-normal leading-tight opacity-80">{props.description}</span>
              </div>
              {props.form}
            </div>
          </div>
          <div class="hidden md:flex w-full bg-muted h-full overflow-clip">
            <img src={props.image} alt="placeholder" class="w-full h-full object-cover" />
          </div>
        </div>
      </div>
    </div>
  );
}

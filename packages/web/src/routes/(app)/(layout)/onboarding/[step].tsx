import { useParams } from "@solidjs/router";

export default function StepsPage() {
  const currentStep = useParams().step;
  const amountOfSteps = 1;

  return (
    <div class="w-full h-full flex items-center justify-center grow">
      <div class="w-full max-w-5xl h-1/2 border rounded-lg grid grid-cols-2">
        <div class="flex p-4 w-full flex-col gap-1">
          <div class="w-full flex flex-row items-center justify-between">
            <span class="text-xl font-medium w-max">Welcome to WareHouse.</span>
            <span class="text-sm font-medium w-max text-muted-foreground/50">
              {currentStep}/{amountOfSteps}
            </span>
          </div>
          <div class="w-full flex flex-col gap-4">
            <span class="text-sm font-medium text-muted-foreground">Onboarding</span>
          </div>
        </div>
        <div class="flex p-4 w-full bg-muted"></div>
      </div>
    </div>
  );
}

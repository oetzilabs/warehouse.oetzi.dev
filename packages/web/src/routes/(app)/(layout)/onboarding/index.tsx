import { Button } from "@/components/ui/button";
import { A } from "@solidjs/router";
import Play from "lucide-solid/icons/play";
import UploadFile from "lucide-solid/icons/upload";
import { JSXElement } from "solid-js";
import { toast } from "solid-sonner";

type Step = {
  title: string;
  description: string;
  content: JSXElement;
};

const OnboardingFormStep1 = () => {
  return (
    <form
      class="w-full flex flex-col gap-4 grow"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.target as HTMLFormElement);
      }}
    >
      <div class="w-full flex flex-col py-2">
        <span class="text-sm font-normal leading-tight opacity-80">
          In order to use WareHouse, you need to prepare some initial configurations, such as setting up your workspace,
          connecting your preferred storage provider, and defining the basic structure of your environment. This helps
          ensure everything runs smoothly and is tailored to your workflow. Once you're done, you'll be ready to start
          managing and deploying your resources efficiently.
        </span>
      </div>
      <div class="flex grow w-full" />
      <div class="w-full flex flex-row gap-2 items-center justify-end">
        <Button size="sm" type="submit" as={A} href="./1">
          Start
          <Play class="size-4" />
        </Button>
        <Button
          size="sm"
          type="button"
          variant="outline"
          onClick={() => {
            toast.info("Importing data is not yet supported");
          }}
        >
          Import
          <UploadFile class="size-4" />
        </Button>
      </div>
    </form>
  );
};

export default function OnboardingPage() {
  return (
    <div class="w-full h-full flex items-center justify-center grow">
      <div class="w-full max-w-5xl h-1/2 border rounded-lg grid grid-cols-2">
        <div class="flex p-4 w-full flex-col gap-1">
          <div class="w-full flex flex-row items-center justify-between">
            <span class="text-xl font-medium w-max">Welcome to WareHouse.</span>
            <span class="text-sm font-medium w-max text-muted-foreground/50">0/1</span>
          </div>
          <div class="w-full flex flex-col gap-4">
            <span class="text-sm font-medium text-muted-foreground">Onboarding</span>
          </div>
          <OnboardingFormStep1 />
        </div>
        <div class="flex p-4 w-full bg-muted"></div>
      </div>
    </div>
  );
}

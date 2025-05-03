import OnboardingDialog from "@/components/OnboardingDialog";
import { Button } from "@/components/ui/button";
import { A } from "@solidjs/router";
import Play from "lucide-solid/icons/play";
import UploadFile from "lucide-solid/icons/upload";
import { toast } from "solid-sonner";

export default function OnboardingPage() {
  return (
    <OnboardingDialog
      step={-1}
      amountOfSteps={2}
      description="In order to use WareHouse, you need to prepare some initial configurations, such as setting up your workspace, connecting your preferred storage provider, and defining the basic structure of your environment. This helps ensure everything runs smoothly and is tailored to your workflow. Once you're done, you'll be ready to start managing and deploying your resources efficiently."
      image="https://picsum.photos/seed/picsum/400/600?grayscale"
      form={
        <form
          class="w-full flex flex-col gap-4 grow"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.target as HTMLFormElement);
          }}
        >
          <div class="flex grow w-full" />
          <div class="w-full flex flex-row gap-2 items-center justify-end">
            <Button size="sm" type="submit" as={A} href="./step/company">
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
      }
    />
  );
}

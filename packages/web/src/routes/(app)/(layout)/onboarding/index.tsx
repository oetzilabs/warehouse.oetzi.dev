import { Button } from "@/components/ui/button";
import { A } from "@solidjs/router";
import Play from "lucide-solid/icons/play";
import UploadFile from "lucide-solid/icons/upload";
import { toast } from "solid-sonner";

export default function OnboardingPage() {
  return (
    <div class="w-full h-full flex items-center justify-center grow">
      <div class="w-full max-w-5xl md:h-[450px] h-full border-0 md:border rounded-none md:rounded-lg md:shadow-2xl shadow-none overflow-clip">
        <div class="grid grid-cols-1 md:grid-cols-2 w-full h-full">
          <div class="flex p-6 w-full flex-col gap-1">
            <div class="w-full flex flex-row items-center justify-between">
              <span class="text-xl font-medium w-max">Welcome to WareHouse.</span>
              <span class="size-[6px] bg-muted-foreground/50 rounded-full"></span>
            </div>
            <div class="w-full flex flex-col gap-4">
              <span class="text-sm font-medium text-muted-foreground">Onboarding</span>
            </div>
            <form
              class="w-full flex flex-col gap-4 grow"
              onSubmit={(event) => {
                event.preventDefault();
                const data = new FormData(event.target as HTMLFormElement);
              }}
            >
              <div class="w-full flex flex-col py-2">
                <span class="text-sm font-normal leading-tight opacity-80">
                  In order to use WareHouse, you need to prepare some initial configurations, such as setting up your
                  workspace, connecting your preferred storage provider, and defining the basic structure of your
                  environment. This helps ensure everything runs smoothly and is tailored to your workflow. Once you're
                  done, you'll be ready to start managing and deploying your resources efficiently.
                </span>
              </div>
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
          </div>
          <div class="hidden md:flex p-6 w-full bg-muted"></div>
        </div>
      </div>
    </div>
  );
}

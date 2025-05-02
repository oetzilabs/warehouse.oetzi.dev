import { Button } from "@/components/ui/button";
import { TextField, TextFieldInput, TextFieldLabel } from "@/components/ui/text-field";
import ChevronRight from "lucide-solid/icons/chevron-right";
import { createSignal } from "solid-js";

export default function CompanyStepPage() {
  const [companyName, setCompanyName] = createSignal("");
  return (
    <div class="w-full h-full flex items-center justify-center grow">
      <div class="w-full max-w-5xl md:h-[450px] h-full border-0 md:border rounded-none md:rounded-lg md:shadow-2xl shadow-none overflow-clip">
        <div class="grid grid-cols-1 md:grid-cols-2 w-full h-full">
          <div class="flex p-6 w-full flex-col gap-1">
            <div class="w-full flex flex-row items-center justify-between">
              <span class="text-xl font-medium w-max">Welcome to WareHouse.</span>
              <span class="text-sm font-medium w-max text-muted-foreground/50">1/2</span>
            </div>
            <div class="w-full flex flex-col gap-4">
              <span class="text-sm font-medium text-muted-foreground">Onboarding</span>
            </div>
            <div class="w-full flex flex-col gap-4 grow">
              <div class="w-full flex flex-col gap-4 py-2">
                <span class="text-sm font-normal leading-tight opacity-80">
                  Please enter the name of your company, which will be used to identify your workspace.
                </span>
              </div>
              <form
                class="w-full flex flex-col gap-4 grow"
                onSubmit={(event) => {
                  event.preventDefault();
                  const data = new FormData(event.target as HTMLFormElement);
                }}
              >
                <TextField name="companyName" value={companyName()} onChange={(value) => setCompanyName(value)}>
                  <TextFieldLabel>Company Name</TextFieldLabel>
                  <TextFieldInput placeholder="Warehouse 1" />
                </TextField>
                <div class="flex grow w-full" />
                <div class="w-full flex flex-row gap-2 items-center justify-end">
                  <Button size="sm" type="submit" disabled={!companyName()}>
                    Next
                    <ChevronRight class="size-4" />
                  </Button>
                </div>
              </form>
            </div>
          </div>
          <div class="hidden md:flex p-6 w-full bg-muted"></div>
        </div>
      </div>
    </div>
  );
}

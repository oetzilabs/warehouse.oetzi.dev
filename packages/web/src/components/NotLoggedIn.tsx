import { A } from "@solidjs/router";
import Fingerprint from "lucide-solid/icons/fingerprint";
import Home from "lucide-solid/icons/home";
import LogIn from "lucide-solid/icons/log-in";
import { Button } from "./ui/button";

export const NotLoggedIn = () => {
  return (
    <div class="flex flex-col gap-10 items-center justify-center p-10 border text-sm bg-muted/5 rounded-lg drop-shadow-md -mt-40">
      <Fingerprint class="size-10 text-muted-foreground/70 animate-pulse" />
      <div class="flex flex-col gap-4 items-center justify-center">
        <span>Seems like you are not logged in.</span>
        <div class="flex flex-row gap-2 items-center justify-center">
          <Button size="sm" as={A} href="/login">
            <LogIn class="size-4" />
            Go to Login
          </Button>
          <Button size="sm" as={A} href="/signup" variant="outline" class="">
            <Home class="size-4" />
            Homepage
          </Button>
        </div>
      </div>
    </div>
  );
};

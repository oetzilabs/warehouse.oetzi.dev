import { A, revalidate, useAction } from "@solidjs/router";
import Play from "lucide-solid/icons/play";
import X from "lucide-solid/icons/x";
import { getBannerCookie, setBannerCookie } from "../lib/api/application";
import { Button } from "./ui/button";

export const Banner = () => {
  const setBannerAction = useAction(setBannerCookie);
  const handleClick = async () => {
    await setBannerAction("beta");
    await revalidate(getBannerCookie.key);
  };
  return (
    <div class="bg-gradient-to-r from-blue-500 to-teal-200 w-full relative">
      <div class="container px-0 md:px-4 py-2 mx-auto">
        <div class="grid justify-center md:grid-cols-2 md:justify-between md:items-center gap-2">
          <div class="text-center md:text-start md:order-2 md:flex md:justify-end md:items-center">
            <p class="me-5 inline-block text-sm font-semibold text-white">Ready to get started?</p>
            <Button as={A} href="/auth/login" size="sm">
              Sign up
            </Button>
          </div>
          <div class="flex items-center">
            <A
              class="py-2 px-3 inline-flex justify-center items-center gap-2 rounded-lg font-medium text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 transition-all text-sm"
              href="/demo"
            >
              <Play class="size-4" />
              Watch demo
            </A>
            <span class="inline-block border-e border-white/30 w-px h-5 mx-2"></span>
            <A
              class="py-2 px-3 inline-flex justify-center items-center gap-2 rounded-lg font-medium text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 transition-all text-sm"
              href="/blogs/new"
            >
              Explore what's new
            </A>
          </div>
        </div>
      </div>
      <div
        class="absolute z-10 flex items-center justify-center top-1/2 right-4 p-2 transform -translate-y-1/2 hover:bg-white/50 rounded-md cursor-pointer"
        onClick={() => {
          handleClick();
        }}
      >
        <X class="size-4 text-black" />
      </div>
    </div>
  );
};

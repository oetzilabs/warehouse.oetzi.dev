import fs from "node:fs";
import path from "node:path";

const css = fs.readFileSync(path.join(process.cwd(), "./packages/functions/src/email/invite.css"), "utf-8");

export const render = (replace: Record<string, string>) =>
  `<html>
<head />
<style>${css}</style>
<body class="bg-white my-auto mx-auto font-sans">
  <div class="border-separate border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] w-[465px]">
    <section class="mt-[32px]">
      <img src="__APP_ICON__" width="40" height="37" alt="WareHouse Portal" class="my-0 mx-auto" />
    </section>
    <h1 class="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
      Join <strong>__TEAM_NAME__</strong> on <strong>WareHouse Portal</strong>
    </h1>
    <span class="text-black text-[14px] leading-[24px]">Hello __USERNAME__,</span>
    <span class="text-black text-[14px] leading-[24px]">
      <strong>__INVITED_BY_USERNAME__</strong> (
      <a href="mailto:__INVITED_BY_EMAIL__" class="text-blue-600 no-underline">
        __INVITED_BY_EMAIL__
      </a>
      ) has invited you to the <strong>__TEAM_NAME__</strong> team on <strong>WareHouse Portal</strong>.
    </span>
    <section>
      <div class="flex flex-col items-center justify-center">
        <div class="flex items-center justify-center">
          <img class="rounded-full" src="__USER_IMAGE__" width="64" height="64" />
        </div>
        <div class="flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="lucide lucide-move-right"
          >
            <path d="M18 8L22 12L18 16" />
            <path d="M2 12H22" />
          </svg>
        </div>
        <div class="flex items-center justify-center">
          <img class="rounded-full" src="__TEAM_IMAGE__" width="64" height="64" />
        </div>
      </div>
    </section>
    <section class="text-center mt-[32px] mb-[32px]">
      <a
        class="bg-[#000000] rounded text-white text-[12px] px-5 py-3 font-semibold no-underline text-center"
        href="__INVITE_LINK__"
      >
        Join the team
      </a>
    </section>
    <span class="text-black !text-[14px] leading-[24px]">
      or copy and paste this URL into your browser:
      <a href="__INVITE_LINK__" class="text-blue-600 no-underline">
        __INVITE_LINK__
      </a>
    </span>
    <hr class="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
    <span class="text-[#666666] !text-[12px] leading-[24px]">
      This invitation was intended for <span class="text-black">__USERNAME__</span>. If you were not expecting
      this invitation, you can ignore this email. If you are concerned about your account's safety, please reply
      to this email to get in touch with us.
    </span>
  </div>
</body>
</html>`.replace(/__[A-Z_]+__/g, (match) => replace[match]);

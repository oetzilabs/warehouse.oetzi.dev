//MessageTemplate
import fs from "node:fs";
import path from "node:path";

const css = fs.readFileSync(path.join(process.cwd(), "./packages/functions/src/email/message.css"), "utf-8");

export const render = (replace: Record<string, string>) =>
  `<html>
      <style>${css}</style>
      <body class="bg-white my-auto mx-auto font-sans">
        <div class="border-separate border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] w-[465px]">
          <section class="mt-[32px]">
            <img src="__APP_ICON__" width="40" height="37" alt="WareHouse Portal" class="my-0 mx-auto" />
          </section>
          <h1 class="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
            Login to <strong>__APP_NAME__</strong>
          </h1>
          <span class="text-black text-[14px] leading-[24px] items-center justify-center flex flex-row gap-2">
            <strong>__LOGIN_CODE__</strong> is your login code for <strong>__APP_NAME__</strong>.
          </span>
          <section class="text-center mt-[32px] mb-[32px]">
            <a
              class="bg-[#000000] rounded text-white text-[12px] px-5 py-3 font-semibold no-underline text-center"
              href="__LOGIN_LINK__"
            >
              Or click here to login
            </a>
          </section>
          <hr class="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
          <span class="text-[#666666] !text-[12px] leading-[24px] text-justify">
            This code was intended for <span class="text-black">__USERNAME__</span>. If you were not expecting this
            code, you can ignore this email. If you are concerned about your account's safety, please reply to this
            email to get in touch with us.
          </span>
        </div>
      </body>
    </html>`.replace(/__[A-Z_]+__/g, (match) => replace[match]);

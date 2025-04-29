import { cache, action } from "@solidjs/router";
import { H3Event, getCookie, getEvent, getHeaders, setCookie } from "vinxi/http";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import localeData from "dayjs/plugin/localeData";
import updateLocale from "dayjs/plugin/updateLocale";
dayjs.extend(localeData);
dayjs.extend(isoWeek);
dayjs.extend(updateLocale);

export const getLocaleSettings = (event: H3Event) => {
  "use server";
  const headers = getHeaders(event);

  let language = headers["Accept-Language"] || headers["accept-language"];

  const languageFromCookie = getCookie(event, "language");

  if (typeof languageFromCookie !== "undefined") {
    language = languageFromCookie;
  }

  if (!language) {
    language = "en";
  }

  if(language.includes("-")){
    language = language.split("-")[0];
  }

  const languageSplit = language.split(",");

  if (languageSplit.length >= 1) {
    language = languageSplit[0];
  }

  dayjs.updateLocale(language, {});

  const ld = dayjs().localeData();

  const startOfWeek = ld.firstDayOfWeek();

  return { language, startOfWeek };
};

export const getLocale = cache(async () => {
  "use server";
  const event = getEvent()!;

  const l = getLocaleSettings(event);

  return l;
}, "locale");

export const changeLocaleCookie = action(async (l: string) => {
  "use server";
  const event = getEvent()!;
  setCookie(event, "language", l);
  return l;
});

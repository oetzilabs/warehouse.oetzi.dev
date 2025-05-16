import { getLocale } from "@/lib/api/locale";
import { translations, type TranslationKeys } from "@/lib/translations";
import { createAsync } from "@solidjs/router";
import dayjs from "dayjs";
import de from "dayjs/locale/de";
import en from "dayjs/locale/en";
import relative from "dayjs/plugin/relativeTime";
import { Accessor, createContext, createEffect, createSignal, JSXElement, useContext } from "solid-js";

dayjs.extend(relative);

export type Translations = {
  t: (key: TranslationKeys, replacer?: { [k: string]: any }) => string;
  language: Accessor<string>;
  d: (date: Date) => dayjs.Dayjs;
};

const TranslationContext = createContext<Translations>({
  t: () => {
    throw new Error("Not implemented yet.");
  },
  language: () => {
    throw new Error("Not implemented yet.");
  },
  d: () => {
    throw new Error("Not implemented yet.");
  },
});

export const TranslationsProvider = (props: { children: JSXElement }) => {
  const locale = createAsync(() => getLocale(), { deferStream: true });

  const [language, setLanguage] = createSignal<string>("en");
  createEffect(() => {
    const loc = locale();
    if (loc) {
      setLanguage(loc.language);
      // @ts-ignore
      // dayjs.locale(languages[loc.language]);
    }
  });

  createEffect(() => {
    const l = language();
    switch (l) {
      case "en":
        dayjs.locale(en);
        break;
      case "de":
        dayjs.locale(de);
        break;
      default:
        dayjs.locale(en);
        break;
    }
  });

  return (
    <TranslationContext.Provider
      value={{
        t(key, replacer) {
          const l = language();
          let theT = translations[l][key];
          const k = Object.entries(replacer ?? {});
          theT = theT.replaceAll("{props.app_name}", "warehouse");
          for (let i = 0; i < k.length; i++) {
            const kkv = k[i];
            const kk = kkv[0];
            const replacer = kkv[1];
            theT = theT.replaceAll(`{props.${kk}}`, replacer);
          }
          return theT;
        },
        language,
        d: (date: Date) => dayjs(date),
      }}
    >
      {props.children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => useContext(TranslationContext);

export * as Translations from "./";

export type Translation = {
  [language: string]: {
    greeting: string;
  };
};
export type TKeys = keyof Translation;
export type TranslationKeys = keyof Translation[TKeys];

export const translations: Translation = {
  en: {
    greeting: "Hello {props.username}, welcome to {props.app_name}",
  },
  de: {
    greeting: "Hallo {props.username}, willkommen zu {props.app_name}",
  },
};

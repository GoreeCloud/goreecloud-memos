import i18n, { BackendModule, FallbackLng, FallbackLngObjList } from "i18next";
import { orderBy } from "lodash-es";
import { initReactI18next } from "react-i18next";
import { findNearestMatchedLanguage } from "./utils/i18n";

export const locales = orderBy([
  "ar",
  "bg",
  "ca",
  "cs",
  "da",
  "de",
  "el",
  "en",
  "en-GB",
  "es",
  "et",
  "fa",
  "fi",
  "fr",
  "gl",
  "hi",
  "hr",
  "hu",
  "id",
  "it",
  "ja",
  "ka-GE",
  "ko",
  "lt",
  "lv",
  "mr",
  "nb",
  "nl",
  "pl",
  "pt-PT",
  "pt-BR",
  "ro",
  "ru",
  "sk",
  "sl",
  "sr",
  "sv",
  "th",
  "tr",
  "uk",
  "vi",
  "zh-Hans",
  "zh-Hant",
]);

const fallbacks = {
  "zh-HK": ["zh-Hant", "en"],
  "zh-TW": ["zh-Hant", "en"],
  zh: ["zh-Hans", "en"],
} as FallbackLngObjList;

const applyGoreeCloudEnglishTerminology = (language: string, translation: Record<string, unknown>): Record<string, unknown> => {
  if (language !== "en" && language !== "en-GB") {
    return translation;
  }

  const setting = (translation.setting ?? {}) as Record<string, unknown>;
  const preference = (setting.preference ?? {}) as Record<string, unknown>;

  return {
    ...translation,
    setting: {
      ...setting,
      preference: {
        ...preference,
        "memo-defaults-title": "Note defaults",
        "memo-defaults-description": "Set the defaults used when creating new notes.",
        "default-memo-visibility": "Default note visibility",
        "default-memo-visibility-description": "Visibility applied to newly created notes unless changed in the editor.",
      },
    },
  };
};

const LazyImportPlugin: BackendModule = {
  type: "backend",
  init: function () {},
  read: function (language, _, callback) {
    const matchedLanguage = findNearestMatchedLanguage(language);
    import(`./locales/${matchedLanguage}.json`)
      .then((translationModule: Record<string, unknown>) => {
        const translation = (translationModule.default as Record<string, unknown>) ?? translationModule;
        callback(null, applyGoreeCloudEnglishTerminology(matchedLanguage, translation));
      })
      .catch(() => {
        import("./locales/en.json")
          .then((translationModule: Record<string, unknown>) => {
            const translation = (translationModule.default as Record<string, unknown>) ?? translationModule;
            callback(null, applyGoreeCloudEnglishTerminology("en", translation));
          })
          .catch((error: unknown) => {
            callback(error as Error, false);
          });
      });
  },
};

i18n
  .use(LazyImportPlugin)
  .use(initReactI18next)
  .init({
    detection: {
      order: ["navigator"],
    },
    interpolation: {
      escapeValue: false,
    },
    fallbackLng: {
      ...fallbacks,
      ...{ default: ["en"] },
    } as FallbackLng,
  });

export default i18n;
export type TLocale = (typeof locales)[number];

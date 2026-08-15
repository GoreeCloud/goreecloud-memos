// Future i18n: swap these for `t("placeholder.<variant>")` lookups via
// react-i18next without touching the component.
export const DEFAULT_MESSAGES = {
  empty: "No notes yet",
  loading: "Loading…",
  noResults: "No matching notes",
  notFound: "Page not found",
} as const;

export type PlaceholderVariant = keyof typeof DEFAULT_MESSAGES;

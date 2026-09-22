import { intlLocales, type Locale } from "./config";

export type Messages = Record<string, string>;
export type Values = Record<string, string | number>;
const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// The catalog uses readable English message IDs. Parameterized messages keep
// live statistics outside translation files, so every language shares the data.
export function createTranslator(locale: Locale, messages: Messages) {
  const folded = new Map(Object.entries(messages).map(([key, value]) => [key.toLowerCase(), value]));
  const patterns = Object.entries(messages).filter(([key]) => /\{\d+\}/.test(key)).sort(([a], [b]) => b.length - a.length).map(([key, value]) => {
    const ids = [...key.matchAll(/\{(\d+)\}/g)].map(match => match[1]);
    return { ids, value, regex: new RegExp(`^${key.split(/\{\d+\}/).map(escape).join("(.+?)")}$`, "i") };
  });
  function translate<T>(input: T, values?: Values): T extends string ? string : T {
    if (typeof input !== "string" || !input.trim()) return input as T extends string ? string : T;
    const source = input.trim();
    if (locale !== "en" && /^(?:\d{1,2} [A-Za-z]+ \d{4}|\d{4}-\d{2}-\d{2})$/.test(source)) {
      const date = new Date(/^\d{4}-/.test(source) ? `${source}T00:00:00Z` : `${source} 00:00:00 GMT`);
      if (!Number.isNaN(date.getTime())) return new Intl.DateTimeFormat(intlLocales[locale], { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(date) as T extends string ? string : T;
    }
    let result = messages[source];
    if (result === undefined && locale !== "en") {
      result = folded.get(source.toLowerCase())!;
      if (result && source === source.toUpperCase()) result = result.toLocaleUpperCase(intlLocales[locale]);
      if (result === undefined) {
        for (const pattern of patterns) {
          const match = source.match(pattern.regex);
          if (!match) continue;
          result = pattern.value.replace(/\{(\d+)\}/g, (_, id) => translate(match[pattern.ids.indexOf(id) + 1] ?? ""));
          break;
        }
      }
    }
    result ??= source;
    if (values) result = result.replace(/\{(\w+)\}/g, (token, key) => Object.hasOwn(values, key) ? String(values[key]) : token);
    return `${input.match(/^\s*/)?.[0] ?? ""}${result}${input.match(/\s*$/)?.[0] ?? ""}` as T extends string ? string : T;
  }
  return translate;
}

import type { Article } from "./article-types";
import { documentText } from "./blog/model";
import { articleWordCount } from "./blog/word-count";
import type { Locale } from "./i18n/config";

/** Estimate the text actually displayed, not a manually entered duration. */
export function articleReadingMinutes(article: Article, locale: Locale, translate: (value: string | number) => string = String) {
  const t = article.managed ? String : translate;
  const text = [t(article.description), article.summary && t(article.summary),
    article.body && documentText(article.body),
    ...article.sections.flatMap(section => [t(section.heading), t(section.text)]),
    ...(article.tables ?? []).flatMap(table => [t(table.caption), ...table.columns.map(t), ...table.rows.flatMap(row => row.cells.map(t)), table.note && t(table.note)]),
  ].filter(Boolean).join(" ");
  return Math.max(1, Math.ceil(articleWordCount(text, locale) / 200));
}

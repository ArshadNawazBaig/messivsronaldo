import type { SourceId } from "./data";
import type { CalculatorPreset } from "./calculator";

export type ArticleCitation = { title: string; url: string };
export type ArticleTable = {
  caption: string;
  columns: readonly string[];
  rows: readonly { cells: readonly (string | number)[]; citations?: readonly ArticleCitation[] }[];
  note?: string;
};
export type Article = {
  slug: string; category: string; title: string; description: string;
  readTime: string; color: string; number: string;
  sections: readonly { heading: string; text: string; citations?: readonly ArticleCitation[] }[];
  sourceIds: readonly SourceId[];
  published?: string; updated?: string; preset?: CalculatorPreset;
  citations?: readonly ArticleCitation[];
  summary?: string; tables?: readonly ArticleTable[];
  relatedSlugs?: readonly string[];
  image?: { path: string; alt: string };
};

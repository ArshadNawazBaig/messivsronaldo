import { PageContext } from "@/components/page-context";
import { PublicPosterStudio } from "@/components/public-poster-studio";
import { ToolNavigation } from "@/components/tool-cards";
import { getComparisonPoster } from "@/lib/comparison-poster";
import { getI18n } from "@/lib/i18n/server";
import { localizedPath } from "@/lib/i18n/config";
import { defaultPublicPoster, pagePosterParams, publicPosterQuery, resolvePublicPoster } from "@/lib/public-comparison-poster";
import { getPublishedData } from "@/lib/server-data";
import { pageMetadata } from "@/lib/site";
import { imageFormats } from "@/lib/stat-image";
import { toolPages } from "@/lib/tools";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
const page = toolPages["comparison-posters"];
export async function generateMetadata({ searchParams }: Props) {
  const data = await getPublishedData();
  let selection;
  try { selection = resolvePublicPoster(pagePosterParams(await searchParams), data); }
  catch { selection = { request: defaultPublicPoster, poster: getComparisonPoster(data, defaultPublicPoster) }; }
  const { request, poster } = selection;
  const base = await pageMetadata(page.title, page.description, "/comparison-posters");
  const { t, locale } = await getI18n();
  const title = `${t(poster.competition)} · ${t("Messi vs Ronaldo Comparison Posters")}`;
  const { width, height } = imageFormats[request.format];
  const image = { url: `/api/comparison-poster?${publicPosterQuery(request)}&v=${encodeURIComponent(data.datasetVersion)}`, width, height, type: "image/png", alt: t("{0}: Messi vs Ronaldo comparison poster", { "0": t(poster.competition) }) };
  return { ...base,
    openGraph: { ...base.openGraph, title, url: localizedPath(`/comparison-posters?${publicPosterQuery(request)}`, locale), images: [image] },
    twitter: { ...base.twitter, title, images: [{ url: image.url, alt: image.alt }] },
  };
}

export default async function ComparisonPostersPage({ searchParams }: Props) {
  // This is an interactive, shareable selection; do not pre-render query state.
  await searchParams;
  const { t } = await getI18n();
  return <div className="page-container inner-page">
    <PageContext path="/comparison-posters" title={t(page.title)} description={t(page.description)} kind="WebPage"
      breadcrumbs={[{ path: "/", name: t("Overview") }, { path: "/tools", name: t("Tools & games") }, { path: "/comparison-posters", name: t("Comparison posters") }]} />
    <div className="page-intro inner-intro"><div><span className="eyebrow"><span className="tiny-dot" />{t(page.eyebrow)}</span><h1>{t(page.heading)}</h1><p>{t(page.description)}</p></div></div>
    <ToolNavigation current="comparison-posters" />
    <PublicPosterStudio />
  </div>;
}

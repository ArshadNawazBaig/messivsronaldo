import { revalidateArticles } from "@/lib/public-cache";
import { commandSchema } from "@/lib/blog/model";
import { checkOrigin, requireAdmin } from "@/lib/admin/auth";
import { articles } from "@/lib/articles";
import { AdminError } from "@/lib/admin/model";
import { isLocale } from "@/lib/i18n/config";
import { getArticleI18nForLocale } from "@/lib/i18n/article-server";
import { readPosts, seedPost, writePost } from "@/lib/blog/store";
import { blogFailure, limitedBody, privateHeaders } from "@/lib/blog/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    await requireAdmin();
    const locale = new URL(request.url).searchParams.get("locale") ?? "en";
    if (!isLocale(locale)) throw new AdminError("Choose a supported language.");
    const { t } = await getArticleI18nForLocale(locale);
    const posts = await readPosts(undefined, locale);
    const slugs = new Set(posts.map(post => post.slug));
    return Response.json({ posts: [...posts, ...articles.filter(article => !slugs.has(article.slug)).map(article => seedPost(article, locale, value => String(t(value))))] }, { headers: privateHeaders });
  } catch (error) { return blogFailure(error); }
}
export async function POST(request: Request) {
  try {
    checkOrigin(request); await requireAdmin();
    let input: unknown;
    try { input = JSON.parse((await limitedBody(request, 750_000)).toString("utf8")); } catch (error) { if (error instanceof AdminError) throw error; throw new AdminError("Invalid article request."); }
    const requestedLocale = (input as { locale?: unknown } | null)?.locale;
    const { t } = await getArticleI18nForLocale(typeof requestedLocale === "string" && isLocale(requestedLocale) ? requestedLocale : "en");
    const command = commandSchema.parse(input);
    const post = await writePost(command, undefined, value => String(t(value)));
    if (["publish", "unpublish", "delete"].includes(command.action)) revalidateArticles(post.locale);
    return Response.json({ post }, { headers: privateHeaders });
  } catch (error) { return blogFailure(error); }
}

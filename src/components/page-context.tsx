import Link from "@/components/localized-link";
import { getI18n } from "@/lib/i18n/server";
import { jsonLd, siteUrl } from "@/lib/site";
import { pageSemantics, type PageSemantics } from "@/lib/page-semantics";
import styles from "./semantics.module.css";

// Pass already-translated titles so article-only translations are also retained.
export async function PageContext(props: PageSemantics) {
  const { locale, t } = await getI18n();
  const { page, breadcrumb } = pageSemantics(props, locale, siteUrl);
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(page) }} />
    {breadcrumb && <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumb) }} />
      <nav className={styles.breadcrumbs} aria-label={t("Breadcrumbs")} data-breadcrumbs>
        <ol>{props.breadcrumbs.map((item, index) => <li key={item.path}>
          {index > 0 && <span className={styles.separator} aria-hidden="true">/</span>}
          {index === props.breadcrumbs.length - 1 ? <span aria-current="page">{item.name}</span> : <Link href={item.path}>{item.name}</Link>}
        </li>)}</ol>
      </nav>
    </>}
  </>;
}

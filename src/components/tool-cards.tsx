import Link from "./localized-link";
import { ArrowUpRight } from "lucide-react";
import { getI18n } from "@/lib/i18n/server";
import { toolLinks } from "@/lib/tools";
import styles from "./interactive-tools.module.css";

export async function ToolCards() {
  const { t } = await getI18n();
  return <section aria-label={t("Tools & games")}><div className="section-title-row"><h2>{t("Explore. Play. Compare.")}</h2><Link className="text-link" href="/tools">{t("Tools & games")}<ArrowUpRight size={14}/></Link></div><div className={styles.grid}>{toolLinks.map(tool => <Link className={styles.card} href={tool.href} key={tool.href}><span>{tool.number} / {t("THE RIVALRY")}</span><h3>{t(tool.label)}</h3><p>{t(tool.description)}</p><ArrowUpRight size={20}/></Link>)}</div></section>;
}
export async function ToolNavigation({ current }: { current: string }) {
  const { t } = await getI18n();
  return <nav className={styles.navigation} aria-label={t("Tools & games")}><Link href="/tools" aria-current={current === "tools" ? "page" : undefined}>{t("Tools & games")}</Link>{toolLinks.map(tool => <Link key={tool.href} href={tool.href} aria-current={tool.href === `/${current}` ? "page" : undefined}>{t(tool.label)}</Link>)}</nav>;
}

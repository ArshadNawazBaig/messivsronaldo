"use client";
import { LanguageSwitcher } from "./language-switcher";
import { NavigationIcon } from "./ui/navigation-icon";
import { stripLocale } from "@/lib/i18n/config";
import { useI18n } from "@/components/i18n-provider";
import { useFootballData } from "@/components/data-provider";
import { players } from "@/lib/data";
import { interactiveGuides } from "@/lib/interactive-guides";
import { honoursNavigation } from "@/lib/awards";
import { toolLinks } from "@/lib/tools";
import Link from "@/components/localized-link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowUpRight, ChevronDown, ChevronRight, Menu, Moon, Search, Sun, X } from "lucide-react";
const comparisonItems = [
    { href: "/", label: "Overview" },
    { href: "/compare", label: "Compare stats" },
    { href: "/2026", label: "2026 stats" },
    { href: "/seasons", label: "Years & seasons" },
    { href: "/honours", label: "Trophies & awards" },
];
const competitionItems = [
    { href: "/clubs", label: "Club by club" },
    { href: "/champions-league", label: "Champions League" },
    { href: "/la-liga", label: "La Liga" },
    { href: "/world-cup", label: "World Cup" },
    { href: "/international", label: "International" },
];
const scoringItems = [
    { href: "/scoring-calculator", label: "Scoring calculator" },
    { href: "/goals", label: "Career goals" },
    { href: "/assists", label: "Assists" },
    { href: "/penalties", label: "Penalties" },
    { href: "/free-kicks", label: "Free kicks" },
    { href: "/hat-tricks", label: "Hat-tricks" },
    { href: "/head-to-head", label: "Head-to-head" },
    { href: "/records", label: "Career milestones" },
];
const honoursItems = honoursNavigation;
const editorialItems = [
    { href: "/tools", label: "Tools & games" },
    ...toolLinks.filter(tool => tool.href !== "/scoring-calculator").map(tool => ({ href: tool.href, label: tool.label })),
    { href: "/insights", label: "The reading room" },
    { href: "/methodology", label: "Sources & methodology" },
];
const navItems = [...comparisonItems, ...competitionItems, ...honoursItems.slice(1)];
function isActivePath(pathname: string, href: string) {
    return pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
}
const searchItems = [{ href: "/tools", label: "Tools & games" }, ...toolLinks.filter(tool => tool.href !== "/scoring-calculator").map(tool => ({ href: tool.href, label: tool.label })), { href: "/scoring-calculator", label: "Scoring calculator" }, ...interactiveGuides.map(article => ({ href: `/insights/${article.slug}`, label: article.title })), ...[["terms", "Terms of use"], ["privacy", "Privacy policy"], ["cookies", "Cookie policy"], ["disclaimer", "Editorial disclaimer"], ["accessibility", "Accessibility"], ["contact", "Contact & corrections"], ["sitemap", "Site map"]].map(([slug, label]) => ({ href: `/${slug}`, label })), ...navItems, { href: "/penalties", label: "Penalties & conversion" }, { href: "/free-kicks", label: "Free kicks & goal types" }, { href: "/hat-tricks", label: "Hat-tricks" }, { href: "/head-to-head", label: "Direct head-to-head meetings" }, { href: "/copa-america-vs-euros", label: "Copa América vs Euros" }, { href: "/european-clubs", label: "European club records" }, { href: "/league", label: "All domestic leagues" }, { href: "/records", label: "Records & race to 1,000" }, { href: "/goals", label: "Career goals" }, { href: "/assists", label: "Understanding assists" }, { href: "/methodology", label: "Sources & methodology" }, { href: "/insights", label: "The reading room" }, { href: "/players/messi", label: "Lionel Messi profile" }, { href: "/players/ronaldo", label: "Cristiano Ronaldo profile" }];
export function Brand() {
    const { t } = useI18n();
    return <Link href="/" className="brand" aria-label={t("The Rivalry home")}><Image className="brand-symbol" src="/images/brand/the-rivalry-mark.svg" width={40} height={40} alt={t("")} unoptimized/><span>{t("THE")}<span className="brand-second">{t("RIVALRY")}<span className="brand-period">.</span></span></span></Link>;
}
const navigationGroups: {
    id: string;
    label: string;
    href?: string;
    items?: typeof navItems;
}[] = [
    { id: "career", label: "All-time stats", items: comparisonItems.slice(0, 2) },
    { id: "years", label: "Years & seasons", items: comparisonItems.slice(2, 4) },
    { id: "clubs", label: "Club stats", items: [...competitionItems.slice(0, 3), { href: "/league", label: "All domestic leagues" }, { href: "/european-clubs", label: "European club records" }] },
    { id: "international", label: "International", items: [competitionItems[4], competitionItems[3], { href: "/copa-america-vs-euros", label: "Copa América vs Euros" }] },
    { id: "scoring", label: "Scoring records", items: scoringItems },
    { id: "honours", label: "Trophies & awards", items: honoursItems },
    { id: "reading", label: "Read & research", items: [...editorialItems, { href: "/updates", label: "Update log" }, { href: "/about", label: "About the project" }] },
];
function SiteHeader({ pathname, onSearch }: {
    pathname: string;
    onSearch: () => void;
}) {
    const { t } = useI18n();
    const [menuOpen, setMenuOpen] = useState(false);
    const [openGroup, setOpenGroup] = useState<string | null>(null);
    const header = useRef<HTMLElement>(null);
    const menuButton = useRef<HTMLButtonElement>(null);
    const { snapshotLabel, snapshotDate } = useFootballData();
    function closeNavigation() { setMenuOpen(false); setOpenGroup(null); }
    useEffect(() => {
        const dismissOutside = (event: PointerEvent) => {
            if (event.target instanceof Node && !header.current?.contains(event.target)) {
                setMenuOpen(false);
                setOpenGroup(null);
            }
        };
        // A resize must not leave focus inside a menu that is becoming hidden.
        const media = window.matchMedia("(max-width: 1000px)");
        const resetNavigation = () => {
            if (header.current?.contains(document.activeElement)) {
                if (media.matches)
                    menuButton.current?.focus();
                else
                    header.current?.querySelector<HTMLElement>(".brand")?.focus();
            }
            setMenuOpen(false);
            setOpenGroup(null);
        };
        document.addEventListener("pointerdown", dismissOutside);
        media.addEventListener("change", resetNavigation);
        return () => {
            document.removeEventListener("pointerdown", dismissOutside);
            media.removeEventListener("change", resetNavigation);
        };
    }, []);
    function toggleTheme() {
        const nextLight = document.documentElement.dataset.theme !== "light";
        document.documentElement.dataset.theme = nextLight ? "light" : "dark";
        document.documentElement.dataset.themePreference = nextLight ? "light" : "dark";
        try {
            localStorage.setItem("rivalry-theme", nextLight ? "light" : "dark");
        }
        catch { /* Theme still works without storage. */ }
    }
    return <header ref={header} className="site-header" onKeyDown={event => {
            if (event.key !== "Escape")
                return;
            if (openGroup) {
                header.current?.querySelector<HTMLButtonElement>(`#nav-trigger-${openGroup}`)?.focus();
                setOpenGroup(null);
                event.preventDefault();
                event.stopPropagation();
            }
            else if (menuOpen) {
                closeNavigation();
                menuButton.current?.focus();
                event.preventDefault();
            }
        }}>
    <div className="site-masthead">
      <div className="masthead-identity"><Brand /><p>{t("Two careers.")}<br /><strong>{t("Every chapter.")}</strong></p></div>
      <div className="header-players" aria-label={t("Player profiles")}>
        {(["messi", "ronaldo"] as const).map(player => <Link href={`/players/${player}`} key={player} className="header-player" aria-label={t(`${player === "messi" ? "Lionel Messi" : "Cristiano Ronaldo"} profile`)} aria-current={pathname === `/players/${player}` ? "page" : undefined} onClick={closeNavigation}>
          <span className={`header-player-photo ${player}`}><Image src={players[player].image} alt={t("")} width={players[player].imageWidth} height={players[player].imageHeight} sizes="60px"/></span>
          <span>{t(player === "messi" ? "Lionel Messi" : "Cristiano Ronaldo")}<small>{t(player === "messi" ? "Argentina · No. 10" : "Portugal · No. 7")}</small></span>
        </Link>)}
      </div>
      <div className="header-tools">
        {!pathname.startsWith("/admin") && <LanguageSwitcher />}
        <button className="header-search" onClick={() => { closeNavigation(); onSearch(); }} aria-label={t("Search the site")}><Search size={18} aria-hidden="true"/><span>{t("Search")}</span><kbd>{t("\u2318 K")}</kbd></button>
        <button className="icon-button theme-toggle" aria-label={t("Toggle light or dark theme")} onClick={toggleTheme}><Moon size={19} className="theme-light-icon" aria-hidden="true"/><Sun size={19} className="theme-dark-icon" aria-hidden="true"/></button>
        <button className="header-menu-toggle" ref={menuButton} aria-label={t(menuOpen ? "Close menu" : "Open menu")} aria-controls="main-navigation" aria-expanded={menuOpen} onClick={() => { setMenuOpen(!menuOpen); setOpenGroup(null); }}>{menuOpen ? <X size={21} aria-hidden="true"/> : <Menu size={21} aria-hidden="true"/>}<span>{t("Menu")}</span></button>
      </div>
    </div>
    <div className={`site-navigation ${menuOpen ? "is-open" : ""}`} id="main-navigation">
      <nav className="primary-navigation" aria-label={t("Main navigation")}>
        <ul className="primary-nav-list">
          {navigationGroups.map(group => {
            const active = group.href ? isActivePath(pathname, group.href) : group.items?.some(item => isActivePath(pathname, item.href));
            const expanded = openGroup === group.id;
            return <li key={group.id} className={`primary-nav-group ${active ? "is-current" : ""}`} onBlur={event => {
                    if (!event.currentTarget.contains(event.relatedTarget as Node | null))
                        setOpenGroup(current => current === group.id ? null : current);
                }}>
              {group.href ? <Link className="primary-nav-trigger" href={group.href} aria-current={active ? "page" : undefined} onClick={closeNavigation}>{t(group.label)}</Link> : <>
                <button id={`nav-trigger-${group.id}`} className="primary-nav-trigger" aria-expanded={expanded} aria-controls={`nav-panel-${group.id}`} onClick={() => setOpenGroup(expanded ? null : group.id)} onKeyDown={event => {
                        if (event.key === "ArrowDown") {
                            event.preventDefault();
                            setOpenGroup(group.id);
                            requestAnimationFrame(() => header.current?.querySelector<HTMLElement>(`#nav-panel-${group.id} a`)?.focus());
                        }
                    }}>{t(group.label)}<ChevronDown size={13} aria-hidden="true"/></button>
                <ul id={`nav-panel-${group.id}`} className="nav-dropdown" hidden={!expanded} aria-labelledby={`nav-trigger-${group.id}`}>
                  {group.items?.map(({ href, label }) => <li key={href}><Link href={href} aria-current={isActivePath(pathname, href) ? "page" : undefined} onClick={closeNavigation}><NavigationIcon href={href} size={20} strokeWidth={1.65} aria-hidden="true"/><span>{t(label)}</span><ChevronRight size={13} aria-hidden="true"/></Link></li>)}
                </ul>
              </>}
            </li>;
        })}
        </ul>
        <Link className="navigation-update" href="/updates" onClick={closeNavigation}><span className="update-indicator"/>{t("Updated ")}<time dateTime={snapshotDate}>{t(snapshotLabel)}</time><ArrowUpRight size={13} aria-hidden="true"/></Link>
        <div className="mobile-profile-links"><Link href="/players/messi" onClick={closeNavigation}>{t("Lionel Messi ")}<ArrowUpRight size={14}/></Link><Link href="/players/ronaldo" onClick={closeNavigation}>{t("Cristiano Ronaldo ")}<ArrowUpRight size={14}/></Link></div>
      </nav>
    </div>
  </header>;
}
export function SiteShell({ children }: {
    children: ReactNode;
}) {
    const { t } = useI18n();
    const { snapshotLabel } = useFootballData();
    const pathname = stripLocale(usePathname());
    const [query, setQuery] = useState("");
    const dialog = useRef<HTMLDialogElement>(null);
    useEffect(() => {
        const onKey = (event: KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key === "k") {
                event.preventDefault();
                dialog.current?.showModal();
            }
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, []);
    return <>
    <a href="#main-content" className="skip-link">{t("Skip to content")}</a>
    <SiteHeader key={pathname} pathname={pathname} onSearch={() => dialog.current?.showModal()}/>
    <div className="site-body">
      <main id="main-content" tabIndex={-1}>{children}</main>
      <footer className="site-footer">
        <div className="footer-intro"><span className="footer-brand">{t("THE RIVALRY")}<span>.</span></span><p>{t("An independent archive of Messi and Ronaldo\u2019s careers.")}</p></div>
        <nav className="footer-navigation" aria-label={t("Footer navigation")}>
          <div><span className="section-kicker">{t("THE PROJECT")}</span><div className="footer-links"><Link href="/about">{t("About")}</Link><Link href="/methodology">{t("Our data")}</Link><Link href="/updates">{t("Update log")}</Link><Link href="/credits">{t("Photo credits")}</Link></div></div>
          <div><span className="section-kicker">{t("INFORMATION")}</span><div className="footer-links"><Link href="/terms">{t("Terms of use")}</Link><Link href="/privacy">{t("Privacy")}</Link><Link href="/cookies">{t("Cookies")}</Link><Link href="/disclaimer">{t("Disclaimer")}</Link></div></div>
          <div><span className="section-kicker">{t("FIND YOUR WAY")}</span><div className="footer-links"><Link href="/contact">{t("Contact & corrections")}</Link><Link href="/accessibility">{t("Accessibility")}</Link><Link href="/sitemap">{t("Site map")}</Link><Link href="/admin">{t("Admin")}</Link></div></div>
        </nav>
        <div className="footer-bottom"><span>© {t(new Date().getFullYear())}{t(" The Rivalry. An independent football project.")}</span><span>{t("Data updated {0}", { "0": t(snapshotLabel) })}</span></div>
      </footer>
    </div>
    <dialog ref={dialog} className="search-dialog" onClick={event => {
            if (event.target === event.currentTarget)
                dialog.current?.close();
        }}><div className="search-dialog-inner"><div className="dialog-search-row"><Search size={21}/><input autoComplete="off" placeholder={t("Players, competitions, stories\u2026")} aria-label={t("Search pages")} value={query} onChange={event => setQuery(event.target.value)}/><button className="icon-button" aria-label={t("Close search")} onClick={() => dialog.current?.close()}><X size={19}/></button></div><div className="search-results">{searchItems.filter(item => t(item.label).toLocaleLowerCase().includes(query.toLocaleLowerCase())).map(({ href, label }) => <Link href={href} key={href} onClick={() => { dialog.current?.close(); setQuery(""); }}><NavigationIcon href={href} size={19} aria-hidden="true"/><span>{t(label)}</span><ArrowUpRight size={15}/></Link>)}{!searchItems.some(item => t(item.label).toLocaleLowerCase().includes(query.toLocaleLowerCase())) && <p className="no-results">{t("No matches. Try \u201Cgoals\u201D, \u201CMessi\u201D or \u201Csources\u201D.")}</p>}</div><div className="search-dialog-footer">{t("Search players, competitions and articles.")}<kbd>{t("ESC to close")}</kbd></div></div></dialog>
  </>;
}

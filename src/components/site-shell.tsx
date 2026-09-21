"use client";
import { useFootballData } from "@/components/data-provider";
import { players } from "@/lib/data";

import Link from "next/link";
import Image from "next/image";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowDownUp, ArrowUpRight, BarChart3, BookOpen, CalendarDays, ChevronDown, ChevronRight, CircleHelp, Globe2, History, LayoutDashboard, Menu, Moon, Search, ShieldCheck, Sun, Trophy, X } from "lucide-react";

const comparisonItems = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/compare", label: "Compare stats", icon: ArrowDownUp },
  { href: "/2026", label: "2026 stats", icon: CalendarDays },
  { href: "/seasons", label: "Years & seasons", icon: CalendarDays },
  { href: "/honours", label: "Trophies & awards", icon: Trophy },
];
const competitionItems = [
  { href: "/clubs", label: "Club by club", icon: BarChart3 },
  { href: "/champions-league", label: "Champions League", icon: Trophy },
  { href: "/la-liga", label: "La Liga", icon: BarChart3 },
  { href: "/world-cup", label: "World Cup", icon: Globe2 },
  { href: "/international", label: "International", icon: Globe2 },
];
const scoringItems = [
  { href: "/goals", label: "Career goals", icon: BarChart3 },
  { href: "/assists", label: "Assists", icon: ArrowDownUp },
  { href: "/penalties", label: "Penalties", icon: BarChart3 },
  { href: "/free-kicks", label: "Free kicks", icon: BarChart3 },
  { href: "/hat-tricks", label: "Hat-tricks", icon: Trophy },
  { href: "/head-to-head", label: "Head-to-head", icon: ArrowDownUp },
  { href: "/records", label: "Career milestones", icon: Trophy },
];
const editorialItems = [
  { href: "/insights", label: "The reading room", icon: BookOpen },
  { href: "/methodology", label: "Sources & methodology", icon: ShieldCheck },
];
const navItems = [...comparisonItems, ...competitionItems];

function isActivePath(pathname: string, href: string) {
  return pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
}

const searchItems = [...[["terms", "Terms of use"], ["privacy", "Privacy policy"], ["cookies", "Cookie policy"], ["disclaimer", "Editorial disclaimer"], ["accessibility", "Accessibility"], ["contact", "Contact & corrections"], ["sitemap", "Site map"]].map(([slug, label]) => ({ href: `/${slug}`, label, icon: BookOpen })), ...navItems, { href: "/penalties", label: "Penalties & conversion", icon: BarChart3 }, { href: "/free-kicks", label: "Free kicks & goal types", icon: BarChart3 }, { href: "/hat-tricks", label: "Hat-tricks", icon: BarChart3 }, { href: "/head-to-head", label: "Direct head-to-head meetings", icon: ArrowDownUp }, { href: "/copa-america-vs-euros", label: "Copa América vs Euros", icon: Globe2 }, { href: "/european-clubs", label: "European club records", icon: Globe2 }, { href: "/league", label: "All domestic leagues", icon: BarChart3 }, { href: "/records", label: "Records & race to 1,000", icon: Trophy }, { href: "/goals", label: "Career goals", icon: BarChart3 }, { href: "/assists", label: "Understanding assists", icon: BookOpen }, { href: "/methodology", label: "Sources & methodology", icon: ShieldCheck }, { href: "/insights", label: "The reading room", icon: BookOpen }, { href: "/players/messi", label: "Lionel Messi profile", icon: CircleHelp }, { href: "/players/ronaldo", label: "Cristiano Ronaldo profile", icon: CircleHelp }];

export function Brand() {
  return <Link href="/" className="brand" aria-label="The Rivalry home"><Image className="brand-symbol" src="/images/brand/the-rivalry-mark.svg" width={40} height={40} alt="" unoptimized /><span>THE<span className="brand-second">RIVALRY<span className="brand-period">.</span></span></span></Link>;
}

const navigationGroups: { id: string; label: string; href?: string; items?: typeof navItems }[] = [
  { id: "career", label: "All-time stats", items: comparisonItems.slice(0, 2) },
  { id: "years", label: "Years & seasons", items: comparisonItems.slice(2, 4) },
  { id: "clubs", label: "Club stats", items: [...competitionItems.slice(0, 3), { href: "/league", label: "All domestic leagues", icon: BarChart3 }, { href: "/european-clubs", label: "European club records", icon: Globe2 }] },
  { id: "international", label: "International", items: [competitionItems[4], competitionItems[3], { href: "/copa-america-vs-euros", label: "Copa América vs Euros", icon: Globe2 }] },
  { id: "scoring", label: "Scoring records", items: scoringItems },
  { id: "honours", label: "Trophies & awards", href: "/honours" },
  { id: "reading", label: "Read & research", items: [...editorialItems, { href: "/updates", label: "Update log", icon: History }, { href: "/about", label: "About the project", icon: CircleHelp }] },
];

function SiteHeader({ pathname, onSearch }: { pathname: string; onSearch: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const header = useRef<HTMLElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const { snapshotLabel, snapshotDate } = useFootballData();

  function closeNavigation() { setMenuOpen(false); setOpenGroup(null); }

  useEffect(() => {
    const dismissOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !header.current?.contains(event.target)) {
        setMenuOpen(false); setOpenGroup(null);
      }
    };
    // A resize must not leave focus inside a menu that is becoming hidden.
    const media = window.matchMedia("(max-width: 1000px)");
    const resetNavigation = () => {
      if (header.current?.contains(document.activeElement)) {
        if (media.matches) menuButton.current?.focus();
        else header.current?.querySelector<HTMLElement>(".brand")?.focus();
      }
      setMenuOpen(false); setOpenGroup(null);
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
    try { localStorage.setItem("rivalry-theme", nextLight ? "light" : "dark"); } catch { /* Theme still works without storage. */ }
  }

  return <header ref={header} className="site-header" onKeyDown={event => {
    if (event.key !== "Escape") return;
    if (openGroup) {
      header.current?.querySelector<HTMLButtonElement>(`#nav-trigger-${openGroup}`)?.focus();
      setOpenGroup(null); event.preventDefault(); event.stopPropagation();
    } else if (menuOpen) {
      closeNavigation(); menuButton.current?.focus(); event.preventDefault();
    }
  }}>
    <div className="site-masthead">
      <div className="masthead-identity"><Brand /><p>Two careers.<br /><strong>Every chapter.</strong></p></div>
      <div className="header-players" aria-label="Player profiles">
        {(["messi", "ronaldo"] as const).map(player => <Link href={`/players/${player}`} key={player} className="header-player" aria-label={`${player === "messi" ? "Lionel Messi" : "Cristiano Ronaldo"} profile`} aria-current={pathname === `/players/${player}` ? "page" : undefined} onClick={closeNavigation}>
          <span className={`header-player-photo ${player}`}><Image src={players[player].image} alt="" width={players[player].imageWidth} height={players[player].imageHeight} sizes="60px" /></span>
          <span>{player === "messi" ? "Lionel Messi" : "Cristiano Ronaldo"}<small>{player === "messi" ? "Argentina · No. 10" : "Portugal · No. 7"}</small></span>
        </Link>)}
      </div>
      <div className="header-tools">
        <button className="header-search" onClick={() => { closeNavigation(); onSearch(); }} aria-label="Search the site"><Search size={18} aria-hidden="true" /><span>Search</span><kbd>⌘ K</kbd></button>
        <button className="icon-button theme-toggle" aria-label="Toggle light or dark theme" onClick={toggleTheme}><Moon size={19} className="theme-light-icon" aria-hidden="true" /><Sun size={19} className="theme-dark-icon" aria-hidden="true" /></button>
        <button className="header-menu-toggle" ref={menuButton} aria-label={menuOpen ? "Close menu" : "Open menu"} aria-controls="main-navigation" aria-expanded={menuOpen} onClick={() => { setMenuOpen(!menuOpen); setOpenGroup(null); }}>{menuOpen ? <X size={21} aria-hidden="true" /> : <Menu size={21} aria-hidden="true" />}<span>Menu</span></button>
      </div>
    </div>
    <div className={`site-navigation ${menuOpen ? "is-open" : ""}`} id="main-navigation">
      <nav className="primary-navigation" aria-label="Main navigation">
        <ul className="primary-nav-list">
          {navigationGroups.map(group => {
            const active = group.href ? isActivePath(pathname, group.href) : group.items?.some(item => isActivePath(pathname, item.href));
            const expanded = openGroup === group.id;
            return <li key={group.id} className={`primary-nav-group ${active ? "is-current" : ""}`} onBlur={event => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpenGroup(current => current === group.id ? null : current);
            }}>
              {group.href ? <Link className="primary-nav-trigger" href={group.href} aria-current={active ? "page" : undefined} onClick={closeNavigation}>{group.label}</Link> : <>
                <button id={`nav-trigger-${group.id}`} className="primary-nav-trigger" aria-expanded={expanded} aria-controls={`nav-panel-${group.id}`} onClick={() => setOpenGroup(expanded ? null : group.id)} onKeyDown={event => {
                  if (event.key === "ArrowDown") {
                    event.preventDefault(); setOpenGroup(group.id);
                    requestAnimationFrame(() => header.current?.querySelector<HTMLElement>(`#nav-panel-${group.id} a`)?.focus());
                  }
                }}>{group.label}<ChevronDown size={13} aria-hidden="true" /></button>
                <ul id={`nav-panel-${group.id}`} className="nav-dropdown" hidden={!expanded} aria-labelledby={`nav-trigger-${group.id}`}>
                  {group.items?.map(({ href, label, icon: Icon }) => <li key={href}><Link href={href} aria-current={isActivePath(pathname, href) ? "page" : undefined} onClick={closeNavigation}><Icon size={17} strokeWidth={1.6} aria-hidden="true" /><span>{label}</span><ChevronRight size={13} aria-hidden="true" /></Link></li>)}
                </ul>
              </>}
            </li>;
          })}
        </ul>
        <Link className="navigation-update" href="/updates" onClick={closeNavigation}><span className="update-indicator" />Updated <time dateTime={snapshotDate}>{snapshotLabel}</time><ArrowUpRight size={13} aria-hidden="true" /></Link>
        <div className="mobile-profile-links"><Link href="/players/messi" onClick={closeNavigation}>Lionel Messi <ArrowUpRight size={14} /></Link><Link href="/players/ronaldo" onClick={closeNavigation}>Cristiano Ronaldo <ArrowUpRight size={14} /></Link></div>
      </nav>
    </div>
  </header>;
}

export function SiteShell({ children }: { children: ReactNode }) {
  const { snapshotLabel } = useFootballData();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") { event.preventDefault(); dialog.current?.showModal(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);
  return <>
    <a href="#main-content" className="skip-link">Skip to content</a>
    <SiteHeader key={pathname} pathname={pathname} onSearch={() => dialog.current?.showModal()} />
    <div className="site-body">
      <main id="main-content" tabIndex={-1}>{children}</main>
      <footer className="site-footer">
        <div className="footer-intro"><span className="footer-brand">THE RIVALRY<span>.</span></span><p>An independent archive of Messi and Ronaldo’s careers.</p></div>
        <nav className="footer-navigation" aria-label="Footer navigation">
          <div><span className="section-kicker">THE PROJECT</span><div className="footer-links"><Link href="/about">About</Link><Link href="/methodology">Our data</Link><Link href="/updates">Update log</Link><Link href="/credits">Photo credits</Link></div></div>
          <div><span className="section-kicker">INFORMATION</span><div className="footer-links"><Link href="/terms">Terms of use</Link><Link href="/privacy">Privacy</Link><Link href="/cookies">Cookies</Link><Link href="/disclaimer">Disclaimer</Link></div></div>
          <div><span className="section-kicker">FIND YOUR WAY</span><div className="footer-links"><Link href="/contact">Contact & corrections</Link><Link href="/accessibility">Accessibility</Link><Link href="/sitemap">Site map</Link><Link href="/admin">Admin</Link></div></div>
        </nav>
        <div className="footer-bottom"><span>© {new Date().getFullYear()} The Rivalry. An independent football project.</span><span>Data updated {snapshotLabel}</span></div>
      </footer>
    </div>
    <dialog ref={dialog} className="search-dialog" onClick={event => { if (event.target === event.currentTarget) dialog.current?.close(); }}><div className="search-dialog-inner"><div className="dialog-search-row"><Search size={21} /><input autoComplete="off" placeholder="Players, competitions, stories…" aria-label="Search pages" value={query} onChange={event => setQuery(event.target.value)} /><button className="icon-button" aria-label="Close search" onClick={() => dialog.current?.close()}><X size={19} /></button></div><div className="search-results">{searchItems.filter(item => item.label.toLowerCase().includes(query.toLowerCase())).map(({ href, label, icon: Icon }) => <Link href={href} key={href} onClick={() => { dialog.current?.close(); setQuery(""); }}><Icon size={19} /><span>{label}</span><ArrowUpRight size={15} /></Link>)}{!searchItems.some(item => item.label.toLowerCase().includes(query.toLowerCase())) && <p className="no-results">No matches. Try “goals”, “Messi” or “sources”.</p>}</div><div className="search-dialog-footer">Search players, competitions and articles.<kbd>ESC to close</kbd></div></div></dialog>
  </>;
}

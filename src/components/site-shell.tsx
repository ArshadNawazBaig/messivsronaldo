"use client";
import { useFootballData } from "@/components/data-provider";

import Link from "next/link";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { ArrowDownUp, ArrowUpRight, BarChart3, BookOpen, CalendarDays, ChevronRight, CircleHelp, Globe2, LayoutDashboard, Menu, Moon, Search, ShieldCheck, Sun, Trophy, X } from "lucide-react";

const navItems = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/2026", label: "2026 stats", icon: CalendarDays },
  { href: "/clubs", label: "Club by club", icon: BarChart3 },
  { href: "/world-cup", label: "World Cup", icon: Globe2 },
  { href: "/compare", label: "Compare stats", icon: ArrowDownUp },
  { href: "/seasons", label: "Years & seasons", icon: CalendarDays },
  { href: "/champions-league", label: "Champions League", icon: Trophy },
  { href: "/la-liga", label: "La Liga", icon: BarChart3 },
  { href: "/international", label: "International", icon: Globe2 },
  { href: "/honours", label: "Trophies & awards", icon: Trophy },
];
const searchItems = [...navItems, { href: "/penalties", label: "Penalties & conversion", icon: BarChart3 }, { href: "/free-kicks", label: "Free kicks & goal types", icon: BarChart3 }, { href: "/hat-tricks", label: "Hat-tricks", icon: BarChart3 }, { href: "/head-to-head", label: "Direct head-to-head meetings", icon: ArrowDownUp }, { href: "/copa-america-vs-euros", label: "Copa América vs Euros", icon: Globe2 }, { href: "/european-clubs", label: "European club records", icon: Globe2 }, { href: "/league", label: "All domestic leagues", icon: BarChart3 }, { href: "/records", label: "Records & race to 1,000", icon: Trophy }, { href: "/goals", label: "Career goals", icon: BarChart3 }, { href: "/assists", label: "Understanding assists", icon: BookOpen }, { href: "/methodology", label: "Sources & methodology", icon: ShieldCheck }, { href: "/insights", label: "The reading room", icon: BookOpen }, { href: "/players/messi", label: "Lionel Messi profile", icon: CircleHelp }, { href: "/players/ronaldo", label: "Cristiano Ronaldo profile", icon: CircleHelp }];

function subscribeMobile(callback: () => void) {
  const media = window.matchMedia("(max-width: 760px)");
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}
const mobileSnapshot = () => window.matchMedia("(max-width: 760px)").matches;
const desktopSnapshot = () => false;

export function Brand() {
  return <Link href="/" className="brand" aria-label="The Rivalry home"><span className="brand-symbol"><span /><span /><span /></span><span>THE<span className="brand-second">RIVALRY<span className="brand-period">.</span></span></span></Link>;
}

export function SiteShell({ children }: { children: ReactNode }) {
  const { snapshotLabel } = useFootballData();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [light, setLight] = useState(false);
  const [query, setQuery] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const sidebar = useRef<HTMLElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const mobile = useSyncExternalStore(subscribeMobile, mobileSnapshot, desktopSnapshot);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") { event.preventDefault(); dialog.current?.showModal(); }
      if (event.key === "Escape" && menuOpen) { setMenuOpen(false); requestAnimationFrame(() => menuButton.current?.focus()); }
      if (event.key === "Tab" && menuOpen && mobile) {
        const items = sidebar.current?.querySelectorAll<HTMLElement>("a[href], button");
        if (items?.length) {
          const first = items[0]; const last = items[items.length - 1];
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
          if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen, mobile]);
  useEffect(() => {
    if (!mobile || !menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [menuOpen, mobile]);
  function toggleTheme() {
    const nextLight = document.documentElement.dataset.theme !== "light";
    document.documentElement.dataset.theme = nextLight ? "light" : "dark";
    setLight(nextLight);
    try { localStorage.setItem("rivalry-theme", nextLight ? "light" : "dark"); } catch { /* Theme still works when browser storage is unavailable. */ }
  }
  return <>
    <a href="#main-content" className="skip-link">Skip to content</a>
    <aside ref={sidebar} id="main-navigation" inert={mobile && !menuOpen ? true : undefined} role={mobile && menuOpen ? "dialog" : undefined} aria-modal={mobile && menuOpen ? true : undefined} className={`sidebar ${menuOpen ? "is-open" : ""}`} aria-label="Main navigation">
      <div className="sidebar-brand"><Brand /><button className="icon-button mobile-only" onClick={() => setMenuOpen(false)} aria-label="Close menu"><X size={20} /></button></div>
      <div className="sidebar-navigation">
        <div className="nav-caption">THE COMPARISON</div>
        <nav aria-label="Comparisons">{navItems.map(({ href, label, icon: Icon }) => <Link onClick={() => setMenuOpen(false)} href={href} key={href} className={`nav-link ${pathname === href ? "active" : ""}`} aria-current={pathname === href ? "page" : undefined}><Icon size={18} strokeWidth={1.7} /><span>{label}</span>{pathname === href && <span className="nav-active-dot" />}</Link>)}</nav>
        <div className="nav-caption second-caption">BEYOND THE NUMBERS</div>
        <nav aria-label="Editorial and sources"><Link className={`nav-link ${pathname.startsWith("/insights") ? "active" : ""}`} href="/insights" onClick={() => setMenuOpen(false)}><BookOpen size={18} strokeWidth={1.7} />The reading room</Link><Link className={`nav-link ${pathname === "/methodology" ? "active" : ""}`} href="/methodology" onClick={() => setMenuOpen(false)}><ShieldCheck size={18} strokeWidth={1.7} />Sources & methodology</Link></nav>
      </div>
      <div className="sidebar-bottom"><div className="sidebar-note"><span className="eyebrow"><span className="tiny-dot" /> BUILT FOR THE BEAUTIFUL GAME</span><p>Greatness deserves<br />a little perspective.</p><Link href="/about" onClick={() => setMenuOpen(false)}>Our philosophy <ArrowUpRight size={14} /></Link></div><div className="sidebar-foot"><span>Two players. A world of football.</span><span>EST. 2026</span></div></div>
    </aside>
    {menuOpen && <button className="sidebar-scrim" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}
    <div className="site-body" inert={mobile && menuOpen ? true : undefined}>
      <header className="topbar"><div className="breadcrumb"><button className="icon-button mobile-only" ref={menuButton} aria-label="Open menu" aria-controls="main-navigation" aria-expanded={menuOpen} onClick={() => { setMenuOpen(true); requestAnimationFrame(() => sidebar.current?.querySelector<HTMLElement>("a")?.focus()); }}><Menu size={21} /></button><span className="desktop-only">Football, in perspective</span><span className="mobile-brand">THE RIVALRY<span>.</span></span><ChevronRight size={13} className="desktop-only" /><span className="breadcrumb-current desktop-only">{pathname.startsWith("/admin") ? "Admin dashboard" : "Messi vs Ronaldo"}</span></div><div className="topbar-actions"><button className="search-trigger" onClick={() => dialog.current?.showModal()} aria-label="Search the site"><Search size={16} /><span>Find a comparison</span><kbd>⌘ K</kbd></button><span className="topbar-divider" /><button className="icon-button theme-toggle" aria-label="Toggle light or dark theme" onClick={toggleTheme}>{light ? <Moon size={18} /> : <Sun size={18} />}</button><Link href="/methodology" className="source-status"><ShieldCheck size={15} /><span>Sources included</span></Link></div></header>
      <main id="main-content">{children}</main>
      <footer className="site-footer"><div><span className="footer-brand">THE RIVALRY<span>.</span></span><p>Independent perspectives on two extraordinary careers.</p></div><div className="footer-links"><Link href="/about">About</Link><Link href="/methodology">Our data</Link><Link href="/contact">Corrections</Link><Link href="/privacy">Privacy</Link><Link href="/credits">Photo credits</Link><Link href="/updates">Update log</Link><Link href="/admin">Admin</Link></div><div className="footer-bottom"><span>© {new Date().getFullYear()} The Rivalry. An independent football project.</span><span>Data updated {snapshotLabel}</span></div></footer>
    </div>
    <dialog ref={dialog} className="search-dialog" onClick={event => { if (event.target === event.currentTarget) dialog.current?.close(); }}><div className="search-dialog-inner"><div className="dialog-search-row"><Search size={21} /><input autoComplete="off" placeholder="Players, competitions, stories…" aria-label="Search pages" value={query} onChange={event => setQuery(event.target.value)} /><button className="icon-button" aria-label="Close search" onClick={() => dialog.current?.close()}><X size={19} /></button></div><div className="search-results">{searchItems.filter(item => item.label.toLowerCase().includes(query.toLowerCase())).map(({ href, label, icon: Icon }) => <Link href={href} key={href} onClick={() => { dialog.current?.close(); setQuery(""); setMenuOpen(false); }}><Icon size={19} /><span>{label}</span><ArrowUpRight size={15} /></Link>)}{!searchItems.some(item => item.label.toLowerCase().includes(query.toLowerCase())) && <p className="no-results">No matches. Try “goals”, “Messi” or “sources”.</p>}</div><div className="search-dialog-footer">Explore the numbers behind the rivalry.<kbd>ESC to close</kbd></div></div></dialog>
  </>;
}

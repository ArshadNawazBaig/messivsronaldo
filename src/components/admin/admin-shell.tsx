"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Activity, ArrowUpRight, BookOpenCheck, CalendarDays, ChevronRight, FileText, LayoutDashboard, LifeBuoy, LogOut, Menu, Moon, Plus, RefreshCw, Search, Settings2, ShieldCheck, Sun, Users, X } from "lucide-react";
import { adminHome, adminNavigation, type AdminNavIcon } from "@/lib/admin/navigation";
import styles from "./workspace.module.css";
const icons = { overview: LayoutDashboard, content: FileText, matches: CalendarDays, players: Users, statistics: Plus, updates: RefreshCw, review: BookOpenCheck, support: LifeBuoy, activity: Activity, settings: Settings2 } satisfies Record<AdminNavIcon, typeof Activity>;

export function AdminShell({ children, email }: { children: ReactNode; email: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState("");
  const navigation = useRef<HTMLDialogElement>(null);
  const search = useRef<HTMLDialogElement>(null);
  const items = adminNavigation.flatMap(group => [...group.items]);
  const current = items.find(item => item.href === pathname);
  useEffect(() => {
    const openSearch = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); search.current?.showModal(); }
    };
    window.addEventListener("keydown", openSearch);
    return () => window.removeEventListener("keydown", openSearch);
  }, []);
  async function signOut() {
    setSigningOut(true); setError("");
    try {
      const response = await fetch("/api/admin/logout", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      if (!response.ok) throw new Error("Sign out failed. Please try again.");
      router.replace("/admin/login"); router.refresh();
    } catch (failure) { setError((failure as Error).message); setSigningOut(false); }
  }
  function toggleTheme() {
    const theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.themePreference = theme;
    try { localStorage.setItem("rivalry-theme", theme); } catch { /* Theme works without persistence. */ }
  }
  function sidebar(mobile = false) { return <>
    <div className={styles.brandRow}><Link href={adminHome} className={styles.brand} onClick={() => navigation.current?.close()}><Image src="/images/brand/the-rivalry-mark.svg" width={32} height={38} alt="" unoptimized/><span>THE RIVALRY<small>ADMINISTRATION</small></span></Link>{mobile && <button className={styles.closeMenu} aria-label="Close admin navigation" onClick={() => navigation.current?.close()}><X size={20}/></button>}</div>
    <nav aria-label={mobile ? "Mobile admin navigation" : "Admin navigation"} className={styles.navigation}>{adminNavigation.map(group => <div key={group.label}><span className={styles.groupLabel}>{group.label}</span>{group.items.map(item => { const Icon = icons[item.icon]; return <Link href={item.href} key={item.href} aria-current={pathname === item.href ? "page" : undefined} onClick={() => navigation.current?.close()}><Icon size={18} strokeWidth={1.7}/><span>{item.label}</span>{pathname === item.href && <span className={styles.activeDot}/>}</Link>; })}</div>)}</nav>
    <div className={styles.sidebarFoot}><Link href="/" target="_blank" rel="noopener noreferrer">Open public website<ArrowUpRight size={15}/></Link></div>
  </>; }
  const matches = items.filter(item => `${item.label} ${item.description}`.toLowerCase().includes(query.trim().toLowerCase()));
  return <div className={styles.workspace}>
    <a className="skip-link" href="#admin-main">Skip to admin content</a>
    <aside className={styles.sidebar} aria-label="Admin workspace navigation">{sidebar()}</aside>
    <dialog ref={navigation} aria-label="Admin navigation" className={styles.mobileDrawer} onClick={event => { if (event.target === event.currentTarget) navigation.current?.close(); }}><div>{sidebar(true)}</div></dialog>
    <div className={styles.frame}>
      <header className={styles.topbar}>
        <div className={styles.topbarLeft}><button className={styles.menuButton} aria-label="Open admin navigation" onClick={event => { event.currentTarget.focus(); navigation.current?.showModal(); }}><Menu size={21}/></button><span className={styles.breadcrumb}>Workspace<ChevronRight size={14}/><strong>{current?.label ?? "Administration"}</strong></span></div>
        <div className={styles.topbarRight}><button className={styles.searchTrigger} onClick={event => { event.currentTarget.focus(); search.current?.showModal(); }} aria-label="Search admin tools"><Search size={17}/><span>Find a tool…</span><kbd>⌘ K</kbd></button><button className={styles.toolButton} onClick={toggleTheme} aria-label="Toggle light or dark theme"><Moon className="theme-light-icon" size={18}/><Sun className="theme-dark-icon" size={18}/></button><span className={styles.topbarDivider}/><div className={styles.account}><span className={styles.avatar}>{email.charAt(0).toUpperCase() || "A"}</span><span>Administrator<small title={email}>{email}</small></span></div><button className={styles.toolButton} onClick={signOut} disabled={signingOut} aria-label="Sign out"><LogOut size={18}/></button></div>
      </header>
      <main id="admin-main" tabIndex={-1} className={styles.main}>{error && <div className="admin-message error" role="alert">{error}</div>}{children}</main>
      <footer className={styles.footer}><span>The Rivalry · Administration</span><span><ShieldCheck size={13}/> Secure session · All match dates use UTC</span></footer>
    </div>
    <dialog ref={search} className={styles.searchDialog} onClick={event => { if (event.target === event.currentTarget) search.current?.close(); }} aria-label="Search admin tools"><div className={styles.searchInput}><Search size={20}/><input aria-label="Find an admin tool" autoComplete="off" placeholder="Search content, matches, settings…" value={query} onChange={event => setQuery(event.target.value)}/><button aria-label="Close admin search" onClick={() => search.current?.close()}><X size={18}/></button></div><div className={styles.searchResults}>{matches.map(item => { const Icon = icons[item.icon]; return <Link key={item.href} href={item.href} onClick={() => { search.current?.close(); setQuery(""); }}><Icon size={20}/><span><strong>{item.label}</strong><small>{item.description}</small></span><ChevronRight size={16}/></Link>; })}{!matches.length && <p>No tools found. Try “matches” or “articles”.</p>}</div></dialog>
  </div>;
}

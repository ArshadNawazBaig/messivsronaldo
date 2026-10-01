"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, LoaderCircle, LockKeyhole, ShieldCheck } from "lucide-react";
import { adminHome } from "@/lib/admin/navigation";
import styles from "./workspace.module.css";

export function AdminLogin({ configured }: { configured: boolean }) {
  const router = useRouter(); const pathname = usePathname();
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false); const [visible, setVisible] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const values = new FormData(event.currentTarget); setBusy(true); setError("");
    try {
      const response = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: values.get("email"), password: values.get("password") }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error || "Sign-in failed. Please try again.");
      if (pathname === "/admin/login" || pathname === "/admin") router.replace(adminHome);
      router.refresh();
    } catch (failure) { setError((failure as Error).message); setBusy(false); }
  }
  return <div className={styles.login}>
    <aside className={styles.loginStory} aria-label="The Rivalry administration"><Link href="/" className={styles.brand}><Image src="/images/brand/the-rivalry-mark.svg" alt="" width={34} height={40} unoptimized/><span>THE RIVALRY<small>ADMINISTRATION</small></span></Link><div><span className={styles.loginKicker}>BEHIND EVERY GREAT STORY</span><h2>A thoughtful space<br/>to run The Rivalry.</h2><p>From the next match record to your next feature. Bring your content, statistics and community together.</p><ul><li><Check size={16}/> Create and publish across nine languages</li><li><Check size={16}/> Keep every player statistic in sync</li><li><Check size={16}/> Review sources and reader feedback</li></ul></div><footer>Two careers. Every chapter. One workspace.</footer></aside>
    <div className={styles.loginPane}><div className={styles.loginForm}><span className={styles.loginMark}><LockKeyhole size={21}/></span><h1>Welcome back.</h1><p>Sign in to your private publishing workspace.</p>
      {configured ? <form onSubmit={submit} aria-busy={busy}><label>Email address<input type="email" name="email" autoComplete="username" placeholder="you@example.com" maxLength={254} required disabled={busy}/></label><label htmlFor="admin-password">Admin password</label><div className={styles.passwordField}><input id="admin-password" type={visible ? "text" : "password"} name="password" autoComplete="current-password" placeholder="Enter your password" maxLength={256} required disabled={busy}/><button type="button" onClick={() => setVisible(value => !value)} aria-label={visible ? "Hide password" : "Show password"} aria-pressed={visible}>{visible ? <EyeOff size={17}/> : <Eye size={17}/>}</button></div>{error && <p className="admin-message error" role="alert">{error}</p>}<button type="submit" className="admin-button primary" disabled={busy}>{busy ? <LoaderCircle size={17} className="admin-spin"/> : <ArrowRight size={17}/>} {busy ? "Signing in…" : "Sign in to dashboard"}</button><span className={styles.loginHelp}><ShieldCheck size={14}/> Protected session · Automatically expires after 8 hours</span></form>
      : <div className="admin-setup-note"><h2>Administrator setup required</h2><p>Configure the admin email, password and session secret on the server before signing in.</p><p className="admin-help">The site owner can run <code>npm run admin:setup -- --email you@example.com</code> and restart the app.</p></div>}
      <Link href="/" className={styles.loginBack}><ArrowLeft size={14}/> Back to the public website</Link>
    </div></div>
  </div>;
}

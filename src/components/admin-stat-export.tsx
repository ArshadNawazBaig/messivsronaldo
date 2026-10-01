"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { Download } from "lucide-react";
import { useFootballData } from "./data-provider";
import { useI18n } from "./i18n-provider";
import type { ImagePlayers, ImageTheme, StatImage } from "@/lib/stat-image";
import styles from "./admin-stat-export.module.css";
import { adminHintCookie } from "@/lib/admin/session-cookie";

type Selection = {
  stats: StatImage[];
  player: ImagePlayers;
  path: string;
  theme: ImageTheme;
};
const Context = createContext<
  ((stats: StatImage[], player: ImagePlayers) => void) | null
>(null);
const ImageDialog = dynamic(() => import("./stat-image-dialog"), {
  ssr: false,
});

export function AdminExportProvider({
  admin: initialAdmin,
  children,
}: {
  admin?: boolean;
  children: ReactNode;
}) {
  const [selection, setSelection] = useState<Selection | null>(null);
  const [admin, setAdmin] = useState(initialAdmin ?? false);
  const pathname = usePathname();
  useEffect(() => {
    // Visiting /admin also upgrades sessions created before the UI hint existed.
    if (initialAdmin) document.cookie = `${adminHintCookie}=1; Path=/; Max-Age=28800; SameSite=Strict${location.protocol === "https:" ? "; Secure" : ""}`;
    const controller = new AbortController();
    let pending = false;
    async function checkSession() {
      if (pending || document.visibilityState === "hidden") return;
      if (!document.cookie.split(";").some(cookie => cookie.trim() === `${adminHintCookie}=1`)) {
        setAdmin(false);
        return;
      }
      pending = true;
      try {
        const response = await fetch("/api/admin/session", { cache: "no-store", signal: controller.signal });
        const result = response.ok ? await response.json() : null;
        if (!controller.signal.aborted) setAdmin(result?.admin === true);
      } catch { if (!controller.signal.aborted) setAdmin(false); }
      finally { pending = false; }
    }
    const timer = window.setTimeout(checkSession, 0);
    window.addEventListener("focus", checkSession);
    return () => { window.clearTimeout(timer); controller.abort(); window.removeEventListener("focus", checkSession); };
  }, [initialAdmin, pathname]);
  if (selection && (!admin || selection.path !== pathname)) setSelection(null);
  return (
    <Context.Provider
      value={
        admin
          ? (stats, player) =>
              setSelection({
                stats,
                player,
                path: pathname,
                // Snapshot the active site theme when the admin opens the preview.
                theme:
                  document.documentElement.dataset.theme === "dark"
                    ? "dark"
                    : "light",
              })
          : null
      }
    >
      {children}
      {admin && selection && selection.path === pathname && (
        <ImageDialog
          stats={selection.stats}
          initialPlayer={selection.player}
          initialTheme={selection.theme}
          onClose={() => setSelection(null)}
        />
      )}
    </Context.Provider>
  );
}

export function StatImageButton({
  stat,
  stats,
  player = "both",
  placement = "row",
}: {
  stat?: StatImage;
  stats?: StatImage[];
  player?: ImagePlayers;
  placement?: "row" | "toolbar";
}) {
  const open = useContext(Context);
  const { snapshotDate } = useFootballData();
  const { t } = useI18n();
  if (!open) return null;
  const items = stats ?? (stat ? [stat] : []);
  if (!items.length) return null;
  return (
    <span
      className={placement === "toolbar" ? styles.toolbar : styles.rowAction}
    >
      <button
        type="button"
        className={styles.launch}
        title={t("Admin image export")}
        aria-label={`${t("Download image")}: ${t(items[0].title)}`}
        onClick={(event) => {
          // Safari does not focus buttons on pointer clicks by default.
          event.currentTarget.focus({ preventScroll: true });
          open(
            items.map((item) => ({ ...item, date: item.date ?? snapshotDate })),
            player,
          );
        }}
      >
        <Download size={14} aria-hidden="true" />
        <span>{t("Download image")}</span>
      </button>
    </span>
  );
}

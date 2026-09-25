"use client";
import { createContext, useContext, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { Download } from "lucide-react";
import { useFootballData } from "./data-provider";
import { useI18n } from "./i18n-provider";
import type { ImagePlayers, ImageTheme, StatImage } from "@/lib/stat-image";
import styles from "./stat-image-dialog.module.css";

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
  admin,
  children,
}: {
  admin: boolean;
  children: ReactNode;
}) {
  const [selection, setSelection] = useState<Selection | null>(null);
  const pathname = usePathname();
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

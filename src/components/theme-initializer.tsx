"use client";

import { useLayoutEffect, useRef } from "react";
import { useServerInsertedHTML } from "next/navigation";

// Keep this function self-contained: it also runs before paint in the server HTML.
function initializeTheme() {
  let preference = "system";
  try {
    const saved = localStorage.getItem("rivalry-theme");
    if (saved === "dark" || saved === "light") preference = saved;
  } catch { /* System preference still works when storage is blocked. */ }
  const root = document.documentElement;
  root.dataset.themePreference = preference;
  root.dataset.theme = preference === "system"
    ? window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    : preference;
}
const themeScript = `(${initializeTheme.toString()})();`;

export function ThemeInitializer() {
  const inserted = useRef(false);
  useServerInsertedHTML(() => {
    if (inserted.current) return null;
    inserted.current = true;
    // Emit executable JavaScript only into the initial server HTML. A 404 can
    // remount the root layout on the client, where inline script JSX is inert.
    return <script id="rivalry-theme-init" dangerouslySetInnerHTML={{ __html: themeScript }} />;
  });

  useLayoutEffect(() => {
    // Restore the preference before paint if a fallback remounts <html>.
    initializeTheme();
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const followSystem = () => {
      if (document.documentElement.dataset.themePreference === "system") {
        document.documentElement.dataset.theme = media.matches ? "dark" : "light";
      }
    };
    media.addEventListener("change", followSystem);
    return () => media.removeEventListener("change", followSystem);
  }, []);

  return null;
}

"use client";

import { useLayoutEffect, useRef } from "react";
import { useServerInsertedHTML } from "next/navigation";

const themeScript = `(function(){try{var theme=localStorage.getItem('rivalry-theme');if(theme==='dark'||theme==='light')document.documentElement.dataset.theme=theme;}catch(e){}})();`;

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
    try {
      const theme = localStorage.getItem("rivalry-theme");
      if (theme === "dark" || theme === "light") document.documentElement.dataset.theme = theme;
    } catch { /* Browsing and the theme toggle still work when storage is blocked. */ }
  }, []);

  return null;
}

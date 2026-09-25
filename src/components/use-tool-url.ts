"use client";

import { useCallback, useEffect, useState } from "react";
import { cancelToolHash, queueToolHash } from "@/lib/tool-url";

export function useToolUrl() {
  const [owner] = useState(() => Symbol("tool-url"));
  useEffect(() => {
    const cancel = () => cancelToolHash(owner);
    window.addEventListener("popstate", cancel);
    window.addEventListener("hashchange", cancel);
    window.addEventListener("pagehide", cancel);
    return () => {
      cancel();
      window.removeEventListener("popstate", cancel);
      window.removeEventListener("hashchange", cancel);
      window.removeEventListener("pagehide", cancel);
    };
  }, [owner]);
  return useCallback((hash: string) => queueToolHash(owner, hash), [owner]);
}

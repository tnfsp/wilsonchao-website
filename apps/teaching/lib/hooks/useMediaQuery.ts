"use client";

import { useEffect, useState } from "react";

/**
 * Returns false on the server and before the first effect runs, so SSR / first
 * paint always uses the safer default (mobile). After mount we read the actual
 * viewport and subscribe to changes.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

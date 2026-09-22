import { useEffect } from "react";
import { useThemeStore } from "./themeStore";

/**
 * Keeps `themeStore.systemPrefersDark` live so a "system" choice follows an OS theme change
 * without a reload, and so the toggle's "currently light/dark" status stays accurate.
 */
export function useSystemTheme(): void {
  const setSystemPrefersDark = useThemeStore((s) => s.setSystemPrefersDark);
  useEffect(() => {
    if (typeof matchMedia !== "function") return;
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [setSystemPrefersDark]);
}

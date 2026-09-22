import { themeAttribute, type ThemeChoice } from "./themeResolution";

/**
 * Reflects a theme choice onto `<html data-theme>`, the hook `styles.css` keys off: "system"
 * clears the attribute so `@media (prefers-color-scheme)` decides instead. The one place that
 * touches the DOM for theming, called both before the app mounts (`applyStoredTheme`) and on
 * every later change (`themeStore`).
 */
export function applyThemeAttribute(choice: ThemeChoice): void {
  const attr = themeAttribute(choice);
  const root = document.documentElement;
  if (attr) root.setAttribute("data-theme", attr);
  else root.removeAttribute("data-theme");
}

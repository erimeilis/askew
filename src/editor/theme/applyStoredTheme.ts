import { kv } from "@/persistence/browser/kv";
import { STORAGE_CONFIG } from "@/config/storage";
import { isThemeChoice, type ThemeChoice } from "./themeResolution";
import { applyThemeAttribute } from "./applyThemeAttribute";

/**
 * Reads the persisted theme choice and applies it to `<html>` before the app mounts (see
 * `main.tsx`), so an explicit light/dark choice that disagrees with the OS never flashes the
 * wrong theme first. Never rejects: a missing key or a read failure just leaves "system" in
 * place, which already matches the OS via the `@media` block with no JS at all.
 */
export async function applyStoredTheme(): Promise<ThemeChoice> {
  let choice: ThemeChoice = "system";
  try {
    const saved = await kv.get<ThemeChoice>(STORAGE_CONFIG.themeKey);
    if (isThemeChoice(saved)) choice = saved;
  } catch {
    choice = "system";
  }
  applyThemeAttribute(choice);
  return choice;
}

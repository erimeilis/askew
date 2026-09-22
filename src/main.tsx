import { mount } from "@/editor/mount";
import { EDITOR_CONFIG } from "@/config/editor";
import { applyStoredTheme } from "@/editor/theme/applyStoredTheme";

// Applied before the first render, not in a useEffect, so an explicit light/dark choice that
// disagrees with the OS never flashes the system theme first. `applyStoredTheme` never rejects.
void applyStoredTheme().finally(() => mount(EDITOR_CONFIG.rootElementId));

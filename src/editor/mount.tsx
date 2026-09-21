import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "@/editor/App";
export function mount(rootId: string): void {
  const el = document.getElementById(rootId);
  if (!el) throw new Error(`mount point #${rootId} not found`);
  createRoot(el).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

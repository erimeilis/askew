import { useCallback, useRef, useState } from "react";
import { EDITOR_CONFIG } from "@/config/editor";
import { type View, toWorld, zoomAt, panBy } from "./viewMath";

const local = (e: { clientX: number; clientY: number }, el: Element) => {
  const r = el.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
};

/** Owns pan/zoom state and screen↔world conversion for the canvas. Tools never see this. */
export function useView() {
  const [view, setView] = useState<View>({
    tx: 200,
    ty: 200,
    s: EDITOR_CONFIG.zoom.initialPxPerMm,
  });
  const pan = useRef<{ x: number; y: number } | null>(null);

  const onWheel = useCallback((e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const f = e.deltaY < 0 ? EDITOR_CONFIG.zoom.wheelFactor : 1 / EDITOR_CONFIG.zoom.wheelFactor;
    setView((v) => zoomAt(v, local(e, e.currentTarget), f, EDITOR_CONFIG.zoom));
  }, []);

  const startPan = (e: React.PointerEvent) => {
    pan.current = { x: e.clientX, y: e.clientY };
  };
  const panMove = (e: React.PointerEvent) => {
    if (!pan.current) return false;
    const dx = e.clientX - pan.current.x;
    const dy = e.clientY - pan.current.y;
    pan.current = { x: e.clientX, y: e.clientY };
    setView((v) => panBy(v, dx, dy));
    return true;
  };
  const endPan = () => {
    pan.current = null;
  };

  const worldAt = (e: { clientX: number; clientY: number }, el: Element) =>
    toWorld(view, local(e, el));

  return {
    view,
    setView,
    onWheel,
    startPan,
    panMove,
    endPan,
    worldAt,
    isPanning: () => pan.current !== null,
  };
}

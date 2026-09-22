import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useEditorStore } from "@/editor/store/editorStore";
import { useView } from "@/editor/view/useView";
import { hitTest } from "@/editor/view/hitTest";
import { EDITOR_CONFIG } from "@/config/editor";
import { pointById, floorPoints } from "@/model/queries";
import { tools } from "@/editor/tools";
import { GridLayer } from "./layers/GridLayer";
import { EmptyHintLayer } from "./layers/EmptyHintLayer";
import { RoomsLayer } from "./layers/RoomsLayer";
import { WallsLayer } from "./layers/WallsLayer";
import { OpeningsLayer } from "./layers/OpeningsLayer";
import { FixturesLayer } from "./layers/FixturesLayer";
import { DimensionsLayer } from "./layers/DimensionsLayer";
import { PointsLayer } from "./layers/PointsLayer";
import { DraftLayer } from "./layers/DraftLayer";

export function Canvas() {
  const svg = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const v = useView();
  const s = useEditorStore();
  const plan = s.plan();
  const result = s.results[s.activeFloorId];
  // Nothing persisted on the floor and no in-progress room draft either: the moment either
  // one appears, the hint must go, so it never sits on top of real content.
  const isFloorEmpty = floorPoints(plan, s.activeFloorId).length === 0 && s.draft.length === 0;

  useLayoutEffect(() => {
    const el = svg.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const box = entry.contentRect;
      setSize({ width: box.width, height: box.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Tools never see the view, so the pixel snap radius is converted to world
  // millimetres here and kept on the store. Selecting the action rather than
  // reading it off `s` gives a stable reference, so the effect depends only on
  // the scale and needs no suppression.
  const setSnapMm = useEditorStore((st) => st.setSnapMm);
  useEffect(() => {
    setSnapMm(EDITOR_CONFIG.snapPx / v.view.s);
  }, [setSnapMm, v.view.s]);

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    // The SVG root is not focusable, so the browser's default mousedown-derived action
    // (compatibility-dispatched from this pointerdown) blurs whatever is currently
    // focused — including a prompt input that a tool is about to open synchronously
    // below. Suppressing that default keeps focus wherever our own effects put it.
    e.preventDefault();
    if (e.button === 1 || e.shiftKey) {
      v.startPan(e);
      return;
    }
    const raw = v.worldAt(e, e.currentTarget);
    const hit = hitTest(plan, s.activeFloorId, raw, EDITOR_CONFIG.hitPx / v.view.s);
    const w = hit?.type === "point" ? pointById(plan, hit.id) : raw;
    tools[s.tool].onClick(w, hit, s);
    if (s.tool === "select" && hit?.type === "point") {
      dragging.current = true;
      tools[s.tool].onDragStart?.(hit, s);
    }
  };

  const endDrag = () => {
    if (!dragging.current) return;
    dragging.current = false;
    tools[s.tool].onDragEnd?.(s);
  };

  return (
    <svg
      ref={svg}
      className="canvas"
      onWheel={v.onWheel}
      onPointerDown={onPointerDown}
      onPointerMove={(e) => {
        if (v.panMove(e)) return;
        const world = v.worldAt(e, e.currentTarget);
        if (dragging.current) tools[s.tool].onDrag?.(world, s);
        else tools[s.tool].onMove?.(world, s);
      }}
      onPointerUp={() => {
        endDrag();
        v.endPan();
      }}
      onPointerLeave={() => {
        endDrag();
        v.endPan();
      }}
    >
      <GridLayer view={v.view} width={size.width} height={size.height} />
      <EmptyHintLayer visible={isFloorEmpty} width={size.width} height={size.height} />
      <g transform={`translate(${v.view.tx} ${v.view.ty}) scale(${v.view.s})`}>
        <RoomsLayer plan={plan} floorId={s.activeFloorId} selection={s.selection} />
        <WallsLayer plan={plan} floorId={s.activeFloorId} selection={s.selection} />
        <OpeningsLayer plan={plan} floorId={s.activeFloorId} selection={s.selection} />
        <FixturesLayer plan={plan} floorId={s.activeFloorId} selection={s.selection} />
        <DimensionsLayer plan={plan} floorId={s.activeFloorId} />
        <PointsLayer
          plan={plan}
          floorId={s.activeFloorId}
          scale={v.view.s}
          selection={s.selection}
          pending={s.pending}
          unconstrained={result?.unconstrained ?? []}
        />
        <DraftLayer draft={s.draft} scale={v.view.s} />
      </g>
    </svg>
  );
}

import type { View } from "@/editor/view/viewMath";
import { EDITOR_CONFIG } from "@/config/editor";

export function GridLayer({ view, width, height }: { view: View; width: number; height: number }) {
  const step = EDITOR_CONFIG.gridMm * view.s;
  if (step < EDITOR_CONFIG.gridMinPx) return null;
  const x0 = ((view.tx % step) + step) % step;
  const y0 = ((view.ty % step) + step) % step;
  const majorStep = EDITOR_CONFIG.gridMm * EDITOR_CONFIG.gridMajorEvery * view.s;
  const majorX0 = ((view.tx % majorStep) + majorStep) % majorStep;
  const majorY0 = ((view.ty % majorStep) + majorStep) % majorStep;
  const xs: number[] = [];
  const ys: number[] = [];
  const majorXs: number[] = [];
  const majorYs: number[] = [];
  for (let x = x0; x < width; x += step) xs.push(x);
  for (let y = y0; y < height; y += step) ys.push(y);
  for (let x = majorX0; x < width; x += majorStep) majorXs.push(x);
  for (let y = majorY0; y < height; y += majorStep) majorYs.push(y);
  return (
    <g className="grid">
      {xs.map((x) => (
        <line key={`x${x}`} x1={x} y1={0} x2={x} y2={height} />
      ))}
      {ys.map((y) => (
        <line key={`y${y}`} x1={0} y1={y} x2={width} y2={y} />
      ))}
      {majorXs.map((x) => (
        <line className="major" key={`major-x${x}`} x1={x} y1={0} x2={x} y2={height} />
      ))}
      {majorYs.map((y) => (
        <line className="major" key={`major-y${y}`} x1={0} y1={y} x2={width} y2={y} />
      ))}
    </g>
  );
}

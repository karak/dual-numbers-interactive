import { useCanvas, type CanvasDrawFn } from '../hooks/useCanvas';

interface PlotProps {
  draw: CanvasDrawFn;
  width?: number;
  height?: number;
}

/*
 * Mirrors v1's canvas wrapping at docs/legacy/index.html:
 *
 *   const canvas = h('canvas', {});      // L382 (poly), L460 (trig), etc.
 *   ...
 *   h('div', {}, canvas)                 // grid right column
 *
 *   setupCanvas(canvas, 600, 360)        // L394-264:
 *     canvas.width  = w * dpr;
 *     canvas.height = h * dpr;
 *     canvas.style.width  = w + 'px';
 *     canvas.style.height = h + 'px';
 *
 * v1's <canvas> has no class / role / aria-label — only width/height
 * attributes and inline style. The parent <div> has no className either;
 * positioning is done by .panel { grid-template-columns: 1fr 600px }.
 *
 * useCanvas() (hooks/useCanvas.ts) sets width/height attributes DPR-scaled
 * via JS, identical to v1's setupCanvas. The inline style on <canvas>
 * supplies the CSS display dimensions.
 */
export function Plot({ draw, width = 600, height = 360 }: PlotProps) {
  const ref = useCanvas(draw);
  return (
    <div>
      <canvas ref={ref} style={{ width, height }} />
    </div>
  );
}

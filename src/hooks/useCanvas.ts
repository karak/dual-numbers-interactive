import { useCallback, useEffect, useRef } from 'react';

export type CanvasDrawFn = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
) => void;

// useCanvas wires a <canvas> element to a draw fn that the host re-creates
// on every render (closing over current state). Naively listing `draw` in
// the mount effect's deps would re-create the ResizeObserver on every host
// re-render; ignoring it would break redraw-on-state-change.
//
// The ref-stabilization pattern below decouples the two:
//   - drawRef.current always holds the latest draw fn (kept in sync via a
//     post-render effect with no deps).
//   - render() reads drawRef.current, so its callback identity is stable.
//   - The mount effect installs ResizeObserver exactly once.
//   - A second commit-time effect calls render() on every host render so
//     that state changes still trigger a redraw.
export function useCanvas(draw: CanvasDrawFn) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawRef = useRef(draw);

  // Keep the latest draw fn available to render() without retriggering effects.
  useEffect(() => {
    drawRef.current = draw;
  });

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    if (w === 0 || h === 0) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      if (import.meta.env.DEV) {
        console.error('useCanvas: 2d context unavailable');
      }
      return;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    drawRef.current(ctx, w, h);
  }, []);

  // Mount: install ResizeObserver once.
  useEffect(() => {
    render();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => render());
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [render]);

  // Re-draw whenever the host re-renders (so state changes trigger redraw).
  useEffect(() => {
    render();
  });

  return canvasRef;
}

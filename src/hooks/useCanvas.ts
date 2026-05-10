import { useCallback, useEffect, useRef } from 'react';

export type CanvasDrawFn = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
) => void;

export function useCanvas(draw: CanvasDrawFn) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    draw(ctx, w, h);
  }, [draw]);

  useEffect(() => {
    render();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => render());
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [render]);

  return canvasRef;
}

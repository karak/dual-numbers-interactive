import { useCanvas, type CanvasDrawFn } from '../hooks/useCanvas';

interface PlotProps {
  draw: CanvasDrawFn;
  width?: number | string;
  height?: number | string;
  ariaLabel?: string;
}

export function Plot({ draw, width = '100%', height = 360, ariaLabel }: PlotProps) {
  const ref = useCanvas(draw);
  return (
    <canvas
      ref={ref}
      role="img"
      aria-label={ariaLabel ?? 'グラフ'}
      style={{ width, height, display: 'block' }}
    />
  );
}

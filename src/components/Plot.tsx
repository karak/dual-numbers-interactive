import { useCanvas, type CanvasDrawFn } from '../hooks/useCanvas';

interface PlotProps {
  draw: CanvasDrawFn;
  width?: number | string;
  height?: number | string;
  ariaLabel?: string;
}

export function Plot({ draw, width = '100%', height = 360, ariaLabel }: PlotProps) {
  const ref = useCanvas(draw);
  // v1 wraps the <canvas> in a <div> grid item. That div is block-level, and
  // canvas inherits the default inline-replaced display. Inside an inline
  // line-box the parent picks up the font-descender below the canvas
  // (~7.6px at 16px / line-height 1.6), so the grid row hosting Plot is
  // 7.6px taller than the canvas itself.  Mirroring v1's wrapper keeps the
  // panel grid height byte-identical without fighting Tailwind preflight's
  // `canvas { display: block }` rule.
  return (
    <div>
      <canvas
        ref={ref}
        role="img"
        aria-label={ariaLabel ?? 'グラフ'}
        style={{ width, height }}
      />
    </div>
  );
}

import { useId } from 'react';

interface SliderProps {
  /** Raw label text (may include $...$ MathJax markup; typeset by the container). */
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}

/*
 * 1:1 port of makeSlider() in docs/legacy/index.html:L304-316:
 *
 *   const id = 'slider-' + (++__sliderSeq);
 *   const valueEl = h('span', {}, format(value));
 *   const slider = h('input', {
 *     type: 'range', id,
 *     min: String(min), max: String(max), step: String(step), value: String(value),
 *   });
 *   const container = h('div', { style: { marginTop: '16px' } },
 *     h('label', { for: id }, label, ' = ', valueEl),
 *     slider);
 *
 * The `label` prop is the literal text v1 hands to h('label', ..., label),
 * including any '$...$' MathJax tokens. The container's useMathJaxTypeset()
 * hook typesets them after commit so no <MathJax> wrapper is needed.
 *
 * useId() generates a stable per-mount id (':r1:'-style). v1 uses a
 * monotonically-incremented 'slider-N' sequence — the exact string differs
 * but the label[htmlFor]/input[id] binding is identical, which is what the
 * runtime cares about. The v1↔v2 equality test handles this single
 * documented difference.
 */
export function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format = (v) => Number(v).toFixed(2),
}: SliderProps) {
  const id = useId();
  return (
    <div style={{ marginTop: '16px' }}>
      <label htmlFor={id}>{label}{' = '}<span>{format(value)}</span></label>
      <input
        type="range"
        id={id}
        min={String(min)}
        max={String(max)}
        step={String(step)}
        value={String(value)}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

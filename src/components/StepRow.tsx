interface StepRowProps {
  tex: string;
  highlight?: boolean;
  ghost?: boolean;
}

/*
 * 1:1 port of renderSteps() in docs/legacy/index.html:L317-323:
 *
 *   container.replaceChildren(...steps.map(s => {
 *     const cls = 'step-row' + (s.highlight ? ' highlight' : '') + (s.ghost ? ' ghost' : '');
 *     return h('div', { class: cls }, '$$' + s.latex + '$$');
 *   }));
 *   typeset(container);
 *
 * Display math is emitted as the raw '$$...$$' string inside the .step-row
 * <div>. The container's useMathJaxTypeset() hook converts it in place after
 * commit, matching v1's typeset(container) call.
 *
 * Class concatenation matches v1 verbatim: space-separated ('step-row',
 * 'step-row highlight', 'step-row ghost') — NOT hyphenated BEM-style names.
 * The matching CSS rules `.step-row { ... }` and `.step-row.highlight { ... }`
 * live in src/index.css (= v1:L47-48); '.ghost' is v1:L38.
 */
export function StepRow({ tex, highlight, ghost }: StepRowProps) {
  const cls =
    'step-row' + (highlight ? ' highlight' : '') + (ghost ? ' ghost' : '');
  return <div className={cls}>{`$$${tex}$$`}</div>;
}

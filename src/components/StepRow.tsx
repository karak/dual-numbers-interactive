import { MathJax } from 'better-react-mathjax';

interface StepRowProps {
  tex: string;
  highlight?: boolean;
  ghost?: boolean;
}

export function StepRow({ tex, highlight, ghost }: StepRowProps) {
  const cls = [
    'step-row',
    highlight ? 'step-row-highlight' : '',
    ghost ? 'step-row-ghost' : '',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <div className={cls}>
      <MathJax dynamic>{`\\[${tex}\\]`}</MathJax>
    </div>
  );
}

import { MathJax } from 'better-react-mathjax';

interface StepRowProps {
  tex: string;
  highlight?: boolean;
  ghost?: boolean;
}

export function StepRow({ tex, highlight, ghost }: StepRowProps) {
  const cls = [
    'py-1',
    highlight ? 'bg-accent-soft px-2 rounded' : '',
    ghost ? 'text-[var(--color-ghost)]' : '',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <div className={cls}>
      <MathJax dynamic>{`\\(${tex}\\)`}</MathJax>
    </div>
  );
}

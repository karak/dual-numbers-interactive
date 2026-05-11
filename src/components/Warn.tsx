interface WarnProps {
  children?: React.ReactNode;
}

/*
 * 1:1 port of v1's warn element (docs/legacy/index.html:L603, L680):
 *
 *   const warnEl = h('div', { class: 'warn' });
 *   ...
 *   warnEl.textContent = condition ? '⚠ ...' : '';
 *
 * v1 always renders the empty <div class="warn"> and toggles its
 * textContent — it never removes the element from the DOM. Match that
 * exactly: this component always renders the <div>, with `children`
 * (possibly null) inside, so the DOM contains <div class="warn"></div>
 * even when no warning is active.
 */
export function Warn({ children }: WarnProps) {
  return <div className="warn">{children}</div>;
}

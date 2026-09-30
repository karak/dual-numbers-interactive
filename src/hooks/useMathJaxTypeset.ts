import { useContext, useEffect } from 'react';
import { MathJaxBaseContext } from 'better-react-mathjax';

/*
 * Mirrors docs/legacy/index.html:L228-232 — v1's `typeset(container)` helper:
 *
 *   function typeset(container) {
 *     if (!window.MathJax || !MathJax.typesetPromise) return;
 *     if (MathJax.typesetClear) MathJax.typesetClear([container]);
 *     MathJax.typesetPromise([container]).catch(err => console.error('[MathJax]', err));
 *   }
 *
 * v1 calls typeset(main) at the end of every render so $...$ text inside
 * the freshly-appended subtree gets converted to SVG math in place.
 *
 * Wrapping each math chunk in a <MathJax inline> component instead would
 * add a <span> or <div> wrapper around every formula, breaking the
 * byte-for-byte parity goal (see plans/rustling-swinging-crescent.md). This
 * hook reproduces v1's container-level typesetting without any extra DOM:
 * the route component returns plain text/element children carrying `$...$`
 * tokens, and this hook scans <main> after each commit.
 *
 * Pass `deps` matching the route's state so the typeset re-fires only when
 * displayed content changes (matches v1's pattern of recomputing+typesetting
 * on slider/select input).
 */
export function useMathJaxTypeset(deps: ReadonlyArray<unknown> = []): void {
  const ctx = useContext(MathJaxBaseContext);
  useEffect(
    () => {
      if (!ctx?.promise) return;
      const main = document.querySelector('main');
      if (!main) return;
      let cancelled = false;
      ctx.promise
        .then((mj) => {
          if (cancelled) return;
          // typesetClear is MathJax v3 only; the cast satisfies the union
          // type that allows v2 as well (we only ship v3).
          (mj as { typesetClear?: (el: Element[]) => void }).typesetClear?.([main]);
          return (mj as { typesetPromise?: (el: Element[]) => Promise<void> })
            .typesetPromise?.([main]);
        })
        .catch((err) => console.error('[MathJax]', err));
      return () => {
        cancelled = true;
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    deps,
  );
}

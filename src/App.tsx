import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { MathJaxContext } from 'better-react-mathjax';
import { Layout } from './components/Layout';
import { Intro } from './routes/Intro';
import { Polynomial } from './routes/Polynomial';
import { Trig } from './routes/Trig';
import { Chain } from './routes/Chain';
import { Newton } from './routes/Newton';
import { GradDescent } from './routes/GradDescent';

// v1 (docs/legacy/index.html:L8-13) sets only
//   tex: { inlineMath: [['$', '$'], ['\\(', '\\)']] }
//   svg: { fontCache: 'global' }
// and relies on MathJax's autoload package to pull in `color` the first time
// `\color{...}` is encountered (autoload is in the default tex-svg packages).
// In v2 the typesetPromise call comes from inside a React useEffect AFTER the
// dynamic <script> finishes loading the tex-svg bundle; the autoload happens
// too late for that first typeset pass, leaving `\color` undefined and the
// `#hex` argument interpreted as a literal `#` macro-parameter character.
// Pre-declaring the `color` package in the config eliminates the race —
// MathJax bundles `color` with tex-svg.js so no extra network fetch is needed.
const mathjaxConfig = {
  loader: { load: ['[tex]/color'] },
  tex: {
    inlineMath: [['$', '$'], ['\\(', '\\)']],
    packages: { '[+]': ['color'] },
  },
  svg: { fontCache: 'global' },
};

// Match v1 which uses MathJax's SVG bundle (`tex-svg.js`).
const MATHJAX_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/3.2.2/es5/tex-svg.js';

export default function App() {
  return (
    <MathJaxContext version={3} src={MATHJAX_SRC} config={mathjaxConfig} hideUntilTypeset="first">
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Navigate to="/intro" replace />} />
            <Route path="intro"        element={<Intro />} />
            <Route path="poly"         element={<Polynomial />} />
            <Route path="trig"         element={<Trig />} />
            <Route path="chain"        element={<Chain />} />
            <Route path="newton"       element={<Newton />} />
            <Route path="grad-descent" element={<GradDescent />} />
            <Route path="*"            element={<Navigate to="/intro" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </MathJaxContext>
  );
}

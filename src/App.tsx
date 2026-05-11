import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { MathJaxContext } from 'better-react-mathjax';
import { Layout } from './components/Layout';
import { Intro } from './routes/Intro';
import { Polynomial } from './routes/Polynomial';
import { Trig } from './routes/Trig';
import { Chain } from './routes/Chain';
import { Newton } from './routes/Newton';
import { GradDescent } from './routes/GradDescent';

const mathjaxConfig = {
  tex: { inlineMath: [['$', '$'], ['\\(', '\\)']] },
  svg: { fontCache: 'global' },
};

// Match v1 which uses MathJax's SVG bundle (`tex-svg.js`). better-react-mathjax
// defaults to `tex-mml-chtml.js` (CHTML output), and CHTML adds an inline
// 108.9% font-size to every mjx-container — see index.css note. Pulling the
// SVG bundle directly keeps math metrics byte-identical to v1.
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

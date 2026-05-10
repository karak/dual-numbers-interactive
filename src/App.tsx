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
  loader: { load: ['input/tex', 'output/svg'] },
  tex: { inlineMath: [['$', '$'], ['\\(', '\\)']] },
  svg: { fontCache: 'global' },
};

export default function App() {
  return (
    <MathJaxContext version={3} config={mathjaxConfig} hideUntilTypeset="first">
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

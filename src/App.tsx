import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { MathJaxContext } from 'better-react-mathjax';
import { Layout } from './components/Layout';
import { Intro } from './routes/Intro';

const mathjaxConfig = {
  loader: { load: ['input/tex', 'output/svg'] },
  tex: { inlineMath: [['$', '$'], ['\\(', '\\)']] },
  svg: { fontCache: 'global' },
};

function Placeholder({ name }: { name: string }) {
  return <h2 className="font-[var(--font-ui)]">{name} (coming soon)</h2>;
}

export default function App() {
  return (
    <MathJaxContext version={3} config={mathjaxConfig} hideUntilTypeset="first">
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Navigate to="/intro" replace />} />
            <Route path="intro"        element={<Intro />} />
            <Route path="poly"         element={<Placeholder name="多項式" />} />
            <Route path="trig"         element={<Placeholder name="三角関数 / Taylor" />} />
            <Route path="chain"        element={<Placeholder name="連鎖律" />} />
            <Route path="newton"       element={<Placeholder name="Newton 法" />} />
            <Route path="grad-descent" element={<Placeholder name="勾配降下" />} />
            <Route path="*"            element={<Navigate to="/intro" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </MathJaxContext>
  );
}

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // `as never` works around a vitest 2.x quirk where `vitest/config` ships its
  // own nested `vite`, so `Plugin<any>` from the top-level `@vitejs/plugin-react`
  // is structurally identical but nominally different from the type expected here.
  plugins: [react() as never],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['tests/unit/**/*.test.{ts,tsx}', 'tests/components/**/*.test.{ts,tsx}'],
    exclude: ['tests/e2e/**'],
  },
});

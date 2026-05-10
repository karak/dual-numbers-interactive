import '@testing-library/jest-dom/vitest';

// jsdom doesn't implement ResizeObserver. Components that observe layout
// (Plot via useCanvas) need a no-op stand-in to mount in tests.
if (typeof globalThis.ResizeObserver === 'undefined') {
  class ResizeObserverMock {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }
  globalThis.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;
}

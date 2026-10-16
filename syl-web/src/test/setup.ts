import "@testing-library/jest-dom";
import React from "react";
import { vi } from "vitest";

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
  }),
});

// jsdom lacks IntersectionObserver (required by embla-carousel)
class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = "";
  readonly thresholds: readonly number[] = [];
  observe = () => {};
  unobserve = () => {};
  disconnect = () => {};
  takeRecords = () => [];
}
window.IntersectionObserver =
  MockIntersectionObserver as unknown as typeof window.IntersectionObserver;

// ResizeObserver (used by some Radix/shadcn components)
class MockResizeObserver implements ResizeObserver {
  observe = () => {};
  unobserve = () => {};
  disconnect = () => {};
}
window.ResizeObserver =
  MockResizeObserver as unknown as typeof window.ResizeObserver;

// Mock react-leaflet  so tests don't need a real map
vi.mock("react-leaflet", () => ({
  MapContainer: ({ children }: { children?: React.ReactNode }) =>
    React.createElement("div", { "data-testid": "map-container" }, children),
  TileLayer: () => null,
  CircleMarker: () => null,
  Popup: () => null,
}));

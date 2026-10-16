import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/test-utils";
import About from "./About.tsx";

describe("About", () => {
  it("renders Layout", () => {
    render(<About />);
    expect(screen.getByRole("banner")).toBeInTheDocument();
  });

  it("renders About Six Yards Love in hero", () => {
    render(<About />);
    expect(
      screen.getAllByText(/about six yards love/i).length,
    ).toBeGreaterThanOrEqual(1);
  });

  it("renders Our Mission and Our Vision", () => {
    render(<About />);
    expect(
      screen.getByRole("heading", { name: /our mission/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /our vision/i }),
    ).toBeInTheDocument();
  });

  it("renders values section", () => {
    render(<About />);
    expect(
      screen.getByRole("heading", { name: /what we stand for/i }),
    ).toBeInTheDocument();
  });

  it("renders Shop and Contact CTA links", () => {
    render(<About />);
    expect(
      screen.getAllByRole("link", { name: /shop now/i }).length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByRole("link", { name: /contact us/i }).length,
    ).toBeGreaterThanOrEqual(1);
  });
});

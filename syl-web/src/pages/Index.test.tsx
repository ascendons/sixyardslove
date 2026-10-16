import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/test-utils";
import Index from "./Index.tsx";

describe("Index", () => {
  it("renders Layout with Header and Footer", () => {
    render(<Index />);
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("renders Hero with main heading", () => {
    render(<Index />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      /Six Yards of Timeless Grace/i,
    );
  });

  it("renders AboutSection", () => {
    render(<Index />);
    expect(
      screen.getByRole("heading", { name: /what is six yards love/i }),
    ).toBeInTheDocument();
  });

  it("renders QualitySection", () => {
    render(<Index />);
    expect(
      screen.getByRole("heading", { name: /why six yards love/i }),
    ).toBeInTheDocument();
  });
});

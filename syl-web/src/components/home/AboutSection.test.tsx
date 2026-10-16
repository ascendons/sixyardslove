import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/test-utils";
import { AboutSection } from "./AboutSection";

describe("AboutSection", () => {
  it("renders Our Story label", () => {
    render(<AboutSection />);
    expect(screen.getAllByText(/our story/i).length).toBeGreaterThan(0);
  });

  it("renders What is Six Yards Love heading", () => {
    render(<AboutSection />);
    expect(
      screen.getByRole("heading", { name: /what is six yards love/i }),
    ).toBeInTheDocument();
  });

  it("renders WEBSITE_ARTICULATION content", () => {
    render(<AboutSection />);
    expect(screen.getByText(/weaving traditions/i)).toBeInTheDocument();
  });

  it("renders the six yards highlight", () => {
    render(<AboutSection />);
    expect(screen.getByText(/6 yards/i)).toBeInTheDocument();
  });
});

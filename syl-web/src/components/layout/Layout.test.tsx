import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/test-utils";
import { Layout } from "./Layout";

describe("Layout", () => {
  it("renders Header", () => {
    render(<Layout>Content</Layout>);
    expect(screen.getByRole("banner")).toBeInTheDocument();
  });

  it("renders Footer", () => {
    render(<Layout>Content</Layout>);
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("renders children inside main", () => {
    render(
      <Layout>
        <span data-testid="child">Page content</span>
      </Layout>,
    );
    const main = screen.getByRole("main");
    expect(main).toBeInTheDocument();
    expect(screen.getByTestId("child")).toBeInTheDocument();
    expect(screen.getByText("Page content")).toBeInTheDocument();
  });

  it("has min-h-screen and flex structure", () => {
    const { container } = render(<Layout>X</Layout>);
    const outer = container.firstElementChild;
    expect(outer).toHaveClass("min-h-screen", "flex", "flex-col");
  });
});

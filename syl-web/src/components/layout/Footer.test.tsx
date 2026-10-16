import { describe, it, expect } from "vitest";
import { render, screen, within } from "@/test/test-utils";
import { Footer } from "./Footer";

describe("Footer", () => {
  it("renders Six Yards Love brand link", () => {
    render(<Footer />);
    const footer = screen.getByRole("contentinfo");
    const brand = within(footer).getByRole("link", { name: /^six yards love$/i });
    expect(brand).toHaveAttribute("href", "/");
  });

  it("renders FOOTER_TAGLINE text", () => {
    render(<Footer />);
    expect(screen.getByText(/handpicked sarees, delivered with love/i)).toBeInTheDocument();
  });

  it("renders Platform section with links", () => {
    render(<Footer />);
    expect(
      screen.getByRole("heading", { name: /explore/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /about six yards love/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /product categories/i }),
    ).toBeInTheDocument();
  });

  it("renders Shop & Services section with Contact", () => {
    render(<Footer />);
    expect(
      screen.getByRole("heading", { name: /shop & services/i }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: /^contact$/i }).length,
    ).toBeGreaterThanOrEqual(1);
  });

  it("renders copyright with current year", () => {
    render(<Footer />);
    const year = new Date().getFullYear();
    expect(
      screen.getByText(new RegExp(`© ${year} Six Yards Love`)),
    ).toBeInTheDocument();
  });

  it("renders Privacy and Terms links", () => {
    render(<Footer />);
    expect(
      screen.getByRole("link", { name: /privacy policy/i }),
    ).toHaveAttribute("href", "/privacy");
    expect(
      screen.getByRole("link", { name: /terms of service/i }),
    ).toHaveAttribute("href", "/terms");
  });
});

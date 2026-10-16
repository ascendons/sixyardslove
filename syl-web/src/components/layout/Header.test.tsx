import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/test-utils";
import { Header } from "./Header";

describe("Header", () => {
  it("renders logo with alt Six Yards Love", () => {
    render(<Header />);
    const img = screen.getByRole("img", { name: /six yards love/i });
    expect(img).toBeInTheDocument();
  });

  it("renders nav with aria-label Global", () => {
    render(<Header />);
    expect(
      screen.getByRole("navigation", { name: /global/i }),
    ).toBeInTheDocument();
  });

  it("renders link to home", () => {
    render(<Header />);
    const home = screen.getAllByRole("link", { name: /six yards love/i })[0];
    expect(home).toHaveAttribute("href", "/");
  });

  it("renders About Six Yards Love link", () => {
    render(<Header />);
    expect(
      screen.getByRole("link", { name: /about six yards love/i }),
    ).toHaveAttribute("href", "/about");
  });

  it("renders Product Categories link", () => {
    render(<Header />);
    expect(
      screen.getByRole("link", { name: /product categories/i }),
    ).toHaveAttribute("href", "/categories");
  });

  it("renders Contact link", () => {
    render(<Header />);
    expect(screen.getByRole("link", { name: /^contact$/i })).toHaveAttribute(
      "href",
      "/contact",
    );
  });


  it("renders mobile menu button", () => {
    render(<Header />);
    expect(
      screen.getByRole("button", { name: /open main menu/i }),
    ).toBeInTheDocument();
  });
});

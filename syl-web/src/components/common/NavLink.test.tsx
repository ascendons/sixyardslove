import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/test-utils";
import { NavLink } from "./NavLink";

describe("NavLink", () => {
  it("renders as a link with correct href", () => {
    render(<NavLink to="/about">About</NavLink>);
    const link = screen.getByRole("link", { name: /about/i });
    expect(link).toHaveAttribute("href", "/about");
  });

  it("applies activeClassName when route matches", () => {
    render(
      <NavLink to="/about" activeClassName="active">
        About
      </NavLink>,
      { initialEntries: ["/about"] },
    );
    const link = screen.getByRole("link", { name: /about/i });
    expect(link).toHaveClass("active");
  });

  it("does not apply activeClassName when route does not match", () => {
    render(
      <NavLink to="/about" activeClassName="active">
        About
      </NavLink>,
      { initialEntries: ["/"] },
    );
    const link = screen.getByRole("link", { name: /about/i });
    expect(link).not.toHaveClass("active");
  });

  it("applies base className", () => {
    render(
      <NavLink to="/" className="custom">
        Home
      </NavLink>,
    );
    expect(screen.getByRole("link", { name: /home/i })).toHaveClass("custom");
  });
});

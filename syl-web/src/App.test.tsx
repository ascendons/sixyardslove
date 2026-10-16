import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/test-utils";
import { AppRoutes } from "@/routes";

describe("App (providers + routes)", () => {
  it("renders Header and main content at /", () => {
    render(<AppRoutes />, { initialEntries: ["/"] });
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
  });

  it("renders home hero at /", () => {
    render(<AppRoutes />, { initialEntries: ["/"] });
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      /Six Yards of Timeless Grace/i,
    );
  });
});

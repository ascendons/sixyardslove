import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/test-utils";
import NotFound from "./NotFound.tsx";

describe("NotFound", () => {
  it("renders Layout", () => {
    render(<NotFound />, { initialEntries: ["/nonexistent"] });
    expect(screen.getByRole("banner")).toBeInTheDocument();
  });

  it("renders 404 and Page not found", () => {
    render(<NotFound />, { initialEntries: ["/nonexistent"] });
    expect(screen.getByRole("heading", { name: "404" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /page not found/i }),
    ).toBeInTheDocument();
  });

  it("renders link back to home", () => {
    render(<NotFound />, { initialEntries: ["/nonexistent"] });
    const link = screen.getByRole("link", { name: /back|home/i });
    expect(link).toHaveAttribute("href", "/");
  });
});

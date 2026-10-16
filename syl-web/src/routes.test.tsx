import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/test-utils";
import { AppRoutes } from "./routes";

describe("AppRoutes", () => {
  it("renders Index at /", () => {
    render(<AppRoutes />, { initialEntries: ["/"] });
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      /Six Yards of Timeless Grace/i,
    );
  });

  it("renders About at /about", () => {
    render(<AppRoutes />, { initialEntries: ["/about"] });
    expect(
      screen.getByRole("heading", { level: 1, name: /six yards\. endless love\./i }),
    ).toBeInTheDocument();
  });

  it("renders Categories at /categories", () => {
    render(<AppRoutes />, { initialEntries: ["/categories"] });
    expect(
      screen.getByRole("heading", { name: /sarees for every occasion/i }),
    ).toBeInTheDocument();
  });

  it("renders Contact at /contact", () => {
    render(<AppRoutes />, { initialEntries: ["/contact"] });
    expect(
      screen.getByRole("heading", { name: /get in touch/i }),
    ).toBeInTheDocument();
  });

  it("renders NotFound at unknown path", () => {
    render(<AppRoutes />, { initialEntries: ["/unknown-page"] });
    expect(screen.getByRole("heading", { name: "404" })).toBeInTheDocument();
  });
});

import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/test-utils";
import Categories from "./Categories.tsx";

describe("Categories", () => {
  it("renders Layout", () => {
    render(<Categories />);
    expect(screen.getByRole("banner")).toBeInTheDocument();
  });

  it("renders Product Categories hero heading", () => {
    render(<Categories />);
    expect(
      screen.getByRole("heading", {
        name: /sarees for every occasion/i,
      }),
    ).toBeInTheDocument();
  });

  it("renders category disclaimer", () => {
    render(<Categories />);
    expect(
      screen.getByText(/our quality promise/i),
    ).toBeInTheDocument();
  });

  it("renders links to category subpages", () => {
    render(<Categories />);
    expect(
      screen.getByRole("link", { name: /silk sarees/i }),
    ).toBeInTheDocument();
  });
});

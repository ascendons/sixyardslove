import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@/test/test-utils";
import Contact from "./Contact.tsx";

describe("Contact", () => {
  it("renders Layout", () => {
    render(<Contact />);
    expect(screen.getByRole("banner")).toBeInTheDocument();
  });

  it("renders Contact Us heading", () => {
    render(<Contact />);
    expect(
      screen.getByRole("heading", { name: /get in touch/i }),
    ).toBeInTheDocument();
  });

  it("renders contact form with name, email, subject, message", () => {
    render(<Contact />);
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/subject/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
  });

  it("renders submit button", () => {
    render(<Contact />);
    expect(
      screen.getByRole("button", { name: /send|submit/i }),
    ).toBeInTheDocument();
  });

  it("form submit does not throw", () => {
    render(<Contact />);
    const btn = screen.getByRole("button", { name: /send|submit/i });
    fireEvent.click(btn);
    // toast is called; we don't assert on it without mocking
  });
});

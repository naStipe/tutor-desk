// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ConfirmModal } from "../components/ConfirmModal";
import { Modal } from "../components/Modal";
import { installDeviceMedia, polyfillDialog } from "./dom-helpers";

beforeEach(() => {
  polyfillDialog();
  installDeviceMedia({ phone: false });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function dialog() {
  const element = document.querySelector("dialog");
  if (!element) throw new Error("no dialog rendered");
  return element;
}

describe("Modal", () => {
  it("stays closed while open is false", () => {
    render(
      <Modal open={false} onClose={() => {}} title="Hello">
        body
      </Modal>,
    );
    expect(dialog().hasAttribute("open")).toBe(false);
  });

  it("opens the native dialog and labels it with the title", () => {
    render(
      <Modal open onClose={() => {}} title="Hello">
        body text
      </Modal>,
    );
    expect(dialog().hasAttribute("open")).toBe(true);
    const heading = screen.getByRole("heading", { name: "Hello" });
    expect(dialog().getAttribute("aria-labelledby")).toBe(heading.id);
    expect(screen.getByText("body text")).toBeTruthy();
  });

  it("closes the dialog when open turns false", () => {
    const { rerender } = render(
      <Modal open onClose={() => {}} title="Hello">
        body
      </Modal>,
    );
    rerender(
      <Modal open={false} onClose={() => {}} title="Hello">
        body
      </Modal>,
    );
    expect(dialog().hasAttribute("open")).toBe(false);
  });

  it("calls onClose from the close button", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <Modal open onClose={onClose} title="Hello">
        body
      </Modal>,
    );
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose on a backdrop click but not a click inside the content", () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} title="Hello">
        <p>inside</p>
      </Modal>,
    );
    fireEvent.click(screen.getByText("inside"));
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(dialog());
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when the native dialog fires close (Esc)", () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} title="Hello">
        body
      </Modal>,
    );
    // The browser fires "close" after Esc; jsdom has no Esc handling, so dispatch it directly.
    act(() => {
      dialog().dispatchEvent(new Event("close"));
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("carries both the bottom-sheet and the centered classes (breakpoint chosen by CSS)", () => {
    render(
      <Modal open onClose={() => {}} title="Hello" className="extra-class">
        body
      </Modal>,
    );
    const classes = dialog().className;
    // jsdom does not evaluate Tailwind or media queries, so only the class contract is checked.
    expect(classes).toContain("max-w-lg");
    expect(classes).toContain("max-sm:rounded-t-2xl");
    expect(classes).toContain("max-sm:mt-auto");
    expect(classes).toContain("extra-class");
  });

  it("opens on a phone-width layout too", () => {
    installDeviceMedia({ phone: true });
    render(
      <Modal open onClose={() => {}} title="Hello">
        body
      </Modal>,
    );
    expect(dialog().hasAttribute("open")).toBe(true);
  });
});

describe("ConfirmModal", () => {
  function setup(props: Partial<ComponentProps<typeof ConfirmModal>> = {}) {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <ConfirmModal
        open
        title="Delete it?"
        message="This cannot be undone."
        confirmLabel="Delete"
        onConfirm={onConfirm}
        onCancel={onCancel}
        {...props}
      />,
    );
    return { onConfirm, onCancel };
  }

  it("renders title, message and labels (default cancel label is Go back)", () => {
    setup();
    expect(screen.getByRole("heading", { name: "Delete it?" })).toBeTruthy();
    expect(screen.getByText("This cannot be undone.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Delete" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Go back" })).toBeTruthy();
  });

  it("uses a custom cancel label", () => {
    setup({ cancelLabel: "Keep it" });
    expect(screen.getByRole("button", { name: "Keep it" })).toBeTruthy();
  });

  it("calls onConfirm only from the confirm button", async () => {
    const user = userEvent.setup();
    const { onConfirm, onCancel } = setup();
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("calls onCancel from Go back and from the X button", async () => {
    const user = userEvent.setup();
    const { onConfirm, onCancel } = setup();
    await user.click(screen.getByRole("button", { name: "Go back" }));
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(onCancel).toHaveBeenCalledTimes(2);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("disables only the confirm button when disabled", async () => {
    const user = userEvent.setup();
    const { onConfirm } = setup({ disabled: true });
    const confirm = screen.getByRole("button", { name: "Delete" }) as HTMLButtonElement;
    expect(confirm.disabled).toBe(true);
    expect((screen.getByRole("button", { name: "Go back" }) as HTMLButtonElement).disabled).toBe(
      false,
    );
    await user.click(confirm);
    expect(onConfirm).not.toHaveBeenCalled();
  });
});

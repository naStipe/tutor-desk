// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Select } from "../components/Select";
import { installDeviceMedia } from "./dom-helpers";

const options = [
  { value: "a", label: "Alpha" },
  { value: "b", label: "Beta" },
  { value: "c", label: "Gamma", disabled: true },
];

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("Select with a fine pointer", () => {
  beforeEach(() => installDeviceMedia({ coarse: false }));

  it("renders the custom trigger, not a native select", () => {
    render(<Select options={options} value="a" aria-label="Pick" />);
    expect(document.querySelector("select")).toBeNull();
    const trigger = screen.getByRole("button", { name: "Pick" });
    expect(trigger.getAttribute("aria-haspopup")).toBe("listbox");
    expect(trigger.textContent).toContain("Alpha");
  });

  it("opens the listbox and commits a chosen option", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Select options={options} value="a" onChange={onChange} aria-label="Pick" />);

    await user.click(screen.getByRole("button", { name: "Pick" }));
    expect(screen.getByRole("listbox")).toBeTruthy();
    expect(screen.getAllByRole("option")).toHaveLength(3);

    await user.click(screen.getByRole("option", { name: "Beta" }));
    expect(onChange).toHaveBeenCalledWith("b");
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("ignores a click on a disabled option", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Select options={options} value="a" onChange={onChange} aria-label="Pick" />);
    await user.click(screen.getByRole("button", { name: "Pick" }));
    await user.click(screen.getByRole("option", { name: "Gamma" }));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("listbox")).toBeTruthy();
  });

  it("selects with the keyboard and closes on Escape", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Select options={options} defaultValue="a" onChange={onChange} aria-label="Pick" />);

    screen.getByRole("button", { name: "Pick" }).focus();
    await user.keyboard("{ArrowDown}{ArrowDown}{Enter}");
    expect(onChange).toHaveBeenCalledWith("b");

    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("listbox")).toBeTruthy();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("writes the value to a hidden input when named", () => {
    render(<Select options={options} value="b" name="choice" />);
    const hidden = document.querySelector('input[type="hidden"][name="choice"]');
    expect((hidden as HTMLInputElement).value).toBe("b");
  });

  it("shows the placeholder when nothing is selected", () => {
    render(<Select options={options} placeholder="Choose one" aria-label="Pick" />);
    expect(screen.getByRole("button", { name: "Pick" }).textContent).toContain("Choose one");
  });
});

describe("Select with a coarse pointer", () => {
  beforeEach(() => installDeviceMedia({ coarse: true }));

  it("renders a native select with every option", () => {
    render(<Select options={options} value="a" aria-label="Pick" />);
    const select = screen.getByRole("combobox", { name: "Pick" }) as HTMLSelectElement;
    expect(select.tagName).toBe("SELECT");
    expect(select.value).toBe("a");
    expect(Array.from(select.options).map((option) => option.text)).toEqual([
      "Alpha",
      "Beta",
      "Gamma",
    ]);
    expect(select.options[2]?.disabled).toBe(true);
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("reports the picked value through onChange", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Select options={options} value="a" onChange={onChange} aria-label="Pick" />);
    await user.selectOptions(screen.getByRole("combobox", { name: "Pick" }), "b");
    expect(onChange).toHaveBeenCalledWith("b");
  });

  it("adds a disabled placeholder option when nothing is selected", () => {
    render(<Select options={options} placeholder="Choose one" aria-label="Pick" />);
    const select = screen.getByRole("combobox", { name: "Pick" }) as HTMLSelectElement;
    expect(select.options[0]?.text).toBe("Choose one");
    expect(select.options[0]?.disabled).toBe(true);
  });
});

import { vi } from "vitest";

/**
 * Minimal jsdom stand-ins for browser APIs the components use. Test-local only; the app code is
 * unchanged. `matches` decides, per media query string, whether `matchMedia` reports a match.
 */
export function installMatchMedia(matches: (query: string) => boolean = () => false) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: matches(query),
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
}

/** Reduced motion is on (so `Modal` skips `motion` animations); coarse pointer and phone width optional. */
export function installDeviceMedia({ coarse = false, phone = false } = {}) {
  installMatchMedia((query) => {
    if (query.includes("prefers-reduced-motion")) return true;
    if (query.includes("pointer: coarse")) return coarse;
    if (query.includes("max-width: 639px")) return phone;
    return false;
  });
}

/** jsdom does not implement showModal()/close(); mimic the open attribute and the close event. */
export function polyfillDialog() {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.show = function show(this: HTMLDialogElement) {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    if (!this.hasAttribute("open")) return;
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
}

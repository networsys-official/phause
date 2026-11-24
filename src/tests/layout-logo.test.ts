import React from "react";
import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/",
}));
vi.mock("next/image", () => ({
  default: ({ priority: _priority, ...props }: React.ImgHTMLAttributes<HTMLImageElement> & { priority?: boolean }) => (
    React.createElement("img", props)
  ),
}));

import Navbar from "@/components/layout/Navbar";

beforeAll(() => {
  class IntersectionObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  Object.defineProperty(globalThis, "IntersectionObserver", { value: IntersectionObserverMock, configurable: true });
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
    navigation: { items: [], label: "Main navigation" },
  }), { status: 200 })));
});

describe("layout logo", () => {
  it("renders a string logoUrl with explicit dimensions", () => {
    const NavbarComponent = Navbar as React.ComponentType<{ initialBrandName?: string; initialLogoUrl?: string }>;
    expect(() => render(React.createElement(NavbarComponent, {
      initialBrandName: "Phause",
      initialLogoUrl: "/logo/phause-logo.png",
    }))).not.toThrow();

    const logo = screen.getByAltText("Phause");
    expect(logo.getAttribute("width")).toBe("600");
    expect(logo.getAttribute("height")).toBe("200");
  });
});

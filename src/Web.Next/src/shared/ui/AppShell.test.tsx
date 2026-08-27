/** @vitest-environment jsdom */
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AppShell } from "./AppShell";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import { LoadingState } from "./LoadingState";

afterEach(() => {
  cleanup();
});

describe("AppShell", () => {
  it("renders brand, login, basket, and footer with Playwright-facing names", () => {
    render(
      <AppShell>
        <p>Shell body</p>
      </AppShell>,
    );

    expect(screen.getByRole("img", { name: "eShop On Web" })).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Login" }).getAttribute("href"),
    ).toBe("/Identity/Account/Login");
    expect(
      screen.getByRole("link", { name: "Basket" }).getAttribute("href"),
    ).toBe("/Basket");
    expect(screen.getByText(/e-ShopOnWeb\. All rights reserved/)).toBeTruthy();
    expect(screen.getByRole("main").textContent).toContain("Shell body");
  });

  it("accepts navigation slots without feature data fetching", () => {
    render(
      <AppShell
        identitySlot={<div data-testid="identity-slot">Custom identity</div>}
        basketSlot={<div data-testid="basket-slot">Custom basket</div>}
      >
        Content
      </AppShell>,
    );

    expect(screen.getByTestId("identity-slot").textContent).toBe(
      "Custom identity",
    );
    expect(screen.getByTestId("basket-slot").textContent).toBe("Custom basket");
    expect(screen.queryByRole("link", { name: "Login" })).toBeNull();
  });
});

describe("presentation states", () => {
  it("exposes loading with status semantics", () => {
    render(<LoadingState message="Loading catalog..." />);
    const status = screen.getByRole("status");
    expect(status.textContent).toContain("Loading catalog...");
  });

  it("exposes empty state with status semantics", () => {
    render(
      <EmptyState
        title="Basket is empty"
        description="Add an item to continue."
      />,
    );
    const status = screen.getByRole("status");
    expect(within(status).getByText("Basket is empty")).toBeTruthy();
    expect(within(status).getByText("Add an item to continue.")).toBeTruthy();
  });

  it("exposes error state with alert semantics", () => {
    render(<ErrorState />);
    const alert = screen.getByRole("alert");
    expect(within(alert).getByRole("heading", { level: 1 }).textContent).toBe(
      "Error.",
    );
    expect(within(alert).getByRole("heading", { level: 2 }).textContent).toBe(
      "An error occurred while processing your request.",
    );
  });
});

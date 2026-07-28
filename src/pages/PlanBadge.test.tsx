// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  act,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PlanBadgePage from "./PlanBadge";

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("../hooks/useDocumentTitle", () => ({
  default: vi.fn(),
}));

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Opens the inline tier picker by clicking "Choose a plan". */
function openTierPicker() {
  fireEvent.click(screen.getByRole("button", { name: /Choose a plan/i }));
}

/** Renders the page and opens the tier picker. */
function renderWithPickerOpen() {
  render(
    <MemoryRouter>
      <PlanBadgePage />
    </MemoryRouter>,
  );
  openTierPicker();
}

/** Renders the page with a custom save function and opens the tier picker. */
function renderWithPickerOpenAndSave(
  saveFn: (tier: string) => Promise<void>,
) {
  render(
    <MemoryRouter>
      <PlanBadgePage onSavePlanTier={saveFn} />
    </MemoryRouter>,
  );
  openTierPicker();
}

/**
 * Returns true if the radio for the given tier is checked.
 * The radio's checked state is reflected in the DOM via the `checked` attribute.
 */
function isRadioChecked(tier: string): boolean {
  const radio = screen.getByLabelText(`${tier} plan`) as HTMLInputElement;
  return radio.checked;
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("PlanBadgePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  // ── Rendering ──────────────────────────────────────────────────────────────

  describe("rendering", () => {
    it("renders the page heading", () => {
      render(<PlanBadgePage />);
      expect(screen.getByRole("heading", { level: 1 })).toBeTruthy();
      expect(screen.getByText(/Plan Badge/i)).toBeTruthy();
    });

    it("renders the eyebrow label", () => {
      render(<PlanBadgePage />);
      expect(screen.getByText(/API Plan Management/i)).toBeTruthy();
    });

    it("renders the page description", () => {
      render(<PlanBadgePage />);
      expect(screen.getByText(/Assign a plan tier/i)).toBeTruthy();
    });
  });

  // ── Empty state ────────────────────────────────────────────────────────────

  describe("empty state (no plan selected)", () => {
    function renderEmpty() {
      return render(
        <MemoryRouter>
          <PlanBadgePage />
        </MemoryRouter>,
      );
    }

    it("renders the plan-badge EmptyState variant", () => {
      renderEmpty();
      const emptyState = screen.getByTestId("empty-state-plan-badge");
      expect(emptyState).toBeTruthy();
    });

    it("shows the 'No plan selected' empty-state heading", () => {
      renderEmpty();
      expect(screen.getByText("No plan selected")).toBeTruthy();
    });

    it("shows a descriptive empty-state message", () => {
      renderEmpty();
      expect(screen.getByText(/plan tier attached yet/i)).toBeTruthy();
    });

    it("renders the primary 'Choose a plan' CTA button", () => {
      renderEmpty();
      const cta = screen.getByRole("button", { name: /Choose a plan/i });
      expect(cta).toBeTruthy();
    });

    it("renders the secondary 'Learn about plans' button", () => {
      renderEmpty();
      const secondary = screen.getByRole("button", {
        name: /Learn more about available plans in the marketplace/i,
      });
      expect(secondary).toBeTruthy();
    });

    it("renders the plan-badge illustration SVG inside the EmptyState", () => {
      const { container } = renderEmpty();
      const emptyState = container.querySelector(
        '[data-testid="empty-state-plan-badge"]',
      );
      expect(emptyState?.querySelector("svg")).toBeTruthy();
    });

    it("illustration is aria-hidden (decorative)", () => {
      const { container } = renderEmpty();
      const hiddenWrapper = container.querySelector('[aria-hidden="true"]');
      expect(hiddenWrapper).toBeTruthy();
      expect(hiddenWrapper?.querySelector("svg")).toBeTruthy();
    });
  });

  // ── "Choose a plan" opens inline picker (#697) ───────────────────────────

  describe("primary CTA — inline tier picker (#697)", () => {
    function renderDefault() {
      return render(
        <MemoryRouter>
          <PlanBadgePage />
        </MemoryRouter>,
      );
    }

    it("opens the inline tier picker instead of navigating away", () => {
      renderDefault();
      openTierPicker();

      // Empty state should be gone.
      expect(screen.queryByTestId("empty-state-plan-badge")).toBeNull();

      // Tier radio buttons should be visible.
      expect(screen.getByLabelText("Free plan")).toBeTruthy();
      expect(screen.getByLabelText("Pro plan")).toBeTruthy();
      expect(screen.getByLabelText("Enterprise plan")).toBeTruthy();
    });

    it("navigates to /marketplace when 'Learn about plans' is clicked", () => {
      renderDefault();
      fireEvent.click(
        screen.getByRole("button", {
          name: /Learn more about available plans in the marketplace/i,
        }),
      );
      expect(mockNavigate).toHaveBeenCalledWith("/marketplace");
    });
  });

  // ── Accessibility ─────────────────────────────────────────────────────────

  describe("accessibility", () => {
    it("uses a <section> landmark with aria-labelledby for the empty-state container", () => {
      const { container } = render(
        <MemoryRouter>
          <PlanBadgePage />
        </MemoryRouter>,
      );
      const section = container.querySelector(
        'section[aria-labelledby="plan-badge-empty-heading"]',
      );
      expect(section).toBeTruthy();
    });

    it("CTA buttons have accessible names (not just generic text)", () => {
      render(
        <MemoryRouter>
          <PlanBadgePage />
        </MemoryRouter>,
      );
      const choosePlan = screen.getByRole("button", {
        name: /Choose a plan/i,
      });
      const learnMore = screen.getByRole("button", {
        name: /Learn more about available plans in the marketplace/i,
      });
      expect(choosePlan).toBeTruthy();
      expect(learnMore).toBeTruthy();
    });

    it("'Learn about plans' button has an aria-label with extra context", () => {
      render(
        <MemoryRouter>
          <PlanBadgePage />
        </MemoryRouter>,
      );
      const learnMore = screen.getByRole("button", {
        name: /Learn more about available plans in the marketplace/i,
      });
      expect(learnMore.getAttribute("aria-label")).toBeTruthy();
    });
  });

  // ── Document title ────────────────────────────────────────────────────────

  describe("document title", () => {
    it("calls useDocumentTitle with the correct page title", async () => {
      const useDocumentTitle = await import("../hooks/useDocumentTitle");
      const spy = vi.spyOn(useDocumentTitle, "default");
      render(
        <MemoryRouter>
          <PlanBadgePage />
        </MemoryRouter>,
      );
      expect(spy).toHaveBeenCalledWith(
        "Plan Badge – Callora",
        expect.any(String),
      );
    });
  });

  // ── Optimistic UI (#697) ──────────────────────────────────────────────────

  describe("optimistic UI (#697)", () => {
    it("selecting a tier shows the badge preview instantly", async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      renderWithPickerOpenAndSave(onSave);

      // No badge preview yet.
      expect(screen.queryByText(/Current plan:/i)).toBeNull();

      // Select "Pro".
      const proRadio = screen.getByLabelText("Pro plan");
      expect(proRadio).not.toBeChecked();
      await act(async () => {
        fireEvent.click(proRadio);
      });

      // Badge preview should appear.
      expect(screen.getByText(/Current plan:/i)).toBeTruthy();
      // The Pro radio should now be checked.
      expect(screen.getByLabelText("Pro plan")).toBeChecked();
    });

    it("shows a saving indicator while the async save is in flight", () => {
      // Use a promise that never settles so the saving state persists.
      const onSave = vi.fn().mockReturnValue(new Promise<void>(() => {}));
      renderWithPickerOpenAndSave(onSave);

      const proRadio = screen.getByLabelText("Pro plan");
      fireEvent.click(proRadio);

      expect(screen.getByText(/Saving…/i)).toBeTruthy();
    });

    it("hides the saving indicator after the save completes", async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      renderWithPickerOpenAndSave(onSave);

      const proRadio = screen.getByLabelText("Pro plan");
      await act(async () => {
        fireEvent.click(proRadio);
      });

      expect(screen.queryByText(/Saving…/i)).toBeNull();
    });

    it("disables radio buttons while saving", () => {
      const onSave = vi.fn().mockReturnValue(new Promise<void>(() => {}));
      renderWithPickerOpenAndSave(onSave);

      const proRadio = screen.getByLabelText("Pro plan");
      fireEvent.click(proRadio);

      expect(screen.getByLabelText("Free plan")).toBeDisabled();
      expect(screen.getByLabelText("Pro plan")).toBeDisabled();
      expect(screen.getByLabelText("Enterprise plan")).toBeDisabled();
    });

    it("re-enables radio buttons after save completes", async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      renderWithPickerOpenAndSave(onSave);

      const proRadio = screen.getByLabelText("Pro plan");
      await act(async () => {
        fireEvent.click(proRadio);
      });

      expect(screen.getByLabelText("Free plan")).not.toBeDisabled();
      expect(screen.getByLabelText("Pro plan")).not.toBeDisabled();
      expect(screen.getByLabelText("Enterprise plan")).not.toBeDisabled();
    });

    it("updates the badge preview instantly when a different tier is selected",
      async () => {
        const onSave = vi.fn().mockResolvedValue(undefined);
        renderWithPickerOpenAndSave(onSave);

        // Select "Pro" first.
        const proRadio = screen.getByLabelText("Pro plan");
        await act(async () => {
          fireEvent.click(proRadio);
        });
        expect(screen.getByLabelText("Pro plan")).toBeChecked();

        // Now select "Enterprise" — badge should update instantly.
        const enterpriseRadio = screen.getByLabelText("Enterprise plan");
        await act(async () => {
          fireEvent.click(enterpriseRadio);
        });
        expect(screen.getByLabelText("Enterprise plan")).toBeChecked();
        expect(screen.getByLabelText("Pro plan")).not.toBeChecked();
      },
    );

    it("reverts to the previous tier and shows an error when save fails",
      async () => {
        const onSave = vi.fn().mockRejectedValue(new Error("Network error"));
        renderWithPickerOpenAndSave(onSave);

        // Select "Pro" — it should optimistically show, then revert.
        const proRadio = screen.getByLabelText("Pro plan");
        await act(async () => {
          fireEvent.click(proRadio);
        });

        // The radio should revert to unchecked (initial state).
        expect(screen.getByLabelText("Pro plan")).not.toBeChecked();
        expect(screen.queryByText(/Current plan:/i)).toBeNull();

        // An error banner should be shown.
        const errorBanner = screen.getByRole("alert");
        expect(errorBanner).toBeTruthy();
        expect(errorBanner.textContent).toContain("Failed to save");
      },
    );

    it("reverts to the previously saved tier when a subsequent selection fails",
      async () => {
        // First save succeeds, second save fails.
        const onSave = vi
          .fn()
          .mockResolvedValueOnce(undefined)
          .mockRejectedValueOnce(new Error("Network error"));

        renderWithPickerOpenAndSave(onSave);

        // Select "Pro" — succeeds.
        const proRadio = screen.getByLabelText("Pro plan");
        await act(async () => {
          fireEvent.click(proRadio);
        });
        expect(screen.getByLabelText("Pro plan")).toBeChecked();

        // Select "Enterprise" — fails. Should revert to "Pro".
        const enterpriseRadio = screen.getByLabelText("Enterprise plan");
        await act(async () => {
          fireEvent.click(enterpriseRadio);
        });

        // Should have reverted to Pro.
        expect(screen.getByLabelText("Pro plan")).toBeChecked();
        expect(screen.getByLabelText("Enterprise plan")).not.toBeChecked();

        // Error banner should be shown.
        const errorBanner = screen.getByRole("alert");
        expect(errorBanner.textContent).toContain("Failed to save");
      },
    );

    it("dismisses the error banner when the dismiss button is clicked",
      async () => {
        const onSave = vi.fn().mockRejectedValue(new Error("Network error"));
        renderWithPickerOpenAndSave(onSave);

        const proRadio = screen.getByLabelText("Pro plan");
        await act(async () => {
          fireEvent.click(proRadio);
        });

        expect(screen.getByRole("alert")).toBeTruthy();

        // Dismiss the error.
        const dismissButton = screen.getByLabelText("Dismiss error");
        fireEvent.click(dismissButton);

        expect(screen.queryByRole("alert")).toBeNull();
      },
    );

    it("clears any previous error when a new tier is selected", async () => {
      // First save fails, second succeeds.
      const onSave = vi
        .fn()
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce(undefined);

      renderWithPickerOpenAndSave(onSave);

      // Select "Pro" — fails.
      const proRadio = screen.getByLabelText("Pro plan");
      await act(async () => {
        fireEvent.click(proRadio);
      });
      expect(screen.getByRole("alert")).toBeTruthy();

      // Select "Free" — succeeds. Error should be cleared.
      const freeRadio = screen.getByLabelText("Free plan");
      await act(async () => {
        fireEvent.click(freeRadio);
      });
      expect(screen.queryByRole("alert")).toBeNull();
    });
  });
});

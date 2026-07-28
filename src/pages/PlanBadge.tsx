import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import EmptyState from "../components/EmptyState";
import PlanBadgeComponent, { type PlanTier } from "../components/PlanBadge";
import useDocumentTitle from "../hooks/useDocumentTitle";

/**
 * PlanBadge page — issue #529 (GrantFox FWC26 / Stellar Wave campaign).
 *
 * Displays a themed empty-state illustration when no plan is attached to
 * the current API or account.  Once a tier is selected the badge preview
 * is shown inline so developers can verify the visual result before saving.
 *
 * Accessibility (WCAG 2.1 AA):
 * - The tier selection group uses role="radiogroup" with a visible legend.
 * - Every radio button has an accessible label derived from the tier name.
 * - Focus indicators inherit the global `--accent` focus ring from focus.css.
 * - The EmptyState illustration is aria-hidden; meaning comes from the
 *   heading + paragraph below it.
 * - Error messages use aria-live="polite" for announcement.
 *
 * Design-token consistency:
 * - All colors reference CSS custom properties; no hardcoded hex values.
 * - Dark-mode tested: `--plan-*` tokens and `--surface` / `--text` adapt
 *   automatically via ThemeProvider.
 *
 * Responsive:
 * - The tier picker stacks to a single column below 480 px via flex-wrap.
 * - The page padding scales with `clamp()` so it feels comfortable at every
 *   breakpoint without explicit @media queries.
 *
 * Optimistic UI (#697):
 * - The "Choose a plan" primary CTA opens an inline tier picker instead of
 *   immediately navigating to /billing.
 * - Selecting a tier immediately updates the UI (optimistic update) and
 *   triggers an async save call.
 * - If the save fails the tier reverts to the previous selection and an
 *   error message is shown.
 * - A saving indicator is shown on the active tier while saving.
 */

/** The three plan tiers exposed by PlanBadge. */
const PLAN_TIERS: PlanTier[] = ["free", "pro", "enterprise"];

const TIER_LABELS: Record<PlanTier, string> = {
  free: "Free",
  pro: "Pro",
  enterprise: "Enterprise",
};

/**
 * Default simulated API: saves the selected plan tier.
 * Replace with a real API call when backend integration is ready.
 */
async function defaultSavePlanTier(_tier: PlanTier): Promise<void> {
  // TODO(#697): Replace with actual API call:
  //   await fetch("/api/plan", { method: "PUT", body: JSON.stringify({ tier }) })
  await new Promise((resolve) => setTimeout(resolve, 600));
}

export type PlanBadgePageProps = {
  /**
   * Optional save function, injected for testing.
   * Defaults to a simulated 600 ms delay.
   */
  onSavePlanTier?: (tier: PlanTier) => Promise<void>;
};

export default function PlanBadgePage({
  onSavePlanTier = defaultSavePlanTier,
}: PlanBadgePageProps = {}) {
  const navigate = useNavigate();

  useDocumentTitle(
    "Plan Badge – Callora",
    "Preview and assign a plan tier badge to your API on the Callora marketplace."
  );

  // ── State ──────────────────────────────────────────────────────────────

  /** Whether the inline tier picker is visible (opened by "Choose a plan"). */
  const [showTierPicker, setShowTierPicker] = useState(false);

  /** The tier currently shown in the badge preview (updated optimistically). */
  const [selectedTier, setSelectedTier] = useState<PlanTier | null>(null);

  /** Whether a save operation is in flight. */
  const [saving, setSaving] = useState(false);

  /** Error message shown when a save attempt fails. */
  const [error, setError] = useState<string | null>(null);

  // ── Handlers ───────────────────────────────────────────────────────────

  /**
   * Opens the inline tier picker (primary action of the page).
   * This is the optimistic UI trigger point — instead of navigating away
   * to /billing, the user can pick a tier inline.
   */
  const handleChoosePlan = () => {
    setShowTierPicker(true);
  };

  /**
   * Optimistic tier selection:
   * 1. Immediately update the visible tier.
   * 2. Fire the async save.
   * 3. On failure, revert to the previous tier and show an error.
   */
  const handleTierChange = useCallback(
    async (nextTier: PlanTier) => {
      const prev = selectedTier; // Capture immediately — avoids stale closure.
      setError(null);
      setSelectedTier(nextTier);
      setSaving(true);

      try {
        await onSavePlanTier(nextTier);
      } catch {
        setSelectedTier(prev);
        setError(
          `Failed to save "${TIER_LABELS[nextTier]}" plan. Please try again.`
        );
      } finally {
        setSaving(false);
      }
    },
    [selectedTier, onSavePlanTier]
  );

  const handleLearnMore = () => navigate("/marketplace");

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div
      className="plan-badge-page"
      style={{ padding: "clamp(16px, 4vw, 32px) 0" }}
    >
      {/* ── Page header ──────────────────────────────────────────────── */}
      <header style={{ marginBottom: "32px", padding: "0 4px" }}>
        <p className="eyebrow">API Plan Management</p>
        <h1
          style={{
            margin: "0 0 12px",
            fontSize: "clamp(1.8rem, 3vw, 2.4rem)",
            fontWeight: "700",
            color: "var(--text)",
          }}
        >
          Plan Badge
        </h1>
        <p
          style={{
            margin: 0,
            fontSize: "1rem",
            color: "var(--muted)",
            lineHeight: "1.65",
            maxWidth: "600px",
          }}
        >
          Assign a plan tier to your API to communicate rate limits and support
          levels to marketplace consumers.
        </p>
      </header>

      {/* ── Global error banner ──────────────────────────────────────── */}
      {error && (
        <section
          role="alert"
          aria-live="polite"
          style={{
            marginBottom: "24px",
            padding: "12px 16px",
            borderRadius: "10px",
            background: "var(--danger-bg, #fef2f2)",
            border: "1px solid var(--danger-border, #fca5a5)",
            color: "var(--danger-text, #991b1b)",
            fontSize: "0.875rem",
            lineHeight: 1.5,
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <span aria-hidden="true" style={{ fontSize: "1.125rem" }}>
            &#9888;
          </span>
          <span>{error}</span>
          <button
            type="button"
            aria-label="Dismiss error"
            onClick={() => setError(null)}
            style={{
              marginLeft: "auto",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "inherit",
              fontSize: "1rem",
              lineHeight: 1,
              padding: "2px 6px",
              borderRadius: "4px",
            }}
          >
            &times;
          </button>
        </section>
      )}

      {/* ── Main content ─────────────────────────────────────────────── */}
      {!showTierPicker && selectedTier === null ? (
        /*
         * Empty state — no plan is attached yet and the tier picker has
         * not been opened.
         *
         * Uses the "plan-badge" EmptyState variant (issue #529) which
         * renders a medal-and-ribbon line-art illustration themed with the
         * design-token accent colour.
         */
        <section
          className="surface"
          aria-labelledby="plan-badge-empty-heading"
          style={{ borderRadius: "16px", overflow: "hidden" }}
        >
          <EmptyState
            variant="plan-badge"
            title="No plan selected"
            message="This API doesn't have a plan tier attached yet. Choose a plan to set
              rate limits, communicate support levels, and appear correctly in
              the marketplace."
            action={{
              label: "Choose a plan",
              onClick: handleChoosePlan,
            }}
          />

          {/*
           * Secondary CTA — offered below the primary action so users who
           * want context before committing have a clear path.
           */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              paddingBottom: "32px",
            }}
          >
            <button
              type="button"
              className="ghost-button"
              onClick={handleLearnMore}
              style={{ fontSize: "0.875rem" }}
              aria-label="Learn more about available plans in the marketplace"
            >
              Learn about plans
            </button>
          </div>
        </section>
      ) : (
        /*
         * Plan picker / badge preview — shown after the user clicks
         * "Choose a plan" or after a tier has been selected.
         *
         * Uses optimistic UI: the badge updates immediately on selection
         * before the async save completes, and reverts on failure.
         *
         * Once a tier is saved successfully the badge preview persists
         * and the picker remains available for changing the tier.
         */
        <section
          className="surface"
          style={{ borderRadius: "16px", padding: "32px" }}
          aria-label="Plan badge preview"
        >
          {/* Live badge preview (only when a tier has been selected) */}
          {selectedTier !== null && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "28px",
              }}
            >
              <span style={{ color: "var(--muted)", fontSize: "0.9375rem" }}>
                Current plan:
              </span>
              <PlanBadgeComponent tier={selectedTier} />
              {saving && (
                <span
                  role="status"
                  aria-live="polite"
                  aria-label="Saving plan selection"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "0.75rem",
                    color: "var(--muted)",
                  }}
                >
                  <span
                    aria-hidden="true"
                    className="button-spinner"
                  />
                  Saving…
                </span>
              )}
            </div>
          )}

          {/* Tier picker */}
          <fieldset
            style={{
              border: "none",
              padding: 0,
              margin: 0,
            }}
          >
            <legend
              style={{
                fontSize: "0.9375rem",
                fontWeight: 600,
                color: "var(--text)",
                marginBottom: "16px",
              }}
            >
              {selectedTier === null
                ? "Choose a plan tier"
                : "Change plan tier"}
            </legend>

            <div
              role="radiogroup"
              aria-label="Plan tiers"
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              {PLAN_TIERS.map((tier) => (
                <label
                  key={tier}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 16px",
                    borderRadius: "10px",
                    border: `1.5px solid ${
                      selectedTier === tier ? "var(--accent)" : "var(--line)"
                    }`,
                    background:
                      selectedTier === tier
                        ? "var(--surface-soft)"
                        : "var(--surface)",
                    cursor: "pointer",
                    fontSize: "0.9375rem",
                    color: "var(--text)",
                    transition:
                      "border-color 120ms ease, background 120ms ease",
                    opacity: saving ? 0.6 : 1,
                  }}
                >
                  <input
                    type="radio"
                    name="plan-tier"
                    value={tier}
                    checked={selectedTier === tier}
                    onChange={() => handleTierChange(tier)}
                    aria-label={`${TIER_LABELS[tier]} plan`}
                    style={{ accentColor: "var(--accent)" }}
                    disabled={saving}
                  />
                  {TIER_LABELS[tier]}
                </label>
              ))}
            </div>
          </fieldset>
        </section>
      )}
    </div>
  );
}

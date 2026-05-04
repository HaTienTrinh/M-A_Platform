/**
 * Deal State Machine Validator
 * Enforces strict state transitions per business spec:
 * Draft → Submitted → Under Review → Approved → Published → In Negotiation → Closed
 */

export type DealStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "approved"
  | "active"
  | "under_offer"
  | "closed";

export const VALID_STATE_TRANSITIONS: Record<DealStatus, DealStatus[]> = {
  draft: ["submitted", "draft"], // seller can stay in draft or submit
  submitted: ["under_review", "draft"], // can go to review or back to draft
  under_review: ["approved", "submitted"], // approved or back to submitted
  approved: ["active", "under_review"], // approved deals can publish or go back
  active: ["under_offer", "approved"], // can start negotiation or unpublish
  under_offer: ["closed", "active"], // can close or revert
  closed: [], // terminal state; cannot transition out
};

/**
 * Validate deal state transition
 * @param currentStatus - Current deal status
 * @param newStatus - Intended new status
 * @returns { valid: boolean, error?: string }
 */
export function validateStateTransition(
  currentStatus: DealStatus,
  newStatus: DealStatus,
): { valid: boolean; error?: string } {
  // No change is always valid
  if (currentStatus === newStatus) {
    return { valid: true };
  }

  // Closed state is terminal
  if (currentStatus === "closed") {
    return {
      valid: false,
      error: `Cannot transition from terminal state 'closed'. Deal is immutable.`,
    };
  }

  const allowedTransitions = VALID_STATE_TRANSITIONS[currentStatus];
  if (!allowedTransitions) {
    return {
      valid: false,
      error: `Unknown current status: ${currentStatus}`,
    };
  }

  if (!allowedTransitions.includes(newStatus)) {
    return {
      valid: false,
      error: `Invalid state transition: ${currentStatus} → ${newStatus}. Allowed: ${allowedTransitions.join(", ")}`,
    };
  }

  return { valid: true };
}

/**
 * Get list of valid next states for a given status
 */
export function getValidNextStates(currentStatus: DealStatus): DealStatus[] {
  return VALID_STATE_TRANSITIONS[currentStatus] || [];
}

/**
 * Check if seller can edit deal in current state
 * Sellers can edit: draft, submitted, under_review, approved
 * Sellers CANNOT edit: active, under_offer, closed
 */
export function canSellerEditDeal(status: DealStatus): boolean {
  const editableStates: DealStatus[] = [
    "draft",
    "submitted",
    "under_review",
    "approved",
  ];
  return editableStates.includes(status);
}

/**
 * Check if deal can be unpublished (reverted)
 * Only active and under_offer deals can be unpublished
 */
export function canUnpublishDeal(status: DealStatus): boolean {
  const unpublishableStates: DealStatus[] = ["active", "under_offer"];
  return unpublishableStates.includes(status);
}

/**
 * Check if deal is in a "locked" state (cannot be modified by seller)
 */
export function isDealLocked(status: DealStatus): boolean {
  return (
    status === "closed" || status === "active" || status === "under_offer"
  );
}

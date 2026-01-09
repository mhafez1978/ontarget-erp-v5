/**
 * Staff Status Event System
 *
 * Triggers real-time updates to staff status widgets when relevant events occur.
 * This reduces the need for frequent polling by pushing updates when actions happen.
 */

export function triggerStaffStatusUpdate(companyId: string, action?: string) {
  // Only trigger on relevant events
  const relevantActions = [
    "LOGIN_SUCCESS",
    "LOGOUT",
    "CLOCK_IN",
    "CLOCK_OUT",
    "BREAK_START",
    "BREAK_END",
  ];

  if (action && !relevantActions.includes(action)) {
    return;
  }

  // Dispatch custom event that the widget listens for
  if (typeof window !== "undefined") {
    const event = new CustomEvent("staff-status-change", {
      detail: { companyId, action, timestamp: Date.now() },
    });
    window.dispatchEvent(event);
  }
}

/**
 * Call this from audit log creation to trigger widget updates
 */
export function notifyStaffStatusChange(companyId: string, action: string) {
  triggerStaffStatusUpdate(companyId, action);
}

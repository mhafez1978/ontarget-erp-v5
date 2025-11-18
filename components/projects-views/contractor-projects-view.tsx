"use client";

import { SuperAdminProjectsView } from "./super-admin-projects-view";

// Contractor sees only projects where they are team members
// The API handles the filtering, so we use the same UI
export function ContractorProjectsView() {
  return <SuperAdminProjectsView />;
}

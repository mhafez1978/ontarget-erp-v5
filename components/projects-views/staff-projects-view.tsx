"use client";

import { SuperAdminProjectsView } from "./super-admin-projects-view";

// Staff sees only projects where they are team members
// The API handles the filtering, so we use the same UI
export function StaffProjectsView() {
  return <SuperAdminProjectsView />;
}

"use client";

import { SuperAdminProjectsView } from "./super-admin-projects-view";

// Manager sees only projects where they are team members
// The API handles the filtering, so we use the same UI
export function ManagerProjectsView() {
  return <SuperAdminProjectsView />;
}

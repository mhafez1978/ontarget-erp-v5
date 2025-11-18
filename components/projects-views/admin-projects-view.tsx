"use client";

import { SuperAdminProjectsView } from "./super-admin-projects-view";

// Admin has similar functionality to Super Admin but only sees their company
// For now, we'll reuse the same component as it handles company-specific data
export function AdminProjectsView() {
  return <SuperAdminProjectsView />;
}

"use client";

import { LucideIcon, Building2, Clock } from "lucide-react";
import {
  superAdminMenuItems,
  adminMenuItems,
  managerMenuItems,
  staffMenuItems,
  erpCustomerMenuItems,
  companyCustomerMenuItems,
  contractorMenuItems,
  supplierMenuItems,
} from "./index";

export interface MenuItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string; // Optional badge identifier (e.g., "cart" for cart count)
}

// Role-based menu renderer
export function getRoleMenuItems(
  role: string,
  companyCount: number = 0,
  userPlan?: string | null
): MenuItem[] {
  let menuItems: MenuItem[] = [];

  switch (role) {
    case "SUPER_ADMIN":
      menuItems = superAdminMenuItems;
      break;
    case "ADMIN_OWNER":
      menuItems = adminMenuItems;
      break;
    case "ADMIN_NONOWNER":
      // Non-owner admins get the same admin menu items (view/operational)
      menuItems = adminMenuItems;
      break;
    case "COMPANY_MANAGER":
      menuItems = managerMenuItems;
      break;
    case "COMPANY_STAFF":
      menuItems = staffMenuItems;
      break;
    case "ERP_CUSTOMER":
      menuItems = erpCustomerMenuItems;
      break;
    case "COMPANY_CUSTOMER":
      menuItems = companyCustomerMenuItems;
      break;
    case "COMPANY_CONTRACTOR":
      menuItems = contractorMenuItems;
      break;
    case "COMPANY_SUPPLIER":
      menuItems = supplierMenuItems;
      break;
    case "TRIAL":
    default:
      // TRIAL should not have menu access
      return [];
  }

  // Add Company/Companies link for SUPER_ADMIN, ADMIN_OWNER and ERP_CUSTOMER
  if (
    role === "SUPER_ADMIN" ||
    role === "ADMIN_OWNER" ||
    role === "ADMIN_NONOWNER" ||
    (role === "ERP_CUSTOMER" && companyCount > 0)
  ) {
    const companyLink: MenuItem = {
      href: "/dashboard/companies",
      label: companyCount <= 1 ? "Company" : "Companies",
      icon: Building2,
    };

    // Insert after Dashboard and Profile (first two items)
    return [menuItems[0], menuItems[1], companyLink, ...menuItems.slice(2)];
  }

  // Ensure SUPER_ADMIN always has Timesheet in their menu (defensive check)
  if ((role as string) === "SUPER_ADMIN") {
    if (!menuItems.some((m) => m.href === "/dashboard/timesheet")) {
      const timesheetItem: MenuItem = {
        href: "/dashboard/timesheet",
        label: "Timesheet",
        icon: Clock,
      };
      const wfIdx = menuItems.findIndex(
        (m) => m.href === "/dashboard/workforce"
      );
      if (wfIdx >= 0) menuItems.splice(wfIdx + 1, 0, timesheetItem);
      else menuItems.push(timesheetItem);
    }
  }

  return menuItems;
}

"use client";



import { LucideIcon, Building2 } from "lucide-react";
;
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
    case "ADMIN":
      menuItems = adminMenuItems;
      break;
    case "MANAGER":
      menuItems = managerMenuItems;
      break;
    case "STAFF":
      menuItems = staffMenuItems;
      break;
    case "ERP_CUSTOMER":
      menuItems = erpCustomerMenuItems;
      break;
    case "COMPANY_CUSTOMER":
      menuItems = companyCustomerMenuItems;
      break;
    case "CONTRACTOR":
      menuItems = contractorMenuItems;
      break;
    case "SUPPLIER":
      menuItems = supplierMenuItems;
      break;
    case "GUEST":
    default:
      // GUEST should not have menu access
      return [];
  }

  // Add Company/Companies link for SUPER_ADMIN, ADMIN and ERP_CUSTOMER
  if (
    role === "SUPER_ADMIN" ||
    role === "ADMIN" ||
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

  return menuItems;
}

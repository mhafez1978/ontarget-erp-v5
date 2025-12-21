import { LayoutDashboard, Briefcase, FileText, Settings, Users, User } from "lucide-react";





;

export const contractorMenuItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/profile", label: "Profile", icon: User },
  { href: "/dashboard/customers", label: "Customers", icon: Users },
  { href: "/dashboard/projects", label: "Projects", icon: Briefcase },
  { href: "/dashboard/invoices", label: "Invoices", icon: FileText },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

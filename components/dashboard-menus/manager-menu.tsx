import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  BarChart3,
  Settings,
  FileText,
  User,
  UsersRound,
} from "lucide-react";

export const managerMenuItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/profile", label: "Profile", icon: User },
  { href: "/dashboard/customers", label: "Customers", icon: Users },
  { href: "/dashboard/workforce", label: "Workforce", icon: UsersRound },
  { href: "/dashboard/orders", label: "Orders", icon: ShoppingCart },
  { href: "/dashboard/invoices", label: "Invoices", icon: FileText },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

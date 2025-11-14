import {
  LayoutDashboard,
  ShoppingCart,
  FileText,
  Settings,
  User,
} from "lucide-react";

export const supplierMenuItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/profile", label: "Profile", icon: User },
  { href: "/dashboard/orders", label: "Orders", icon: ShoppingCart },
  { href: "/dashboard/invoices", label: "Invoices", icon: FileText },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

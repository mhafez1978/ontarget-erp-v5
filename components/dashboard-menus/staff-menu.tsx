import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  FileText,
  User,
} from "lucide-react";

export const staffMenuItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/profile", label: "Profile", icon: User },
  { href: "/dashboard/customers", label: "Customers", icon: Users },
  { href: "/dashboard/orders", label: "Orders", icon: ShoppingCart },
  { href: "/dashboard/invoices", label: "Invoices", icon: FileText },
];

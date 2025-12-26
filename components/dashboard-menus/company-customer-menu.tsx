import {
  LayoutDashboard,
  ShoppingCart,
  FileText,
  Settings,
  User,
  ShoppingBag,
  FolderKanban,
} from "lucide-react";

export const companyCustomerMenuItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/profile", label: "Profile", icon: User },
  { href: "/dashboard/catalog", label: "Catalog", icon: ShoppingBag },
  { href: "/dashboard/projects", label: "Projects", icon: FolderKanban },
  { href: "/dashboard/orders", label: "Orders", icon: ShoppingCart },
  { href: "/dashboard/invoices", label: "Invoices", icon: FileText },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

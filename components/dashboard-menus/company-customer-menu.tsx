import {
  LayoutDashboard,
  ShoppingCart,
  FileText,
  User,
  ShoppingBag,
  FolderKanban,
  LifeBuoy,
  Receipt,
} from "lucide-react";

export const companyCustomerMenuItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/profile", label: "Profile", icon: User },
  { href: "/dashboard/catalog", label: "Catalog", icon: ShoppingBag },
  { href: "/dashboard/cart", label: "Cart", icon: ShoppingCart },
  { href: "/dashboard/projects", label: "Projects", icon: FolderKanban },
  { href: "/dashboard/orders", label: "Orders", icon: FileText },
  { href: "/dashboard/invoices", label: "Invoices", icon: Receipt },
  { href: "/dashboard/support", label: "Support", icon: LifeBuoy },
];

import {
  LayoutDashboard,
  Users,
  User,
  FolderKanban,
  Folder,
  HelpCircle,
  Clock,
} from "lucide-react";

export const staffMenuItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/profile", label: "Profile", icon: User },
  { href: "/dashboard/timesheet", label: "Timesheet", icon: Clock },
  { href: "/dashboard/projects", label: "Projects", icon: FolderKanban },
  { href: "/dashboard/customers", label: "Customers", icon: Users },
  { href: "/dashboard/files", label: "Files", icon: Folder },
  { href: "/dashboard/support", label: "Support", icon: HelpCircle },
];

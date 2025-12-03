import {
  LayoutDashboard,
  Users,
  BarChart3,
  Settings,
  User,
  UsersRound,
  FolderKanban,
  Clock,
} from "lucide-react";

export const managerMenuItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/profile", label: "Profile", icon: User },
  { href: "/dashboard/projects", label: "Projects", icon: FolderKanban },
  { href: "/dashboard/customers", label: "Customers", icon: Users },
  { href: "/dashboard/workforce", label: "Workforce", icon: UsersRound },
  { href: "/dashboard/timesheet", label: "Timesheet", icon: Clock },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

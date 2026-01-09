import { ClockInOutWidget } from "@/components/clock-in-out-widget";
import { StaffStatsWidget } from "@/components/staff-stats-widget";
import { StaffStatusWidget } from "@/components/staff-status-widget";

interface ManagerViewProps {
  userName?: string | null;
  companyId?: string | null;
}

export function ManagerView({ userName, companyId }: ManagerViewProps) {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">
        You are a Manager, welcome {userName || "Guest"}!
      </h1>
      <p className="text-muted-foreground">
        Manage your team, oversee projects, and track performance metrics.
      </p>

      {companyId && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl">
          <ClockInOutWidget companyId={companyId} />
          <StaffStatsWidget companyId={companyId} />
          <StaffStatusWidget companyId={companyId} />
        </div>
      )}
    </div>
  );
}

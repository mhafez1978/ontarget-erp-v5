import { ClockInOutWidget } from "@/components/clock-in-out-widget";
import { StaffStatsWidget } from "@/components/staff-stats-widget";

interface StaffViewProps {
  userName?: string | null;
  companyId?: string | null;
}

export function StaffView({ userName, companyId }: StaffViewProps) {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">
        You are a Staff member, welcome {userName || "Guest"}!
      </h1>
      <p className="text-muted-foreground">
        Access your daily tasks, customer interactions, and work assignments.
      </p>

      {companyId && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ClockInOutWidget companyId={companyId} />
          <StaffStatsWidget companyId={companyId} />
        </div>
      )}
    </div>
  );
}

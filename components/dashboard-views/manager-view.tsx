import { ClockInOutWidget } from "@/components/clock-in-out-widget";

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
        <div className="max-w-md">
          <ClockInOutWidget companyId={companyId} />
        </div>
      )}
    </div>
  );
}

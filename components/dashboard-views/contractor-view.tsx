import { ClockInOutWidget } from "@/components/clock-in-out-widget";
import { StaffStatsWidget } from "@/components/staff-stats-widget";

interface ContractorViewProps {
  userName?: string | null;
  companyId?: string | null;
}

export function ContractorView({ userName, companyId }: ContractorViewProps) {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">
        You are a Contractor, welcome {userName || "Guest"}!
      </h1>
      <p className="dark:text-gray-200">
        View your contracts, submit invoices, and manage project deliverables.
      </p>

      {companyId && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl">
          <ClockInOutWidget companyId={companyId} />
          <StaffStatsWidget companyId={companyId} />
        </div>
      )}
    </div>
  );
}

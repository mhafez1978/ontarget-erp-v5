import { ClockInOutWidget } from "@/components/clock-in-out-widget";

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
      <p className="text-muted-foreground">
        View your contracts, submit invoices, and manage project deliverables.
      </p>

      {companyId && (
        <div className="max-w-md">
          <ClockInOutWidget companyId={companyId} />
        </div>
      )}
    </div>
  );
}

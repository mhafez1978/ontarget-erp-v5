interface ContractorViewProps {
  userName?: string | null;
}

export function ContractorView({ userName }: ContractorViewProps) {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">
        You are a Contractor, welcome {userName || "Guest"}!
      </h1>
      <p className="text-muted-foreground">
        View your contracts, track project progress, and submit invoices.
      </p>
    </div>
  );
}

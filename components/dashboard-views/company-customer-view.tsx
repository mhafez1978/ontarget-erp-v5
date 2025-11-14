interface CompanyCustomerViewProps {
  userName?: string | null;
}

export function CompanyCustomerView({ userName }: CompanyCustomerViewProps) {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">
        You are a Company Customer, welcome {userName || "Guest"}!
      </h1>
      <p className="text-muted-foreground">
        Manage your company&apos;s orders, invoices, and business relationships.
      </p>
    </div>
  );
}

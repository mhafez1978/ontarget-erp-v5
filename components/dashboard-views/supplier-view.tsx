interface SupplierViewProps {
  userName?: string | null;
}

export function SupplierView({ userName }: SupplierViewProps) {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">
        You are a Supplier, welcome {userName || "Guest"}!
      </h1>
      <p className="dark:text-gray-200">
        Manage your supply orders, inventory, and delivery schedules.
      </p>
    </div>
  );
}

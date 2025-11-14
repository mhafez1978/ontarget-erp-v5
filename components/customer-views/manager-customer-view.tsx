interface ManagerCustomerViewProps {
  userName?: string | null;
}

export function ManagerCustomerView({ userName }: ManagerCustomerViewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
        <p className="text-muted-foreground">
          Welcome {userName || "Guest"}! As a Manager, you can view and manage
          customers assigned to your department or team.
        </p>
      </div>

      <div className="rounded-lg border bg-card p-8">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold">
            Department Customer Management
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            This is the manager customer view. You can view customer details,
            manage relationships, track interactions, and oversee customer
            satisfaction for your assigned accounts. Team performance metrics
            and customer insights will be displayed here.
          </p>
        </div>
      </div>
    </div>
  );
}

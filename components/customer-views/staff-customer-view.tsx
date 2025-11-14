interface StaffCustomerViewProps {
  userName?: string | null;
}

export function StaffCustomerView({ userName }: StaffCustomerViewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
        <p className="text-muted-foreground">
          Welcome {userName || "Guest"}! As a Staff member, you can view
          customer information and handle day-to-day customer interactions.
        </p>
      </div>

      <div className="rounded-lg border bg-card p-8">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold">Customer Information</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            This is the staff customer view. You can view customer contact
            details, order history, open tickets, and process customer requests.
            Quick access to frequently needed customer information and common
            tasks will be available here.
          </p>
        </div>
      </div>
    </div>
  );
}

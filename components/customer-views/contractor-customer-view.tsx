interface ContractorCustomerViewProps {
  userName?: string | null;
}

export function ContractorCustomerView({
  userName,
}: ContractorCustomerViewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
        <p className="dark:text-gray-200">
          Welcome {userName || "Guest"}! As a Contractor, you can view customer
          information related to your assigned projects.
        </p>
      </div>

      <div className="rounded-lg border bg-card p-8">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold">
            Project Customer Information
          </h2>
          <p className="dark:text-gray-200 max-w-2xl mx-auto">
            This is the contractor customer view. You can view customer details
            and contact information for the projects you are working on. Access
            to customer requirements, specifications, and project-specific
            communication will be available here.
          </p>
        </div>
      </div>
    </div>
  );
}

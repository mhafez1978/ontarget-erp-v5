"use client";

import { CompanyCustomers } from "@/components/company-customers";

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

      <CompanyCustomers />
    </div>
  );
}

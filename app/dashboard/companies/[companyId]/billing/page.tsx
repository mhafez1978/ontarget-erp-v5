"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Loader2 } from "lucide-react";

export default function CompanyBillingPage({ params }: { params: { companyId: string } }) {
  const { companyId } = params;
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const invRes = await fetch(`/api/company/${companyId}/invoices`);
        if (invRes.ok) {
          const data = await invRes.json();
          setInvoices(data.invoices || []);
        }

        const payRes = await fetch(`/api/company/${companyId}/payments`);
        if (payRes.ok) {
          const data = await payRes.json();
          setPayments(data.payments || []);
        }
      } catch (err) {
        console.error("Failed to load billing data:", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [companyId]);

  if (loading) return (
    <DashboardLayout user={{ name: null, email: null, image: null, role: "GUEST" }}>
      <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout user={{ name: null, email: null, image: null, role: "GUEST" }}>
      <div className="container mx-auto py-10">
        <h1 className="text-2xl font-bold mb-4">Billing</h1>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-2">Invoices</h2>
          <div className="overflow-auto border rounded">
            <table className="w-full table-fixed">
              <thead>
                <tr className="text-left">
                  <th className="p-2">#</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Total</th>
                  <th className="p-2">Issue Date</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-t">
                    <td className="p-2">{inv.invoiceNumber}</td>
                    <td className="p-2">{inv.status}</td>
                    <td className="p-2">{inv.total}</td>
                    <td className="p-2">{new Date(inv.issueDate).toLocaleDateString()}</td>
                  </tr>
                ))}
                {invoices.length === 0 && <tr><td className="p-4" colSpan={4}>No invoices found.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">Payments</h2>
          <div className="overflow-auto border rounded">
            <table className="w-full table-fixed">
              <thead>
                <tr className="text-left">
                  <th className="p-2">ID</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Amount</th>
                  <th className="p-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="p-2">{p.gatewayReference || p.id}</td>
                    <td className="p-2">{p.status}</td>
                    <td className="p-2">{p.amount} {p.currency}</td>
                    <td className="p-2">{new Date(p.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
                {payments.length === 0 && <tr><td className="p-4" colSpan={4}>No payments found.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

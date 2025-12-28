"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { DashboardLayout } from "@/components/dashboard-layout";

interface OrderItem {
  id: string;
  itemName: string;
  quantity: number;
  price: number;
  total: number;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  shippingAddress: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  items: OrderItem[];
  createdAt: string;
  company: {
    name: string;
    logo: string | null;
    email: string | null;
    phone: string | null;
  };
}

export default function OrderReceiptPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const orderId = params.orderId as string;
  const shouldAutoPrint = searchParams.get("print") === "true";
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  // User state for dashboard layout
  const [user, setUser] = useState<{
    name: string | null;
    email: string | null;
    image: string | null;
    role: string;
  }>({
    name: null,
    email: null,
    image: null,
    role: "GUEST",
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("/api/auth/me");
        const data = await response.json();

        if (data.authenticated && data.user) {
          setUser({
            name: data.user.name,
            email: data.user.email,
            image: data.user.image,
            role: data.user.role,
          });
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/orders/${orderId}`);
        if (response.ok) {
          const data = await response.json();
          setOrder(data.order);
        }
      } catch (error) {
        console.error("Error fetching order:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  useEffect(() => {
    // Update document title for PDF filename
    if (order) {
      const orderDate = new Date(order.createdAt)
        .toLocaleDateString("en-US", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        })
        .replace(/\//g, "-");
      document.title = `${order.company.name} - ${orderDate}`;
    }
  }, [order]);

  useEffect(() => {
    // Auto-print when page loads and order is ready (only if print param is true)
    if (order && !loading && shouldAutoPrint) {
      setTimeout(() => window.print(), 500);
    }
  }, [order, loading, shouldAutoPrint]);

  if (loading) {
    return (
      <DashboardLayout user={user}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!order) {
    return (
      <DashboardLayout user={user}>
        <div className="flex items-center justify-center min-h-screen">
          <p>Order not found</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user}>
      <style jsx global>{`
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="max-w-4xl mx-auto p-8 bg-white">
        {/* Header with Company Branding */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b-2 border-gray-200">
          <div>
            {order.company.logo && (
              <Image
                src={order.company.logo}
                alt={order.company.name}
                width={150}
                height={60}
                className="mb-2"
              />
            )}
            <h1 className="text-2xl font-bold text-gray-900">
              {order.company.name}
            </h1>
            {order.company.email && (
              <p className="text-sm text-gray-600">{order.company.email}</p>
            )}
            {order.company.phone && (
              <p className="text-sm text-gray-600">{order.company.phone}</p>
            )}
          </div>
          <div className="text-right">
            <h2 className="text-3xl font-bold text-gray-900">ORDER RECEIPT</h2>
            <p className="text-lg font-semibold text-gray-700 mt-1">
              #{order.id}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {new Date(order.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Customer Information */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 uppercase mb-2">
              Bill To
            </h3>
            <p className="font-semibold text-gray-900">{order.customerName}</p>
            <p className="text-sm text-gray-600">{order.customerEmail}</p>
            {order.customerPhone && (
              <p className="text-sm text-gray-600">{order.customerPhone}</p>
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700 uppercase mb-2">
              Ship To
            </h3>
            <p className="text-sm text-gray-900">
              {order.shippingAddress.line1}
            </p>
            {order.shippingAddress.line2 && (
              <p className="text-sm text-gray-900">
                {order.shippingAddress.line2}
              </p>
            )}
            <p className="text-sm text-gray-900">
              {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
              {order.shippingAddress.postalCode}
            </p>
            <p className="text-sm text-gray-900">
              {order.shippingAddress.country}
            </p>
          </div>
        </div>

        {/* Order Items */}
        <div className="mb-8">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 text-sm font-semibold text-gray-700 uppercase">
                  Item
                </th>
                <th className="text-center py-3 text-sm font-semibold text-gray-700 uppercase">
                  Qty
                </th>
                <th className="text-right py-3 text-sm font-semibold text-gray-700 uppercase">
                  Price
                </th>
                <th className="text-right py-3 text-sm font-semibold text-gray-700 uppercase">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id} className="border-b border-gray-100">
                  <td className="py-4 text-gray-900">{item.itemName}</td>
                  <td className="py-4 text-center text-gray-700">
                    {item.quantity}
                  </td>
                  <td className="py-4 text-right text-gray-700">
                    ${Number(item.price).toFixed(2)}
                  </td>
                  <td className="py-4 text-right font-semibold text-gray-900">
                    ${Number(item.total).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-80">
            <div className="flex justify-between py-2 text-gray-700">
              <span>Subtotal:</span>
              <span>${Number(order.subtotal).toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2 text-gray-700">
              <span>Tax:</span>
              <span>${Number(order.tax).toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2 text-gray-700">
              <span>Shipping:</span>
              <span>${Number(order.shipping).toFixed(2)}</span>
            </div>
            {Number(order.discount) > 0 && (
              <div className="flex justify-between py-2 text-green-600">
                <span>Discount:</span>
                <span>-${Number(order.discount).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between py-3 border-t-2 border-gray-200 text-lg font-bold text-gray-900">
              <span>Total:</span>
              <span>${Number(order.total).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-600">Thank you for your business!</p>
          <p className="text-xs text-gray-500 mt-2">
            This is a computer-generated receipt and does not require a
            signature.
          </p>
        </div>

        {/* Print Button (hidden when printing) */}
        <div className="no-print mt-8 text-center">
          <button
            onClick={() => window.print()}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Print Receipt
          </button>
          <button
            onClick={() => window.close()}
            className="ml-4 px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}

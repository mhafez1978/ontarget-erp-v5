"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertTriangle, CheckCircle } from "lucide-react";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  tax: number;
  total: number;
  dueDate: string;
  status: string;
  type: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;
}

interface CompanyReactivationBannerProps {
  companyId: string;
  companyName?: string; // Optional to avoid unused variable warning
  isActive: boolean;
}

function PaymentForm({ invoice }: { invoice: Invoice }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Submit payment element
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setError(submitError.message || "Payment failed");
        setIsProcessing(false);
        return;
      }

      // Create payment method
      const { error: paymentError, paymentMethod } =
        await stripe.createPaymentMethod({
          elements,
        });

      if (paymentError) {
        setError(paymentError.message || "Failed to create payment method");
        setIsProcessing(false);
        return;
      }

      // Process payment via API
      const response = await fetch("/api/invoices/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: invoice.id,
          paymentMethodId: paymentMethod.id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Payment failed");
        setIsProcessing(false);
        return;
      }

      setSuccess(true);

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
      setIsProcessing(false);
    }
  };

  if (success) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          Payment successful! Your company has been reactivated. Redirecting...
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing Payment...
          </>
        ) : (
          `Pay $${invoice.total.toFixed(2)}`
        )}
      </Button>
    </form>
  );
}

export default function CompanyReactivationBanner({
  companyId,
  isActive,
}: CompanyReactivationBannerProps) {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(!isActive);
  const [showPayment, setShowPayment] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  useEffect(() => {
    if (isActive) {
      return;
    }

    // Fetch unpaid invoice
    fetch(
      `/api/invoices?companyId=${companyId}&status=OVERDUE&type=TRIAL_SUBSCRIPTION`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.invoices && data.invoices.length > 0) {
          setInvoice(data.invoices[0]);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to fetch invoice:", error);
        setLoading(false);
      });
  }, [companyId, isActive]);

  if (isActive || loading) {
    return null;
  }

  if (!invoice) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Your company account is suspended. Please contact support for
          assistance.
        </AlertDescription>
      </Alert>
    );
  }

  const handleLoadPayment = async () => {
    try {
      // Create payment intent to get client secret
      const response = await fetch("/api/invoices/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: invoice.id }),
      });

      const data = await response.json();

      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
        setShowPayment(true);
      }
    } catch (error) {
      console.error("Failed to load payment:", error);
    }
  };

  return (
    <div className="mb-6 space-y-4">
      <Alert variant="destructive">
        <AlertTriangle className="h-5 w-5" />
        <AlertDescription className="text-base font-medium">
          ⚠️ Your company account is currently suspended due to an unpaid
          invoice. Team members cannot access the system until payment is
          received.
        </AlertDescription>
      </Alert>

      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Action Required: Payment Overdue
          </CardTitle>
          <CardDescription>
            Pay your invoice now to restore full access for your team
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Invoice Details */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">Invoice Number:</span>
              <span>{invoice.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Due Date:</span>
              <span className="text-red-600 font-medium">
                {new Date(invoice.dueDate).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
              <span>Total Amount Due:</span>
              <span className="text-red-600">${invoice.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Invoice Items */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Invoice Items:</h4>
            {invoice.items.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span>
                  {item.description} (×{item.quantity})
                </span>
                <span>${item.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>

          {/* Payment Section */}
          {showPayment && clientSecret ? (
            <div className="border-t pt-4 mt-4">
              <h4 className="font-medium mb-4">Enter Payment Details</h4>
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: {
                    theme: "stripe",
                  },
                }}
              >
                <PaymentForm invoice={invoice} />
              </Elements>
            </div>
          ) : (
            <Button onClick={handleLoadPayment} className="w-full" size="lg">
              Pay Invoice & Reactivate Company
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

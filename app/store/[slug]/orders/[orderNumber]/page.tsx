import { CheckCircle, Package, MapPin, Mail, Phone } from "lucide-react";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import Image from "next/image";




;
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";

interface PageProps {
  params: {
    slug: string;
    orderNumber: string;
  };
}

interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface ProductImage {
  url: string;
}

interface ServiceImage {
  url: string;
}

async function getOrderData(slug: string, orderNumber: string) {
  // Get company by slug
  const company = await db.company.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      logo: true,
      email: true,
      phone: true,
    },
  });

  if (!company) {
    return null;
  }

  // Get order by order number and company
  const order = await db.storefrontOrder.findFirst({
    where: {
      orderNumber,
      companyId: company.id,
    },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              images: true,
              sku: true,
            },
          },
          service: {
            select: {
              id: true,
              name: true,
              images: true,
            },
          },
        },
      },
    },
  });

  if (!order) {
    return null;
  }

  return { company, order };
}

function getStatusBadge(status: string) {
  const variants: Record<string, { color: string; label: string }> = {
    PENDING: { color: "bg-yellow-100 text-yellow-800", label: "Pending" },
    CONFIRMED: { color: "bg-blue-100 text-blue-800", label: "Confirmed" },
    PROCESSING: { color: "bg-purple-100 text-purple-800", label: "Processing" },
    SHIPPED: { color: "bg-indigo-100 text-indigo-800", label: "Shipped" },
    DELIVERED: { color: "bg-green-100 text-green-800", label: "Delivered" },
    CANCELED: { color: "bg-red-100 text-red-800", label: "Canceled" },
    REFUNDED: { color: "bg-gray-100 text-gray-800", label: "Refunded" },
  };

  const config = variants[status] || {
    color: "bg-gray-100 text-gray-800",
    label: status,
  };
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}
    >
      {config.label}
    </span>
  );
}

function getPaymentBadge(status: string) {
  const variants: Record<string, { color: string; label: string }> = {
    PENDING: {
      color: "bg-yellow-100 text-yellow-800",
      label: "Payment Pending",
    },
    PAID: { color: "bg-green-100 text-green-800", label: "Paid" },
    FAILED: { color: "bg-red-100 text-red-800", label: "Payment Failed" },
    REFUNDED: { color: "bg-gray-100 text-gray-800", label: "Refunded" },
  };

  const config = variants[status] || {
    color: "bg-gray-100 text-gray-800",
    label: status,
  };
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}
    >
      {config.label}
    </span>
  );
}

export default async function OrderConfirmationPage({ params }: PageProps) {
  const data = await getOrderData(params.slug, params.orderNumber);

  if (!data) {
    notFound();
  }

  const { company, order } = data;
  const shippingAddress = order.shippingAddress as Address | null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <Link
              href={`/store/${params.slug}`}
              className="flex items-center gap-3"
            >
              {company.logo ? (
                <Image
                  src={company.logo}
                  alt={company.name}
                  width={40}
                  height={40}
                  className="rounded"
                />
              ) : (
                <div className="w-10 h-10 bg-primary rounded flex items-center justify-center text-primary-foreground font-bold">
                  {company.name.charAt(0)}
                </div>
              )}
              <span className="text-xl font-bold">{company.name}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Success Message */}
        <div className="bg-white rounded-lg shadow-sm border p-8 mb-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Order Confirmed!</h1>
          <p className="text-lg text-muted-foreground mb-4">
            Thank you for your order. We&apos;ve sent a confirmation email to{" "}
            <span className="font-medium">{order.customerEmail}</span>
          </p>
          <div className="flex items-center justify-center gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Order Number:</span>{" "}
              <span className="font-bold">{order.orderNumber}</span>
            </div>
            <Separator orientation="vertical" className="h-6" />
            <div>
              <span className="text-muted-foreground">Date:</span>{" "}
              <span className="font-medium">
                {format(new Date(order.createdAt), "MMMM d, yyyy")}
              </span>
            </div>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {/* Left Column - Order Details */}
          <div className="md:col-span-2 space-y-6">
            {/* Order Status */}
            <Card>
              <CardHeader>
                <CardTitle>Order Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status:</span>
                  {getStatusBadge(order.status)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Payment:</span>
                  {getPaymentBadge(order.paymentStatus)}
                </div>
                {order.shippedAt && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Shipped on:</span>
                    <span className="font-medium">
                      {format(new Date(order.shippedAt), "MMM d, yyyy")}
                    </span>
                  </div>
                )}
                {order.deliveredAt && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Delivered on:</span>
                    <span className="font-medium">
                      {format(new Date(order.deliveredAt), "MMM d, yyyy")}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
                <CardDescription>
                  {order.items.length} item{order.items.length !== 1 && "s"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.items.map((item) => {
                    const itemData = item.product || item.service;
                    const images = itemData?.images as
                      | ProductImage[]
                      | ServiceImage[]
                      | null;
                    const image =
                      images && images.length > 0 ? images[0].url : null;

                    return (
                      <div
                        key={item.id}
                        className="flex items-center gap-4 pb-4 border-b last:border-0 last:pb-0"
                      >
                        {image ? (
                          <Image
                            src={image}
                            alt={itemData?.name || "Item"}
                            width={80}
                            height={80}
                            className="rounded object-cover"
                          />
                        ) : (
                          <div className="w-20 h-20 bg-gray-100 rounded flex items-center justify-center">
                            <Package className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="font-medium">
                            {itemData?.name || "Unknown Item"}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Quantity: {item.quantity}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            ${Number(item.price).toFixed(2)} each
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            ${Number(item.total).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            {shippingAddress && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Shipping Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm space-y-1">
                    <div>{order.customerName}</div>
                    <div>{shippingAddress.line1}</div>
                    {shippingAddress.line2 && (
                      <div>{shippingAddress.line2}</div>
                    )}
                    <div>
                      {shippingAddress.city}, {shippingAddress.state}{" "}
                      {shippingAddress.postalCode}
                    </div>
                    <div>{shippingAddress.country}</div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Order Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span>${Number(order.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax:</span>
                  <span>${Number(order.tax).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping:</span>
                  <span>${Number(order.shipping).toFixed(2)}</span>
                </div>
                {Number(order.discount) > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount:</span>
                    <span>-${Number(order.discount).toFixed(2)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>${Number(order.total).toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle>Need Help?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {company.email && (
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="text-sm">
                      <div className="font-medium">Email Us</div>
                      <a
                        href={`mailto:${company.email}`}
                        className="text-primary hover:underline"
                      >
                        {company.email}
                      </a>
                    </div>
                  </div>
                )}
                {company.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="text-sm">
                      <div className="font-medium">Call Us</div>
                      <a
                        href={`tel:${company.phone}`}
                        className="text-primary hover:underline"
                      >
                        {company.phone}
                      </a>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Link href={`/store/${params.slug}`}>
              <Button className="w-full">Continue Shopping</Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ShoppingCart,
  Package,
  FileText,
  MessageSquare,
  Store,
} from "lucide-react";

interface CompanyCustomerViewProps {
  userName?: string | null;
}

export function CompanyCustomerView({ userName }: CompanyCustomerViewProps) {
  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {userName || "Guest"}! 👋
        </h1>
        <p className="dark:text-gray-200 text-lg">
          Browse our catalog, manage your orders, and track your purchases all
          in one place.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:border-primary transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5 text-primary" />
              Browse Catalog
            </CardTitle>
            <CardDescription>
              Explore products and services available for purchase
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/catalog">
              <Button className="w-full">View Catalog</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:border-primary transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              Shopping Cart
            </CardTitle>
            <CardDescription>
              Review items and proceed to checkout
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/cart">
              <Button variant="outline" className="w-full">
                View Cart
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:border-primary transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              My Orders
            </CardTitle>
            <CardDescription>
              Track your order status and history
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/orders">
              <Button variant="outline" className="w-full">
                View Orders
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:border-primary transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Invoices
            </CardTitle>
            <CardDescription>
              Access your billing and invoice history
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/invoices">
              <Button variant="outline" className="w-full">
                View Invoices
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:border-primary transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Support
            </CardTitle>
            <CardDescription>
              Get help and submit support tickets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/support">
              <Button variant="outline" className="w-full">
                Get Support
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

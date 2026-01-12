"use client";

import {
  Package,
  Search,
  Eye,
  Loader2,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Clock,
  Printer,
} from "lucide-react";
import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

import Image from "next/image";
import { format } from "date-fns";

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  total: number;
  product?: {
    id: string;
    name: string;
    images: string[] | null;
  } | null;
  service?: {
    id: string;
    name: string;
    images: string[] | null;
  } | null;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  status: string;
  paymentStatus: string;
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  paymentMethod: string | null;
  customerNotes: string | null;
  internalNotes: string | null;
  shippingAddress: unknown;
  billingAddress: unknown;
  createdAt: string;
  items: OrderItem[];
  user?: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
}

type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELED"
  | "REFUNDED";

type PaymentStatusType = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

export default function OrdersPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

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

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    revenue: 0,
  });

  // Create order states - commented out (feature not implemented in this component)
  // const [createOrderOpen, setCreateOrderOpen] = useState(false);
  // const [companies, setCompanies] = useState<
  //   Array<{ id: string; name: string; isRoot: boolean }>
  // >([]);
  // const [customers, setCustomers] = useState<
  //   Array<{
  //     id: string;
  //     name: string | null;
  //     email: string | null;
  //     phone: string | null;
  //   }>
  // >([]);
  // const [products, setProducts] = useState<
  //   Array<{ id: string; name: string; price: number }>
  // >([]);
  // const [services, setServices] = useState<
  //   Array<{ id: string; name: string; price: number }>
  // >([]);
  // const [selectedCompanyId, setSelectedCompanyId] = useState("");
  // const [selectedCustomerId, setSelectedCustomerId] = useState("");
  // const [orderItems, setOrderItems] = useState<
  //   Array<{
  //     type: "product" | "service";
  //     id: string;
  //     name: string;
  //     quantity: number;
  //     unitPrice: number;
  //   }>
  // >([]);
  // const [creatingOrder, setCreatingOrder] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/orders");

      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }

      const data = await response.json();
      setOrders(data.orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

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

  const isCustomer =
    user.role === "COMPANY_CUSTOMER" || user.role === "ERP_CUSTOMER";
  const canEditOrders = ["STAFF", "MANAGER", "ADMIN", "SUPER_ADMIN"].includes(
    user.role
  );

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    );
  };

  const toggleAllOrders = () => {
    if (selectedOrderIds.length === filteredOrders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(filteredOrders.map((order) => order.id));
    }
  };

  const printOrder = (orderId: string) => {
    // Create hidden iframe for printing
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = `/dashboard/orders/${orderId}/receipt?print=true`;
    document.body.appendChild(iframe);

    // Remove iframe after printing
    iframe.onload = () => {
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    };
  };

  const printSelectedOrders = () => {
    if (selectedOrderIds.length === 0) {
      toast.error("Please select at least one order to print");
      return;
    }

    selectedOrderIds.forEach((orderId, index) => {
      setTimeout(() => printOrder(orderId), index * 500);
    });
  };

  const getStatusVariant = (
    status: string
  ): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "DELIVERED":
        return "default";
      case "SHIPPED":
      case "PROCESSING":
        return "secondary";
      case "CANCELED":
      case "REFUNDED":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getPaymentStatusVariant = (
    paymentStatus: string
  ): "default" | "secondary" | "destructive" | "outline" => {
    switch (paymentStatus) {
      case "PAID":
        return "default";
      case "PENDING":
        return "outline";
      case "FAILED":
      case "REFUNDED":
        return "destructive";
      default:
        return "secondary";
    }
  };

  useEffect(() => {
    fetchUser();
    fetchOrders();
  }, []);

  const filterOrders = () => {
    let filtered = [...orders];

    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    if (paymentFilter !== "all") {
      filtered = filtered.filter(
        (order) => order.paymentStatus === paymentFilter
      );
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order.id.toLowerCase().includes(query) ||
          order.customerName.toLowerCase().includes(query) ||
          order.customerEmail.toLowerCase().includes(query)
      );
    }

    setFilteredOrders(filtered);
  };

  const calculateStats = () => {
    const total = orders.length;
    const pending = orders.filter((o) => o.status === "PENDING").length;
    const processing = orders.filter(
      (o) => o.status === "PROCESSING" || o.status === "CONFIRMED"
    ).length;
    const completed = orders.filter((o) => o.status === "DELIVERED").length;
    const revenue = orders
      .filter((o) => o.paymentStatus === "PAID")
      .reduce((sum, o) => sum + Number(o.total), 0);

    setStats({ total, pending, processing, completed, revenue });
  };

  useEffect(() => {
    filterOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders, statusFilter, paymentFilter, searchQuery]);

  useEffect(() => {
    calculateStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders]);

  const handleUpdateOrder = async () => {
    if (!selectedOrder) return;

    try {
      setUpdating(true);
      const response = await fetch(`/api/orders/${selectedOrder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: selectedOrder.status,
          paymentStatus: selectedOrder.paymentStatus,
          internalNotes: selectedOrder.internalNotes,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update order");
      }

      const data = await response.json();

      // Update orders list
      setOrders((prev) =>
        prev.map((o) => (o.id === data.order.id ? data.order : o))
      );

      toast.success("Order updated successfully");
      setSheetOpen(false);
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Failed to update order");
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      {
        variant: "default" | "secondary" | "destructive" | "outline";
        label: string;
      }
    > = {
      PENDING: { variant: "outline", label: "Pending" },
      CONFIRMED: { variant: "secondary", label: "Confirmed" },
      PROCESSING: { variant: "default", label: "Processing" },
      SHIPPED: { variant: "default", label: "Shipped" },
      DELIVERED: { variant: "default", label: "Delivered" },
      CANCELED: { variant: "destructive", label: "Canceled" },
      REFUNDED: { variant: "destructive", label: "Refunded" },
    };

    const config = variants[status] || { variant: "outline", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPaymentBadge = (status: string) => {
    const variants: Record<
      string,
      {
        variant: "default" | "secondary" | "destructive" | "outline";
        label: string;
      }
    > = {
      PENDING: { variant: "outline", label: "Pending" },
      PAID: { variant: "default", label: "Paid" },
      FAILED: { variant: "destructive", label: "Failed" },
      REFUNDED: { variant: "secondary", label: "Refunded" },
    };

    const config = variants[status] || { variant: "outline", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Orders</h1>
            <p className="dark:text-gray-200">
              Manage and track customer orders
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div
          className={`grid gap-4 ${
            user.role === "ERP_CUSTOMER" || user.role === "COMPANY_CUSTOMER"
              ? "md:grid-cols-2 lg:grid-cols-4"
              : "md:grid-cols-2 lg:grid-cols-5"
          }`}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Orders
              </CardTitle>
              <ShoppingCart className="h-4 w-4 dark:text-gray-200" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 dark:text-gray-200" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Processing</CardTitle>
              <Package className="h-4 w-4 dark:text-gray-200" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.processing}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <TrendingUp className="h-4 w-4 dark:text-gray-200" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completed}</div>
            </CardContent>
          </Card>

          {/* Revenue Card - Hide for customers */}
          {user.role !== "ERP_CUSTOMER" && user.role !== "COMPANY_CUSTOMER" && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                <DollarSign className="h-4 w-4 dark:text-gray-200" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${stats.revenue.toFixed(2)}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filter Orders</CardTitle>
            <CardDescription>
              Search and filter orders by status and payment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 dark:text-gray-200" />
                <Input
                  placeholder="Search by order #, name, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                  <SelectItem value="PROCESSING">Processing</SelectItem>
                  <SelectItem value="SHIPPED">Shipped</SelectItem>
                  <SelectItem value="DELIVERED">Delivered</SelectItem>
                  <SelectItem value="CANCELED">Canceled</SelectItem>
                  <SelectItem value="REFUNDED">Refunded</SelectItem>
                </SelectContent>
              </Select>

              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by payment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payments</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                  <SelectItem value="REFUNDED">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>
              {filteredOrders.length} order{filteredOrders.length !== 1 && "s"}{" "}
              found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin dark:text-gray-200" />
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Package className="h-12 w-12 dark:text-gray-200 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No orders found</h3>
                <p className="text-sm dark:text-gray-200">
                  {searchQuery ||
                  statusFilter !== "all" ||
                  paymentFilter !== "all"
                    ? "Try adjusting your filters"
                    : "Orders will appear here once customers make purchases"}
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {isCustomer && (
                        <TableHead className="w-12">
                          <Checkbox
                            checked={
                              selectedOrderIds.length ===
                                filteredOrders.length &&
                              filteredOrders.length > 0
                            }
                            onCheckedChange={toggleAllOrders}
                            aria-label="Select all orders"
                          />
                        </TableHead>
                      )}
                      <TableHead>Order #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => (
                      <TableRow key={order.id}>
                        {isCustomer && (
                          <TableCell>
                            <Checkbox
                              checked={selectedOrderIds.includes(order.id)}
                              onCheckedChange={() =>
                                toggleOrderSelection(order.id)
                              }
                              aria-label={`Select order ${order.id}`}
                            />
                          </TableCell>
                        )}
                        <TableCell className="font-medium">
                          {order.id.toUpperCase()}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {order.customerName}
                            </div>
                            <div className="text-sm dark:text-gray-200">
                              {order.customerEmail}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{order.items.length}</TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell>
                          {getPaymentBadge(order.paymentStatus)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ${Number(order.total).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {format(new Date(order.createdAt), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (isCustomer) {
                                  window.location.href = `/dashboard/orders/${order.id}/receipt`;
                                } else {
                                  setSelectedOrder(order);
                                  setSheetOpen(true);
                                }
                              }}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                printOrder(order.id);
                              }}
                              title="Print Receipt"
                            >
                              <Printer className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order Details Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {selectedOrder && (
            <>
              <SheetHeader>
                <SheetTitle>Order {selectedOrder.id.toUpperCase()}</SheetTitle>
                <SheetDescription>
                  Placed on{" "}
                  {format(
                    new Date(selectedOrder.createdAt),
                    "MMMM d, yyyy 'at' h:mm a"
                  )}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Customer Information */}
                <div>
                  <h3 className="font-semibold mb-3">Customer Information</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="dark:text-gray-200">Name:</span>{" "}
                      {selectedOrder.customerName}
                    </div>
                    <div>
                      <span className="dark:text-gray-200">Email:</span>{" "}
                      {selectedOrder.customerEmail}
                    </div>
                    {selectedOrder.customerPhone && (
                      <div>
                        <span className="dark:text-gray-200">Phone:</span>{" "}
                        {selectedOrder.customerPhone}
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <h3 className="font-semibold mb-3">Order Items</h3>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item) => {
                      const itemData = item.product || item.service;
                      const image =
                        itemData?.images && Array.isArray(itemData.images)
                          ? itemData.images[0]
                          : null;

                      return (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 p-3 border rounded-lg"
                        >
                          {image ? (
                            <Image
                              src={image}
                              alt={itemData?.name || "Item"}
                              width={60}
                              height={60}
                              className="rounded object-cover"
                            />
                          ) : (
                            <div className="w-[60px] h-[60px] bg-muted rounded flex items-center justify-center">
                              <Package className="h-6 w-6 dark:text-gray-200" />
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="font-medium">
                              {itemData?.name || "Unknown Item"}
                            </div>
                            <div className="text-sm dark:text-gray-200">
                              Qty: {item.quantity} × $
                              {Number(item.unitPrice).toFixed(2)}
                            </div>
                          </div>
                          <div className="font-medium">
                            ${Number(item.total).toFixed(2)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Order Totals */}
                <div>
                  <h3 className="font-semibold mb-3">Order Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="dark:text-gray-200">Subtotal:</span>
                      <span>${Number(selectedOrder.subtotal).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="dark:text-gray-200">Tax:</span>
                      <span>${Number(selectedOrder.tax).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="dark:text-gray-200">Shipping:</span>
                      <span>${Number(selectedOrder.shipping).toFixed(2)}</span>
                    </div>
                    {Number(selectedOrder.discount) > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount:</span>
                        <span>
                          -${Number(selectedOrder.discount).toFixed(2)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold pt-2 border-t">
                      <span>Total:</span>
                      <span>${Number(selectedOrder.total).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Customer Notes */}
                {selectedOrder.customerNotes && (
                  <div>
                    <h3 className="font-semibold mb-2">Customer Notes</h3>
                    <p className="text-sm dark:text-gray-200">
                      {selectedOrder.customerNotes}
                    </p>
                  </div>
                )}

                {/* Status Information for Customers (Read-Only) */}
                {isCustomer && (
                  <div className="space-y-3 pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Order Status:</span>
                      <Badge variant={getStatusVariant(selectedOrder.status)}>
                        {selectedOrder.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">
                        Payment Status:
                      </span>
                      <Badge
                        variant={getPaymentStatusVariant(
                          selectedOrder.paymentStatus
                        )}
                      >
                        {selectedOrder.paymentStatus}
                      </Badge>
                    </div>
                    {selectedOrder.paymentMethod && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">
                          Payment Method:
                        </span>
                        <span className="text-sm dark:text-gray-200">
                          {selectedOrder.paymentMethod}
                        </span>
                      </div>
                    )}
                    <Button
                      onClick={() => {
                        window.open(
                          `/dashboard/orders/${selectedOrder.id}/receipt`,
                          "_blank"
                        );
                      }}
                      className="w-full mt-4"
                    >
                      <Printer className="mr-2 h-4 w-4" />
                      Print Receipt
                    </Button>
                  </div>
                )}

                {/* Order Management for Staff (Editable) */}
                {canEditOrders && (
                  <div className="space-y-4 pt-4 border-t">
                    <div>
                      <Label htmlFor="status">Order Status</Label>
                      <Select
                        value={selectedOrder.status}
                        onValueChange={(value) =>
                          setSelectedOrder({
                            ...selectedOrder,
                            status: value as OrderStatus,
                          })
                        }
                      >
                        <SelectTrigger id="status" className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PENDING">Pending</SelectItem>
                          <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                          <SelectItem value="PROCESSING">Processing</SelectItem>
                          <SelectItem value="SHIPPED">Shipped</SelectItem>
                          <SelectItem value="DELIVERED">Delivered</SelectItem>
                          <SelectItem value="CANCELED">Canceled</SelectItem>
                          <SelectItem value="REFUNDED">Refunded</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="paymentStatus">Payment Status</Label>
                      <Select
                        value={selectedOrder.paymentStatus}
                        onValueChange={(value) =>
                          setSelectedOrder({
                            ...selectedOrder,
                            paymentStatus: value as PaymentStatusType,
                          })
                        }
                      >
                        <SelectTrigger id="paymentStatus" className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PENDING">Pending</SelectItem>
                          <SelectItem value="PAID">Paid</SelectItem>
                          <SelectItem value="FAILED">Failed</SelectItem>
                          <SelectItem value="REFUNDED">Refunded</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="internalNotes">Internal Notes</Label>
                      <Textarea
                        id="internalNotes"
                        value={selectedOrder.internalNotes || ""}
                        onChange={(e) =>
                          setSelectedOrder({
                            ...selectedOrder,
                            internalNotes: e.target.value,
                          })
                        }
                        placeholder="Add internal notes about this order..."
                        className="mt-1"
                        rows={4}
                      />
                    </div>

                    <Button
                      onClick={handleUpdateOrder}
                      disabled={updating}
                      className="w-full"
                    >
                      {updating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        "Update Order"
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Floating Action Button for Batch Print */}
      {isCustomer && selectedOrderIds.length > 0 && (
        <div className="fixed bottom-8 right-8 z-50">
          <Button
            onClick={printSelectedOrders}
            size="lg"
            className="shadow-lg hover:shadow-xl transition-shadow"
          >
            <Printer className="mr-2 h-5 w-5" />
            Print {selectedOrderIds.length} Order
            {selectedOrderIds.length !== 1 && "s"}
          </Button>
        </div>
      )}
    </DashboardLayout>
  );
}

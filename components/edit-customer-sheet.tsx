"use client";


import { Loader2, UserCog } from "lucide-react";
import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

;
import { useFormDirty, getPulsateClassName } from "@/lib/hooks/use-form-dirty";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Customer {
  id: string;
  name: string;
  email: string;
  role: string;
  companyId: string;
}

interface EditCustomerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
  onSuccess?: () => void;
  isSuperAdmin?: boolean;
}

export function EditCustomerSheet({
  open,
  onOpenChange,
  customer,
  onSuccess,
  isSuperAdmin = false,
}: EditCustomerSheetProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
  });

  // Load customer data when sheet opens or customer changes
  useEffect(() => {
    if (customer && open) {
      console.log("Loading customer data:", customer); // Debug log
      setFormData({
        name: customer.name || "",
        email: customer.email || "",
        role: customer.role || "",
      });
      setError(null);
    } else if (!open) {
      // Reset form when sheet closes
      setFormData({
        name: "",
        email: "",
        role: "",
      });
      setError(null);
    }
  }, [customer, open]);

  // Track if form is dirty
  const isFormDirty = useFormDirty(
    {
      name: customer?.name || "",
      email: customer?.email || "",
      role: customer?.role || "",
    },
    formData
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;

    setError(null);
    setIsSubmitting(true);

    try {
      const endpoint = isSuperAdmin
        ? `/api/subscribers/${customer.id}`
        : `/api/customers/${customer.id}`;

      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          role: formData.role,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update customer");
      }

      toast.success(`Customer "${formData.name}" updated successfully`);
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      console.error("Failed to update customer:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
      toast.error(
        err instanceof Error ? err.message : "Failed to update customer"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Edit Customer
          </SheetTitle>
          <SheetDescription>
            Update customer information below.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              type="text"
              placeholder="e.g., John Doe"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
            />
          </div>

          {!isSuperAdmin && (
            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STAFF">Staff</SelectItem>
                  <SelectItem value="MANAGER">Manager</SelectItem>
                  <SelectItem value="CONTRACTOR">Contractor</SelectItem>
                  <SelectItem value="COMPANY_CUSTOMER">
                    Company Customer
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className={`flex-1 ${getPulsateClassName(isFormDirty)}`}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <UserCog className="mr-2 h-4 w-4" />
                  Update Customer
                </>
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

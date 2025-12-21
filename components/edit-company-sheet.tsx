"use client";


import { Loader2, Building2 } from "lucide-react";
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
import {
  AddressAutocomplete,
  AddressData,
} from "@/components/address-autocomplete";
import { toast } from "sonner";
import LocationsManager from "@/components/locations-manager";

interface Company {
  id: string;
  name: string;
  slogan: string | null;
  description: string | null;
  email: string | null;
  salesEmail: string | null;
  supportEmail: string | null;
  phone: string | null;
  website: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  countryCode: string | null;
  postalCode: string | null;
}

interface EditCompanySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: Company | null;
  onSuccess?: () => void;
}

export function EditCompanySheet({
  open,
  onOpenChange,
  company,
  onSuccess,
}: EditCompanySheetProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    slogan: "",
    description: "",
    email: "",
    salesEmail: "",
    supportEmail: "",
    phone: "",
    website: "",
  });

  const [addressData, setAddressData] = useState<AddressData>({
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    country: "",
    countryCode: "",
    postalCode: "",
  });

  // Load company data when sheet opens or company changes
  useEffect(() => {
    let mounted = true;

    async function loadCompanyDetails() {
      // If given company has only light fields (from my-owned), fetch full details
      if (company && open) {
        try {
          // If company already has email/address fields populated, use it
          const needsFetch = typeof (company as any).email === "undefined";

          if (needsFetch) {
            const res = await fetch(`/api/company/${company.id}`);
            if (!mounted) return;
            if (res.ok) {
              const data = await res.json();
              const full = data.company;
              setFormData({
                name: full.name || "",
                slogan: full.slogan || "",
                description: full.description || "",
                email: full.email || "",
                salesEmail: full.salesEmail || "",
                supportEmail: full.supportEmail || "",
                phone: full.phone || "",
                website: full.website || "",
              });
              setAddressData({
                addressLine1: full.addressLine1 || "",
                addressLine2: full.addressLine2 || "",
                city: full.city || "",
                state: full.state || "",
                country: full.country || "",
                countryCode: full.countryCode || "",
                postalCode: full.postalCode || "",
                latitude: full.latitude ?? undefined,
                longitude: full.longitude ?? undefined,
              });
              setError(null);
            } else {
              // fallback to minimal company data
              setFormData({
                name: company.name || "",
                slogan: (company as any).slogan || "",
                description: (company as any).description || "",
                email: "",
                salesEmail: "",
                supportEmail: "",
                phone: "",
                website: "",
              });
            }
          } else {
            setFormData({
              name: company.name || "",
              slogan: company.slogan || "",
              description: company.description || "",
              email: company.email || "",
              salesEmail: (company as any).salesEmail || "",
              supportEmail: (company as any).supportEmail || "",
              phone: (company as any).phone || "",
              website: (company as any).website || "",
            });
            setAddressData({
              addressLine1: (company as any).addressLine1 || "",
              addressLine2: (company as any).addressLine2 || "",
              city: (company as any).city || "",
              state: (company as any).state || "",
              country: (company as any).country || "",
              countryCode: (company as any).countryCode || "",
              postalCode: (company as any).postalCode || "",
              latitude: (company as any).latitude ?? undefined,
              longitude: (company as any).longitude ?? undefined,
            });
            setError(null);
          }
        } catch (err) {
          console.error("Failed to load company details:", err);
          if (mounted) setError("Failed to load company details");
        }
      } else if (!open) {
        // Reset form when sheet closes
        setFormData({
          name: "",
          slogan: "",
          description: "",
          email: "",
          salesEmail: "",
          supportEmail: "",
          phone: "",
          website: "",
        });
        setAddressData({
          addressLine1: "",
          addressLine2: "",
          city: "",
          state: "",
          country: "",
          countryCode: "",
          postalCode: "",
        });
        setError(null);
      }
    }

    loadCompanyDetails();

    return () => {
      mounted = false;
    };
  }, [company, open]);

  // Track if form is dirty
  const isFormDirty = useFormDirty(
    {
      name: company?.name || "",
      slogan: company?.slogan || "",
      description: company?.description || "",
      email: company?.email || "",
      salesEmail: company?.salesEmail || "",
      supportEmail: company?.supportEmail || "",
      phone: company?.phone || "",
      website: company?.website || "",
    },
    formData
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/company/${company.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          slogan: formData.slogan,
          description: formData.description,
          email: formData.email,
          salesEmail: formData.salesEmail,
          supportEmail: formData.supportEmail,
          phone: formData.phone,
          website: formData.website,
          address: addressData,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update company");
      }

      toast.success(`Company "${formData.name}" updated successfully`);
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      console.error("Failed to update company:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
      toast.error(
        err instanceof Error ? err.message : "Failed to update company"
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
            <Building2 className="h-5 w-5" />
            Edit Company
          </SheetTitle>
          <SheetDescription>
            Update your company information below.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6 px-6">
          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Company Name *</Label>
            <Input
              id="name"
              type="text"
              placeholder="e.g., Acme Corporation"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slogan">Slogan</Label>
            <Input
              id="slogan"
              type="text"
              placeholder="Your company tagline or slogan"
              value={formData.slogan}
              onChange={(e) =>
                setFormData({ ...formData, slogan: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              type="text"
              placeholder="Brief description of your company"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="contact@company.com"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="salesEmail">Sales Email</Label>
            <Input
              id="salesEmail"
              type="email"
              placeholder="sales@company.com"
              value={formData.salesEmail}
              onChange={(e) =>
                setFormData({ ...formData, salesEmail: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="supportEmail">Support Email</Label>
            <Input
              id="supportEmail"
              type="email"
              placeholder="support@company.com"
              value={formData.supportEmail}
              onChange={(e) =>
                setFormData({ ...formData, supportEmail: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+1 (555) 123-4567"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="url"
              placeholder="https://company.com"
              value={formData.website}
              onChange={(e) =>
                setFormData({ ...formData, website: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <AddressAutocomplete
              label="Company Address"
              value={addressData}
              onChange={setAddressData}
            />
          </div>

          {company && (
            <div className="border-t pt-6">
              <LocationsManager companyId={company.id} />
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
                  <Building2 className="mr-2 h-4 w-4" />
                  Update Company
                </>
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

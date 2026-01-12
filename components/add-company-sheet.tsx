"use client";

import { Loader2, Building2, AlertCircle } from "lucide-react";
import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";

import { useFormDirty, getPulsateClassName } from "@/lib/hooks/use-form-dirty";
import {
  AddressAutocomplete,
  AddressData,
} from "@/components/address-autocomplete";
import {
  LEGAL_ENTITY_LABELS,
  TAX_ID_TYPE_LABELS,
  requiresBusinessTaxId,
} from "@/lib/validations/company-tax";
import {
  COMPANY_INDUSTRY_LABELS,
  getIndustriesByCategory,
} from "@/lib/validations/company-industry";
import { CompanyIndustry } from "@prisma/client";

interface AddCompanySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddCompanySheet({
  open,
  onOpenChange,
  onSuccess,
}: AddCompanySheetProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initialFormData = {
    name: "",
    slogan: "",
    description: "",
    industry: "",
    email: "",
    salesEmail: "",
    supportEmail: "",
    phone: "",
    website: "",
  };

  const initialAddressData: AddressData = {
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    country: "",
    countryCode: "",
    postalCode: "",
  };

  const initialTaxData = {
    legalEntity: "",
    taxIdType: "",
    taxId: "",
    taxCountry: "",
  };

  const [formData, setFormData] = useState(initialFormData);
  const [addressData, setAddressData] =
    useState<AddressData>(initialAddressData);
  const [taxData, setTaxData] = useState(initialTaxData);
  const [hedraEnabled, setHedraEnabled] = useState(false);

  // Track if form is dirty
  const isFormDirty = useFormDirty(initialFormData, formData);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/company/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          slogan: formData.slogan,
          description: formData.description,
          industry: formData.industry || undefined,
          email: formData.email,
          salesEmail: formData.salesEmail,
          supportEmail: formData.supportEmail,
          phone: formData.phone,
          website: formData.website,
          address: addressData,
          taxInfo:
            taxData.legalEntity && taxData.taxIdType && taxData.taxId
              ? taxData
              : undefined,
          hedraEnabled,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create company");
      }

      // Reset form and close sheet
      setFormData(initialFormData);
      setAddressData(initialAddressData);
      setTaxData(initialTaxData);
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      console.error("Failed to create company:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
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
            Add New Company
          </SheetTitle>
          <SheetDescription>
            Create a new company. This will be owned by you.
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
              placeholder="OnTarget Brands Inc"
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
              placeholder="Brief description of the company"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="industry">Industry</Label>
            <Select
              value={formData.industry}
              onValueChange={(value) =>
                setFormData({ ...formData, industry: value })
              }
            >
              <SelectTrigger id="industry">
                <SelectValue placeholder="Select your industry" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {Object.entries(getIndustriesByCategory()).map(
                  ([category, industries]) => (
                    <div key={category}>
                      <div className="px-2 py-1.5 text-xs font-semibold dark:text-gray-200">
                        {category}
                      </div>
                      {industries.map((industry) => (
                        <SelectItem key={industry.value} value={industry.value}>
                          {industry.label}
                        </SelectItem>
                      ))}
                    </div>
                  )
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Company Email</Label>
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
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+1 (555) 000-0000"
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

          <AddressAutocomplete
            label="Company Address (Optional)"
            value={addressData}
            onChange={setAddressData}
          />

          {/* Tax Information Section */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 dark:text-gray-200 mt-0.5" />
              <div>
                <h3 className="font-semibold text-sm">
                  Tax Information (Optional)
                </h3>
                <p className="text-xs dark:text-gray-200 mt-1">
                  Required for invoicing, payroll, and IRS compliance
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="legalEntity">Legal Entity Type</Label>
              <Select
                value={taxData.legalEntity}
                onValueChange={(value) =>
                  setTaxData({ ...taxData, legalEntity: value, taxIdType: "" })
                }
              >
                <SelectTrigger id="legalEntity">
                  <SelectValue placeholder="Select entity type..." />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {Object.entries(LEGAL_ENTITY_LABELS).map(
                    ([key, { label, region }]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex flex-col">
                          <span>{label}</span>
                          <span className="text-xs dark:text-gray-200">
                            {region}
                          </span>
                        </div>
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            {taxData.legalEntity && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="taxIdType">Tax ID Type</Label>
                  <Select
                    value={taxData.taxIdType}
                    onValueChange={(value) =>
                      setTaxData({ ...taxData, taxIdType: value })
                    }
                  >
                    <SelectTrigger id="taxIdType">
                      <SelectValue placeholder="Select tax ID type..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {Object.entries(TAX_ID_TYPE_LABELS).map(
                        ([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {requiresBusinessTaxId(taxData.legalEntity) && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      Business entities require EIN/ITIN or equivalent tax ID
                      (not SSN)
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="taxId">
                    {taxData.legalEntity === "SOLE_PROPRIETOR"
                      ? "SSN / Tax ID"
                      : "EIN / Tax ID"}
                  </Label>
                  <Input
                    id="taxId"
                    type="text"
                    placeholder={
                      taxData.legalEntity === "SOLE_PROPRIETOR"
                        ? "XXX-XX-XXXX"
                        : "XX-XXXXXXX"
                    }
                    value={taxData.taxId}
                    onChange={(e) =>
                      setTaxData({
                        ...taxData,
                        taxId: e.target.value.toUpperCase(),
                      })
                    }
                  />
                  <p className="text-xs dark:text-gray-200">
                    Data is encrypted and stored securely for compliance
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Hedera Anchoring Option */}
          <div className="space-y-2 pt-4 border-t">
            <Label>Hedera Anchoring (Optional)</Label>
            <div className="flex items-center gap-2 mt-2">
              <Checkbox
                checked={hedraEnabled}
                onCheckedChange={(v) => setHedraEnabled(!!v)}
              />
              <div className="text-sm dark:text-gray-200">
                Enable Hedera anchoring for this company (requires Super Admin
                to enable globally).
              </div>
            </div>
          </div>

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
              disabled={isSubmitting || !formData.name}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Building2 className="h-4 w-4 mr-2" />
                  Create Company
                </>
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
// ... imports remain the same
import {
  Plus,
  Trash2,
  Edit2,
  MapPin,
  Building2,
  Phone,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { AddressAutocomplete } from "@/components/address-autocomplete";
import { CompanyLocation, LocationType } from "@prisma/client";

interface LocationsManagerProps {
  companyId: string;
}

// Helper function moved OUTSIDE the component since it doesn't need state.
// This prevents it from being recreated on every render.
const getLocationTypeLabel = (type: LocationType) => {
  const labels: Record<LocationType, string> = {
    HEADQUARTERS: "Headquarters",
    BRANCH: "Branch",
    OFFICE: "Office",
    WAREHOUSE: "Warehouse",
  };
  return labels[type];
};

export default function LocationsManager({ companyId }: LocationsManagerProps) {
  const [locations, setLocations] = useState<CompanyLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] =
    useState<CompanyLocation | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "BRANCH" as LocationType,
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
    latitude: 0,
    longitude: 0,
    phone: "",
    email: "",
    hours: "",
    notes: "",
    isMain: false,
  });

  // 1. CRITICAL: Wrapped in useCallback to prevent infinite useEffect loop
  const fetchLocations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/company/${companyId}/locations`);

      if (!response.ok) {
        toast.error("Failed to fetch locations");
        return;
      }

      const data = await response.json();
      setLocations(data.locations || []);
    } catch (error) {
      console.error("Error fetching locations:", error);
      toast.error("Error fetching locations");
    } finally {
      setLoading(false);
    }
  }, [companyId]); // Only recreate if companyId changes

  // Fetch locations on mount
  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const handleAddLocation = () => {
    setEditingLocation(null);
    setFormData({
      name: "",
      type: "BRANCH",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      country: "",
      postalCode: "",
      latitude: 0,
      longitude: 0,
      phone: "",
      email: "",
      hours: "",
      notes: "",
      isMain: locations.length === 0,
    });
    setDialogOpen(true);
  };

  const handleEditLocation = (location: CompanyLocation) => {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      type: location.type,
      addressLine1: location.addressLine1,
      addressLine2: location.addressLine2 || "",
      city: location.city,
      state: location.state || "",
      country: location.country,
      postalCode: location.postalCode || "",
      latitude: location.latitude,
      longitude: location.longitude,
      phone: location.phone || "",
      email: location.email || "",
      hours: location.hours || "",
      notes: location.notes || "",
      isMain: location.isMain,
    });
    setDialogOpen(true);
  };

  // 2. OPTIMIZATION: Wrapped in useCallback.
  // This is passed to <AddressAutocomplete />, so keeping the reference stable
  // prevents that child component from re-rendering unnecessarily.
  const handleAddressSelect = useCallback(
    (address: {
      addressLine1: string;
      city: string;
      country: string;
      state?: string;
      postalCode?: string;
      latitude: number;
      longitude: number;
    }) => {
      setFormData((prev) => ({
        ...prev,
        addressLine1: address.addressLine1,
        city: address.city,
        state: address.state || "",
        country: address.country,
        postalCode: address.postalCode || "",
        latitude: address.latitude,
        longitude: address.longitude,
      }));
    },
    []
  );

  const handleSaveLocation = async () => {
    if (
      !formData.name ||
      !formData.addressLine1 ||
      !formData.city ||
      !formData.country ||
      formData.latitude === 0 ||
      formData.longitude === 0
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const method = editingLocation ? "PATCH" : "POST";
      const url = editingLocation
        ? `/api/company/${companyId}/locations/${editingLocation.id}`
        : `/api/company/${companyId}/locations`;

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || "Failed to save location");
        return;
      }

      toast.success(editingLocation ? "Location updated" : "Location created");
      setDialogOpen(false);
      fetchLocations();
    } catch (error) {
      console.error("Error saving location:", error);
      toast.error("Error saving location");
    }
  };

  const handleDeleteLocation = async (locationId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this location? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `/api/company/${companyId}/locations/${locationId}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || "Failed to delete location");
        return;
      }

      toast.success("Location deleted");
      fetchLocations();
    } catch (error) {
      console.error("Error deleting location:", error);
      toast.error("Error deleting location");
    }
  };

  if (loading) {
    return (
      <div className="text-center text-sm text-gray-500">
        Loading locations...
      </div>
    );
  }

  return (
    // ... JSX remains exactly the same
    <div className="space-y-4">
      {/* (Truncated for brevity, paste your previous JSX here) */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Company Locations</h3>
        <Button onClick={handleAddLocation} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Location
        </Button>
      </div>

      {locations.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-sm text-gray-500">
            No locations yet. Add your first location to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {locations.map((location) => (
            <Card key={location.id} className="overflow-hidden">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-blue-600" />
                      <h4 className="font-semibold">{location.name}</h4>
                      {location.isMain && (
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                          Main
                        </span>
                      )}
                      <span className="text-xs text-gray-500">
                        {getLocationTypeLabel(location.type)}
                      </span>
                    </div>

                    <div className="space-y-1 text-sm text-gray-600">
                      <p className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        {location.addressLine1}
                        {location.addressLine2 && `, ${location.addressLine2}`}
                      </p>
                      <p>
                        {location.city}, {location.state} {location.postalCode}
                      </p>
                      <p>{location.country}</p>

                      {location.phone && (
                        <p className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          {location.phone}
                        </p>
                      )}
                      {location.email && (
                        <p className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {location.email}
                        </p>
                      )}

                      {location.hours && (
                        <p className="text-xs text-gray-500">
                          Hours: {location.hours}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditLocation(location)}
                      className="gap-2"
                    >
                      <Edit2 className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteLocation(location.id)}
                      className="gap-2 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingLocation ? "Edit Location" : "Add New Location"}
            </DialogTitle>
            <DialogDescription>
              {editingLocation
                ? "Update the location details below"
                : "Create a new company location"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Name */}
            <div>
              <Label htmlFor="location-name">Name *</Label>
              <Input
                id="location-name"
                placeholder="e.g., New York Headquarters"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>

            {/* Type */}
            <div>
              <Label htmlFor="location-type">Location Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    type: value as LocationType,
                  }))
                }
              >
                <SelectTrigger id="location-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HEADQUARTERS">Headquarters</SelectItem>
                  <SelectItem value="BRANCH">Branch</SelectItem>
                  <SelectItem value="OFFICE">Office</SelectItem>
                  <SelectItem value="WAREHOUSE">Warehouse</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Address Autocomplete */}
            <div>
              <Label>Address *</Label>
              <AddressAutocomplete
                value={{
                  addressLine1: formData.addressLine1,
                  addressLine2: formData.addressLine2,
                  city: formData.city,
                  country: formData.country,
                  countryCode: "",
                  state: formData.state,
                  postalCode: formData.postalCode,
                  latitude: formData.latitude,
                  longitude: formData.longitude,
                }}
                onChange={(address) =>
                  setFormData((prev) => ({
                    ...prev,
                    addressLine1: address.addressLine1,
                    addressLine2: address.addressLine2 || "",
                    city: address.city,
                    country: address.country,
                    state: address.state || "",
                    postalCode: address.postalCode || "",
                    latitude: address.latitude ?? 0,
                    longitude: address.longitude ?? 0,
                  }))
                }
              />
            </div>

            {/* Rest of the dialog fields... */}
            <div>
              <Label htmlFor="address-line2">Address Line 2</Label>
              <Input
                id="address-line2"
                placeholder="Apt, Suite, Floor, etc."
                value={formData.addressLine2}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    addressLine2: e.target.value,
                  }))
                }
              />
            </div>

            {/* City, State, Country Row */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, city: e.target.value }))
                  }
                  placeholder="City"
                />
              </div>
              <div>
                <Label htmlFor="state">State/Province</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, state: e.target.value }))
                  }
                  placeholder="State"
                />
              </div>
              <div>
                <Label htmlFor="country">Country *</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      country: e.target.value,
                    }))
                  }
                  placeholder="Country"
                />
              </div>
            </div>

            {/* Postal Code */}
            <div>
              <Label htmlFor="postal-code">Postal Code</Label>
              <Input
                id="postal-code"
                value={formData.postalCode}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    postalCode: e.target.value,
                  }))
                }
                placeholder="12345"
              />
            </div>

            {/* Contact Info Row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="location@company.com"
                />
              </div>
            </div>

            {/* Hours */}
            <div>
              <Label htmlFor="hours">Business Hours</Label>
              <Input
                id="hours"
                value={formData.hours}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, hours: e.target.value }))
                }
                placeholder="Mon-Fri: 9AM-5PM"
              />
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Any additional information..."
              />
            </div>

            {/* Main Location Checkbox */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is-main"
                checked={formData.isMain}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, isMain: e.target.checked }))
                }
                className="rounded border-gray-300"
              />
              <Label htmlFor="is-main" className="cursor-pointer">
                Set as main location
              </Label>
            </div>

            {/* Coordinates Display */}
            <div className="rounded bg-gray-50 p-3 text-sm text-gray-600">
              <p>
                Coordinates: {formData.latitude.toFixed(4)},{" "}
                {formData.longitude.toFixed(4)}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveLocation}>
                {editingLocation ? "Update Location" : "Create Location"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

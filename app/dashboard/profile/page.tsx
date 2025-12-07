"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { EmailVerificationBanner } from "@/components/email-verification-banner";
import { MfaSettings } from "@/components/mfa-settings";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { AddressAutocomplete } from "@/components/address-autocomplete";
import { Upload, Loader2, Save, User } from "lucide-react";

interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: string;
  plan: string;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  countryCode: string | null;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  // Email verification / MFA
  emailVerified?: string | null;
  mfaEnabled?: boolean;
  mfaSetupAt?: string | null;
}

interface FormData {
  name: string;
  email: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  country: string;
  countryCode: string;
  postalCode: string;
  latitude: number | null;
  longitude: number | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    country: "",
    countryCode: "",
    postalCode: "",
    latitude: null,
    longitude: null,
  });

  const [originalData, setOriginalData] = useState<FormData>({
    name: "",
    email: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    country: "",
    countryCode: "",
    postalCode: "",
    latitude: null,
    longitude: null,
  });

  const [isDirty, setIsDirty] = useState(false);

  // Calculate profile completion percentage
  const calculateProgress = () => {
    const fields = [
      formData.name,
      formData.addressLine1,
      formData.city,
      formData.state,
      formData.country,
      formData.postalCode,
      user?.image,
    ];
    const filledFields = fields.filter(
      (field) => field && field.length > 0
    ).length;
    return Math.round((filledFields / fields.length) * 100);
  };

  const progress = calculateProgress();

  const fetchProfile = useCallback(async () => {
    try {
      const response = await fetch("/api/user/profile", {
        cache: "no-store",
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error("Failed to fetch profile");
      }

      const data = await response.json();
      console.log("🔍 Initial profile data loaded:", data);
      console.log("🖼️ User image from API:", data.image);
      const imageWithCache = data.image
        ? `${data.image}${data.image.includes("?") ? "&" : "?"}t=${Date.now()}`
        : data.image;
      setUser({ ...data, image: imageWithCache });

      const profileData = {
        name: data.name || "",
        email: data.email || "",
        addressLine1: data.addressLine1 || "",
        addressLine2: data.addressLine2 || "",
        city: data.city || "",
        state: data.state || "",
        country: data.country || "",
        countryCode: data.countryCode || "",
        postalCode: data.postalCode || "",
        latitude: data.latitude,
        longitude: data.longitude,
      };

      setFormData(profileData);
      setOriginalData(profileData);
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Fetch user profile
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Debug: Track user.image changes
  useEffect(() => {
    console.log("👁️ user.image changed in profile page:", user?.image);
  }, [user?.image]);

  // Check if form is dirty
  useEffect(() => {
    const isFormDirty =
      JSON.stringify(formData) !== JSON.stringify(originalData);
    setIsDirty(isFormDirty);
  }, [formData, originalData]);

  // Heartbeat for dirty state
  useEffect(() => {
    if (!isDirty) return;

    const interval = setInterval(() => {
      console.log("Form has unsaved changes...");
    }, 5000);

    return () => clearInterval(interval);
  }, [isDirty]);

  const clearSelectedImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      clearSelectedImage();
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      clearSelectedImage();
      return;
    }

    setSelectedImage(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadSelectedAvatar = async () => {
    if (!selectedImage) return;

    setUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append("image", selectedImage);

      const response = await fetch("/api/user/profile/image", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload image");
      }

      const timestamp = Date.now();
      const cacheBustedUrl = `${data.imageUrl}?t=${timestamp}`;

      setUser((prev) =>
        prev ? { ...prev, image: cacheBustedUrl || prev.image } : prev
      );

      window.dispatchEvent(
        new CustomEvent("profile-updated", {
          detail: { imageUrl: cacheBustedUrl },
        })
      );

      toast.success("Profile image updated successfully!");
      clearSelectedImage();
    } catch (error) {
      console.error("Image upload error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to upload image"
      );
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddressChange = (address: {
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    country: string;
    countryCode: string;
    postalCode: string;
    latitude?: number;
    longitude?: number;
  }) => {
    setFormData((prev) => ({
      ...prev,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2,
      city: address.city,
      state: address.state,
      country: address.country,
      countryCode: address.countryCode,
      postalCode: address.postalCode,
      latitude: address.latitude || null,
      longitude: address.longitude || null,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isDirty) {
      toast.info("No changes to save");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      const updatedUser = data.user
        ? {
            ...data.user,
            image: data.user.image
              ? `${data.user.image}${
                  data.user.image.includes("?") ? "&" : "?"
                }t=${Date.now()}`
              : data.user.image,
          }
        : null;
      setUser(updatedUser);
      setOriginalData(formData);
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update profile"
      );
    } finally {
      setSaving(false);
    }
  };

  const currentAvatarSrc = imagePreview
    ? imagePreview
    : user?.image
    ? `${user.image}`
    : "";

  const avatarKey = imagePreview
    ? `preview-${imagePreview}`
    : user?.image || "no-profile-image";

  if (loading) {
    return (
      <DashboardLayout
        user={user || { name: null, email: null, image: null, role: "GUEST" }}
      >
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout user={user}>
      <div className="p-6 max-w-6xl">
        <Tabs defaultValue="profile">
          <TabsList>
            <TabsTrigger value="profile">Profile information</TabsTrigger>
            <TabsTrigger value="security">Account security</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-2">My Profile</h1>
              <p className="text-muted-foreground">
                Manage your personal information and preferences
              </p>
            </div>

            {/* Profile Completion Progress */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Profile Completion</CardTitle>
                <CardDescription>
                  Complete your profile to unlock all features ({progress}%)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Progress value={progress} className="h-3" />
              </CardContent>
            </Card>

            {/* Profile Image Upload */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Profile Picture</CardTitle>
                <CardDescription>
                  Upload a profile picture. Recommended size: 400x400px, max 5MB
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6 flex-wrap">
                  <Avatar className="h-24 w-24" key={avatarKey}>
                    {currentAvatarSrc ? (
                      <AvatarImage
                        src={currentAvatarSrc}
                        alt={user.name || "User"}
                      />
                    ) : null}
                    <AvatarFallback className="text-2xl">
                      {user.name?.charAt(0).toUpperCase() || <User />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      id="profile-image"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarSelect}
                    />
                    <div className="flex flex-wrap gap-2">
                      {selectedImage ? (
                        <>
                          <Button
                            type="button"
                            onClick={handleUploadSelectedAvatar}
                            disabled={uploadingImage}
                          >
                            {uploadingImage ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="mr-2 h-4 w-4" />
                                Upload Photo
                              </>
                            )}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={clearSelectedImage}
                            disabled={uploadingImage}
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingImage}
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Choose Photo
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      JPG, PNG or GIF. Max 5MB.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Profile Form */}
            <form onSubmit={handleSubmit}>
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>
                    Update your personal details and contact information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">
                        Email Address
                        {user.email?.endsWith("@github.placeholder.local") &&
                          " *"}
                      </Label>
                      {user.email?.endsWith("@github.placeholder.local") ? (
                        <>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                email: e.target.value,
                              })
                            }
                            placeholder="your.email@example.com"
                            className="border-yellow-500"
                          />
                          <p className="text-xs text-yellow-600 mt-1">
                            ⚠️ Please update your email address (GitHub
                            didn&apos;t provide one)
                          </p>
                        </>
                      ) : (
                        <>
                          <Input
                            id="email"
                            type="email"
                            value={user.email || ""}
                            disabled
                            className="bg-muted"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Email cannot be changed
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="role">Role</Label>
                      <Input
                        id="role"
                        value={user.role}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                    <div>
                      <Label htmlFor="plan">Subscription Plan</Label>
                      <Input
                        id="plan"
                        value={user.plan}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Address Information</CardTitle>
                  <CardDescription>
                    Search and select your address using the autocomplete below
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AddressAutocomplete
                    label="Search Address"
                    value={{
                      addressLine1: formData.addressLine1,
                      addressLine2: formData.addressLine2,
                      city: formData.city,
                      state: formData.state,
                      country: formData.country,
                      countryCode: formData.countryCode,
                      postalCode: formData.postalCode,
                      latitude: formData.latitude ?? undefined,
                      longitude: formData.longitude ?? undefined,
                    }}
                    onChange={handleAddressChange}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Start typing to search for your address. The selected
                    address will be saved automatically.
                  </p>

                  {formData.addressLine1 && (
                    <div className="mt-4 p-4 bg-muted rounded-lg">
                      <p className="text-sm font-medium mb-2">
                        Current Address:
                      </p>
                      <p className="text-sm">{formData.addressLine1}</p>
                      {formData.addressLine2 && (
                        <p className="text-sm">{formData.addressLine2}</p>
                      )}
                      <p className="text-sm">
                        {formData.city}, {formData.state} {formData.postalCode}
                      </p>
                      <p className="text-sm">{formData.country}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={!isDirty || saving}
                  className="flex-1"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFormData(originalData)}
                  disabled={!isDirty || saving}
                >
                  Reset
                </Button>
              </div>

              {isDirty && (
                <p className="text-sm text-amber-600 dark:text-amber-400 mt-4 text-center">
                  You have unsaved changes
                </p>
              )}
            </form>
          </TabsContent>

          <TabsContent value="security">
            {/* Email verification banner and MFA settings */}
            <div className="mb-4">
              <EmailVerificationBanner
                userEmail={user.email || ""}
                emailVerified={!!user.emailVerified}
              />
            </div>

            <MfaSettings
              initialMfaEnabled={!!user.mfaEnabled}
              initialMfaSetupAt={
                user.mfaSetupAt ? new Date(user.mfaSetupAt) : null
              }
              onMfaStatusChange={(enabled, setupAt) => {
                setUser((prev) =>
                  prev
                    ? {
                        ...prev,
                        mfaEnabled: enabled,
                        mfaSetupAt: setupAt ? setupAt.toISOString() : null,
                      }
                    : null
                );
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

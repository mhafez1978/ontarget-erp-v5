"use client";


import { Upload, CheckCircle2, Circle, FileText, ChevronRight } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
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
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface OnboardingData {
  valid: boolean;
  staff: {
    name: string;
    email: string;
    jobTitle: string;
  };
  company: {
    id: string;
    name: string;
    logo?: string;
    logoLight?: string;
    logoDark?: string;
  };
  progress: {
    step1Complete: boolean;
    step2Complete: boolean;
    step3Complete: boolean;
    step4Complete: boolean;
  };
  documents: Array<{
    id: string;
    docType: string;
    fileName: string;
    status: string;
    uploadedAt: string;
  }>;
  requiredDocs: string[];
  missingDocs: string[];
  isComplete: boolean;
}

interface DocumentRequirement {
  type: string;
  label: string;
  description: string;
  required: boolean;
}

const documentRequirements: DocumentRequirement[] = [
  {
    type: "SSN_CARD",
    label: "Social Security Card",
    description: "Clear photo or scan of your SS card",
    required: true,
  },
  {
    type: "DRIVERS_LICENSE",
    label: "Driver's License or State ID",
    description: "Government-issued photo ID",
    required: true,
  },
  {
    type: "W4_TAX_FORM",
    label: "W-4 Tax Withholding Form",
    description: "Federal tax withholding information",
    required: true,
  },
  {
    type: "I9_FORM",
    label: "I-9 Employment Eligibility",
    description: "Proof of work authorization",
    required: true,
  },
  {
    type: "DIRECT_DEPOSIT_FORM",
    label: "Direct Deposit Authorization",
    description: "Bank account information for payroll",
    required: true,
  },
  {
    type: "EMPLOYEE_HANDBOOK_SIGNED",
    label: "Employee Handbook Acknowledgment",
    description: "Signed acknowledgment of company policies",
    required: true,
  },
  {
    type: "WORK_AUTHORIZATION",
    label: "Work Authorization (if applicable)",
    description: "Visa, work permit, or green card",
    required: false,
  },
  {
    type: "STATE_TAX_FORM",
    label: "State Tax Form (if applicable)",
    description: "State withholding form",
    required: false,
  },
];

export default function OnboardingPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(
    null
  );
  const [uploading, setUploading] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<{ [key: string]: File }>(
    {}
  );

  const verifyToken = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/onboarding/verify-token?token=${token}`
      );
      const data = await response.json();

      if (!response.ok) {
        if (data.expired) {
          toast.error(
            "Your onboarding link has expired. Please contact your administrator."
          );
        } else if (data.alreadyCompleted) {
          toast.success("Onboarding already completed!");
          setTimeout(() => router.push("/dashboard"), 2000);
        } else {
          toast.error(data.error || "Invalid onboarding link");
        }
        return;
      }

      setOnboardingData(data);
    } catch (error) {
      console.error("Token verification error:", error);
      toast.error("Failed to verify onboarding link");
    } finally {
      setLoading(false);
    }
  }, [token, router]);

  useEffect(() => {
    verifyToken();
  }, [verifyToken]);

  const handleFileSelect = (docType: string, file: File) => {
    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only PDF, JPEG, PNG, and WebP files are allowed");
      return;
    }

    setSelectedFiles((prev) => ({ ...prev, [docType]: file }));
  };

  const handleUpload = async (docType: string) => {
    const file = selectedFiles[docType];
    if (!file) {
      toast.error("Please select a file first");
      return;
    }

    setUploading(docType);

    try {
      const formData = new FormData();
      formData.append("token", token);
      formData.append("docType", docType);
      formData.append("file", file);

      const response = await fetch("/api/onboarding/upload-document", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to upload document");
        return;
      }

      toast.success(`${file.name} uploaded successfully!`);

      // Remove selected file
      setSelectedFiles((prev) => {
        const updated = { ...prev };
        delete updated[docType];
        return updated;
      });

      // Refresh onboarding data
      await verifyToken();
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload document");
    } finally {
      setUploading(null);
    }
  };

  const handleCompleteOnboarding = async () => {
    if (!onboardingData?.isComplete) {
      toast.error("Please upload all required documents");
      return;
    }

    try {
      const response = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to complete onboarding");
        return;
      }

      toast.success("Onboarding completed successfully! 🎉");
      setTimeout(() => router.push("/dashboard"), 2000);
    } catch (error) {
      console.error("Complete onboarding error:", error);
      toast.error("Failed to complete onboarding");
    }
  };

  const isDocumentUploaded = (docType: string) => {
    return onboardingData?.documents.some((doc) => doc.docType === docType);
  };

  const getDocumentStatus = (docType: string) => {
    const doc = onboardingData?.documents.find((d) => d.docType === docType);
    return doc?.status || null;
  };

  const calculateProgress = () => {
    if (!onboardingData) return 0;
    const totalRequired = documentRequirements.filter((d) => d.required).length;
    const uploaded = documentRequirements
      .filter((d) => d.required)
      .filter((d) => isDocumentUploaded(d.type)).length;
    return (uploaded / totalRequired) * 100;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifying onboarding link...</p>
        </div>
      </div>
    );
  }

  if (!onboardingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invalid Link</CardTitle>
            <CardDescription>
              This onboarding link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/")} className="w-full">
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progress = calculateProgress();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">
                Welcome to {onboardingData.company.name}!
              </h1>
              <p className="text-muted-foreground">
                Complete your onboarding to get started
              </p>
            </div>
            {onboardingData.company.logo && (
              <Image
                src={onboardingData.company.logo}
                alt={onboardingData.company.name}
                width={48}
                height={48}
                className="h-12 w-auto"
              />
            )}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Onboarding Progress</span>
              <span className="text-muted-foreground">
                {Math.round(progress)}% Complete
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Employee Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  Name
                </dt>
                <dd className="text-sm">{onboardingData.staff.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  Email
                </dt>
                <dd className="text-sm">{onboardingData.staff.email}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  Job Title
                </dt>
                <dd className="text-sm">
                  {onboardingData.staff.jobTitle || "Not specified"}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  Company
                </dt>
                <dd className="text-sm">{onboardingData.company.name}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Required Documents</CardTitle>
            <CardDescription>
              Upload all required documents to complete your onboarding
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {documentRequirements.map((doc) => {
              const isUploaded = isDocumentUploaded(doc.type);
              const status = getDocumentStatus(doc.type);
              const isUploading = uploading === doc.type;
              const selectedFile = selectedFiles[doc.type];

              return (
                <div
                  key={doc.type}
                  className="flex items-start gap-4 p-4 border rounded-lg"
                >
                  <div className="shrink-0 mt-1">
                    {isUploaded ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-medium">{doc.label}</h4>
                      {doc.required && (
                        <Badge variant="secondary" className="text-xs">
                          Required
                        </Badge>
                      )}
                      {isUploaded && status && (
                        <Badge
                          variant={
                            status === "APPROVED"
                              ? "default"
                              : status === "REJECTED"
                              ? "destructive"
                              : "secondary"
                          }
                          className="text-xs"
                        >
                          {status}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {doc.description}
                    </p>
                    {!isUploaded ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          id={`file-${doc.type}`}
                          accept=".pdf,.jpg,.jpeg,.png,.webp"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileSelect(doc.type, file);
                          }}
                          className="hidden"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            document.getElementById(`file-${doc.type}`)?.click()
                          }
                          disabled={isUploading}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          {selectedFile ? selectedFile.name : "Choose File"}
                        </Button>
                        {selectedFile && (
                          <Button
                            size="sm"
                            onClick={() => handleUpload(doc.type)}
                            disabled={isUploading}
                          >
                            {isUploading ? (
                              <>Uploading...</>
                            ) : (
                              <>
                                <Upload className="h-4 w-4 mr-2" />
                                Upload
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Document uploaded
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {onboardingData.isComplete && (
          <Card>
            <CardHeader>
              <CardTitle>Ready to Get Started!</CardTitle>
              <CardDescription>
                All required documents have been uploaded. Click below to
                complete your onboarding.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleCompleteOnboarding}
                size="lg"
                className="w-full"
              >
                Complete Onboarding
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

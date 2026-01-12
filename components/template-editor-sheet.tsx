"use client";

import { X } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface TemplateEditorSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: EmailTemplate | null;
  mode: "create" | "edit";
  companyId?: string | null;
  onSuccess?: () => void;
}

interface EmailTemplate {
  id: string;
  type: string;
  name: string;
  description: string | null;
  subject: string;
  bodyHtml: string;
  bodyText: string | null;
  variables: string[];
  scope: string;
  companyId: string | null;
  isActive: boolean;
  isDefault: boolean;
}

const templateTypes = [
  { value: "PASSWORD_RESET", label: "Password Reset" },
  { value: "WELCOME_CUSTOMER", label: "Welcome Customer" },
  { value: "WELCOME_STAFF", label: "Welcome Staff" },
  { value: "ACCOUNT_VERIFICATION", label: "Account Verification" },
  { value: "PASSWORD_CHANGED", label: "Password Changed" },
  { value: "INVOICE_SENT", label: "Invoice Sent" },
  { value: "PAYMENT_RECEIVED", label: "Payment Received" },
  { value: "APPOINTMENT_REMINDER", label: "Appointment Reminder" },
  { value: "CUSTOM", label: "Custom" },
];

const availableVariables = [
  { name: "userName", description: "User's full name" },
  { name: "email", description: "User's email address" },
  { name: "staffName", description: "Staff member's name" },
  { name: "companyName", description: "Company name" },
  { name: "role", description: "User role" },
  { name: "resetUrl", description: "Password reset URL" },
  { name: "loginUrl", description: "Login page URL" },
  { name: "temporaryPassword", description: "Temporary password" },
  { name: "currentYear", description: "Current year" },
];

export function TemplateEditorSheet({
  open,
  onOpenChange,
  template,
  mode,
  companyId,
  onSuccess,
}: TemplateEditorSheetProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: template?.type || "CUSTOM",
    name: template?.name || "",
    description: template?.description || "",
    subject: template?.subject || "",
    bodyHtml: template?.bodyHtml || "",
    bodyText: template?.bodyText || "",
    variables: template?.variables || ([] as string[]),
    isActive: template?.isActive ?? true,
  });
  const [newVariable, setNewVariable] = useState("");

  useEffect(() => {
    if (template) {
      setFormData({
        type: template.type,
        name: template.name,
        description: template.description || "",
        subject: template.subject,
        bodyHtml: template.bodyHtml,
        bodyText: template.bodyText || "",
        variables: template.variables || [],
        isActive: template.isActive,
      });
    } else {
      setFormData({
        type: "CUSTOM",
        name: "",
        description: "",
        subject: "",
        bodyHtml: "",
        bodyText: "",
        variables: [],
        isActive: true,
      });
    }
  }, [template, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url =
        mode === "edit" && template
          ? `/api/templates/${template.id}`
          : "/api/templates";

      const method = mode === "edit" ? "PUT" : "POST";

      const payload = {
        ...formData,
        companyId: companyId || null,
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save template");
      }

      toast.success(mode === "edit" ? "Template updated" : "Template created", {
        description: `${formData.name} has been saved successfully.`,
      });

      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error("Error", {
        description:
          error instanceof Error ? error.message : "Failed to save template",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addVariable = (varName: string) => {
    if (varName && !formData.variables.includes(varName)) {
      setFormData({
        ...formData,
        variables: [...formData.variables, varName],
      });
      setNewVariable("");
    }
  };

  const removeVariable = (varName: string) => {
    setFormData({
      ...formData,
      variables: formData.variables.filter((v) => v !== varName),
    });
  };

  const insertVariable = (
    varName: string,
    field: "bodyHtml" | "bodyText" | "subject"
  ) => {
    const variable = `{{${varName}}}`;
    setFormData({
      ...formData,
      [field]: formData[field] + variable,
    });
    toast.success("Variable inserted", {
      description: `{{${varName}}} added to ${
        field === "bodyHtml"
          ? "HTML body"
          : field === "bodyText"
          ? "text body"
          : "subject"
      }`,
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[600px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {mode === "edit" ? "Edit Template" : "Create Template"}
          </SheetTitle>
          <SheetDescription>
            {mode === "edit"
              ? "Update the template details below."
              : "Create a new email template."}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6 px-6">
          {/* Template Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Template Type *</Label>
            <Select
              value={formData.type}
              onValueChange={(value) =>
                setFormData({ ...formData, type: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {templateTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Template Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Template Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., Welcome New Customer"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Brief description of when this template is used"
              rows={2}
            />
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject Line *</Label>
            <div className="flex gap-2">
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) =>
                  setFormData({ ...formData, subject: e.target.value })
                }
                placeholder="Welcome to {{companyName}}"
                required
              />
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {availableVariables.slice(0, 5).map((v) => (
                <Button
                  key={v.name}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => insertVariable(v.name, "subject")}
                  title={v.description}
                >
                  +{`{${v.name}}`}
                </Button>
              ))}
            </div>
          </div>

          {/* HTML Body */}
          <div className="space-y-2">
            <Label htmlFor="bodyHtml">Email Body (HTML) *</Label>
            <Textarea
              id="bodyHtml"
              value={formData.bodyHtml}
              onChange={(e) =>
                setFormData({ ...formData, bodyHtml: e.target.value })
              }
              placeholder="<h1>Hello {{userName}}</h1><p>Welcome to our platform!</p>"
              rows={8}
              className="font-mono text-sm"
              required
            />
            <div className="flex flex-wrap gap-1">
              {availableVariables.map((v) => (
                <Button
                  key={v.name}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => insertVariable(v.name, "bodyHtml")}
                  title={v.description}
                >
                  +{`{${v.name}}`}
                </Button>
              ))}
            </div>
          </div>

          {/* Plain Text Body */}
          <div className="space-y-2">
            <Label htmlFor="bodyText">Email Body (Plain Text)</Label>
            <Textarea
              id="bodyText"
              value={formData.bodyText}
              onChange={(e) =>
                setFormData({ ...formData, bodyText: e.target.value })
              }
              placeholder="Hello {{userName}}, Welcome to our platform!"
              rows={6}
              className="font-mono text-sm"
            />
            <p className="text-xs dark:text-gray-200">
              Fallback for email clients that don&apos;t support HTML
            </p>
          </div>

          {/* Variables */}
          <div className="space-y-2">
            <Label>Template Variables</Label>
            <div className="flex gap-2">
              <Select
                value={newVariable}
                onValueChange={(value) => {
                  setNewVariable(value);
                  addVariable(value);
                }}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Add a variable..." />
                </SelectTrigger>
                <SelectContent>
                  {availableVariables.map((v) => (
                    <SelectItem key={v.name} value={v.name}>
                      {v.name} - {v.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.variables.map((varName) => (
                <Badge key={varName} variant="secondary" className="gap-1">
                  {varName}
                  <button
                    type="button"
                    onClick={() => removeVariable(varName)}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <p className="text-xs dark:text-gray-200">
              Variables are used in the template as {`{{variableName}}`}
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? "Saving..."
                : mode === "edit"
                ? "Update Template"
                : "Create Template"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

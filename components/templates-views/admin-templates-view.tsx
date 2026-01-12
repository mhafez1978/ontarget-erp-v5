"use client";

import { Mail, Plus, Edit, Eye, Send, Trash2, Building2 } from "lucide-react";
import { useState, useEffect } from "react";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TemplateEditorSheet } from "@/components/template-editor-sheet";
import { TemplatePreviewDialog } from "@/components/template-preview-dialog";
import { TestSendDialog } from "@/components/test-send-dialog";
import { DeleteTemplateDialog } from "@/components/delete-template-dialog";

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
  createdAt: string;
  updatedAt: string;
}

interface Company {
  id: string;
  name: string;
}

export default function AdminTemplatesView() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>("GLOBAL");
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [testSendOpen, setTestSendOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] =
    useState<EmailTemplate | null>(null);
  const [editorMode, setEditorMode] = useState<"create" | "edit">("create");

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      fetchTemplates();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompany]);

  const fetchCompanies = async () => {
    try {
      const response = await fetch("/api/companies/my-owned");
      if (response.ok) {
        const data = await response.json();
        setCompanies(data.companies || []);
        // Auto-select first company if available
        if (data.companies && data.companies.length > 0) {
          setSelectedCompany(data.companies[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching companies:", error);
    }
  };

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const url =
        selectedCompany === "GLOBAL"
          ? "/api/templates"
          : `/api/templates?companyId=${selectedCompany}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setEditorMode("edit");
    setEditorOpen(true);
  };

  const handlePreviewTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setPreviewOpen(true);
  };

  const handleTestSend = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setTestSendOpen(true);
  };

  const handleDeleteTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setDeleteOpen(true);
  };

  const handleOverrideTemplate = async (template: EmailTemplate) => {
    if (isGlobalView || !selectedCompany) {
      toast.error("Error", {
        description: "Please select a company first",
      });
      return;
    }

    try {
      const response = await fetch("/api/templates/override", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: template.id,
          companyId: selectedCompany,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create override");
      }

      toast.success("Override created", {
        description: `Company-specific version of ${template.name} has been created.`,
      });

      fetchTemplates();
    } catch (error) {
      toast.error("Error", {
        description:
          error instanceof Error ? error.message : "Could not create override",
      });
    }
  };

  const getTemplateTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      PASSWORD_RESET: "bg-red-100 text-red-800",
      WELCOME_CUSTOMER: "bg-green-100 text-green-800",
      WELCOME_STAFF: "bg-blue-100 text-blue-800",
      ACCOUNT_VERIFICATION: "bg-yellow-100 text-yellow-800",
      PASSWORD_CHANGED: "bg-purple-100 text-purple-800",
      INVOICE_SENT: "bg-orange-100 text-orange-800",
      PAYMENT_RECEIVED: "bg-teal-100 text-teal-800",
      APPOINTMENT_REMINDER: "bg-pink-100 text-pink-800",
      CUSTOM: "bg-gray-100 text-gray-800",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  const isGlobalView = selectedCompany === "GLOBAL";
  const companyTemplates = templates.filter(
    (t) => t.companyId === selectedCompany
  );
  const globalTemplates = templates.filter((t) => t.scope === "GLOBAL");

  if (loading && templates.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Mail className="h-8 w-8" />
            Email Templates
          </h1>
          <p className="dark:text-gray-200 mt-2">
            Manage email templates for your companies
          </p>
        </div>
      </div>

      {/* Company Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Select Company
          </CardTitle>
          <CardDescription>
            View global templates or customize templates for your companies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedCompany} onValueChange={setSelectedCompany}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a company" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="GLOBAL">
                🌍 Global Templates (System Default)
              </SelectItem>
              {companies.map((company) => (
                <SelectItem key={company.id} value={company.id}>
                  🏢 {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      {!isGlobalView && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Company Templates
              </CardTitle>
              <Mail className="h-4 w-4 dark:text-gray-200" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {companyTemplates.length}
              </div>
              <p className="text-xs dark:text-gray-200">
                Custom overrides for this company
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Using Global
              </CardTitle>
              <Mail className="h-4 w-4 dark:text-gray-200" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {globalTemplates.length - companyTemplates.length}
              </div>
              <p className="text-xs dark:text-gray-200">
                Templates using system defaults
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Templates
              </CardTitle>
              <Mail className="h-4 w-4 dark:text-gray-200" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {templates.filter((t) => t.isActive).length}
              </div>
              <p className="text-xs dark:text-gray-200">
                Currently enabled templates
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Templates Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {isGlobalView ? "Global Templates" : "Company Templates"}
          </CardTitle>
          <CardDescription>
            {isGlobalView
              ? "System-wide default templates (read-only)"
              : "Customize templates for this company or use global defaults"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">
                No templates found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {isGlobalView
                  ? "No global templates available."
                  : "Override global templates to customize them for this company."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => {
                  const isCompanyOverride =
                    template.companyId === selectedCompany;
                  return (
                    <TableRow key={template.id}>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getTemplateTypeBadge(template.type)}
                        >
                          {template.type.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {template.name}
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate">
                        {template.subject}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={isCompanyOverride ? "default" : "secondary"}
                        >
                          {isCompanyOverride ? "Custom" : "Global"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={template.isActive ? "default" : "secondary"}
                        >
                          {template.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Preview"
                            onClick={() => handlePreviewTemplate(template)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {!isGlobalView && (
                            <>
                              {isCompanyOverride ? (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    title="Edit"
                                    onClick={() => handleEditTemplate(template)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    title="Delete Override"
                                    className="text-red-600 hover:text-red-700"
                                    onClick={() =>
                                      handleDeleteTemplate(template)
                                    }
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Create Override"
                                  onClick={() =>
                                    handleOverrideTemplate(template)
                                  }
                                >
                                  <Plus className="h-4 w-4 mr-1" />
                                  Override
                                </Button>
                              )}
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Test Send"
                            onClick={() => handleTestSend(template)}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Help Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">
            💡 Template Customization
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800 space-y-4">
          <div>
            <p className="font-semibold mb-2">Global Templates:</p>
            <p className="text-sm">
              System defaults used when no company override exists.
            </p>
          </div>

          <div>
            <p className="font-semibold mb-2">Available Variables:</p>
            <p className="text-sm mb-2">
              Use double curly braces to insert dynamic content:
            </p>
            <div className="bg-blue-100 rounded-lg p-3 space-y-2 text-sm">
              <div>
                <strong>Common:</strong>{" "}
                <code className="bg-white px-1 rounded mx-1">{`{{userName}}`}</code>
                <code className="bg-white px-1 rounded mx-1">{`{{email}}`}</code>
                <code className="bg-white px-1 rounded mx-1">{`{{loginUrl}}`}</code>
                <code className="bg-white px-1 rounded mx-1">{`{{currentYear}}`}</code>
              </div>
              <div>
                <strong>Password Reset:</strong>{" "}
                <code className="bg-white px-1 rounded mx-1">{`{{resetUrl}}`}</code>
              </div>
              <div>
                <strong>Staff Welcome:</strong>{" "}
                <code className="bg-white px-1 rounded mx-1">{`{{staffName}}`}</code>
                <code className="bg-white px-1 rounded mx-1">{`{{companyName}}`}</code>
                <code className="bg-white px-1 rounded mx-1">{`{{temporaryPassword}}`}</code>
                <code className="bg-white px-1 rounded mx-1">{`{{role}}`}</code>
              </div>
            </div>
          </div>

          <div>
            <p className="font-semibold mb-2">Override Templates:</p>
            <p className="text-sm">
              Create a company-specific version of any template to customize it
              for your brand.
            </p>
          </div>

          <div>
            <p className="font-semibold mb-2">Fallback:</p>
            <p className="text-sm">
              Deleting an override will restore the global template for that
              company.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs & Sheets */}
      <TemplateEditorSheet
        open={editorOpen}
        onOpenChange={setEditorOpen}
        template={selectedTemplate}
        mode={editorMode}
        companyId={isGlobalView ? null : selectedCompany}
        onSuccess={fetchTemplates}
      />

      <TemplatePreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        template={selectedTemplate}
      />

      {selectedTemplate && (
        <>
          <TestSendDialog
            open={testSendOpen}
            onOpenChange={setTestSendOpen}
            templateId={selectedTemplate.id}
            templateName={selectedTemplate.name}
          />

          <DeleteTemplateDialog
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
            templateId={selectedTemplate.id}
            templateName={selectedTemplate.name}
            onSuccess={fetchTemplates}
          />
        </>
      )}
    </div>
  );
}

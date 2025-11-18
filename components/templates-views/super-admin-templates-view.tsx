"use client";

import { useState, useEffect } from "react";
import { Mail, Plus, Edit, Eye, Send, Trash2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "sonner";
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

export default function SuperAdminTemplatesView() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [testSendOpen, setTestSendOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] =
    useState<EmailTemplate | null>(null);
  const [editorMode, setEditorMode] = useState<"create" | "edit">("create");

  // Template types to generate
  const [enabledTemplates, setEnabledTemplates] = useState({
    WELCOME_STAFF: false,
    WELCOME_CUSTOMER: false,
    PASSWORD_RESET: false,
    ACCOUNT_VERIFICATION: false,
    PASSWORD_CHANGED: false,
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/templates");
      console.log("Templates API response status:", response.status);
      if (response.ok) {
        const data = await response.json();
        console.log("Templates data received:", data);
        setTemplates(data.templates || []);
      } else {
        console.error(
          "Templates API error:",
          response.status,
          response.statusText
        );
        const errorText = await response.text();
        console.error("Error details:", errorText);
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = () => {
    setSelectedTemplate(null);
    setEditorMode("create");
    setEditorOpen(true);
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

  const handleToggleTemplate = (
    templateType: keyof typeof enabledTemplates
  ) => {
    setEnabledTemplates((prev) => ({
      ...prev,
      [templateType]: !prev[templateType],
    }));
  };

  const handleGenerateTemplates = async () => {
    const selectedTypes = Object.entries(enabledTemplates)
      .filter(([, enabled]) => enabled)
      .map(([type]) => type);

    if (selectedTypes.length === 0) {
      toast.error("Please enable at least one template type");
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch("/api/templates/generate-global", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateTypes: selectedTypes }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Generated ${data.count} global template(s)!`);
        fetchTemplates(); // Refresh the list
        // Reset toggles
        setEnabledTemplates({
          WELCOME_STAFF: false,
          WELCOME_CUSTOMER: false,
          PASSWORD_RESET: false,
          ACCOUNT_VERIFICATION: false,
          PASSWORD_CHANGED: false,
        });
      } else {
        toast.error(data.error || "Failed to generate templates");
      }
    } catch (error) {
      console.error("Error generating templates:", error);
      toast.error("Failed to generate templates");
    } finally {
      setGenerating(false);
    }
  };

  const isAnyTemplateEnabled = Object.values(enabledTemplates).some((v) => v);

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

  if (loading) {
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
          <p className="text-muted-foreground mt-2">
            Manage global email templates sent by the system
          </p>
        </div>
        <Button className="gap-2" onClick={handleCreateTemplate}>
          <Plus className="h-4 w-4" />
          Create Template
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Templates
            </CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templates.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Templates
            </CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {templates.filter((t) => t.isActive).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Default Templates
            </CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {templates.filter((t) => t.isDefault).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Generate Global Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Generate Global Templates
          </CardTitle>
          <CardDescription>
            Select template types to generate default system templates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="template-generator">
              <AccordionTrigger>Select Templates to Generate</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex items-center justify-between space-x-4 rounded-lg border p-4">
                      <div className="flex-1 space-y-1">
                        <Label
                          htmlFor="welcome-staff"
                          className="cursor-pointer"
                        >
                          Welcome Staff
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Sent when a new staff member is added
                        </p>
                      </div>
                      <Switch
                        id="welcome-staff"
                        checked={enabledTemplates.WELCOME_STAFF}
                        onCheckedChange={() =>
                          handleToggleTemplate("WELCOME_STAFF")
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between space-x-4 rounded-lg border p-4">
                      <div className="flex-1 space-y-1">
                        <Label
                          htmlFor="welcome-customer"
                          className="cursor-pointer"
                        >
                          Welcome Customer
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Sent when a new customer signs up
                        </p>
                      </div>
                      <Switch
                        id="welcome-customer"
                        checked={enabledTemplates.WELCOME_CUSTOMER}
                        onCheckedChange={() =>
                          handleToggleTemplate("WELCOME_CUSTOMER")
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between space-x-4 rounded-lg border p-4">
                      <div className="flex-1 space-y-1">
                        <Label
                          htmlFor="password-reset"
                          className="cursor-pointer"
                        >
                          Password Reset
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Sent when user requests password reset
                        </p>
                      </div>
                      <Switch
                        id="password-reset"
                        checked={enabledTemplates.PASSWORD_RESET}
                        onCheckedChange={() =>
                          handleToggleTemplate("PASSWORD_RESET")
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between space-x-4 rounded-lg border p-4">
                      <div className="flex-1 space-y-1">
                        <Label
                          htmlFor="account-verification"
                          className="cursor-pointer"
                        >
                          Account Verification
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Sent to verify user email address
                        </p>
                      </div>
                      <Switch
                        id="account-verification"
                        checked={enabledTemplates.ACCOUNT_VERIFICATION}
                        onCheckedChange={() =>
                          handleToggleTemplate("ACCOUNT_VERIFICATION")
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between space-x-4 rounded-lg border p-4">
                      <div className="flex-1 space-y-1">
                        <Label
                          htmlFor="password-changed"
                          className="cursor-pointer"
                        >
                          Password Changed
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Sent after password is successfully changed
                        </p>
                      </div>
                      <Switch
                        id="password-changed"
                        checked={enabledTemplates.PASSWORD_CHANGED}
                        onCheckedChange={() =>
                          handleToggleTemplate("PASSWORD_CHANGED")
                        }
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button
                      onClick={handleGenerateTemplates}
                      disabled={!isAnyTemplateEnabled || generating}
                      className="gap-2"
                    >
                      <Sparkles className="h-4 w-4" />
                      {generating
                        ? "Generating..."
                        : "Generate Selected Templates"}
                    </Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Templates Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Templates</CardTitle>
          <CardDescription>
            Global templates that can be overridden at the company level
          </CardDescription>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">
                No templates
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new email template.
              </p>
              <div className="mt-6">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Template
                </Button>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Variables</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
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
                      {template.isDefault && (
                        <Badge variant="secondary" className="ml-2">
                          Default
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate">
                      {template.subject}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {Array.isArray(template.variables) &&
                          template.variables.slice(0, 3).map((variable) => (
                            <Badge
                              key={variable}
                              variant="outline"
                              className="text-xs"
                            >
                              {`{{${variable}}}`}
                            </Badge>
                          ))}
                        {Array.isArray(template.variables) &&
                          template.variables.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{template.variables.length - 3}
                            </Badge>
                          )}
                        {!Array.isArray(template.variables) && (
                          <Badge
                            variant="outline"
                            className="text-xs text-muted-foreground"
                          >
                            No variables
                          </Badge>
                        )}
                      </div>
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
                          title="Test Send"
                          onClick={() => handleTestSend(template)}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                        {!template.isDefault && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Delete"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDeleteTemplate(template)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Help Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">
            📧 About Email Templates
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800 space-y-4">
          <div>
            <p className="font-semibold mb-2">Global Templates:</p>
            <p className="text-sm">
              These templates are used system-wide for all companies unless
              overridden.
            </p>
          </div>

          <div>
            <p className="font-semibold mb-2">Available Variables:</p>
            <p className="text-sm mb-2">
              Use double curly braces to insert dynamic content. Variables are
              automatically replaced when emails are sent.
            </p>
            <div className="bg-blue-100 rounded-lg p-3 space-y-2 text-sm">
              <div>
                <strong>Common Variables:</strong>
                <ul className="list-disc list-inside ml-2 mt-1">
                  <li>
                    <code className="bg-white px-1 rounded">{`{{userName}}`}</code>{" "}
                    - User&apos;s full name
                  </li>
                  <li>
                    <code className="bg-white px-1 rounded">{`{{email}}`}</code>{" "}
                    - User&apos;s email address
                  </li>
                  <li>
                    <code className="bg-white px-1 rounded">{`{{loginUrl}}`}</code>{" "}
                    - Login page URL
                  </li>
                  <li>
                    <code className="bg-white px-1 rounded">{`{{currentYear}}`}</code>{" "}
                    - Current year (for copyright)
                  </li>
                </ul>
              </div>
              <div>
                <strong>Password Reset:</strong>
                <ul className="list-disc list-inside ml-2 mt-1">
                  <li>
                    <code className="bg-white px-1 rounded">{`{{resetUrl}}`}</code>{" "}
                    - Password reset link (expires in 1 hour)
                  </li>
                </ul>
              </div>
              <div>
                <strong>Staff Welcome:</strong>
                <ul className="list-disc list-inside ml-2 mt-1">
                  <li>
                    <code className="bg-white px-1 rounded">{`{{staffName}}`}</code>{" "}
                    - Staff member&apos;s name
                  </li>
                  <li>
                    <code className="bg-white px-1 rounded">{`{{companyName}}`}</code>{" "}
                    - Company name
                  </li>
                  <li>
                    <code className="bg-white px-1 rounded">{`{{temporaryPassword}}`}</code>{" "}
                    - Initial password
                  </li>
                  <li>
                    <code className="bg-white px-1 rounded">{`{{role}}`}</code>{" "}
                    - User role (ADMIN, MANAGER, etc.)
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <p className="font-semibold mb-2">Example Usage:</p>
            <div className="bg-white rounded p-2 text-xs font-mono">
              <code>
                Hello {`{{userName}}`}, your password reset link is:{" "}
                {`{{resetUrl}}`}
              </code>
            </div>
          </div>

          <div>
            <p className="font-semibold mb-2">Company Overrides:</p>
            <p className="text-sm">
              Admins can create company-specific versions of these templates in
              their own dashboard.
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

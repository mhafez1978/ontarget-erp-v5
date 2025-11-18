"use client";

import { useState, useEffect } from "react";
import { Send, Building2, Users, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

interface Company {
  id: string;
  name: string;
  email: string | null;
  isRoot: boolean;
  isOwned: boolean;
  isSubscriber: boolean;
}

interface Employee {
  id: string; // CompanyStaff ID
  userId: string; // User ID
  name: string | null;
  email: string | null;
  role: string;
  jobTitle: string | null;
  status: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  type: string;
  subject: string;
  bodyHtml: string;
  variables: string[];
  isActive: boolean;
}

interface EmailCustomersTabProps {
  userRole: string;
  userId: string;
}

export default function EmailCustomersTab({}: EmailCustomersTabProps) {
  // State for template-based email
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [templateVariables, setTemplateVariables] = useState<
    Record<string, string>
  >({});

  // State for ad-hoc email
  const [adHocRecipient, setAdHocRecipient] = useState("");
  const [adHocSubject, setAdHocSubject] = useState("");
  const [adHocMessage, setAdHocMessage] = useState("");

  // Loading and status states
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [sendingAdHoc, setSendingAdHoc] = useState(false);

  // Fetch companies on mount
  useEffect(() => {
    fetchCompanies();
    fetchTemplates();
  }, []);

  // Fetch employees when company is selected
  useEffect(() => {
    if (selectedCompanyId) {
      fetchEmployees(selectedCompanyId);
    } else {
      setEmployees([]);
      setSelectedEmployees([]);
    }
  }, [selectedCompanyId]);

  // Auto-populate template variables when employees are selected
  useEffect(() => {
    if (selectedTemplateId && selectedEmployees.length > 0) {
      const template = templates.find((t) => t.id === selectedTemplateId);
      if (template) {
        const firstEmployee = employees.find(
          (e) => e.id === selectedEmployees[0]
        );
        if (firstEmployee) {
          const vars: Record<string, string> = {};
          const variablesArray = Array.isArray(template.variables)
            ? template.variables
            : [];

          variablesArray.forEach((v) => {
            // Auto-populate with employee data
            if (v === "user_name" || v === "username" || v === "name") {
              vars[v] = firstEmployee.name || "";
            } else if (v === "user_email" || v === "email") {
              vars[v] = firstEmployee.email || "";
            } else if (v === "login_url" || v === "reset_url" || v === "url") {
              vars[v] = `${window.location.origin}/login`;
            } else if (v === "company_name" && selectedCompany) {
              vars[v] = selectedCompany.name;
            } else {
              vars[v] = templateVariables[v] || "";
            }
          });

          setTemplateVariables(vars);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEmployees, selectedTemplateId]);

  const fetchCompanies = async () => {
    try {
      setLoadingCompanies(true);
      const response = await fetch("/api/hub/companies");
      if (response.ok) {
        const data = await response.json();
        setCompanies(data.companies || []);
      }
    } catch (error) {
      console.error("Error fetching companies:", error);
    } finally {
      setLoadingCompanies(false);
    }
  };

  const fetchEmployees = async (companyId: string) => {
    try {
      setLoadingEmployees(true);
      const response = await fetch(`/api/hub/companies/${companyId}/employees`);
      if (response.ok) {
        const data = await response.json();
        setEmployees(data.employees || []);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    } finally {
      setLoadingEmployees(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch("/api/templates?activeOnly=true");
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
    }
  };

  const handleEmployeeToggle = (employeeId: string) => {
    setSelectedEmployees((prev) =>
      prev.includes(employeeId)
        ? prev.filter((id) => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const handleSelectAllEmployees = () => {
    if (selectedEmployees.length === employees.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(employees.map((e) => e.id));
    }
  };

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      // Initialize variables
      const vars: Record<string, string> = {};
      const variablesArray = Array.isArray(template.variables)
        ? template.variables
        : [];

      // Auto-populate common variables if we have employee data
      if (selectedEmployees.length > 0) {
        const firstEmployee = employees.find(
          (e) => e.id === selectedEmployees[0]
        );
        if (firstEmployee) {
          variablesArray.forEach((v) => {
            // Auto-populate with employee data
            if (v === "user_name" || v === "username" || v === "name") {
              vars[v] = firstEmployee.name || "";
            } else if (v === "user_email" || v === "email") {
              vars[v] = firstEmployee.email || "";
            } else if (v === "login_url" || v === "reset_url" || v === "url") {
              // Auto-populate login URL
              vars[v] = `${window.location.origin}/login`;
            } else if (v === "company_name" && selectedCompany) {
              vars[v] = selectedCompany.name;
            } else {
              vars[v] = "";
            }
          });
        }
      } else {
        // No employees selected yet, just initialize empty
        variablesArray.forEach((v) => {
          vars[v] = "";
        });
      }

      setTemplateVariables(vars);
    }
  };

  const handleSendTemplateEmail = async () => {
    if (
      !selectedCompanyId ||
      selectedEmployees.length === 0 ||
      !selectedTemplateId
    ) {
      toast.error("Please select company, employees, and template");
      return;
    }

    try {
      setSendingEmail(true);

      const response = await fetch("/api/hub/send-template-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: selectedCompanyId,
          employeeIds: selectedEmployees,
          templateId: selectedTemplateId,
          variables: templateVariables,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const { successCount, failureCount, total } = data;
        if (failureCount > 0) {
          toast.warning(
            `Sent ${successCount} of ${total} emails successfully. ${failureCount} failed.`
          );
        } else {
          toast.success(
            `Successfully sent emails to ${successCount} employee(s)! 🎉`
          );
        }
        setSelectedEmployees([]);
        setSelectedTemplateId("");
        setTemplateVariables({});
      } else {
        toast.error(data.error || "Failed to send email");
      }
    } catch (error) {
      toast.error("Error sending email");
      console.error("Error sending email:", error);
    } finally {
      setSendingEmail(false);
    }
  };

  const handleSendAdHocEmail = async () => {
    if (!adHocRecipient || !adHocSubject || !adHocMessage) {
      toast.error("Please fill in all fields for ad-hoc email");
      return;
    }

    try {
      setSendingAdHoc(true);

      const response = await fetch("/api/hub/send-adhoc-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: adHocRecipient,
          subject: adHocSubject,
          message: adHocMessage,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Email sent successfully! 📧");
        setAdHocRecipient("");
        setAdHocSubject("");
        setAdHocMessage("");
      } else {
        toast.error(data.error || "Failed to send email");
      }
    } catch (error) {
      toast.error("Error sending email");
      console.error("Error sending ad-hoc email:", error);
    } finally {
      setSendingAdHoc(false);
    }
  };

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);
  const selectedCompany = companies.find((c) => c.id === selectedCompanyId);

  return (
    <div className="space-y-6">
      {/* Template-Based Email Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Send Template Email to Staff
          </CardTitle>
          <CardDescription>
            Select a company, choose employees, pick a template, and send
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Step 1: Company Selection Table */}
            <div>
              <Label className="text-base font-semibold mb-3 flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                1. Select Company
              </Label>
              <div className="border rounded-lg">
                {loadingCompanies ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  </div>
                ) : companies.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No companies available
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Company Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Type</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {companies.map((company) => (
                        <TableRow
                          key={company.id}
                          className={`cursor-pointer ${
                            selectedCompanyId === company.id
                              ? "bg-primary/5 border-l-4 border-l-primary"
                              : "hover:bg-muted/50"
                          }`}
                          onClick={() => setSelectedCompanyId(company.id)}
                        >
                          <TableCell className="font-medium">
                            {company.name}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {company.email || "—"}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {company.isRoot && (
                                <Badge variant="secondary" className="text-xs">
                                  Root
                                </Badge>
                              )}
                              {company.isOwned && (
                                <Badge variant="default" className="text-xs">
                                  Owned
                                </Badge>
                              )}
                              {company.isSubscriber && (
                                <Badge variant="outline" className="text-xs">
                                  Subscriber
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>

            {/* Step 2: Employee Selection Table */}
            {selectedCompanyId && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    2. Select Staff Members
                  </Label>
                  {employees.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSelectAllEmployees}
                    >
                      {selectedEmployees.length === employees.length
                        ? "Deselect All"
                        : "Select All"}
                    </Button>
                  )}
                </div>
                <div className="border rounded-lg">
                  {loadingEmployees ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                  ) : employees.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No staff members found in {selectedCompany?.name}
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12"></TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Job Title</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {employees.map((employee) => (
                          <TableRow
                            key={employee.id}
                            className={`cursor-pointer ${
                              selectedEmployees.includes(employee.id)
                                ? "bg-primary/5"
                                : "hover:bg-muted/50"
                            }`}
                            onClick={() => handleEmployeeToggle(employee.id)}
                          >
                            <TableCell>
                              <Checkbox
                                checked={selectedEmployees.includes(
                                  employee.id
                                )}
                                onCheckedChange={() =>
                                  handleEmployeeToggle(employee.id)
                                }
                              />
                            </TableCell>
                            <TableCell className="font-medium">
                              {employee.name || "—"}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {employee.email || "—"}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="text-xs">
                                {employee.role}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {employee.jobTitle || "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Template Selection & Send */}
            {selectedEmployees.length > 0 && (
              <div>
                <Label className="text-base font-semibold mb-3 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  3. Choose Template & Send
                </Label>
                <div className="border rounded-lg p-4 space-y-4">
                  <div>
                    <Label>Email Template</Label>
                    <Select
                      value={selectedTemplateId}
                      onValueChange={handleTemplateChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a template" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedTemplate && (
                    <>
                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="font-medium">Subject:</span>{" "}
                          <span className="text-muted-foreground">
                            {selectedTemplate.subject}
                          </span>
                        </div>
                        <Badge variant="outline">
                          {selectedTemplate.type.replace(/_/g, " ")}
                        </Badge>
                      </div>

                      {Array.isArray(selectedTemplate.variables) &&
                        selectedTemplate.variables.length > 0 && (
                          <div className="space-y-3">
                            <Label className="text-sm font-medium">
                              Template Variables
                            </Label>
                            <div className="grid gap-3 sm:grid-cols-2">
                              {selectedTemplate.variables.map((variable) => (
                                <div key={variable}>
                                  <Label htmlFor={variable} className="text-xs">
                                    {`{{${variable}}}`}
                                  </Label>
                                  <Input
                                    id={variable}
                                    value={templateVariables[variable] || ""}
                                    onChange={(e) =>
                                      setTemplateVariables((prev) => ({
                                        ...prev,
                                        [variable]: e.target.value,
                                      }))
                                    }
                                    placeholder={`Enter ${variable}`}
                                    className="mt-1"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      <div className="pt-4">
                        <Button
                          className="w-full gap-2"
                          onClick={handleSendTemplateEmail}
                          disabled={sendingEmail || !selectedTemplateId}
                        >
                          {sendingEmail ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4" />
                              Send to {selectedEmployees.length} Employee
                              {selectedEmployees.length !== 1 ? "s" : ""}
                            </>
                          )}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Ad-Hoc Email Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Send Ad-Hoc Email
          </CardTitle>
          <CardDescription>
            Send a custom email to anyone using your default email provider
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-2xl space-y-4">
            <div className="space-y-2">
              <Label htmlFor="adhoc-recipient">Recipient Email</Label>
              <Input
                id="adhoc-recipient"
                type="email"
                placeholder="email@example.com"
                value={adHocRecipient}
                onChange={(e) => setAdHocRecipient(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="adhoc-subject">Subject</Label>
              <Input
                id="adhoc-subject"
                placeholder="Email subject"
                value={adHocSubject}
                onChange={(e) => setAdHocSubject(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="adhoc-message">Message</Label>
              <Textarea
                id="adhoc-message"
                placeholder="Your message here..."
                rows={8}
                value={adHocMessage}
                onChange={(e) => setAdHocMessage(e.target.value)}
              />
            </div>

            <Button
              className="gap-2"
              onClick={handleSendAdHocEmail}
              disabled={
                sendingAdHoc ||
                !adHocRecipient ||
                !adHocSubject ||
                !adHocMessage
              }
            >
              {sendingAdHoc ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send Email
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

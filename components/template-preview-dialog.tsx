"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TemplatePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: EmailTemplate | null;
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
}

const sampleData: Record<string, string> = {
  userName: "John Doe",
  email: "john.doe@example.com",
  staffName: "Jane Smith",
  companyName: "Acme Corporation",
  role: "Manager",
  resetUrl: "https://example.com/reset-password?token=abc123",
  loginUrl: "https://example.com/login",
  temporaryPassword: "TempPass123!",
  currentYear: new Date().getFullYear().toString(),
};

export function TemplatePreviewDialog({
  open,
  onOpenChange,
  template,
}: TemplatePreviewDialogProps) {
  const { renderedSubject, renderedHtml, renderedText } = useMemo(() => {
    if (!template) {
      return {
        renderedSubject: "",
        renderedHtml: "",
        renderedText: "",
      };
    }

    // Replace variables with sample data
    let subject = template.subject;
    let html = template.bodyHtml;
    let text = template.bodyText || "";

    // Replace all {{variableName}} with sample values
    Object.entries(sampleData).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, "g");
      subject = subject.replace(regex, value);
      html = html.replace(regex, value);
      text = text.replace(regex, value);
    });

    return {
      renderedSubject: subject,
      renderedHtml: html,
      renderedText: text,
    };
  }, [template]);

  if (!template) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle>Preview: {template.name}</AlertDialogTitle>
          <AlertDialogDescription>
            Template preview with sample data
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          {/* Subject Line */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Subject:</h3>
            <div className="p-3 bg-muted rounded-md">
              <p className="font-medium">{renderedSubject}</p>
            </div>
          </div>

          {/* Email Body Tabs */}
          <Tabs defaultValue="html" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="html">HTML Preview</TabsTrigger>
              <TabsTrigger value="text">Plain Text</TabsTrigger>
            </TabsList>

            <TabsContent value="html" className="space-y-2">
              <div className="border rounded-md p-6 bg-white dark:bg-gray-900 min-h-[300px]">
                <div dangerouslySetInnerHTML={{ __html: renderedHtml }} />
              </div>
              <details className="text-xs text-muted-foreground">
                <summary className="cursor-pointer hover:text-foreground">
                  View HTML Source
                </summary>
                <pre className="mt-2 p-4 bg-muted rounded overflow-x-auto">
                  <code>{renderedHtml}</code>
                </pre>
              </details>
            </TabsContent>

            <TabsContent value="text" className="space-y-2">
              <div className="border rounded-md p-6 bg-muted min-h-[300px] font-mono text-sm whitespace-pre-wrap">
                {renderedText || "No plain text version available"}
              </div>
            </TabsContent>
          </Tabs>

          {/* Sample Data Used */}
          <details className="text-xs">
            <summary className="cursor-pointer font-semibold text-muted-foreground hover:text-foreground">
              Sample Data Used in Preview
            </summary>
            <div className="mt-2 p-4 bg-muted rounded-md space-y-1">
              {template.variables.map((varName) => (
                <div key={varName} className="flex gap-2">
                  <span className="font-mono font-semibold">
                    {`{{${varName}}}`}:
                  </span>
                  <span className="text-muted-foreground">
                    {sampleData[varName] || "(no sample data)"}
                  </span>
                </div>
              ))}
            </div>
          </details>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}

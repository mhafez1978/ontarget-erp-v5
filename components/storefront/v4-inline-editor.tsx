"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Edit2, Save, X } from "lucide-react";

interface EditableField {
  name: string;
  label: string;
  type: "text" | "textarea" | "url";
  value: string;
}

interface InlineEditorProps {
  websiteId: string;
  pageSlug?: string;
  componentIndex: number;
  isEnabled: boolean;
  onSave?: () => void;
}

/**
 * Inline editor component that makes V4 website sections editable
 * Click on elements to edit them in place
 */
export function V4InlineEditor({
  websiteId,
  pageSlug = "home",
  componentIndex,
  isEnabled,
  onSave,
}: InlineEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [fields, setFields] = useState<EditableField[]>([]);

  // Detect which element was clicked and open editor
  const handleElementClick = useCallback(
    (event: MouseEvent) => {
      if (!isEnabled) return;

      const target = event.target as HTMLElement;

      // Find the component wrapper (section/div with data-component-index)
      const componentEl = target.closest(
        `[data-component-index="${componentIndex}"]`
      );
      if (!componentEl) return;

      event.preventDefault();
      event.stopPropagation();

      // Determine what was clicked and extract editable fields
      const editableFields: EditableField[] = [];

      // Check for heading
      const heading = componentEl.querySelector("h1, h2");
      if (heading) {
        editableFields.push({
          name: "heading",
          label: "Heading",
          type: "text",
          value: heading.textContent || "",
        });
      }

      // Check for subtitle/subheading
      const subtitle = componentEl.querySelector(
        'p[class*="subtitle"], p[class*="subheading"], p[class*="lead"]'
      );
      if (subtitle) {
        editableFields.push({
          name: "subheading",
          label: "Subheading",
          type: "text",
          value: subtitle.textContent || "",
        });
      }

      // Check for description/content
      const description = componentEl.querySelector(
        'p:not([class*="subtitle"]):not([class*="subheading"]):not([class*="lead"])'
      );
      if (description) {
        editableFields.push({
          name: "description",
          label: "Description",
          type: "textarea",
          value: description.textContent || "",
        });
      }

      // Check for CTA button
      const ctaButton = componentEl.querySelector(
        'button, a[class*="button"], a[class*="btn"], a[class*="cta"]'
      );
      if (ctaButton) {
        editableFields.push({
          name: "ctaText",
          label: "Button Text",
          type: "text",
          value: ctaButton.textContent || "",
        });

        if (ctaButton.tagName === "A") {
          const href = (ctaButton as HTMLAnchorElement).href;
          editableFields.push({
            name: "ctaLink",
            label: "Button Link",
            type: "url",
            value: href || "",
          });
        }
      }

      if (editableFields.length > 0) {
        setFields(editableFields);
        setIsOpen(true);
      }
    },
    [isEnabled, componentIndex]
  );

  // Add click listener when edit mode is enabled
  useEffect(() => {
    if (isEnabled) {
      document.addEventListener("click", handleElementClick, true);
      return () => {
        document.removeEventListener("click", handleElementClick, true);
      };
    }
  }, [isEnabled, handleElementClick]);

  const handleFieldChange = (name: string, value: string) => {
    setFields((prev) =>
      prev.map((field) => (field.name === name ? { ...field, value } : field))
    );
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      // Convert fields array to updates object
      const updates = fields.reduce((acc, field) => {
        acc[field.name] = field.value;
        return acc;
      }, {} as Record<string, string>);

      const response = await fetch("/api/storefront/v4/update-section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          websiteId,
          pageSlug,
          componentIndex,
          updates,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save changes");
      }

      toast.success("Changes saved successfully");
      setIsOpen(false);

      // Trigger callback to refresh preview
      if (onSave) {
        onSave();
      } else {
        // Fallback: reload page to show changes
        window.location.reload();
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save changes"
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit2 className="h-5 w-5" />
            Edit Section
          </DialogTitle>
          <DialogDescription>
            Make changes to this section. Click save to update your website.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {fields.map((field) => (
            <div key={field.name} className="space-y-2">
              <Label htmlFor={field.name}>{field.label}</Label>
              {field.type === "textarea" ? (
                <Textarea
                  id={field.name}
                  value={field.value}
                  onChange={(e) =>
                    handleFieldChange(field.name, e.target.value)
                  }
                  rows={4}
                  className="resize-none"
                />
              ) : (
                <Input
                  id={field.name}
                  type={field.type}
                  value={field.value}
                  onChange={(e) =>
                    handleFieldChange(field.name, e.target.value)
                  }
                />
              )}
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isSaving}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Makes a section editable by adding data attributes and hover effects
 */
export function EditableSection({
  children,
  componentIndex,
  isEditMode,
}: {
  children: React.ReactNode;
  componentIndex: number;
  isEditMode: boolean;
}) {
  return (
    <div
      data-component-index={componentIndex}
      className={
        isEditMode
          ? "relative cursor-pointer transition-all hover:ring-2 hover:ring-primary hover:ring-offset-2"
          : ""
      }
      style={
        isEditMode
          ? {
              outline: "1px dashed rgba(147, 51, 234, 0.3)",
              outlineOffset: "4px",
            }
          : undefined
      }
    >
      {children}
      {isEditMode && (
        <div className="absolute top-2 right-2 bg-primary text-white px-2 py-1 rounded text-xs font-medium pointer-events-none">
          <Edit2 className="h-3 w-3 inline mr-1" />
          Click to edit
        </div>
      )}
    </div>
  );
}

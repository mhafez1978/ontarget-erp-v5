"use client";


import { Edit, Check, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";


;
import { toast } from "sonner";

interface InlineEditSectionProps {
  title: string;
  value: string | null;
  fieldName: string;
  projectId: string;
  type?: "text" | "textarea" | "date";
  onSave?: (newValue: string) => void;
  placeholder?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export function InlineEditSection({
  title,
  value,
  fieldName,
  projectId,
  type = "text",
  onSave,
  placeholder = "No value set",
  icon,
}: InlineEditSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (editValue === value) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [fieldName]: editValue || null }),
      });

      if (!response.ok) {
        throw new Error("Failed to update project");
      }

      toast.success(`${title} updated successfully`);
      setIsEditing(false);
      if (onSave) {
        onSave(editValue);
      }
    } catch (error) {
      console.error("Error updating project:", error);
      toast.error("Failed to update project");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value || "");
    setIsEditing(false);
  };

  const IconComponent = icon;

  // Format date for display
  const formatDateForDisplay = (dateString: string | null) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  // Format date for input (YYYY-MM-DD)
  const formatDateForInput = (dateString: string | null) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toISOString().split("T")[0];
    } catch {
      return dateString;
    }
  };

  const displayValue =
    type === "date" && value ? formatDateForDisplay(value) : value;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium flex items-center gap-2">
          {IconComponent && <IconComponent className="h-4 w-4" />}
          {title}
        </Label>
        {!isEditing && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={() => setIsEditing(true)}
          >
            <Edit className="h-3 w-3" />
          </Button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-2">
          {type === "textarea" ? (
            <Textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder={placeholder}
              rows={4}
              className="resize-none"
            />
          ) : (
            <Input
              type={type}
              value={
                type === "date" ? formatDateForInput(editValue) : editValue
              }
              onChange={(e) => setEditValue(e.target.value)}
              placeholder={placeholder}
            />
          )}
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              <Check className="h-3 w-3 mr-1" />
              Save
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancel}
              disabled={isSaving}
            >
              <X className="h-3 w-3 mr-1" />
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-sm text-muted-foreground whitespace-pre-wrap">
          {displayValue || <span className="italic">{placeholder}</span>}
        </div>
      )}
    </div>
  );
}

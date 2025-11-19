"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TimeTracker } from "@/components/projects/time-tracker";
import { toast } from "sonner";
import {
  StickyNote,
  Plus,
  Trash2,
  Edit,
  X,
  Save,
  Clock,
  User2,
} from "lucide-react";

interface ProjectNote {
  id: string;
  content: string;
  timeEntry: number;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    user: {
      name: string | null;
      email: string;
      image: string | null;
    };
  };
}

interface ProjectNotesProps {
  projectId: string;
  notes: ProjectNote[];
  currentUserId: string;
}

export function ProjectNotes({
  projectId,
  notes: initialNotes,
}: ProjectNotesProps) {
  const [notes, setNotes] = useState<ProjectNote[]>(initialNotes);
  const [isAdding, setIsAdding] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNoteTime, setNewNoteTime] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editTime, setEditTime] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const handleAddNote = async () => {
    if (!newNoteContent.trim()) {
      toast.error("Note content cannot be empty");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newNoteContent,
          timeEntry: newNoteTime,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create note");
      }

      const newNote = await response.json();
      setNotes([newNote, ...notes]);
      setNewNoteContent("");
      setNewNoteTime(0);
      setIsAdding(false);
      toast.success("Note added successfully");
    } catch (error) {
      toast.error("Failed to add note");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditNote = async (noteId: string) => {
    if (!editContent.trim()) {
      toast.error("Note content cannot be empty");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(
        `/api/projects/${projectId}/notes/${noteId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: editContent,
            timeEntry: editTime,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update note");
      }

      const updatedNote = await response.json();
      setNotes(notes.map((n) => (n.id === noteId ? updatedNote : n)));
      setEditingId(null);
      setEditContent("");
      setEditTime(0);
      toast.success("Note updated successfully");
    } catch (error) {
      toast.error("Failed to update note");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("Are you sure you want to delete this note?")) {
      return;
    }

    try {
      const response = await fetch(
        `/api/projects/${projectId}/notes/${noteId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete note");
      }

      setNotes(notes.filter((n) => n.id !== noteId));
      toast.success("Note deleted successfully");
    } catch (error) {
      toast.error("Failed to delete note");
      console.error(error);
    }
  };

  const startEditing = (note: ProjectNote) => {
    setEditingId(note.id);
    setEditContent(note.content);
    setEditTime(note.timeEntry);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditContent("");
    setEditTime(0);
  };

  const totalTime = notes.reduce((sum, note) => sum + note.timeEntry, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StickyNote className="h-5 w-5" />
            <CardTitle>Notes</CardTitle>
            {notes.length > 0 && (
              <span className="text-sm text-muted-foreground">
                ({notes.length})
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {totalTime > 0 && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{formatTime(totalTime)} tracked</span>
              </div>
            )}
            {!isAdding && (
              <Button
                size="sm"
                onClick={() => setIsAdding(true)}
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Note
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add New Note Form */}
        {isAdding && (
          <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
            <Textarea
              placeholder="Write your note..."
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              className="min-h-[100px]"
              disabled={isSaving}
            />
            <div className="flex items-center justify-between">
              <TimeTracker
                onTimeChange={setNewNoteTime}
                initialMinutes={newNoteTime}
              />
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsAdding(false);
                    setNewNoteContent("");
                    setNewNoteTime(0);
                  }}
                  disabled={isSaving}
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
                <Button size="sm" onClick={handleAddNote} disabled={isSaving}>
                  <Save className="h-4 w-4 mr-1" />
                  Save Note
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Notes List */}
        {notes.length === 0 && !isAdding ? (
          <div className="text-center py-8 text-muted-foreground">
            <StickyNote className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p>No notes yet. Add your first note to track project updates.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <div
                key={note.id}
                className="p-4 border rounded-lg space-y-3 bg-card"
              >
                {editingId === note.id ? (
                  // Edit Mode
                  <>
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="min-h-[100px]"
                      disabled={isSaving}
                    />
                    <div className="flex items-center justify-between">
                      <TimeTracker
                        onTimeChange={setEditTime}
                        initialMinutes={editTime}
                      />
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={cancelEditing}
                          disabled={isSaving}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleEditNote(note.id)}
                          disabled={isSaving}
                        >
                          <Save className="h-4 w-4 mr-1" />
                          Save
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  // View Mode
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={note.author.user.image || ""}
                            alt={note.author.user.name || "User"}
                          />
                          <AvatarFallback>
                            <User2 className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {note.author.user.name || "Unknown User"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(note.createdAt).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  hour: "numeric",
                                  minute: "2-digit",
                                }
                              )}
                            </span>
                            {note.timeEntry > 0 && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {formatTime(note.timeEntry)}
                              </span>
                            )}
                          </div>
                          <p className="text-sm whitespace-pre-wrap">
                            {note.content}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEditing(note)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteNote(note.id)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

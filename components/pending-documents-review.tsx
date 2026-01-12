"use client";

import { FileText, CheckCircle2, XCircle, Clock, Download } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface Document {
  id: string;
  docType: string;
  fileName: string;
  fileSize: number;
  status: string;
  uploadedAt: string;
  employeeName: string;
  employeeEmail: string;
}

interface PendingDocumentsProps {
  companyId: string;
}

export function PendingDocumentsReview({ companyId }: PendingDocumentsProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);

  const fetchPendingDocuments = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/company/files?companyId=${companyId}&category=HR-Docs`
      );
      if (response.ok) {
        const data = await response.json();
        // Filter only pending documents
        const pending = data.files.filter(
          (file: Document) => file.status === "PENDING"
        );
        setDocuments(pending);
      }
    } catch (error) {
      console.error("Failed to fetch documents:", error);
      toast.error("Failed to load pending documents");
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    void fetchPendingDocuments();
  }, [fetchPendingDocuments]);

  const handleApprove = async (docId: string) => {
    setProcessing(true);
    try {
      const response = await fetch(`/api/documents/review/${docId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to approve document");
        return;
      }

      toast.success("Document approved successfully");
      fetchPendingDocuments();
    } catch (error) {
      console.error("Approve error:", error);
      toast.error("Failed to approve document");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedDoc || !rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch(`/api/documents/review/${selectedDoc.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reject",
          reason: rejectionReason,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to reject document");
        return;
      }

      toast.success("Document rejected and employee notified");
      setShowRejectDialog(false);
      setRejectionReason("");
      setSelectedDoc(null);
      fetchPendingDocuments();
    } catch (error) {
      console.error("Reject error:", error);
      toast.error("Failed to reject document");
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = async (docId: string, fileName: string) => {
    try {
      const response = await fetch(`/api/company/files/download/${docId}`);
      if (!response.ok) {
        toast.error("Failed to download file");
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download file");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDocType = (docType: string) => {
    return docType.replace(/_/g, " ");
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Document Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 dark:text-gray-200">
            Loading pending documents...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (documents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Document Reviews</CardTitle>
          <CardDescription>No pending documents to review</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 dark:text-gray-200">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>All documents have been reviewed!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>
            Pending Document Reviews
            <Badge variant="secondary" className="ml-2">
              {documents.length}
            </Badge>
          </CardTitle>
          <CardDescription>
            Review and approve employee onboarding documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Document Type</TableHead>
                <TableHead>File Name</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{doc.employeeName}</div>
                      <div className="text-xs dark:text-gray-200">
                        {doc.employeeEmail}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 dark:text-gray-200" />
                      {formatDocType(doc.docType)}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {doc.fileName}
                  </TableCell>
                  <TableCell className="dark:text-gray-200">
                    {formatFileSize(doc.fileSize)}
                  </TableCell>
                  <TableCell className="dark:text-gray-200">
                    {new Date(doc.uploadedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload(doc.id, doc.fileName)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleApprove(doc.id)}
                        disabled={processing}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setSelectedDoc(doc);
                          setShowRejectDialog(true);
                        }}
                        disabled={processing}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Document</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this document. The employee
              will be notified via email.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedDoc && (
              <div className="bg-muted p-3 rounded-md">
                <div className="text-sm font-medium mb-1">
                  {selectedDoc.employeeName}
                </div>
                <div className="text-xs dark:text-gray-200">
                  {formatDocType(selectedDoc.docType)} - {selectedDoc.fileName}
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="reason">Rejection Reason</Label>
              <Textarea
                id="reason"
                placeholder="Please explain why this document is being rejected and what the employee needs to do to correct it..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setRejectionReason("");
                setSelectedDoc(null);
              }}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={processing || !rejectionReason.trim()}
            >
              {processing ? "Rejecting..." : "Reject & Notify"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

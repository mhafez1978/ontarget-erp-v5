"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  Folder,
  FolderOpen,
  File,
  ChevronRight,
  ChevronDown,
  Upload,
  Lock,
  Unlock,
  RefreshCw,
  FolderPlus,
  Grid3x3,
  List,
  Download,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FileUploadDialog } from "@/components/file-upload-dialog";
import { CreateFolderDialog } from "@/components/create-folder-dialog";
import { FileContextMenu } from "@/components/file-context-menu";
import { FolderPasswordDialog } from "@/components/folder-password-dialog";
import {
  getFileIcon,
  canPreviewImage,
  getAllowedFileTypesDescription,
  getBlockedFileTypesDescription,
} from "@/lib/file-utils";
import Image from "next/image";

interface FileItem {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
}

interface FolderNode {
  id: string;
  name: string;
  path: string;
  type: string;
  parentId: string | null;
  ownerId: string | null;
  isPasswordProtected: boolean;
  fileCount: number;
  files: FileItem[];
  children: FolderNode[];
}

interface HierarchicalFileExplorerProps {
  companyId?: string;
  companies?: Array<{ id: string; name: string }>;
}

export function HierarchicalFileExplorer({
  companyId: initialCompanyId,
  companies,
}: HierarchicalFileExplorerProps) {
  const [companyId, setCompanyId] = useState(
    initialCompanyId || companies?.[0]?.id || ""
  );
  const [folders, setFolders] = useState<FolderNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set()
  );
  const [selectedFolder, setSelectedFolder] = useState<FolderNode | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showCreateFolderDialog, setShowCreateFolderDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordDialogMode, setPasswordDialogMode] = useState<
    "set" | "verify" | "remove"
  >("set");
  const [lockedFolder, setLockedFolder] = useState<FolderNode | null>(null);
  const [allFolders, setAllFolders] = useState<FolderNode[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(
    new Set()
  );
  const [downloadingMultiple, setDownloadingMultiple] = useState(false);
  const [storageInfo, setStorageInfo] = useState<{
    used: number;
    limit: number;
    plan: string;
  } | null>(null);

  const fetchFolderTree = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/company/folders?companyId=${companyId}`
      );
      if (response.ok) {
        const data = await response.json();
        setFolders(data.folders);
        setIsAdmin(data.isAdmin);

        // Flatten folders for CreateFolderDialog
        const flattenFolders = (nodes: FolderNode[]): FolderNode[] => {
          let result: FolderNode[] = [];
          for (const node of nodes) {
            result.push(node);
            if (node.children && node.children.length > 0) {
              result = result.concat(flattenFolders(node.children));
            }
          }
          return result;
        };
        setAllFolders(flattenFolders(data.folders));

        // Auto-expand root folders
        const rootIds = data.folders.map((f: FolderNode) => f.id);
        setExpandedFolders(new Set(rootIds));
      } else {
        // Check if folders need to be initialized
        if (response.status === 404) {
          toast.info("Initializing folder structure...");
          const initResponse = await fetch("/api/company/folders/initialize", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ companyId }),
          });

          if (initResponse.ok) {
            toast.success("Folder structure initialized");
            // Refetch after initialization
            const refetchResponse = await fetch(
              `/api/company/folders?companyId=${companyId}`
            );
            if (refetchResponse.ok) {
              const data = await refetchResponse.json();
              setFolders(data.folders);
              setIsAdmin(data.isAdmin);
            }
          }
        }
      }

      // Fetch storage info
      const storageResponse = await fetch(
        `/api/company/storage?companyId=${companyId}`
      );
      if (storageResponse.ok) {
        const storageData = await storageResponse.json();
        setStorageInfo({
          used: storageData.company?.storageUsedGB || 0,
          limit: storageData.storageLimit || 10,
          plan: storageData.company?.plan || "ESSENTIAL",
        });
      }
    } catch (error) {
      console.error("Failed to fetch folders:", error);
      toast.error("Failed to load folder tree");
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  // Handle drag and drop for file upload
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (!selectedFolder) {
        toast.error("Please select a folder first");
        return;
      }

      if (!isAdmin) {
        toast.error("You don't have permission to upload files");
        return;
      }

      const files = Array.from(e.dataTransfer.files);

      if (files.length === 0) {
        return;
      }

      // Upload files one by one
      for (const file of files) {
        try {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("folderId", selectedFolder.id);
          formData.append("companyId", companyId);

          const response = await fetch("/api/files/upload", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Upload failed");
          }

          toast.success(`${file.name} uploaded successfully`);
        } catch (error) {
          console.error("Upload error:", error);
          toast.error(
            `Failed to upload ${file.name}: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }
      }

      // Refresh the folder tree to show new files
      fetchFolderTree();
    },
    [selectedFolder, isAdmin, companyId, fetchFolderTree]
  );

  useEffect(() => {
    if (companyId) {
      fetchFolderTree();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  const initializeFolders = async () => {
    try {
      const response = await fetch("/api/company/folders/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId }),
      });

      if (response.ok) {
        toast.success("Folder structure initialized");
        fetchFolderTree();
      }
    } catch (error) {
      console.error("Failed to initialize folders:", error);
      toast.error("Failed to initialize folder structure");
    }
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const handleFolderClick = (node: FolderNode) => {
    // Check if folder is password protected
    if (node.isPasswordProtected && selectedFolder?.id !== node.id) {
      setLockedFolder(node);
      setPasswordDialogMode("verify");
      setShowPasswordDialog(true);
    } else {
      setSelectedFolder(node);
      setSelectedFileIds(new Set()); // Clear selection when changing folders
      if (node.children && node.children.length > 0) {
        toggleFolder(node.id);
      }
    }
  };

  const handlePasswordVerified = () => {
    if (lockedFolder) {
      setSelectedFolder(lockedFolder);
      setLockedFolder(null);
    }
  };

  const handleLockFolder = () => {
    if (!selectedFolder) return;
    setPasswordDialogMode("set");
    setShowPasswordDialog(true);
  };

  const handleUnlockFolder = () => {
    if (!selectedFolder) return;
    setPasswordDialogMode("remove");
    setShowPasswordDialog(true);
  };

  const toggleFileSelection = (fileId: string) => {
    setSelectedFileIds((prev) => {
      const next = new Set(prev);
      if (next.has(fileId)) {
        next.delete(fileId);
      } else {
        next.add(fileId);
      }
      return next;
    });
  };

  const selectAllFiles = () => {
    if (!selectedFolder?.files) return;
    setSelectedFileIds(new Set(selectedFolder.files.map((f) => f.id)));
  };

  const deselectAllFiles = () => {
    setSelectedFileIds(new Set());
  };

  const handleDownloadMultiple = async () => {
    if (selectedFileIds.size === 0) return;

    setDownloadingMultiple(true);
    try {
      const response = await fetch("/api/files/download-multiple", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileIds: Array.from(selectedFileIds) }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to download files");
      }

      // Get the blob from response
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      // Create a temporary link and trigger download
      const link = document.createElement("a");
      link.href = url;
      link.download = `files-${new Date().toISOString().split("T")[0]}.zip`;
      document.body.appendChild(link);
      link.click();

      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`${selectedFileIds.size} files downloaded successfully`);
      deselectAllFiles();
    } catch (error) {
      console.error("Download error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to download files"
      );
    } finally {
      setDownloadingMultiple(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const renderFolderTree = (nodes: FolderNode[], level = 0) => {
    return nodes.map((node) => {
      const isExpanded = expandedFolders.has(node.id);
      const hasChildren = node.children && node.children.length > 0;
      const isSelected = selectedFolder?.id === node.id;

      return (
        <div key={node.id}>
          <div
            className={`flex items-center gap-2 py-2 px-3 hover:bg-muted/50 cursor-pointer rounded-md ${
              isSelected ? "bg-muted" : ""
            }`}
            style={{ paddingLeft: `${level * 20 + 12}px` }}
            onClick={() => handleFolderClick(node)}
          >
            {hasChildren && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFolder(node.id);
                }}
                className="p-0 hover:bg-transparent"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            )}
            {!hasChildren && <div className="w-4" />}

            {isExpanded ? (
              <FolderOpen className="h-4 w-4 text-blue-500" />
            ) : (
              <Folder className="h-4 w-4 text-blue-500" />
            )}

            <span className="flex-1 text-sm font-medium">{node.name}</span>

            {node.isPasswordProtected && (
              <Lock className="h-3 w-3 text-amber-600" />
            )}

            {node.fileCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {node.fileCount}
              </Badge>
            )}
          </div>

          {isExpanded && hasChildren && (
            <div>{renderFolderTree(node.children, level + 1)}</div>
          )}
        </div>
      );
    });
  };

  const renderFileList = () => {
    if (!selectedFolder) {
      return (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <div className="text-center">
            <Folder className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Select a folder to view files</p>
          </div>
        </div>
      );
    }

    if (!selectedFolder.files || selectedFolder.files.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <div className="text-center">
            <File className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No files in this folder</p>
            {isAdmin && (
              <Button
                size="sm"
                variant="outline"
                className="mt-4"
                onClick={() => setShowUploadDialog(true)}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Files
              </Button>
            )}
          </div>
        </div>
      );
    }

    if (viewMode === "grid") {
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {selectedFolder.files.map((file) => {
            const FileIcon = getFileIcon(file.mimeType);
            const isSelected = selectedFileIds.has(file.id);
            const showPreview = canPreviewImage(file.mimeType);

            return (
              <FileContextMenu
                key={file.id}
                fileId={file.id}
                fileName={file.fileName}
                canDelete={isAdmin}
                onFileDeleted={fetchFolderTree}
              >
                <div
                  className={`relative border rounded-lg p-4 hover:bg-muted/50 cursor-pointer transition-all ${
                    isSelected ? "ring-2 ring-primary bg-muted/50" : ""
                  }`}
                  onClick={(e) => {
                    if (e.ctrlKey || e.metaKey) {
                      toggleFileSelection(file.id);
                    }
                  }}
                >
                  <div className="absolute top-2 right-2 z-10">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleFileSelection(file.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>

                  <div className="flex flex-col items-center text-center space-y-2">
                    {showPreview ? (
                      <div className="w-full h-32 relative rounded overflow-hidden bg-muted">
                        <Image
                          width={180}
                          height={128}
                          src={`/api/files/${file.id}?preview=true`}
                          alt={file.fileName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback to icon if image fails to load
                            e.currentTarget.style.display = "none";
                            const fallback = e.currentTarget
                              .nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = "flex";
                          }}
                        />
                        <div
                          className="hidden w-full h-full items-center justify-center"
                          style={{ display: "none" }}
                        >
                          <FileIcon className="h-16 w-16 text-muted-foreground" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-32 flex items-center justify-center bg-muted rounded">
                        <FileIcon className="h-16 w-16 text-muted-foreground" />
                      </div>
                    )}

                    <div className="w-full">
                      <div
                        className="font-medium text-sm truncate"
                        title={file.fileName}
                      >
                        {file.fileName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatFileSize(file.fileSize)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(file.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              </FileContextMenu>
            );
          })}
        </div>
      );
    }

    // List view
    return (
      <div className="space-y-2">
        {selectedFolder.files.map((file) => {
          const FileIcon = getFileIcon(file.mimeType);
          const isSelected = selectedFileIds.has(file.id);

          return (
            <FileContextMenu
              key={file.id}
              fileId={file.id}
              fileName={file.fileName}
              canDelete={isAdmin}
              onFileDeleted={fetchFolderTree}
            >
              <div
                className={`flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-all ${
                  isSelected ? "ring-2 ring-primary bg-muted/50" : ""
                }`}
                onClick={(e) => {
                  if (e.ctrlKey || e.metaKey) {
                    toggleFileSelection(file.id);
                  }
                }}
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggleFileSelection(file.id)}
                  onClick={(e) => e.stopPropagation()}
                />
                <FileIcon className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {file.fileName}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatFileSize(file.fileSize)} •{" "}
                    {new Date(file.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Right-click for options
                </div>
              </div>
            </FileContextMenu>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>File Explorer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            Loading file system...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle>File Explorer</CardTitle>
            <CardDescription className="flex flex-col gap-1">
              {companies && companies.length > 0 && (
                <span>
                  Company:{" "}
                  <strong>
                    {companies.find((c) => c.id === companyId)?.name ||
                      "Select a company"}
                  </strong>
                </span>
              )}
              {selectedFolder && (
                <span className="text-xs">
                  Selected: <strong>{selectedFolder.path}</strong>
                </span>
              )}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {companies && companies.length > 0 && (
              <Select value={companyId} onValueChange={setCompanyId}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {isAdmin && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowCreateFolderDialog(true)}
                >
                  <FolderPlus className="h-4 w-4 mr-2" />
                  New Folder
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fetchFolderTree()}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Storage Info Alert */}
        {storageInfo && (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Upload Guidelines</AlertTitle>
            <AlertDescription className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Storage Used:</span>
                <span className="font-medium">
                  {storageInfo.used.toFixed(2)} GB / {storageInfo.limit} GB
                </span>
              </div>
              <div className="text-xs space-y-1">
                <p>
                  <strong>Max file size:</strong> 100MB per file
                </p>
                <p>
                  <strong>Allowed:</strong> {getAllowedFileTypesDescription()}
                </p>
                <p>
                  <strong>Blocked:</strong> {getBlockedFileTypesDescription()}
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-3 gap-6">
          {/* Folder Tree */}
          <div className="col-span-1 border rounded-lg p-4 max-h-[600px] overflow-y-auto">
            <div className="mb-4 font-semibold text-sm">Folders</div>
            {folders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Folder className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm mb-4">No folders found</p>
                {isAdmin && (
                  <Button size="sm" onClick={() => initializeFolders()}>
                    Initialize Folders
                  </Button>
                )}
              </div>
            ) : (
              renderFolderTree(folders)
            )}
          </div>

          {/* File List */}
          <div
            className={`col-span-2 border rounded-lg p-4 max-h-[600px] overflow-y-auto transition-all relative ${
              isDragging && selectedFolder && isAdmin
                ? "border-primary border-2 bg-primary/5"
                : ""
            }`}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">
                  {selectedFolder ? selectedFolder.path : "Files"}
                </span>
                {selectedFolder?.files && selectedFolder.files.length > 0 && (
                  <Badge variant="outline">
                    {selectedFolder.files.length} files
                  </Badge>
                )}
              </div>
              <div className="flex gap-2">
                {/* View Toggle */}
                <div className="flex border rounded-md">
                  <Button
                    size="sm"
                    variant={viewMode === "list" ? "secondary" : "ghost"}
                    className="rounded-r-none"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={viewMode === "grid" ? "secondary" : "ghost"}
                    className="rounded-l-none"
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid3x3 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Multi-select actions */}
                {selectedFileIds.size > 0 && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleDownloadMultiple}
                      disabled={downloadingMultiple}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {downloadingMultiple
                        ? "Preparing..."
                        : `Download (${selectedFileIds.size})`}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={deselectAllFiles}
                    >
                      Clear
                    </Button>
                  </>
                )}

                {/* Folder actions */}
                {selectedFolder && isAdmin && (
                  <>
                    {!selectedFolder.isPasswordProtected &&
                      !selectedFolder.path.endsWith("-store") && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleLockFolder}
                        >
                          <Lock className="h-4 w-4 mr-2" />
                          Lock
                        </Button>
                      )}
                    {selectedFolder.isPasswordProtected && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleUnlockFolder}
                      >
                        <Unlock className="h-4 w-4 mr-2" />
                        Unlock
                      </Button>
                    )}
                    <Button size="sm" onClick={() => setShowUploadDialog(true)}>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload
                    </Button>
                  </>
                )}

                {/* Select all button */}
                {selectedFolder?.files &&
                  selectedFolder.files.length > 0 &&
                  selectedFileIds.size < selectedFolder.files.length && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={selectAllFiles}
                    >
                      Select All
                    </Button>
                  )}
              </div>
            </div>

            {isDragging && selectedFolder && isAdmin && (
              <div className="absolute inset-0 flex items-center justify-center bg-primary/10 backdrop-blur-sm rounded-lg z-10 pointer-events-none">
                <div className="text-center">
                  <Upload className="h-12 w-12 mx-auto mb-2 text-primary" />
                  <p className="text-lg font-semibold text-primary">
                    Drop files here to upload
                  </p>
                  <p className="text-sm text-muted-foreground">
                    to {selectedFolder.name}
                  </p>
                </div>
              </div>
            )}

            {renderFileList()}
          </div>
        </div>
      </CardContent>

      {/* Dialogs */}
      {selectedFolder && (
        <FileUploadDialog
          open={showUploadDialog}
          onOpenChange={setShowUploadDialog}
          folderId={selectedFolder.id}
          companyId={companyId}
          folderName={selectedFolder.name}
          companyName={companies?.find((c) => c.id === companyId)?.name}
          onUploadComplete={fetchFolderTree}
        />
      )}
      <CreateFolderDialog
        open={showCreateFolderDialog}
        onOpenChange={setShowCreateFolderDialog}
        companyId={companyId}
        folders={allFolders}
        onFolderCreated={fetchFolderTree}
      />
      {(selectedFolder || lockedFolder) && (
        <FolderPasswordDialog
          open={showPasswordDialog}
          onOpenChange={setShowPasswordDialog}
          folderId={(lockedFolder || selectedFolder)!.id}
          folderName={(lockedFolder || selectedFolder)!.name}
          isPasswordProtected={
            (lockedFolder || selectedFolder)!.isPasswordProtected
          }
          mode={passwordDialogMode}
          onSuccess={
            passwordDialogMode === "verify"
              ? handlePasswordVerified
              : fetchFolderTree
          }
        />
      )}
    </Card>
  );
}

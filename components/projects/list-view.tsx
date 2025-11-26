import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MoreHorizontal,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit,
  Trash2,
  Users,
  ListTodo,
} from "lucide-react";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditProjectDialog } from "@/components/edit-project-dialog";
import { DeleteProjectDialog } from "@/components/delete-project-dialog";

interface Project {
  id: string;
  name: string;
  description: string | null;
  status:
    | "PLANNING"
    | "IN_PROGRESS"
    | "ON_HOLD"
    | "BLOCKED"
    | "COMPLETED"
    | "CANCELLED";
  startDate: string | null;
  endDate: string | null;
  companyId: string;
  teamId: string;
  customerId: string | null;
  managerId: string | null;
  leadId: string | null;
  createdAt: string;
  updatedAt: string;
  team: {
    id: string;
    name: string;
  };
  projectManager: {
    id: string;
    user: {
      name: string | null;
      image: string | null;
    };
  } | null;
  teamLead: {
    id: string;
    user: {
      name: string | null;
      image: string | null;
    };
  } | null;
  _count: {
    tasks: number;
  };
}

interface ListViewProps {
  projects: Project[];
  onProjectsChange?: () => void;
}

const STATUS_CONFIG = {
  PLANNING: {
    label: "Planning",
    variant: "secondary" as const,
  },
  IN_PROGRESS: {
    label: "In Progress",
    variant: "default" as const,
  },
  ON_HOLD: {
    label: "On Hold",
    variant: "outline" as const,
  },
  BLOCKED: {
    label: "Blocked",
    variant: "destructive" as const,
  },
  COMPLETED: {
    label: "Completed",
    variant: "secondary" as const,
  },
  CANCELLED: {
    label: "Cancelled",
    variant: "destructive" as const,
  },
};

type SortField = "name" | "status" | "team" | "tasks" | "startDate" | "endDate";
type SortDirection = "asc" | "desc";

export function ListView({ projects, onProjectsChange }: ListViewProps) {
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Sorting logic
  const sortedProjects = [...projects].sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;

    switch (sortField) {
      case "name":
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case "status":
        aValue = a.status;
        bValue = b.status;
        break;
      case "team":
        aValue = a.team.name.toLowerCase();
        bValue = b.team.name.toLowerCase();
        break;
      case "tasks":
        aValue = a._count.tasks;
        bValue = b._count.tasks;
        break;
      case "startDate":
        aValue = a.startDate ? new Date(a.startDate).getTime() : 0;
        bValue = b.startDate ? new Date(b.startDate).getTime() : 0;
        break;
      case "endDate":
        aValue = a.endDate ? new Date(a.endDate).getTime() : 0;
        bValue = b.endDate ? new Date(b.endDate).getTime() : 0;
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  // Pagination logic
  const totalPages = Math.ceil(sortedProjects.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProjects = sortedProjects.slice(startIndex, endIndex);

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort("name")}
                  className="-ml-3 h-8"
                >
                  Project Name
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort("status")}
                  className="-ml-3 h-8"
                >
                  Status
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort("team")}
                  className="-ml-3 h-8"
                >
                  Team
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>Manager</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort("tasks")}
                  className="-ml-3 h-8"
                >
                  Tasks
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort("startDate")}
                  className="-ml-3 h-8"
                >
                  Start Date
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort("endDate")}
                  className="-ml-3 h-8"
                >
                  Due Date
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedProjects.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center text-muted-foreground"
                >
                  No projects found
                </TableCell>
              </TableRow>
            ) : (
              paginatedProjects.map((project) => (
                <TableRow
                  key={project.id}
                  className="cursor-pointer hover:bg-muted/50"
                >
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{project.name}</div>
                      {project.description && (
                        <div className="text-sm text-muted-foreground">
                          {project.description.length > 30
                            ? `${project.description.substring(0, 30)}...`
                            : project.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_CONFIG[project.status].variant}>
                      {STATUS_CONFIG[project.status].label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{project.team.name}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {project.projectManager?.user.name || "—"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{project._count.tasks}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {project.startDate
                      ? new Date(project.startDate).toLocaleDateString()
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {project.endDate
                      ? new Date(project.endDate).toLocaleDateString()
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            (window.location.href = `/dashboard/projects/${project.id}`)
                          }
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            (window.location.href = `/dashboard/projects/${project.id}?tab=tasks`)
                          }
                        >
                          <ListTodo className="mr-2 h-4 w-4" />
                          View Tasks
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            (window.location.href = `/dashboard/projects/${project.id}?tab=team`)
                          }
                        >
                          <Users className="mr-2 h-4 w-4" />
                          View Team
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedProject(project);
                            setEditDialogOpen(true);
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Project
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => {
                            setSelectedProject(project);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Project
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {projects.length > 0 && (
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to {Math.min(endIndex, projects.length)}{" "}
              of {projects.length} projects
            </p>
          </div>

          <div className="flex items-center gap-6">
            {/* Items per page selector */}
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">Rows per page</p>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(value) => {
                  setItemsPerPage(Number(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-8 w-16">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Page navigation */}
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Project Dialog */}
      {selectedProject && (
        <EditProjectDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          project={{
            id: selectedProject.id,
            name: selectedProject.name,
            description: selectedProject.description,
            teamId: selectedProject.teamId,
            companyId: selectedProject.companyId,
            status: selectedProject.status,
            projectManagerId: selectedProject.projectManager?.id || null,
            teamLeadId: selectedProject.teamLead?.id || null,
            startDate: selectedProject.startDate,
            endDate: selectedProject.endDate,
            customerId: selectedProject.customerId,
          }}
          onSuccess={() => {
            setEditDialogOpen(false);
            setSelectedProject(null);
            if (onProjectsChange) {
              onProjectsChange();
            }
          }}
        />
      )}

      {/* Delete Project Dialog */}
      {selectedProject && (
        <DeleteProjectDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          projectId={selectedProject.id}
          projectName={selectedProject.name}
          taskCount={selectedProject._count.tasks}
          onSuccess={() => {
            setDeleteDialogOpen(false);
            setSelectedProject(null);
            if (onProjectsChange) {
              onProjectsChange();
            }
          }}
        />
      )}
    </div>
  );
}

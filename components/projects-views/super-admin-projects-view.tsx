"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FolderKanban,
  Plus,
  Search,
  LayoutGrid,
  List,
  Calendar,
  Users,
  Loader2,
  Filter,
} from "lucide-react";
import {
  ProjectsListSkeleton,
  ProjectsBoardSkeleton,
} from "@/components/projects/projects-skeleton";
import { BoardView } from "@/components/projects/board-view";
import { ListView } from "@/components/projects/list-view";
import { TimelineView } from "@/components/projects/timeline-view";
import { TeamView } from "@/components/projects/team-view";
import { CreateProjectDialog } from "@/components/create-project-dialog";

interface Company {
  id: string;
  name: string;
}

interface Team {
  id: string;
  name: string;
  companyId: string;
}

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
  targetEndDate: string | null;
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

type ViewMode = "board" | "list" | "timeline" | "team";

export function SuperAdminProjectsView() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [teams, setTeams] = useState<Team[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("board");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Fetch companies owned by SUPER_ADMIN
  useEffect(() => {
    async function fetchCompanies() {
      try {
        const response = await fetch("/api/companies");
        const data = await response.json();

        if (data.companies) {
          setCompanies(data.companies);
          // Auto-select first company if available
          if (data.companies.length > 0) {
            setSelectedCompanyId(data.companies[0].id);
          }
        }
      } catch (error) {
        console.error("Error fetching companies:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchCompanies();
  }, []);

  // Fetch teams when company changes
  useEffect(() => {
    async function fetchTeams() {
      if (!selectedCompanyId) return;

      try {
        const response = await fetch(
          `/api/teams?companyId=${selectedCompanyId}`
        );
        const data = await response.json();

        if (data.teams) {
          setTeams(data.teams);
        }
      } catch (error) {
        console.error("Error fetching teams:", error);
      }
    }

    fetchTeams();
  }, [selectedCompanyId]);

  // Fetch projects when company changes
  useEffect(() => {
    async function fetchProjects() {
      if (!selectedCompanyId) {
        setProjects([]);
        setFilteredProjects([]);
        return;
      }

      setProjectsLoading(true);
      try {
        const response = await fetch(
          `/api/projects?companyId=${selectedCompanyId}`
        );
        const data = await response.json();

        if (data.projects) {
          setProjects(data.projects);
          setFilteredProjects(data.projects);
        }
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setProjectsLoading(false);
      }
    }

    fetchProjects();
  }, [selectedCompanyId]);

  // Function to refetch projects (for after creating a new project)
  const refetchProjects = async () => {
    if (!selectedCompanyId) return;

    setProjectsLoading(true);
    try {
      const response = await fetch(
        `/api/projects?companyId=${selectedCompanyId}`
      );
      const data = await response.json();

      if (data.projects) {
        setProjects(data.projects);
        setFilteredProjects(data.projects);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setProjectsLoading(false);
    }
  };

  // Apply filters
  useEffect(() => {
    let filtered = [...projects];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (project) =>
          project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          project.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Team filter
    if (selectedTeamId !== "all") {
      filtered = filtered.filter(
        (project) => project.teamId === selectedTeamId
      );
    }

    // Status filter
    if (selectedStatus !== "all") {
      filtered = filtered.filter(
        (project) => project.status === selectedStatus
      );
    }

    setFilteredProjects(filtered);
  }, [projects, searchQuery, selectedTeamId, selectedStatus]);

  // Handle project status update (drag & drop)
  const handleProjectMove = async (
    projectId: string,
    newStatus: Project["status"]
  ) => {
    // Store previous state for rollback
    const previousProjects = projects;

    try {
      // Update local state immediately (optimistic update)
      setProjects((prevProjects) =>
        prevProjects.map((project) =>
          project.id === projectId ? { ...project, status: newStatus } : project
        )
      );

      // Then make the API call
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = {
            error: `HTTP ${response.status}: ${response.statusText}`,
          };
        }
        console.error("Failed to update project status:", errorData);
        console.error("Response status:", response.status);
        console.error("Project ID:", projectId, "New Status:", newStatus);
        // Rollback on error
        setProjects(previousProjects);
        throw new Error(errorData.error || "Failed to update project status");
      }

      await response.json(); // Consume the response
    } catch (error) {
      console.error("Error updating project status:", error);
      // Rollback already happened in the if block above
      throw error; // Re-throw to let BoardView handle the error
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center space-y-4">
          <FolderKanban className="h-16 w-16 mx-auto text-muted-foreground" />
          <h2 className="text-2xl font-bold">No Companies Found</h2>
          <p className="text-muted-foreground max-w-md">
            You need to create a company first before you can manage projects.
          </p>
          <Button
            onClick={() => (window.location.href = "/dashboard/companies")}
          >
            Create Company
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Manage your teams and projects across companies
          </p>
        </div>
        <Button
          onClick={() => setCreateDialogOpen(true)}
          disabled={!selectedCompanyId}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Project
        </Button>
      </div>

      {/* Company Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Select Company</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedCompanyId}
            onValueChange={setSelectedCompanyId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a company" />
            </SelectTrigger>
            <SelectContent>
              {companies.map((company) => (
                <SelectItem key={company.id} value={company.id}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* View Switcher & Filters */}
      <div className="flex items-center justify-between gap-4">
        {/* View Mode Tabs */}
        <Tabs
          value={viewMode}
          onValueChange={(v) => setViewMode(v as ViewMode)}
        >
          <TabsList>
            <TabsTrigger value="board">
              <LayoutGrid className="h-4 w-4 mr-2" />
              Board
            </TabsTrigger>
            <TabsTrigger value="list">
              <List className="h-4 w-4 mr-2" />
              List
            </TabsTrigger>
            <TabsTrigger value="timeline">
              <Calendar className="h-4 w-4 mr-2" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="team">
              <Users className="h-4 w-4 mr-2" />
              Team
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filters:</span>
        </div>

        {/* Team Filter */}
        <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Teams" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Teams</SelectItem>
            {teams.map((team) => (
              <SelectItem key={team.id} value={team.id}>
                {team.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="PLANNING">Planning</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="ON_HOLD">On Hold</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        {(selectedTeamId !== "all" ||
          selectedStatus !== "all" ||
          searchQuery) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedTeamId("all");
              setSelectedStatus("all");
              setSearchQuery("");
            }}
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Projects Content */}
      {projectsLoading ? (
        viewMode === "list" ? (
          <ProjectsListSkeleton />
        ) : (
          <ProjectsBoardSkeleton />
        )
      ) : filteredProjects.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FolderKanban className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Projects Found</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
              {projects.length === 0
                ? "Get started by creating your first project."
                : "No projects match your current filters."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Render appropriate view based on viewMode */}
          {viewMode === "board" && (
            <BoardView
              projects={filteredProjects}
              onProjectMove={handleProjectMove}
            />
          )}
          {viewMode === "list" && (
            <ListView
              projects={filteredProjects}
              onProjectsChange={refetchProjects}
            />
          )}
          {viewMode === "timeline" && (
            <TimelineView projects={filteredProjects} />
          )}
          {viewMode === "team" && <TeamView projects={filteredProjects} />}
        </div>
      )}

      {/* Create Project Dialog */}
      <CreateProjectDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        companyId={selectedCompanyId}
        onSuccess={refetchProjects}
      />
    </div>
  );
}

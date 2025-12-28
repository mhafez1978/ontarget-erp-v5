"use client";

import { FolderKanban, Search, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ProjectsListSkeleton } from "@/components/projects/projects-skeleton";
import { ListView } from "@/components/projects/list-view";

interface Company {
  id: string;
  name: string;
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

export function CompanyCustomerProjectsView() {
  const [company, setCompany] = useState<Company | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch customer's company and projects
  useEffect(() => {
    async function fetchCustomerData() {
      try {
        // First, get the customer's company
        const companyResponse = await fetch("/api/customers/my-companies");
        const companyData = await companyResponse.json();

        if (companyData.companies && companyData.companies.length > 0) {
          const customerCompany = companyData.companies[0]; // Customer should have one company
          setCompany(customerCompany);

          // Fetch projects where this customer is assigned
          setProjectsLoading(true);
          const projectsResponse = await fetch(
            `/api/projects?companyId=${customerCompany.id}`
          );
          const projectsData = await projectsResponse.json();

          if (projectsData.projects) {
            setProjects(projectsData.projects);
            setFilteredProjects(projectsData.projects);
          }
          setProjectsLoading(false);
        } else {
          // Customer not linked to any company
          setCompany(null);
          setProjects([]);
          setFilteredProjects([]);
        }
      } catch (error) {
        console.error("Error fetching customer data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchCustomerData();
  }, []);

  // Filter projects based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProjects(projects);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = projects.filter(
      (project) =>
        project.name.toLowerCase().includes(query) ||
        project.description?.toLowerCase().includes(query) ||
        project.team.name.toLowerCase().includes(query)
    );
    setFilteredProjects(filtered);
  }, [searchQuery, projects]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">No Company Access</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              You are not currently linked to any company. Please contact your
              administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <FolderKanban className="h-8 w-8" />
          My Projects
        </h1>
        <p className="text-muted-foreground mt-1">
          View projects from {company.name}
        </p>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Projects content - List view only for customers */}
      {projectsLoading ? (
        <ProjectsListSkeleton />
      ) : filteredProjects.length === 0 ? (
        <Card className="col-span-full">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderKanban className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Projects Found</h3>
            <p className="text-muted-foreground text-center">
              {searchQuery
                ? "No projects match your search criteria"
                : "You don't have any projects assigned yet"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <ListView projects={filteredProjects} />
      )}
    </div>
  );
}

import useSWR, { mutate } from "swr";
import { toast } from "sonner";

// ========================================
// Type Definitions
// ========================================

interface Project {
  id: string;
  name: string;
  description: string | null;
  teamId: string;
  companyId: string;
  status: string;
  projectManagerId: string | null;
  teamLeadId: string | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Team {
  id: string;
  name: string;
  description: string | null;
  companyId: string;
  memberCount: number;
  projectCount: number;
  createdAt: string;
  updatedAt: string;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  projectId: string;
  assignedToId: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
}

// ========================================
// Projects Hooks
// ========================================

export function useProjects(companyId?: string) {
  const url = companyId ? `/api/projects?companyId=${companyId}` : null;

  const {
    data,
    error,
    isLoading,
    mutate: revalidate,
  } = useSWR(url, {
    revalidateOnMount: true,
    dedupingInterval: 2000,
  });

  return {
    projects: data?.projects || [],
    isLoading,
    isError: error,
    revalidate,
  };
}

export function useProject(projectId?: string) {
  const url = projectId ? `/api/projects/${projectId}` : null;

  const {
    data,
    error,
    isLoading,
    mutate: revalidate,
  } = useSWR(url, {
    revalidateOnMount: true,
    dedupingInterval: 2000,
  });

  return {
    project: data?.project || null,
    isLoading,
    isError: error,
    revalidate,
  };
}

// ========================================
// Teams Hooks
// ========================================

export function useTeams(companyId?: string) {
  const url = companyId ? `/api/teams?companyId=${companyId}` : null;

  const {
    data,
    error,
    isLoading,
    mutate: revalidate,
  } = useSWR(url, {
    revalidateOnMount: true,
    dedupingInterval: 2000,
  });

  return {
    teams: data?.teams || [],
    isLoading,
    isError: error,
    revalidate,
  };
}

export function useTeam(teamId?: string) {
  const url = teamId ? `/api/teams/${teamId}` : null;

  const {
    data,
    error,
    isLoading,
    mutate: revalidate,
  } = useSWR(url, {
    revalidateOnMount: true,
    dedupingInterval: 2000,
  });

  return {
    team: data?.team || null,
    isLoading,
    isError: error,
    revalidate,
  };
}

// ========================================
// Tasks Hooks
// ========================================

export function useTasks(projectId?: string) {
  const url = projectId ? `/api/projects/${projectId}/tasks` : null;

  const {
    data,
    error,
    isLoading,
    mutate: revalidate,
  } = useSWR(url, {
    revalidateOnMount: true,
    dedupingInterval: 2000,
  });

  return {
    tasks: data?.tasks || [],
    isLoading,
    isError: error,
    revalidate,
  };
}

export function useTask(taskId?: string) {
  const url = taskId ? `/api/tasks/${taskId}` : null;

  const {
    data,
    error,
    isLoading,
    mutate: revalidate,
  } = useSWR(url, {
    revalidateOnMount: true,
    dedupingInterval: 2000,
  });

  return {
    task: data?.task || null,
    isLoading,
    isError: error,
    revalidate,
  };
}

// ========================================
// Optimistic Update Helpers
// ========================================

export async function createProject(
  data: Record<string, unknown>,
  companyId: string
) {
  const optimisticProject = {
    ...data,
    id: `temp-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as Project;

  // Optimistic update
  mutate(
    `/api/projects?companyId=${companyId}`,
    (current: { projects?: Project[] } | undefined) => ({
      ...current,
      projects: [optimisticProject, ...(current?.projects || [])],
    }),
    false
  );

  try {
    const response = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Failed to create project");
    }

    // Revalidate after successful creation
    mutate(`/api/projects?companyId=${companyId}`);
    toast.success("Project created successfully!");

    return result.project;
  } catch (error) {
    // Rollback on error
    mutate(`/api/projects?companyId=${companyId}`);
    toast.error(
      error instanceof Error ? error.message : "Failed to create project"
    );
    throw error;
  }
}

export async function updateProject(
  projectId: string,
  data: Record<string, unknown>,
  companyId: string
) {
  // Optimistic update
  mutate(
    `/api/projects/${projectId}`,
    (current: { project?: Project } | undefined) => ({
      ...current,
      project: {
        ...current?.project,
        ...data,
        updatedAt: new Date().toISOString(),
      } as Project,
    }),
    false
  );

  mutate(
    `/api/projects?companyId=${companyId}`,
    (current: { projects?: Project[] } | undefined) => ({
      ...current,
      projects: current?.projects?.map((p: Project) =>
        p.id === projectId
          ? { ...p, ...data, updatedAt: new Date().toISOString() }
          : p
      ),
    }),
    false
  );

  try {
    const response = await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Failed to update project");
    }

    // Revalidate after successful update
    mutate(`/api/projects/${projectId}`);
    mutate(`/api/projects?companyId=${companyId}`);
    toast.success("Project updated successfully!");

    return result.project;
  } catch (error) {
    // Rollback on error
    mutate(`/api/projects/${projectId}`);
    mutate(`/api/projects?companyId=${companyId}`);
    toast.error(
      error instanceof Error ? error.message : "Failed to update project"
    );
    throw error;
  }
}

export async function deleteProject(projectId: string, companyId: string) {
  // Optimistic delete
  mutate(
    `/api/projects?companyId=${companyId}`,
    (current: { projects?: Project[] } | undefined) => ({
      ...current,
      projects: current?.projects?.filter((p: Project) => p.id !== projectId),
    }),
    false
  );

  try {
    const response = await fetch(`/api/projects/${projectId}`, {
      method: "DELETE",
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Failed to delete project");
    }

    // Revalidate after successful deletion
    mutate(`/api/projects?companyId=${companyId}`);
    toast.success("Project deleted successfully!");

    return true;
  } catch (error) {
    // Rollback on error
    mutate(`/api/projects?companyId=${companyId}`);
    toast.error(
      error instanceof Error ? error.message : "Failed to delete project"
    );
    throw error;
  }
}

// ========================================
// Team Optimistic Updates
// ========================================

export async function createTeam(
  data: Record<string, unknown>,
  companyId: string
) {
  const optimisticTeam = {
    ...data,
    id: `temp-${Date.now()}`,
    memberCount: 0,
    projectCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as Team;

  mutate(
    `/api/teams?companyId=${companyId}`,
    (current: { teams?: Team[] } | undefined) => ({
      ...current,
      teams: [optimisticTeam, ...(current?.teams || [])],
    }),
    false
  );

  try {
    const response = await fetch("/api/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Failed to create team");
    }

    mutate(`/api/teams?companyId=${companyId}`);
    toast.success("Team created successfully!");

    return result.team;
  } catch (error) {
    mutate(`/api/teams?companyId=${companyId}`);
    toast.error(
      error instanceof Error ? error.message : "Failed to create team"
    );
    throw error;
  }
}

export async function updateTeam(
  teamId: string,
  data: Record<string, unknown>,
  companyId: string
) {
  mutate(
    `/api/teams/${teamId}`,
    (current: { team?: Team } | undefined) => ({
      ...current,
      team: {
        ...current?.team,
        ...data,
        updatedAt: new Date().toISOString(),
      } as Team,
    }),
    false
  );

  mutate(
    `/api/teams?companyId=${companyId}`,
    (current: { teams?: Team[] } | undefined) => ({
      ...current,
      teams: current?.teams?.map((t: Team) =>
        t.id === teamId
          ? { ...t, ...data, updatedAt: new Date().toISOString() }
          : t
      ),
    }),
    false
  );

  try {
    const response = await fetch(`/api/teams/${teamId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Failed to update team");
    }

    mutate(`/api/teams/${teamId}`);
    mutate(`/api/teams?companyId=${companyId}`);
    toast.success("Team updated successfully!");

    return result.team;
  } catch (error) {
    mutate(`/api/teams/${teamId}`);
    mutate(`/api/teams?companyId=${companyId}`);
    toast.error(
      error instanceof Error ? error.message : "Failed to update team"
    );
    throw error;
  }
}

export async function deleteTeam(teamId: string, companyId: string) {
  mutate(
    `/api/teams?companyId=${companyId}`,
    (current: { teams?: Team[] } | undefined) => ({
      ...current,
      teams: current?.teams?.filter((t: Team) => t.id !== teamId),
    }),
    false
  );

  try {
    const response = await fetch(`/api/teams/${teamId}`, {
      method: "DELETE",
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Failed to delete team");
    }

    mutate(`/api/teams?companyId=${companyId}`);
    toast.success("Team deleted successfully!");

    return true;
  } catch (error) {
    mutate(`/api/teams?companyId=${companyId}`);
    toast.error(
      error instanceof Error ? error.message : "Failed to delete team"
    );
    throw error;
  }
}

// ========================================
// Task Optimistic Updates
// ========================================

export async function createTask(
  data: Record<string, unknown>,
  projectId: string
) {
  const optimisticTask = {
    ...data,
    id: `temp-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as Task;

  mutate(
    `/api/projects/${projectId}/tasks`,
    (current: { tasks?: Task[] } | undefined) => ({
      ...current,
      tasks: [optimisticTask, ...(current?.tasks || [])],
    }),
    false
  );

  try {
    const response = await fetch(`/api/projects/${projectId}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Failed to create task");
    }

    mutate(`/api/projects/${projectId}/tasks`);
    mutate(`/api/projects/${projectId}`); // Also revalidate project for counts
    toast.success("Task created successfully!");

    return result.task;
  } catch (error) {
    mutate(`/api/projects/${projectId}/tasks`);
    toast.error(
      error instanceof Error ? error.message : "Failed to create task"
    );
    throw error;
  }
}

export async function updateTask(
  taskId: string,
  data: Record<string, unknown>,
  projectId: string
) {
  mutate(
    `/api/tasks/${taskId}`,
    (current: { task?: Task } | undefined) => ({
      ...current,
      task: {
        ...current?.task,
        ...data,
        updatedAt: new Date().toISOString(),
      } as Task,
    }),
    false
  );

  mutate(
    `/api/projects/${projectId}/tasks`,
    (current: { tasks?: Task[] } | undefined) => ({
      ...current,
      tasks: current?.tasks?.map((t: Task) =>
        t.id === taskId
          ? { ...t, ...data, updatedAt: new Date().toISOString() }
          : t
      ),
    }),
    false
  );

  try {
    const response = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Failed to update task");
    }

    mutate(`/api/tasks/${taskId}`);
    mutate(`/api/projects/${projectId}/tasks`);
    mutate(`/api/projects/${projectId}`); // Also revalidate project for counts
    toast.success("Task updated successfully!");

    return result.task;
  } catch (error) {
    mutate(`/api/tasks/${taskId}`);
    mutate(`/api/projects/${projectId}/tasks`);
    toast.error(
      error instanceof Error ? error.message : "Failed to update task"
    );
    throw error;
  }
}

export async function deleteTask(taskId: string, projectId: string) {
  mutate(
    `/api/projects/${projectId}/tasks`,
    (current: { tasks?: Task[] } | undefined) => ({
      ...current,
      tasks: current?.tasks?.filter((t: Task) => t.id !== taskId),
    }),
    false
  );

  try {
    const response = await fetch(`/api/tasks/${taskId}`, {
      method: "DELETE",
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Failed to delete task");
    }

    mutate(`/api/projects/${projectId}/tasks`);
    mutate(`/api/projects/${projectId}`); // Also revalidate project for counts
    toast.success("Task deleted successfully!");

    return true;
  } catch (error) {
    mutate(`/api/projects/${projectId}/tasks`);
    toast.error(
      error instanceof Error ? error.message : "Failed to delete task"
    );
    throw error;
  }
}

// ========================================
// Cache Invalidation Utilities
// ========================================

export function invalidateProjects(companyId: string) {
  mutate(`/api/projects?companyId=${companyId}`);
}

export function invalidateProject(projectId: string) {
  mutate(`/api/projects/${projectId}`);
}

export function invalidateTeams(companyId: string) {
  mutate(`/api/teams?companyId=${companyId}`);
}

export function invalidateTeam(teamId: string) {
  mutate(`/api/teams/${teamId}`);
}

export function invalidateTasks(projectId: string) {
  mutate(`/api/projects/${projectId}/tasks`);
}

export function invalidateTask(taskId: string) {
  mutate(`/api/tasks/${taskId}`);
}

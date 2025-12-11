"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { useState } from "react";
import { toast } from "sonner";
import { ProjectCard } from "@/components/projects/project-card";

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

interface BoardViewProps {
  projects: Project[];
  onProjectMove?: (
    projectId: string,
    newStatus: Project["status"]
  ) => Promise<void>;
  onProjectReorder?: (
    projectId: string,
    newStatus: Project["status"],
    newOrder: number
  ) => Promise<void>;
}

const STATUS_CONFIG = {
  PLANNING: {
    label: "Planning",
    color: "bg-emerald-200 text-emerald-900",
  },
  IN_PROGRESS: {
    label: "In Progress",
    color: "bg-emerald-200 text-emerald-900",
  },
  ON_HOLD: {
    label: "On Hold",
    color: "bg-emerald-200 text-emerald-900",
  },
  BLOCKED: {
    label: "Blocked",
    color: "bg-emerald-200 text-emerald-900",
  },
  COMPLETED: {
    label: "Completed",
    color: "bg-emerald-200 text-emerald-900",
  },
  CANCELLED: {
    label: "Cancelled",
    color: "bg-emerald-200 text-emerald-900",
  },
} as const;

export function BoardView({
  projects,
  onProjectMove,
  onProjectReorder,
}: BoardViewProps) {
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeStatus, setActiveStatus] = useState<Project["status"] | null>(
    null
  );

  // Configure drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px of movement required before drag starts
      },
    })
  );

  // Group projects by status and sort by sortOrder
  const projectsByStatus = projects.reduce((acc, project) => {
    if (!acc[project.status]) {
      acc[project.status] = [];
    }
    acc[project.status].push(project);
    return acc;
  }, {} as Record<string, Project[]>);

  // Sort projects within each status by sortOrder
  Object.keys(projectsByStatus).forEach((status) => {
    projectsByStatus[status].sort((a, b) => {
      const aOrder = (a as any).sortOrder ?? 0;
      const bOrder = (b as any).sortOrder ?? 0;
      return aOrder - bOrder;
    });
  });

  const handleDragStart = (event: DragStartEvent) => {
    const project = projects.find((p) => p.id === event.active.id);
    if (project) {
      setActiveProject(project);
      setActiveStatus(project.status);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveProject(null);
    setActiveStatus(null);

    if (!over) {
      return;
    }

    // Get the project being dragged
    const project = projects.find((p) => p.id === active.id);
    if (!project) return;

    // Check if we're dropping over a status column or another project
    const overId = over.id as string;
    const overProject = projects.find((p) => p.id === overId);

    if (overProject) {
      // Reordering within the same status or moving to a different status
      const newStatus = overProject.status;

      if (project.status === newStatus && active.id !== over.id) {
        // Reordering within the same lane
        const statusProjects = projectsByStatus[newStatus];
        const oldIndex = statusProjects.findIndex((p) => p.id === active.id);
        const newIndex = statusProjects.findIndex((p) => p.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1 && onProjectReorder) {
          setIsUpdating(true);
          try {
            await onProjectReorder(project.id, newStatus, newIndex);
            toast.success("Project reordered");
          } catch (error) {
            console.error("Failed to reorder project:", error);
            toast.error("Failed to reorder project. Please try again.");
          } finally {
            setIsUpdating(false);
          }
        }
      } else if (project.status !== newStatus) {
        // Moving to a different status lane
        if (onProjectMove) {
          setIsUpdating(true);
          try {
            await onProjectMove(project.id, newStatus);
            toast.success(`Project moved to ${STATUS_CONFIG[newStatus].label}`);
          } catch (error) {
            console.error("Failed to update project status:", error);
            toast.error("Failed to move project. Please try again.");
          } finally {
            setIsUpdating(false);
          }
        }
      }
    } else {
      // Dropping on a status column directly
      const newStatus = overId as Project["status"];
      if (
        Object.keys(STATUS_CONFIG).includes(newStatus) &&
        project.status !== newStatus
      ) {
        if (onProjectMove) {
          setIsUpdating(true);
          try {
            await onProjectMove(project.id, newStatus);
            toast.success(`Project moved to ${STATUS_CONFIG[newStatus].label}`);
          } catch (error) {
            console.error("Failed to update project status:", error);
            toast.error("Failed to move project. Please try again.");
          } finally {
            setIsUpdating(false);
          }
        }
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div
        className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 ${
          isUpdating ? "opacity-50 pointer-events-none" : ""
        }`}
      >
        {(Object.keys(STATUS_CONFIG) as Array<keyof typeof STATUS_CONFIG>).map(
          (status) => {
            const statusProjects = projectsByStatus[status] || [];
            const config = STATUS_CONFIG[status];

            return (
              <DroppableColumn
                key={status}
                status={status}
                config={config}
                projects={statusProjects}
              />
            );
          }
        )}
      </div>

      {/* Drag Overlay - shows the dragged project card */}
      <DragOverlay>
        {activeProject && <ProjectCard project={activeProject} isDragging />}
      </DragOverlay>
    </DndContext>
  );
}

// Droppable Column Component
import { useDroppable } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface DroppableColumnProps {
  status: Project["status"];
  config: { label: string; color: string };
  projects: Project[];
}

function DroppableColumn({ status, config, projects }: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  const projectIds = projects.map((p) => p.id);

  return (
    <Card
      ref={setNodeRef}
      className={`border-2 border-emerald-600 bg-emerald-200 flex flex-col min-h-[500px] transition-colors ${
        isOver ? "ring-2 ring-primary ring-offset-2" : ""
      }`}
    >
      {/* Column Header */}
      <CardHeader className="pb-3 px-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-emerald-900">
            {config.label}
          </CardTitle>
          <Badge
            variant="secondary"
            className="text-xs bg-emerald-100 text-emerald-900"
          >
            {projects.length}
          </Badge>
        </div>
      </CardHeader>

      {/* Projects Content - inside the column */}
      <CardContent className="flex-1 pt-0 px-3 space-y-3">
        {projects.length === 0 ? (
          <div className="flex items-center justify-center h-32 border-2 border-dashed border-emerald-400 rounded-lg bg-emerald-50/50">
            <p className="text-sm text-emerald-700">
              {isOver ? "Drop here" : "No projects"}
            </p>
          </div>
        ) : (
          <SortableContext
            items={projectIds}
            strategy={verticalListSortingStrategy}
          >
            {projects.map((project) => (
              <SortableProjectCard key={project.id} project={project} />
            ))}
          </SortableContext>
        )}
      </CardContent>
    </Card>
  );
}

// Sortable Project Card Component
interface SortableProjectCardProps {
  project: Project;
}

function SortableProjectCard({ project }: SortableProjectCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: project.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <ProjectCard
        project={project}
        isDragging={isDragging}
        disableNavigation={false}
        showQuickActions={false}
      />
    </div>
  );
}

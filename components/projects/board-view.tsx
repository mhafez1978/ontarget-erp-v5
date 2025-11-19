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
} from "@dnd-kit/core";
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

export function BoardView({ projects, onProjectMove }: BoardViewProps) {
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Configure drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px of movement required before drag starts
      },
    })
  );

  // Group projects by status
  const projectsByStatus = projects.reduce((acc, project) => {
    if (!acc[project.status]) {
      acc[project.status] = [];
    }
    acc[project.status].push(project);
    return acc;
  }, {} as Record<string, Project[]>);

  const handleDragStart = (event: DragStartEvent) => {
    const project = projects.find((p) => p.id === event.active.id);
    if (project) {
      setActiveProject(project);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveProject(null);

    if (!over || active.id === over.id) {
      return;
    }

    // Get the project being dragged
    const project = projects.find((p) => p.id === active.id);
    if (!project) return;

    // Get the new status from the droppable area
    const newStatus = over.id as Project["status"];

    // Don't update if status hasn't changed
    if (project.status === newStatus) {
      return;
    }

    // Call the onProjectMove callback if provided
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
  };

  return (
    <DndContext
      sensors={sensors}
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
import { useDraggable } from "@dnd-kit/core";

interface DroppableColumnProps {
  status: Project["status"];
  config: { label: string; color: string };
  projects: Project[];
}

function DroppableColumn({ status, config, projects }: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

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
          projects.map((project) => (
            <DraggableProjectCard key={project.id} project={project} />
          ))
        )}
      </CardContent>
    </Card>
  );
}

// Draggable Project Card Component
interface DraggableProjectCardProps {
  project: Project;
}

function DraggableProjectCard({ project }: DraggableProjectCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: project.id,
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={isDragging ? "opacity-50" : ""}
    >
      <ProjectCard
        project={project}
        isDragging={isDragging}
        disableNavigation={true}
        showQuickActions={false}
      />
    </div>
  );
}

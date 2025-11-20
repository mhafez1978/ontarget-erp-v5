"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { useDroppable } from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { TaskCard } from "@/components/projects/task-card";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status:
    | "TODO"
    | "IN_PROGRESS"
    | "IN_REVIEW"
    | "BLOCKED"
    | "COMPLETED"
    | "CANCELLED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate: string | null;
  order: number;
  createdById: string;
  assignedToId: string | null;
  projectId: string;
  timeEntry: number;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    user: {
      id: string;
      name: string | null;
      email: string;
      image: string | null;
    };
  };
  assignedTo: {
    id: string;
    user: {
      id: string;
      name: string | null;
      email: string;
      image: string | null;
    };
  } | null;
}

interface TasksBoardProps {
  projectId: string;
  onTaskClick?: (task: Task) => void;
  onCreateTask?: (status: Task["status"]) => void;
  onEditTask?: (task: Task) => void;
  onDeleteTask?: (task: Task) => void;
  onAssignTask?: (task: Task) => void;
  onChangePriority?: (task: Task) => void;
  onSetDueDate?: (task: Task) => void;
  refreshTrigger?: number; // Add this to trigger refetch
}

const STATUS_CONFIG = {
  TODO: {
    label: "To Do",
    color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    borderColor: "border-gray-200",
  },
  IN_PROGRESS: {
    label: "In Progress",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    borderColor: "border-blue-200",
  },
  IN_REVIEW: {
    label: "In Review",
    color:
      "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
    borderColor: "border-purple-200",
  },
  BLOCKED: {
    label: "Blocked",
    color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    borderColor: "border-red-200",
  },
  COMPLETED: {
    label: "Completed",
    color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    borderColor: "border-green-200",
  },
  CANCELLED: {
    label: "Cancelled",
    color: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
    borderColor: "border-gray-300",
  },
} as const;

export function TasksBoard({
  projectId,
  onTaskClick,
  onCreateTask,
  onEditTask,
  onDeleteTask,
  onAssignTask,
  onChangePriority,
  onSetDueDate,
  refreshTrigger,
}: TasksBoardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Setup drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    async function fetchTasks() {
      try {
        const response = await fetch(`/api/projects/${projectId}/tasks`);
        if (!response.ok) {
          throw new Error("Failed to fetch tasks");
        }
        const data = await response.json();
        setTasks(data.tasks || []);
      } catch (error) {
        console.error("Error fetching tasks:", error);
        toast.error("Failed to load tasks");
      } finally {
        setLoading(false);
      }
    }

    if (projectId) {
      fetchTasks();
    }
  }, [projectId, refreshTrigger]); // Added refreshTrigger to dependencies

  const getTasksByStatus = (status: Task["status"]) => {
    return tasks
      .filter((task) => task.status === status)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  };

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    // Check if dropping over a column or over another task
    const overIsColumn = Object.keys(STATUS_CONFIG).includes(over.id as string);

    if (overIsColumn) {
      // Dropping over a column - move to that column
      const newStatus = over.id as Task["status"];
      if (task.status === newStatus) return;

      // Optimistic update
      const previousTasks = [...tasks];
      setTasks(
        tasks.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );

      setIsUpdating(true);
      try {
        const response = await fetch(`/api/tasks/${taskId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });

        if (!response.ok) {
          throw new Error("Failed to update task");
        }

        toast.success("Task moved successfully");
      } catch (error) {
        console.error("Error updating task:", error);
        toast.error("Failed to move task");
        // Rollback on error
        setTasks(previousTasks);
      } finally {
        setIsUpdating(false);
      }
    } else {
      // Dropping over another task - reorder within the same column
      const overTask = tasks.find((t) => t.id === over.id);
      if (!overTask || task.status !== overTask.status) return;

      const statusTasks = getTasksByStatus(task.status);
      const oldIndex = statusTasks.findIndex((t) => t.id === taskId);
      const newIndex = statusTasks.findIndex((t) => t.id === over.id);

      if (oldIndex === newIndex) return;

      // Optimistic UI update
      const previousTasks = [...tasks];
      const reorderedTasks = [...statusTasks];
      const [movedTask] = reorderedTasks.splice(oldIndex, 1);
      reorderedTasks.splice(newIndex, 0, movedTask);

      // Update orders
      const updatedStatusTasks = reorderedTasks.map((t, index) => ({
        ...t,
        order: index,
      }));

      const updatedTasks = tasks.map((t) => {
        const updated = updatedStatusTasks.find((ut) => ut.id === t.id);
        return updated || t;
      });

      setTasks(updatedTasks);

      // Update order in database
      setIsUpdating(true);
      try {
        const response = await fetch(`/api/tasks/${taskId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: newIndex }),
        });

        if (!response.ok) throw new Error("Failed to update task order");

        toast.success("Task reordered");
      } catch (error) {
        console.error("Error updating task order:", error);
        toast.error("Failed to reorder task");
        // Rollback on error
        setTasks(previousTasks);
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const handleCreateTask = (status: Task["status"]) => {
    if (onCreateTask) {
      onCreateTask(status);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-4">
        {/* Board Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Tasks Board</h3>
            <p className="text-sm text-muted-foreground">
              {tasks.length} task{tasks.length !== 1 ? "s" : ""} total
              {isUpdating && " • Updating..."}
            </p>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {(
            Object.keys(STATUS_CONFIG) as Array<keyof typeof STATUS_CONFIG>
          ).map((status) => {
            const statusTasks = getTasksByStatus(status);
            const config = STATUS_CONFIG[status];

            return (
              <DroppableColumn key={status} status={status} config={config}>
                {statusTasks.length === 0 ? (
                  <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                    No tasks
                  </div>
                ) : (
                  statusTasks.map((task) => (
                    <DraggableTask
                      key={task.id}
                      task={task}
                      onClick={() => onTaskClick && onTaskClick(task)}
                      onEdit={onEditTask}
                      onDelete={onDeleteTask}
                      onAssign={onAssignTask}
                      onChangePriority={onChangePriority}
                      onSetDueDate={onSetDueDate}
                    />
                  ))
                )}

                {/* Add Task Button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-3"
                  onClick={() => handleCreateTask(status)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Task
                </Button>
              </DroppableColumn>
            );
          })}
        </div>

        {/* Empty State */}
        {tasks.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <Plus className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Tasks Yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Get started by creating your first task
              </p>
              <Button onClick={() => handleCreateTask("TODO")}>
                <Plus className="mr-2 h-4 w-4" />
                Create First Task
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Drag Overlay */}
        <DragOverlay>
          {activeTask && (
            <div className="rotate-3 opacity-90">
              <TaskCard task={activeTask} />
            </div>
          )}
        </DragOverlay>
      </div>
    </DndContext>
  );
}

// Droppable Column Component
interface DroppableColumnProps {
  status: Task["status"];
  config: (typeof STATUS_CONFIG)[keyof typeof STATUS_CONFIG];
  children: React.ReactNode;
}

function DroppableColumn({ status, config, children }: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  return (
    <div ref={setNodeRef} className="flex flex-col gap-3">
      {/* Column Header */}
      <Card
        className={`border-t-4 ${config.borderColor} ${
          isOver ? "ring-2 ring-primary" : ""
        }`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">
              {config.label}
            </CardTitle>
            <Badge variant="secondary" className="text-xs">
              {/* Count will be shown via children */}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Tasks List */}
      <div className="flex flex-col gap-3 min-h-[200px]">{children}</div>
    </div>
  );
}

// Draggable Task Component
interface DraggableTaskProps {
  task: Task;
  onClick?: () => void;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  onAssign?: (task: Task) => void;
  onChangePriority?: (task: Task) => void;
  onSetDueDate?: (task: Task) => void;
}

function DraggableTask({
  task,
  onClick,
  onEdit,
  onDelete,
  onAssign,
  onChangePriority,
  onSetDueDate,
}: DraggableTaskProps) {
  const {
    attributes,
    listeners,
    setNodeRef: setDraggableRef,
    transform,
    isDragging,
  } = useDraggable({
    id: task.id,
  });

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: task.id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={(node) => {
        setDraggableRef(node);
        setDroppableRef(node);
      }}
      style={style}
      {...listeners}
      {...attributes}
      className={`${isDragging ? "opacity-50" : ""} ${
        isOver ? "ring-2 ring-primary rounded-lg" : ""
      }`}
    >
      <div className="cursor-grab active:cursor-grabbing">
        <TaskCard
          task={task}
          onClick={onClick}
          showStatus={true}
          onEdit={onEdit}
          onDelete={onDelete}
          onAssign={onAssign}
          onChangePriority={onChangePriority}
          onSetDueDate={onSetDueDate}
        />
      </div>
    </div>
  );
}

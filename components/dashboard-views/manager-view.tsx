interface ManagerViewProps {
  userName?: string | null;
}

export function ManagerView({ userName }: ManagerViewProps) {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">
        You are a Manager, welcome {userName || "Guest"}!
      </h1>
      <p className="text-muted-foreground">
        You can manage teams, oversee operations, and access management reports.
      </p>
    </div>
  );
}

interface StaffViewProps {
  userName?: string | null;
}

export function StaffView({ userName }: StaffViewProps) {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">
        You are a Staff member, welcome {userName || "Guest"}!
      </h1>
      <p className="text-muted-foreground">
        Access your daily tasks, customer interactions, and work assignments.
      </p>
    </div>
  );
}

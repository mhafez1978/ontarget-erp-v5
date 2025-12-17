import { SessionManager } from "@/components/session-manager";
import { validateSession } from "@/lib/session-manager";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function SessionsPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("sessionToken")?.value;

  if (!sessionToken) {
    redirect("/login");
  }

  const validation = await validateSession(sessionToken);

  if (!validation.valid || !validation.user) {
    redirect("/login");
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Session Management</h1>
        <p className="text-muted-foreground">
          Manage your active sessions and monitor login activity across all
          devices.
        </p>
      </div>

      <SessionManager userRole={validation.user.role} />
    </div>
  );
}

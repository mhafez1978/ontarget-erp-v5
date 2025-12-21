"use client";


import { Folder } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { HierarchicalFileExplorer } from "@/components/hierarchical-file-explorer";
;

export default function FilesPage() {
  const router = useRouter();
  const [user, setUser] = useState({
    name: null as string | null,
    email: null as string | null,
    image: null as string | null,
    role: "GUEST",
    plan: "ESSENTIAL",
    companyId: null as string | null,
  });

  const [companies, setCompanies] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [companyId, setCompanyId] = useState<string>("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const meRes = await fetch("/api/auth/me");
        const me = await meRes.json();
        if (!me?.authenticated || me?.user?.role === "GUEST") {
          router.push("/");
          return;
        }

        const u = {
          name: me.user.name,
          email: me.user.email,
          image: me.user.image,
          role: me.user.role,
          plan: me.user.plan || "ESSENTIAL",
          companyId: me.user.companyId || null,
        };
        setUser(u);

        if (u.role === "ADMIN" || u.role === "SUPER_ADMIN") {
          const cRes = await fetch("/api/companies");
          const cData = await cRes.json();
          const list: Array<{ id: string; name: string }> =
            cData.companies || [];
          setCompanies(list);
          setCompanyId(list[0]?.id || u.companyId || "");
        } else {
          setCompanyId(u.companyId || "");
        }
      } catch (e) {
        console.error("Failed to initialize files page", e);
        router.push("/");
      } finally {
        setReady(true);
      }
    };
    init();
  }, [router]);

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Folder className="h-6 w-6" /> Files
            </h1>
            <p className="text-muted-foreground">
              Browse and manage company files
            </p>
          </div>
        </div>

        {!ready ? (
          <div className="text-center py-12 text-muted-foreground">
            Loading…
          </div>
        ) : !companyId ? (
          <div className="text-center py-12 text-muted-foreground">
            No company selected
          </div>
        ) : (
          <HierarchicalFileExplorer
            companyId={companyId}
            companies={companies.length > 0 ? companies : undefined}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

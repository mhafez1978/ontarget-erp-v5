"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";

export default function JobDetailPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params?.jobId as string;

  const [user, setUser] = useState<any>(null);
  const [job, setJob] = useState<any | null>(null);

  useEffect(() => {
    const load = async () => {
      const me = await fetch("/api/auth/me");
      const meData = await me.json();
      if (!meData.authenticated) return router.push("/");
      if (meData.user.role !== "SUPER_ADMIN") return router.push("/dashboard");
      setUser(meData.user);

      const res = await fetch(`/api/frontstore/v6/video-job/${jobId}`);
      const data = await res.json();
      if (data.job) setJob(data.job);
    };
    load();
  }, [jobId, router]);

  return (
    <DashboardLayout user={user || {}}>
      <div className="p-4">
        <h1 className="text-2xl font-bold">Job Details</h1>
        {!job ? (
          <div className="mt-6">Loading...</div>
        ) : (
          <div className="mt-6 rounded-lg border p-4 bg-muted/10">
            <div className="font-mono text-sm">ID: {job.id}</div>
            <div className="mt-2">Status: {job.status}</div>
            <div>Provider: {job.provider || "-"}</div>
            <div>
              Result:{" "}
              {job.resultUrl ? (
                <a href={job.resultUrl} className="text-primary">
                  View
                </a>
              ) : (
                "-"
              )}
            </div>

            <h3 className="mt-4 font-semibold">Logs</h3>
            <div className="mt-2 bg-background rounded p-3">
              {job.logs?.length ? (
                job.logs.map((l: any) => (
                  <div key={l.id} className="text-sm font-mono text-xs">
                    [{new Date(l.createdAt).toLocaleString()}] {l.level}:{" "}
                    {l.message}
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">No logs yet</div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

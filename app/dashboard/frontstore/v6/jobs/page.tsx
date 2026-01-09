"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useRouter } from "next/navigation";

export default function JobsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const check = async () => {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (!data.authenticated) return router.push("/");
      setUser(data.user);
      if (data.user.role !== "SUPER_ADMIN") return router.push("/dashboard");

      // Fetch jobs
      const jobsRes = await fetch("/api/frontstore/v6/video-jobs");
      const jobsData = await jobsRes.json();
      setJobs(jobsData.jobs || []);
      setLoading(false);
    };
    check();
  }, [router]);

  return (
    <DashboardLayout user={user || {}}>
      <div className="p-4">
        <h1 className="text-2xl font-bold">Video Generation Jobs</h1>
        <p className="text-sm text-muted-foreground">
          Monitor queued and processed video jobs.
        </p>

        {loading ? (
          <div className="mt-6">Loading…</div>
        ) : (
          <div className="mt-6 rounded-lg border overflow-hidden">
            <table className="min-w-full divide-y">
              <thead className="bg-muted/20">
                <tr>
                  <th className="px-4 py-2 text-left">ID</th>
                  <th className="px-4 py-2 text-left">Company</th>
                  <th className="px-4 py-2 text-left">Section</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Provider</th>
                  <th className="px-4 py-2 text-left">Created</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody className="bg-background">
                {jobs.map((job) => (
                  <tr key={job.id} className="border-t">
                    <td className="px-4 py-2 text-xs font-mono">{job.id}</td>
                    <td className="px-4 py-2">{job.companyId}</td>
                    <td className="px-4 py-2">{job.sectionId}</td>
                    <td className="px-4 py-2">{job.status}</td>
                    <td className="px-4 py-2">{job.provider || "-"}</td>
                    <td className="px-4 py-2 text-sm">
                      {new Date(job.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <a
                        className="text-primary hover:underline"
                        href={`/dashboard/frontstore/v6/jobs/${job.id}`}
                      >
                        View
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

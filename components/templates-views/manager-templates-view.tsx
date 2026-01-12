"use client";

import { Mail } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ManagerTemplatesView() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Mail className="h-8 w-8" />
          Email Templates
        </h1>
        <p className="dark:text-gray-200 mt-2">
          View email templates used by your company
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Read-Only Access</CardTitle>
          <CardDescription>
            Managers can view email templates but cannot edit them
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="dark:text-gray-200">
            Email template management is available to Administrators only.
            Contact your admin if you need changes to email templates.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

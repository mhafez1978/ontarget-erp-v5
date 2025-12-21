"use client";


import { Mail, Send } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

;
import SuperAdminTemplatesView from "@/components/templates-views/super-admin-templates-view";
import EmailCustomersTab from "@/components/hub-views/email-customers-tab";

interface BusinessHubViewProps {
  role: string;
  userId: string;
}

export default function BusinessHubView({
  role,
  userId,
}: BusinessHubViewProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Mail className="h-8 w-8" />
          Business Hub
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage templates and send emails to your team
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="templates" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="templates" className="gap-2">
            <Mail className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="email" className="gap-2">
            <Send className="h-4 w-4" />
            Email Staff
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="mt-6">
          <SuperAdminTemplatesView />
        </TabsContent>

        <TabsContent value="email" className="mt-6">
          <EmailCustomersTab userRole={role} userId={userId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

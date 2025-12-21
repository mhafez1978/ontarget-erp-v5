import { ScrollText } from "lucide-react";
import { AuditLog } from "@/components/audit-log";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
;
import { ClockInOutWidget } from "@/components/clock-in-out-widget";

interface AdminViewProps {
  userName?: string | null;
  companyId?: string | null;
}

export function AdminView({ userName, companyId }: AdminViewProps) {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">
        You are an Admin, welcome {userName || "Guest"}!
      </h1>
      <p className="text-muted-foreground">
        You have administrative access to manage users, settings, and business
        operations.
      </p>

      {companyId && (
        <div className="max-w-md">
          <ClockInOutWidget companyId={companyId} />
        </div>
      )}

      {/* Audit Logs Display in Accordion */}
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="audit-logs">
          <AccordionTrigger className="text-lg font-semibold">
            <div className="flex items-center gap-2">
              <ScrollText className="h-5 w-5" />
              Company Activity Logs
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <AuditLog />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

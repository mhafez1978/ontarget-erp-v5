// "use client";

// import { ScrollText } from "lucide-react";
// import { AuditLogClientStatic } from "@/components/audit-log-client-static";
// import {
//   Accordion,
//   AccordionContent,
//   AccordionItem,
//   AccordionTrigger,
// } from "@/components/ui/accordion";
// import { ClockInOutWidget } from "@/components/clock-in-out-widget";
// import { StaffStatsWidget } from "@/components/staff-stats-widget";
// import { StaffStatusWidget } from "@/components/staff-status-widget";
// import { useEffect, useState } from "react";
// import { Prisma } from "../generated/prisma/client";

// interface AdminViewProps {
//   userName?: string | null;
//   companyId?: string | null;
// }

// type Company = Pick<Prisma.CompanyGetPayload<true>, "id" | "name"> & {
//   role: string;
// };

// export function AdminView({ userName, companyId }: AdminViewProps) {
//   const [companies, setCompanies] = useState<Company[]>([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchUserCompanies = async () => {
//       try {
//         const response = await fetch("/api/companies/user-companies");
//         const data = await response.json();

//         if (data.success) {
//           // Filter to only companies where user is ADMIN_OWNER
//           const adminCompanies = data.companies.filter(
//             (c: Company) => c.role === "ADMIN_OWNER"
//           );
//           setCompanies(adminCompanies);
//         }
//       } catch (error) {
//         console.error("Failed to fetch user companies:", error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchUserCompanies();
//   }, []);
//   return (
//     <div className="space-y-6">
//       <h1 className="text-3xl font-bold tracking-tight">
//         {`Welcome ${userName || "Howdy, Stranger !"}`}
//       </h1>

//       {/* Show widgets for primary company */}
//       {companyId && (
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl">
//           <ClockInOutWidget companyId={companyId} />
//           <StaffStatsWidget companyId={companyId} />
//           {!loading && companies.length > 0 && (
//            {companies.map((company, index) => {
//                   const colors: Array<
//                     "red" | "purple" | "indigo" | "teal" | "amber" | "pink"
//                   > = ["red", "purple", "indigo", "teal", "amber", "pink"];
//                   const colorVariant = colors[index % colors.length];

//                   return (
//                     <StaffStatusWidget
//                       key={company.id}
//                       companyId={company.id}
//                       companyName={company.name}
//                       colorVariant={colorVariant}
//                     />
//                   );
//                 })}
//           )}
//         </div>
//       )}

//       {/* Staff Status Widgets - one per company if user is admin of multiple companies */}

//       {/* Audit Logs Display in Accordion */}
//       <Accordion
//         type="single"
//         collapsible
//         defaultValue="audit-logs"
//         className="w-full"
//       >
//         <AccordionItem value="audit-logs">
//           <AccordionTrigger className="text-lg font-semibold">
//             <div className="flex items-center gap-2">
//               <ScrollText className="h-5 w-5" />
//               Company Activity Logs
//             </div>
//           </AccordionTrigger>
//           <AccordionContent>
//             <AuditLogClientStatic showRefreshButton={true} />
//           </AccordionContent>
//         </AccordionItem>
//       </Accordion>
//     </div>
//   );
// }

"use client";

import { ScrollText } from "lucide-react";
import { AuditLogClientStatic } from "@/components/audit-log-client-static";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ClockInOutWidget } from "@/components/clock-in-out-widget";
import { StaffStatsWidget } from "@/components/staff-stats-widget";
import { StaffStatusWidget } from "@/components/staff-status-widget";
import { useEffect, useState } from "react";

interface AdminViewProps {
  userName?: string | null;
  companyId?: string | null;
}

// Simplified interface for client-side use
interface Company {
  id: string;
  name: string;
  role: string;
}

export function AdminView({ userName, companyId }: AdminViewProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserCompanies = async () => {
      try {
        const response = await fetch("/api/companies/user-companies");
        const data = await response.json();

        if (data.success) {
          // Filter to only companies where user is ADMIN_OWNER
          const adminCompanies = data.companies.filter(
            (c: Company) => c.role === "ADMIN_OWNER"
          );
          setCompanies(adminCompanies);
        }
      } catch (error) {
        console.error("Failed to fetch user companies:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserCompanies();
  }, []);

  const statusColors = [
    "red",
    "purple",
    "indigo",
    "teal",
    "amber",
    "pink",
  ] as const;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">
        {`Welcome ${userName || "Howdy, Stranger !"}`}
      </h1>

      {/* Show widgets for primary company */}
      {companyId && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ClockInOutWidget companyId={companyId} />
          <StaffStatsWidget companyId={companyId} />

          {/* FIXED: Removed extra curly braces and added Fragment support */}
          {!loading && companies.length > 0 && (
            <>
              {companies.map((company, index) => {
                const colorVariant = statusColors[index % statusColors.length];

                return (
                  <StaffStatusWidget
                    key={company.id}
                    companyId={company.id}
                    companyName={company.name}
                    colorVariant={colorVariant}
                  />
                );
              })}
            </>
          )}
        </div>
      )}

      {/* Audit Logs Display in Accordion */}
      <Accordion
        type="single"
        collapsible
        defaultValue="audit-logs"
        className="w-full"
      >
        <AccordionItem value="audit-logs">
          <AccordionTrigger className="text-lg font-semibold">
            <div className="flex items-center gap-2">
              <ScrollText className="h-5 w-5" />
              Company Activity Logs
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <AuditLogClientStatic showRefreshButton={true} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

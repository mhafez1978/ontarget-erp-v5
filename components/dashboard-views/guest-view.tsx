import { MapPin } from "lucide-react";
import { GeoTrackingDisplay } from "@/components/geo-tracking-display";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
;

interface GuestViewProps {
  userName?: string | null;
}

export function GuestView({ userName }: GuestViewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          You are a Guest, welcome {userName || "Guest"}!
        </h1>
        <p className="text-muted-foreground">
          You have limited access. Please contact an administrator to upgrade
          your account.
        </p>
      </div>

      {/* Accordion with Geo Tracking */}
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="geo-tracking">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Visitor & User Tracking
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="pt-4">
              <GeoTrackingDisplay />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

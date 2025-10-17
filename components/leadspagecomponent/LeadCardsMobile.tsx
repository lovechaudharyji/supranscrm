"use client";

import LeadActions from "./LeadActions";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface LeadCardsMobileProps {
  data: any[];
  onEdit: (lead: any) => void;
  fetchLeads: () => void;
}

export default function LeadCardsMobile({
  data,
  onEdit,
  fetchLeads,
}: LeadCardsMobileProps) {
  if (!data.length)
    return (
      <p className="text-center text-muted-foreground py-8">No leads found</p>
    );

  return (
    <div className="space-y-3">
      {data.map((lead: any) => (
        <div
          key={lead.whalesync_postgres_id}
          className="border border-border rounded-lg bg-card shadow-sm overflow-hidden"
        >
          {/* Header with Avatar and Name */}
          <div className="bg-muted/50 px-4 py-3 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  {lead.profile_photo ? (
                    <AvatarImage src={lead.profile_photo} alt={lead.name} />
                  ) : (
                    <AvatarFallback className="bg-muted text-muted-foreground font-semibold">
                      {lead.name?.charAt(0)?.toUpperCase() || "?"}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <p className="font-semibold text-foreground">{lead.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(lead.date_and_time).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric"
                    })}
                  </p>
                </div>
              </div>
              <LeadActions lead={lead} onEdit={onEdit} fetchLeads={fetchLeads} />
            </div>
          </div>

          {/* Content */}
          <div className="p-4 space-y-2">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Mobile</p>
                <p className="font-medium">{lead.mobile || "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">City</p>
                <p className="font-medium">{lead.city || "-"}</p>
              </div>
            </div>

            <div>
              <p className="text-muted-foreground text-xs">Email</p>
              <p className="font-medium text-sm truncate">{lead.email || "-"}</p>
            </div>

            <div>
              <p className="text-muted-foreground text-xs mb-1">Service</p>
              {lead.services && (
                <Badge variant="outline" className="text-xs">
                  {lead.services}
                </Badge>
              )}
            </div>

            <div>
              <p className="text-muted-foreground text-xs">Assigned To</p>
              <div className="flex items-center gap-2 mt-1">
                {lead.assigned_to?.profile_photo && (
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={lead.assigned_to.profile_photo} alt={lead.assigned_to.full_name} />
                  </Avatar>
                )}
                <p className="font-medium text-sm">
                  {lead.assigned_to?.full_name || "Unassigned"}
                </p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}


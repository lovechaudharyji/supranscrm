"use client";

import { Button } from "@/components/ui/button";
import { Edit, Eye, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function LeadActions({
  lead,
  onEdit,
  fetchLeads,
}: {
  lead: any;
  onEdit: (lead: any) => void;
  fetchLeads: () => void;
}) {
  const router = useRouter();

  const handleDelete = async () => {
    const confirmDelete = confirm("Are you sure you want to delete this lead?");
    if (!confirmDelete) return;

    await supabase
      .from("Leads")
      .delete()
      .eq("whalesync_postgres_id", lead.whalesync_postgres_id);

    fetchLeads();
  };

  return (
    <div className="flex items-center gap-1">
      <TooltipProvider delayDuration={150}>
        {/* ✏️ Edit */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(lead);
              }}
              data-action="edit"
              className="h-7 w-7 hover:bg-muted"
            >
              <Edit className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            Edit
          </TooltipContent>
        </Tooltip>

        {/* 🗑 Delete */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
              data-action="delete"
              className="h-7 w-7 hover:bg-muted hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            Delete
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}


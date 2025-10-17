"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectValue,
  SelectItem,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabaseClient";
import type { Lead, Employee } from "./assign-dialog";

interface ReassignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leads: Lead[];
  employees: Employee[];
  reload: () => Promise<void>;
}

export function ReassignDialog({
  open,
  onOpenChange,
  leads,
  employees,
  reload,
}: ReassignDialogProps) {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const assigned = leads.filter((l) => l.assigned_to);

  const reassign = async (leadId: string, empId: string) => {
    setLoading(true);
    try {
      await supabase
        .from("Leads")
        .update({ assigned_to: empId })
        .eq("whalesync_postgres_id", leadId);
      await reload();
    } finally {
      setLoading(false);
    }
  };

  // ✅ Helper: find employee name from assigned_to UUID
  const getEmployeeName = (assigned_to: any) => {
    if (!assigned_to) return "Unassigned";
    // If Supabase relation is expanded, it might already be an object
    if (typeof assigned_to === "object" && assigned_to.full_name) {
      return assigned_to.full_name;
    }
    // Otherwise, find by UUID in employees array
    const emp = employees.find((e) => e.whalesync_postgres_id === assigned_to);
    return emp ? emp.full_name || "Unknown" : "Unknown";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Re-assign Lead</DialogTitle>
        </DialogHeader>
        {assigned.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No assigned leads found.
          </div>
        ) : (
          <>
            <Input
              placeholder="Search lead..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mb-4"
            />
            <div className="max-h-[350px] overflow-y-auto space-y-2">
              {assigned
                .filter((l) =>
                  (l.name || "").toLowerCase().includes(search.toLowerCase())
                )
                .map((lead) => (
                  <div
                    key={lead.whalesync_postgres_id}
                    className="flex justify-between items-center p-3 rounded hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium">{lead.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Assigned to:{" "}
                        <span className="font-medium">
                          {getEmployeeName(lead.assigned_to)}
                        </span>
                      </p>
                    </div>
                    <Select
                      onValueChange={(v) =>
                        reassign(lead.whalesync_postgres_id, v)
                      }
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Reassign to..." />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map((e) => (
                          <SelectItem
                            key={e.whalesync_postgres_id}
                            value={e.whalesync_postgres_id}
                          >
                            {e.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
            </div>
            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}


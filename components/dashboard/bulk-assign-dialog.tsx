"use client";

import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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

interface BulkAssignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leads: Lead[];
  employees: Employee[];
  reload: () => Promise<void>;
}

export function BulkAssignDialog({
  open,
  onOpenChange,
  leads,
  employees,
  reload,
}: BulkAssignDialogProps) {
  const unassigned = leads.filter((l) => !l.assigned_to);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [employee, setEmployee] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [serviceFilter, setServiceFilter] = useState<string>("All");

  // Get unique services for dropdown
  const services = useMemo(() => {
    const unique = Array.from(
      new Set(
        unassigned
          .map((lead) => lead.services || "")
          .filter((s) => s.trim() !== "")
      )
    );
    return ["All", ...unique];
  }, [unassigned]);

  // Filter employees to show only sales personnel
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => 
      emp.job_title?.toLowerCase().includes('sales') || 
      emp.job_title?.toLowerCase().includes('rep') ||
      emp.job_title?.toLowerCase().includes('manager') ||
      emp.full_name?.toLowerCase().includes('sales') || 
      emp.full_name?.toLowerCase().includes('rep') ||
      emp.full_name?.toLowerCase().includes('manager')
    );
  }, [employees]);

  // Filter leads by service + search
  const filteredLeads = useMemo(() => {
    return unassigned.filter((lead) => {
      const matchesSearch =
        (lead.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (lead.services || "").toLowerCase().includes(search.toLowerCase());
      const matchesService =
        serviceFilter === "All" || lead.services === serviceFilter;
      return matchesSearch && matchesService;
    });
  }, [unassigned, search, serviceFilter]);

  const toggleLead = (id: string) => {
    const copy = new Set(selected);
    copy.has(id) ? copy.delete(id) : copy.add(id);
    setSelected(copy);
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelected(
        new Set(filteredLeads.map((l) => l.whalesync_postgres_id))
      );
    } else {
      setSelected(new Set());
    }
  };

  const assignBulk = async () => {
    if (!employee || selected.size === 0) return;
    setLoading(true);
    try {
      for (const id of selected) {
        await supabase
          .from("Leads")
          .update({ assigned_to: employee })
          .eq("whalesync_postgres_id", id);
      }
      onOpenChange(false);
      await reload();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk Assign Leads</DialogTitle>
        </DialogHeader>
        {unassigned.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No unassigned leads.
          </p>
        ) : (
          <>
            {/* Assign Employee */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <label className="font-medium text-sm">Assign to:</label>
              <Select
                onValueChange={(v) => setEmployee(v)}
                value={employee || ""}
              >
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Select Sales Person" />
                </SelectTrigger>
                <SelectContent>
                  {filteredEmployees.map((e) => (
                    <SelectItem
                      key={e.whalesync_postgres_id}
                      value={e.whalesync_postgres_id}
                    >
                      {e.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <span className="text-sm text-muted-foreground ml-auto">
                {selected.size} selected
              </span>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-3">
              <Input
                placeholder="Search by name or service..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1"
              />
              <Select value={serviceFilter} onValueChange={setServiceFilter}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Filter by service" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Leads List */}
            <div className="max-h-[360px] overflow-y-auto border rounded-md p-2 space-y-2">
              {filteredLeads.length === 0 ? (
                <p className="text-center text-muted-foreground py-4 text-sm">
                  No leads match your filters.
                </p>
              ) : (
                <>
                  {/* Select All */}
                  <div className="flex items-center gap-2 border-b pb-2 mb-2">
                    <Checkbox
                      checked={
                        filteredLeads.length > 0 &&
                        selected.size === filteredLeads.length
                      }
                      onCheckedChange={(val) => toggleSelectAll(!!val)}
                    />
                    <span className="text-sm font-medium">Select All</span>
                  </div>

                  {/* List */}
                  {filteredLeads.map((lead) => (
                    <div
                      key={lead.whalesync_postgres_id}
                      className="flex justify-between items-center p-2 rounded hover:bg-muted/50 transition-colors"
                    >
                      <div>
                        <div className="font-medium text-sm">
                          {lead.name || "Unnamed Lead"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {lead.services || "No Service"}
                        </div>
                      </div>
                      <Checkbox
                        checked={selected.has(lead.whalesync_postgres_id)}
                        onCheckedChange={() =>
                          toggleLead(lead.whalesync_postgres_id)
                        }
                      />
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* Buttons */}
            <div className="flex justify-end mt-4 gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={assignBulk}
                disabled={loading || !employee || selected.size === 0}
              >
                {loading ? "Assigning..." : `Assign (${selected.size})`}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}


"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { supabase } from "@/lib/supabaseClient";

export interface Lead {
  whalesync_postgres_id: string;
  name: string | null;
  stage: string | null;
  deal_amount: number | null;
  date_and_time: string | null;
  services: string | null;
  source: string | null;
  assigned_to?: string | null | { full_name?: string | null } | null;
  follow_up_day?: string | null;
}

export interface Employee {
  whalesync_postgres_id: string;
  full_name: string | null;
  job_title?: string | null;
  employment_type?: string | null;
  department?: {
    department_name?: string | null;
  } | null;
}

interface AssignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leads: Lead[];
  employees: Employee[];
  reload: () => Promise<void>;
}

export function AssignDialog({
  open,
  onOpenChange,
  leads,
  employees,
  reload,
}: AssignDialogProps) {
  const [assignQueue, setAssignQueue] = useState<Lead[]>([]);
  const [assignIndex, setAssignIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');

  React.useEffect(() => {
    if (open) {
      const unassigned = leads
        .filter((l) => !l.assigned_to)
        .sort((a, b) => {
          const da = a.date_and_time
            ? new Date(a.date_and_time).getTime()
            : 0;
          const db = b.date_and_time
            ? new Date(b.date_and_time).getTime()
            : 0;
          return da - db;
        });
      setAssignQueue(unassigned);
      setAssignIndex(0);
    }
  }, [open, leads]);

  const assignLead = async (leadId: string, empId: string) => {
    setLoading(true);
    try {
      await supabase
        .from("Leads")
        .update({ assigned_to: empId })
        .eq("whalesync_postgres_id", leadId);

      const newQueue = assignQueue.filter(
        (l) => l.whalesync_postgres_id !== leadId
      );
      setAssignQueue(newQueue);

      if (newQueue.length === 0) {
        onOpenChange(false);
        await reload();
      }
    } finally {
      setLoading(false);
    }
  };

  const skipLead = () => {
    if (assignIndex + 1 < assignQueue.length) setAssignIndex(assignIndex + 1);
    else onOpenChange(false);
  };

  const currentLead = assignQueue[assignIndex];

  // Filter employees based on selected filter type
  const getFilteredEmployees = () => {
    if (filterType === 'all') {
      return employees;
    }
    
    return employees.filter(emp => {
      const jobTitle = emp.job_title?.toLowerCase() || '';
      const department = emp.department?.department_name?.toLowerCase() || '';
      const employmentType = emp.employment_type?.toLowerCase() || '';
      
      if (filterType === 'sales') {
        return jobTitle.includes('sales') || 
               jobTitle.includes('marketing') || 
               department.includes('sales') || 
               department.includes('marketing') ||
               employmentType.includes('sales');
      }
      
      if (filterType === 'operations') {
        return jobTitle.includes('operation') || 
               jobTitle.includes('admin') || 
               jobTitle.includes('manager') ||
               department.includes('operation') || 
               department.includes('admin') ||
               employmentType.includes('operation');
      }
      
      if (filterType === 'sales_operations') {
        return (jobTitle.includes('sales') || 
                jobTitle.includes('marketing') || 
                department.includes('sales') || 
                department.includes('marketing') ||
                employmentType.includes('sales')) ||
               (jobTitle.includes('operation') || 
                jobTitle.includes('admin') || 
                jobTitle.includes('manager') ||
                department.includes('operation') || 
                department.includes('admin') ||
                employmentType.includes('operation'));
      }
      
      return true;
    });
  };

  const filteredEmployees = getFilteredEmployees();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Assign Leads Queue</DialogTitle>
        </DialogHeader>
        {assignQueue.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No unassigned leads found.
          </div>
        ) : (
          <>
            <div className="border rounded-lg p-4 bg-muted/50">
              <p className="text-sm text-muted-foreground">
                Lead {assignIndex + 1} of {assignQueue.length}
              </p>
              <h3 className="text-xl font-bold mt-2">
                {currentLead?.name || "Unnamed Lead"}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Service: {currentLead?.services || "-"}
              </p>
            </div>
            
            {/* Filter Dropdown */}
            <div className="mt-4">
              <label className="text-sm font-medium mb-2 block">Filter Assignees:</label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select filter type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees ({employees.length})</SelectItem>
                  <SelectItem value="sales">Sales Personnel</SelectItem>
                  <SelectItem value="operations">Operations Personnel</SelectItem>
                  <SelectItem value="sales_operations">Sales & Operations ({filteredEmployees.length})</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4">
              {filteredEmployees.length === 0 ? (
                <div className="col-span-full text-center py-4 text-muted-foreground">
                  No employees found for the selected filter.
                </div>
              ) : (
                filteredEmployees.map((emp) => (
                  <Button
                    key={emp.whalesync_postgres_id}
                    onClick={() =>
                      assignLead(
                        currentLead!.whalesync_postgres_id,
                        emp.whalesync_postgres_id
                      )
                    }
                    disabled={loading}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    {emp.full_name}
                  </Button>
                ))
              )}
            </div>
            <div className="flex justify-between mt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button onClick={skipLead} variant="secondary">
                Skip
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}


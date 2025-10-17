"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface EmployeeFields {
  whalesync_postgres_id: string;
  full_name: string;
  job_title?: string;
}

interface LeadFields {
  whalesync_postgres_id: string;
  services?: string;
  assigned_to?: string;
  [key: string]: any;
}

interface SavedConfig {
  [serviceName: string]: string[];
}

const AutoAssignmentPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [services, setServices] = useState<string[]>([]);
  const [employees, setEmployees] = useState<EmployeeFields[]>([]);
  const [config, setConfig] = useState<SavedConfig>({});
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string>("Save Today's Configuration");
  const [isAssigning, setIsAssigning] = useState<boolean>(false);
  const [assignmentLog, setAssignmentLog] = useState<React.ReactNode>('');

  const todayKey = 'service_mapping_' + new Date().toISOString().slice(0, 10);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Fetch leads to get unique services
        const { data: leadsData, error: leadsError } = await supabase
          .from('Leads')
          .select('services')
          .not('services', 'is', null);

        if (leadsError) throw leadsError;

        // Extract unique services
        const serviceSet = new Set<string>();
        leadsData?.forEach(lead => {
          if (lead.services) {
            serviceSet.add(lead.services);
          }
        });

        // Fetch employees from Sales Team - only sales people
        const { data: employeeData, error: employeeError } = await supabase
          .from('Employee Directory')
          .select('whalesync_postgres_id, full_name, job_title')
          .eq('status', 'Active')
          .ilike('job_title', '%Sales%')
          .order('full_name');

        if (employeeError) throw employeeError;

        setServices(Array.from(serviceSet).sort());
        setEmployees(employeeData || []);

        // Load saved configuration from localStorage
        const savedConfigJSON = localStorage.getItem(todayKey);
        setConfig(savedConfigJSON ? JSON.parse(savedConfigJSON) : {});
      } catch (err: any) {
        setError(`Failed to load component: ${err.message}. Please check your database connection.`);
        toast.error(`Error: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, [todayKey]);

  const handleCheckboxChange = useCallback((serviceName: string, employeeId: string) => {
    setConfig(prevConfig => {
      const currentSelection = prevConfig[serviceName] || [];
      const newSelection = currentSelection.includes(employeeId)
        ? currentSelection.filter(id => id !== employeeId)
        : [...currentSelection, employeeId];
      return { ...prevConfig, [serviceName]: newSelection };
    });
  }, []);

  const handleSaveConfig = useCallback(() => {
    setIsSaving(true);
    setSaveMessage('Saving...');
    try {
      localStorage.setItem(todayKey, JSON.stringify(config));
      setSaveMessage('Saved!');
      toast.success('Configuration saved successfully!');
      setTimeout(() => {
        setSaveMessage("Save Today's Configuration");
        setIsSaving(false);
      }, 2000);
    } catch (error: any) {
      setAssignmentLog(<p className="text-red-600">Error saving configuration: {error.message}</p>);
      toast.error(`Error: ${error.message}`);
      setSaveMessage("Save Today's Configuration");
      setIsSaving(false);
    }
  }, [config, todayKey]);

  const handleClearConfig = useCallback(() => {
    localStorage.removeItem(todayKey);
    setConfig({});
    toast.info('Configuration cleared');
  }, [todayKey]);

  const handleRunAssignment = useCallback(async () => {
    setIsAssigning(true);
    setAssignmentLog(
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <p>Processing...</p>
      </div>
    );

    try {
      const savedConfigJSON = localStorage.getItem(todayKey);
      if (!savedConfigJSON) {
        throw new Error("Today's assignment configuration has not been saved yet.");
      }
      const assignmentRules: SavedConfig = JSON.parse(savedConfigJSON);

      // Fetch unassigned leads
      const { data: allLeads, error: leadsError } = await supabase
        .from('Leads')
        .select('whalesync_postgres_id, services, assigned_to')
        .or('assigned_to.is.null,assigned_to.eq.');

      if (leadsError) throw leadsError;

      const unassignedLeads = allLeads?.filter(lead =>
        !lead.assigned_to || lead.assigned_to === ''
      ) || [];

      if (unassignedLeads.length === 0) {
        setAssignmentLog('No unassigned leads to process.');
        toast.info('No unassigned leads found');
        setIsAssigning(false);
        return;
      }

      // Initialize round-robin counters
      const roundRobinCounters: { [key: string]: number } = {};
      Object.keys(assignmentRules).forEach(serviceName => {
        roundRobinCounters[serviceName] = 0;
      });

      // Prepare updates
      const updates: { id: string; assigned_to: string }[] = [];
      let assignedCount = 0;

      unassignedLeads.forEach(lead => {
        const leadService = lead.services;
        if (!leadService) return;

        const serviceName = leadService;
        const employeesForService = assignmentRules[serviceName];

        if (employeesForService && employeesForService.length > 0) {
          const counter = roundRobinCounters[serviceName] || 0;
          const employeeToAssignId = employeesForService[counter];
          updates.push({
            id: lead.whalesync_postgres_id,
            assigned_to: employeeToAssignId
          });
          assignedCount++;
          roundRobinCounters[serviceName] = (counter + 1) % employeesForService.length;
        }
      });

      // Execute updates in batches
      if (updates.length > 0) {
        for (let i = 0; i < updates.length; i += 10) {
          const batch = updates.slice(i, i + 10);
          
          for (const update of batch) {
            const { error: updateError } = await supabase
              .from('Leads')
              .update({ assigned_to: update.assigned_to })
              .eq('whalesync_postgres_id', update.id);

            if (updateError) {
              console.error('Error updating lead:', update.id, updateError);
            }
          }
        }
      }

      setAssignmentLog(`Success! ${assignedCount} leads have been assigned.`);
      toast.success(`${assignedCount} leads assigned successfully!`);
    } catch (err: any) {
      setAssignmentLog(<p className="text-red-600">Error: {err.message}</p>);
      toast.error(`Error: ${err.message}`);
    } finally {
      setIsAssigning(false);
    }
  }, [todayKey]);

  if (isLoading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex flex-col h-screen">
            <SiteHeader />
            <div className="flex items-center justify-center flex-1">
              <div className="text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Loading configuration...</p>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (error) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex flex-col h-screen">
            <SiteHeader />
            <div className="flex items-center justify-center flex-1">
              <Card className="w-full max-w-md bg-destructive/10 border-destructive">
                <CardContent className="p-6">
                  <p className="font-bold text-destructive">Failed to load component:</p>
                  <p className="mt-2 text-sm text-muted-foreground">{error}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  const formattedDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex flex-col h-screen">
          <SiteHeader 
            title="Auto-Assignment Configuration" 
            showQuickNotes={true} 
            notesStorageKey="auto_assignment"
            useDatabase={true}
          />

          <div className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto p-6 space-y-6">

              {/* Service Mapping Card */}
              <Card>
                <CardHeader className="border-b">
                  <CardTitle className="text-lg">Service to Employee Mapping for {formattedDate}</CardTitle>
                  <p className="text-sm text-muted-foreground">Select employees for each service to handle today's leads.</p>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    {services.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No services found in the database.
                      </div>
                    ) : (
                      services.map(serviceName => (
                        <Card key={serviceName} className="border">
                          <CardContent className="p-4">
                            <h3 className="font-semibold text-md text-foreground mb-4">{serviceName}</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                              {employees.map(emp => (
                                <div key={emp.whalesync_postgres_id} className="flex items-center space-x-2">
                                  <input
                                    id={`chk-${serviceName.replace(/\s+/g, '-')}-${emp.whalesync_postgres_id}`}
                                    type="checkbox"
                                    value={emp.whalesync_postgres_id}
                                    className="h-4 w-4 rounded border-input text-primary focus:ring-primary focus:ring-offset-2"
                                    checked={config[serviceName]?.includes(emp.whalesync_postgres_id) ?? false}
                                    onChange={() => handleCheckboxChange(serviceName, emp.whalesync_postgres_id)}
                                  />
                                  <label
                                    htmlFor={`chk-${serviceName.replace(/\s+/g, '-')}-${emp.whalesync_postgres_id}`}
                                    className="text-sm font-medium text-foreground cursor-pointer select-none"
                                  >
                                    {emp.full_name}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end items-center mt-6 pt-6 border-t gap-3">
                    <Button
                      onClick={handleClearConfig}
                      variant="outline"
                      className="font-medium"
                    >
                      Clear Configuration
                    </Button>
                    <Button
                      onClick={handleSaveConfig}
                      disabled={isSaving}
                      className="font-medium"
                    >
                      {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {saveMessage}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Run Auto-Assignment Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Run Auto-Assignment</CardTitle>
                  <p className="text-sm text-muted-foreground">Automatically assign unassigned leads based on today's rules.</p>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <Button
                      onClick={handleRunAssignment}
                      disabled={isAssigning}
                      className="font-medium"
                    >
                      {isAssigning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Run Auto-Assignment
                    </Button>
                    {assignmentLog && (
                      <div className="text-sm text-muted-foreground">
                        {assignmentLog}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Footer */}
              <div className="text-xs text-muted-foreground text-center py-4">
                Design & Developed by Startup Squad Pvt. Ltd.
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default AutoAssignmentPage;


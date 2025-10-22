"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Users, Settings, Zap, CheckCircle, AlertCircle, User, Palette, Building2, Truck, FileText, Video } from "lucide-react";
import { toast } from "sonner";

interface EmployeeFields {
  whalesync_postgres_id: string;
  full_name: string;
  job_title?: string;
  profile_photo?: string;
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

  // Function to get service icon based on service name
  const getServiceIcon = (serviceName: string) => {
    const service = serviceName.toLowerCase();
    
    if (service.includes('brand') || service.includes('development')) {
      return <Palette className="w-5 h-5 text-purple-600" />;
    } else if (service.includes('canton')) {
      return <Building2 className="w-5 h-5 text-blue-600" />;
    } else if (service.includes('dropshipping')) {
      return <Truck className="w-5 h-5 text-green-600" />;
    } else if (service.includes('llc') || service.includes('formation')) {
      return <FileText className="w-5 h-5 text-orange-600" />;
    } else if (service.includes('video') || service.includes('call')) {
      return <Video className="w-5 h-5 text-red-600" />;
    } else {
      return <Settings className="w-5 h-5 text-gray-600" />;
    }
  };

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
          .select('whalesync_postgres_id, full_name, job_title, profile_photo')
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
            <div className="w-full px-4 py-2 space-y-3">

              {/* Service Mapping Card */}
              <Card>
                <CardContent className="p-2">
                  <div className="space-y-3">
                    {services.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No services found in the database.
                      </div>
                    ) : (
                      services.map((serviceName, index) => (
                        <Card key={serviceName} className="border hover:shadow-md transition-shadow">
                          <CardContent className="p-2">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                {getServiceIcon(serviceName)}
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold text-sm text-foreground">{serviceName}</h3>
                                <p className="text-xs text-muted-foreground">Service #{index + 1}</p>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Users className="w-3 h-3" />
                                <span>{config[serviceName]?.length || 0} selected</span>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                              {employees.map(emp => (
                                <div key={emp.whalesync_postgres_id} className="group">
                                  <label
                                    htmlFor={`chk-${serviceName.replace(/\s+/g, '-')}-${emp.whalesync_postgres_id}`}
                                    className={`flex items-center space-x-2 p-2 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:border-primary/50 hover:bg-primary/5 ${
                                      config[serviceName]?.includes(emp.whalesync_postgres_id) 
                                        ? 'border-primary bg-primary/10 shadow-sm' 
                                        : 'border-border hover:shadow-sm'
                                    }`}
                                  >
                                    <input
                                      id={`chk-${serviceName.replace(/\s+/g, '-')}-${emp.whalesync_postgres_id}`}
                                      type="checkbox"
                                      value={emp.whalesync_postgres_id}
                                      className="h-3 w-3 rounded border-input text-primary focus:ring-primary focus:ring-offset-1"
                                      checked={config[serviceName]?.includes(emp.whalesync_postgres_id) ?? false}
                                      onChange={() => handleCheckboxChange(serviceName, emp.whalesync_postgres_id)}
                                    />
                                    <Avatar className="h-6 w-6">
                                      <AvatarImage src={emp.profile_photo || ""} alt={emp.full_name} />
                                      <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                                        {emp.full_name.slice(0, 2).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-medium text-foreground truncate">
                                        {emp.full_name}
                                      </p>
                                      <p className="text-xs text-muted-foreground truncate">
                                        {emp.job_title || 'Sales Rep'}
                                      </p>
                                    </div>
                                    {config[serviceName]?.includes(emp.whalesync_postgres_id) && (
                                      <CheckCircle className="w-3 h-3 text-primary" />
                                    )}
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
                  <div className="flex justify-between items-center mt-4 pt-4 border-t gap-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <User className="w-3 h-3" />
                      <span>{employees.length} employees available</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleClearConfig}
                        variant="outline"
                        size="sm"
                        className="font-medium hover:bg-destructive/10 hover:border-destructive/50 hover:text-destructive"
                      >
                        <AlertCircle className="mr-1 h-3 w-3" />
                        Clear
                      </Button>
                      <Button
                        onClick={handleSaveConfig}
                        disabled={isSaving}
                        size="sm"
                        className="font-medium"
                      >
                        {isSaving && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                        <Settings className="mr-1 h-3 w-3" />
                        {saveMessage}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Run Auto-Assignment Card */}
              <Card>
                <CardHeader className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-success" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Auto-Assignment Engine</CardTitle>
                      <p className="text-xs text-muted-foreground">Automatically assign unassigned leads based on today's rules.</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="w-3 h-3 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm text-foreground">Ready to Execute</p>
                          <p className="text-xs text-muted-foreground">Auto-assignment will distribute leads using round-robin method</p>
                        </div>
                      </div>
                      <Button
                        onClick={handleRunAssignment}
                        disabled={isAssigning}
                        className="font-medium"
                        size="sm"
                      >
                        {isAssigning && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                        <Zap className="mr-1 h-3 w-3" />
                        {isAssigning ? 'Processing...' : 'Run Assignment'}
                      </Button>
                    </div>
                    
                    {assignmentLog && (
                      <div className="p-3 bg-muted/50 rounded-lg border">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                          <span className="text-xs font-medium text-foreground">Assignment Status</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {assignmentLog}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Footer */}
              <div className="text-xs text-muted-foreground text-center py-2">
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


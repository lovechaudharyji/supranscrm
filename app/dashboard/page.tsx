"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { StageDoughnutChart } from "@/components/dashboard/stage-doughnut-chart";
import { TopPerformersCard } from "@/components/dashboard/top-performers-card";
import {
  AssignDialog,
  type Lead,
  type Employee,
} from "@/components/dashboard/assign-dialog";
import { BulkAssignDialog } from "@/components/dashboard/bulk-assign-dialog";
import { ReassignDialog } from "@/components/dashboard/reassign-dialog";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";

const TARGET_DEPARTMENT_NAME = "Sales & Customer Success";

export default function Page() {
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("Initializing...");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [deptEmployees, setDeptEmployees] = useState<Employee[]>([]);
  const isFetchingRef = useRef(false);

  // dialog states
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [reassignDialogOpen, setReassignDialogOpen] = useState(false);

  // utils
  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }),
    []
  );

  const parseCurrency = (value: any): number => {
    if (typeof value === "number") return value;
    if (typeof value === "string") {
      const cleaned = value.replace(/[^0-9.-]+/g, "");
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  // Fetch from Supabase
  const fetchLeads = async (): Promise<Lead[]> => {
    const { data, error } = await supabase.from("Leads").select(`
      whalesync_postgres_id,
      name,
      stage,
      deal_amount,
      date_and_time,
      services,
      source,
      assigned_to,
      follow_up_day
    `);
    if (error) throw error;
    return data || [];
  };

  const fetchEmployees = async (): Promise<Employee[]> => {
    const { data, error } = await supabase
      .from("Employee Directory")
      .select(`
        whalesync_postgres_id, 
        full_name, 
        job_title,
        employment_type,
        department:department(department_name)
      `)
      .eq('status', 'Active');
    if (error) throw error;
    return data || [];
  };

  const fetchDeptEmployees = async (
    deptName: string
  ): Promise<Employee[] | null> => {
    // First get the department ID
    const { data: deptData, error: deptError } = await supabase
      .from("Departments")
      .select("whalesync_postgres_id")
      .eq("department_name", deptName)
      .single();

    if (deptError || !deptData) return null;

    // Then get employees from that department
    const { data: employeesData, error: employeesError } = await supabase
      .from("Employee Directory")
      .select("whalesync_postgres_id, full_name, job_title, status")
      .eq("department", deptData.whalesync_postgres_id)
      .eq("status", "Active")
      .ilike("job_title", "%Sales%")
      .limit(1);

    if (employeesError) return null;
    return (employeesData || []) as Employee[];
  };

  // Load Dashboard
  const loadDashboard = useCallback(async () => {
    if (isFetchingRef.current) return;

    isFetchingRef.current = true;
    setIsRefreshing(true);
    setError(null);

    try {
      const [leadsData, employeesData] = await Promise.all([
        fetchLeads(),
        fetchEmployees(),
      ]);

      setLeads(leadsData);
      setEmployees(employeesData);

      const deptEmps = await fetchDeptEmployees(TARGET_DEPARTMENT_NAME);
      setDeptEmployees(
        (deptEmps?.length ? deptEmps : employeesData).sort((a, b) =>
          (a.full_name || "").localeCompare(b.full_name || "")
        )
      );

      setLastUpdated(`Last updated: ${new Date().toLocaleTimeString()}`);
    } catch (err: any) {
      console.error("Load dashboard error:", err);
      setError(err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    loadDashboard();
    const id = setInterval(loadDashboard, 60000);
    return () => clearInterval(id);
  }, [loadDashboard]);

  // Charts
  const dashboardData = useMemo(() => {
    const wonLeads = leads.filter((l) => l.stage?.toLowerCase() === "converted");
    const leadsByStage = leads.reduce<Record<string, number>>((acc, l) => {
      const stage = l.stage || "Uncategorized";
      acc[stage] = (acc[stage] || 0) + 1;
      return acc;
    }, {});

    const dailySalesMap = wonLeads.reduce<Record<string, number>>((acc, l) => {
      if (!l.date_and_time) return acc;
      const date = new Date(l.date_and_time).toISOString().split("T")[0];
      acc[date] = (acc[date] || 0) + parseCurrency(l.deal_amount);
      return acc;
    }, {});

    const dailySales = Object.entries(dailySalesMap)
      .map(([date, sales]) => ({ date, sales }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate daily leads count for ChartAreaInteractive
    const dailyLeadsMap = leads.reduce<Record<string, number>>((acc, l) => {
      if (!l.date_and_time) return acc;
      const date = new Date(l.date_and_time).toISOString().split("T")[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    const dailyLeads = Object.entries(dailyLeadsMap)
      .map(([date, leads]) => ({ date, leads }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const performance = wonLeads.reduce<Record<string, number>>((acc, l) => {
      const emp = employees.find(
        (e) => e.whalesync_postgres_id === l.assigned_to
      );
      const name = emp?.full_name || "Unassigned";
      acc[name] = (acc[name] || 0) + parseCurrency(l.deal_amount);
      return acc;
    }, {});

    const topPerformers = Object.entries(performance)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      charts: { 
        leadsByStage: leadsByStage || {}, 
        dailySales: dailySales || [], 
        dailyLeads: dailyLeads || [] 
      },
      lists: { topPerformers: topPerformers || [] },
    };
  }, [leads, employees]);

  if (loading)
    return (
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <div className="flex flex-1 items-center justify-center py-16">
            <div className="text-center">
              <div className="h-8 w-8 mx-auto animate-spin border-2 border-muted border-t-primary rounded-full"></div>
              <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );

  if (error)
    return (
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <div className="flex flex-1 items-center justify-center p-6">
            <div className="bg-destructive/10 border border-destructive p-6 rounded-lg max-w-md">
              <h2 className="font-bold text-lg text-destructive">
                Error loading data
              </h2>
              <p className="text-sm text-destructive/80 mt-2">{error.message}</p>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );

  const { charts, lists } = dashboardData || { 
    charts: { 
      leadsByStage: {}, 
      dailySales: [], 
      dailyLeads: [] 
    }, 
    lists: { topPerformers: [] } 
  };

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        {/* Header */}
        <SiteHeader />

        {/* Main Content */}
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2 flex-wrap px-4 lg:px-6">
                <div className="flex items-center gap-2 flex-wrap">
                  <Button onClick={() => setAssignDialogOpen(true)} size="sm">
                    Start Assigning
                  </Button>
                  <Button onClick={() => setBulkDialogOpen(true)} size="sm">
                    Bulk Assign
                  </Button>
                  <Button onClick={() => setReassignDialogOpen(true)} size="sm">
                    Re-assign Lead
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={loadDashboard}
                    disabled={isRefreshing}
                    size="sm"
                  >
                    {isRefreshing ? "Refreshing..." : "Refresh Data"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.location.href = '/dashboard/admin'}
                    size="sm"
                  >
                    Admin Dashboard
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">{lastUpdated}</p>
              </div>

              {/* KPI Cards - New Data-Driven */}
              <div className="px-4 lg:px-6">
                <KpiCards />
              </div>
              <div className="px-4 lg:px-6">
                <ChartAreaInteractive 
                  leadsData={charts.dailyLeads} 
                  salesData={charts.dailySales} 
                />
              </div>
              {/* Two Column Grid: Leads by Stage, Top Performers */}
              <div className="grid grid-cols-1 gap-4 px-4 md:gap-6 lg:px-6 @5xl/main:grid-cols-2">
                {/* Leads by Stage - Column 1 */}
                <div className="@5xl/main:col-span-1 flex">
                  <div className="flex-1 h-[600px]">
                    <StageDoughnutChart data={charts.leadsByStage} />
                  </div>
                </div>

                {/* Top Performing Staff - Column 2 */}
                <div className="@5xl/main:col-span-1 flex">
                  <div className="flex-1 h-[600px]">
                    <TopPerformersCard
                      performers={lists.topPerformers}
                      formatter={currencyFormatter}
                    />
                  </div>
                </div>
              </div>


              {/* Original Dashboard Components from Template */}
         

              {/* Section Cards - Original Template */}
             

              {/* Chart Area - Original Template */}
         

              {/* Data Table - Original Template */}
        
            </div>
          </div>
        </div>

        {/* Dialogs */}
        <AssignDialog
          open={assignDialogOpen}
          onOpenChange={setAssignDialogOpen}
          leads={leads}
          employees={employees}
          reload={loadDashboard}
        />
        <BulkAssignDialog
          open={bulkDialogOpen}
          onOpenChange={setBulkDialogOpen}
          leads={leads}
          employees={employees}
          reload={loadDashboard}
        />
        <ReassignDialog
          open={reassignDialogOpen}
          onOpenChange={setReassignDialogOpen}
          leads={leads}
          employees={deptEmployees}
          reload={loadDashboard}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}

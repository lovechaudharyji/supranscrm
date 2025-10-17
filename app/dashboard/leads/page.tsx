"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import LeadKanbanView from "@/components/leadspagecomponent/LeadKanbanView";
import dynamic from "next/dynamic";
import LeadTable from "@/components/leadspagecomponent/LeadTable";
import LeadCardsMobile from "@/components/leadspagecomponent/LeadCardsMobile";
import LeadFormModal from "@/components/leadspagecomponent/LeadFormModal";
import ExportButton from "@/components/leadspagecomponent/ExportButton";
import LeadCards from "@/components/leadspagecomponent/LeadCards";
import { LayoutGrid, Table as TableIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";

// ✅ Disable SSR for filters to avoid hydration mismatch
const LeadFilters = dynamic(
  () => import("@/components/leadspagecomponent/LeadFilters"),
  { ssr: false }
);

export default function LeadsPage() {
  const [data, setData] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    service: "",
    stage: "",
    date: "",
    search: "",
  });
  const [services, setServices] = useState<string[]>([]);
  const [stages, setStages] = useState<string[]>([]);
  const [editingLead, setEditingLead] = useState<any | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [showKanban, setShowKanban] = useState(false);

  // 🧠 Load saved view mode from localStorage
  useEffect(() => {
    const savedView = localStorage.getItem("leadViewMode");
    if (savedView === "kanban") {
      setShowKanban(true);
    } else {
      setShowKanban(false);
    }
  }, []);

  // 💾 Save view mode to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("leadViewMode", showKanban ? "kanban" : "table");
  }, [showKanban]);

  // 🔹 Fetch distinct services and stages
  const fetchDistincts = async () => {
    const { data: svcData } = await supabase
      .from("Leads")
      .select("services")
      .neq("services", null);
    if (svcData) setServices([...new Set(svcData.map((r) => r.services))]);

    const { data: stgData } = await supabase
      .from("Leads")
      .select("stage")
      .neq("stage", null);
    if (stgData) setStages([...new Set(stgData.map((r) => r.stage))]);
  };

  // 🔹 Fetch leads with pagination + filters
  const fetchLeads = async () => {
    let query = supabase
      .from("Leads")
      .select(
        `
        whalesync_postgres_id, date_and_time, stage, name, mobile, email,
        services, city, source,
        assigned_to (whalesync_postgres_id, full_name, profile_photo)
      `,
        { count: "exact" }
      )
      .order("date_and_time", { ascending: false })
      .range(pageIndex * pageSize, (pageIndex + 1) * pageSize - 1);

    // Handle multi-select for services
    if (filters.service) {
      const selectedServices = filters.service.split(',').filter(Boolean);
      if (selectedServices.length > 0) {
        query = query.in("services", selectedServices);
      }
    }

    // Handle multi-select for stages
    if (filters.stage) {
      const selectedStages = filters.stage.split(',').filter(Boolean);
      if (selectedStages.length > 0) {
        query = query.in("stage", selectedStages);
      }
    }

    if (filters.date) query = query.ilike("date_and_time", `${filters.date}%`);
    if (filters.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,mobile.ilike.%${filters.search}%,email.ilike.%${filters.search}%,city.ilike.%${filters.search}%`
      );
    }

    const { data: leads, count } = await query;
    setData(leads || []);
    setTotalCount(count || 0);
  };

  useEffect(() => {
    fetchDistincts();
    fetchLeads();
  }, [filters, pageIndex, pageSize]);

  // Reset to first page when filters change
  useEffect(() => {
    setPageIndex(0);
  }, [filters]);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex flex-col h-screen">
          {/* Header - Fixed */}
          <SiteHeader title="Leads" />

          {/* Main Content */}
          <div className="flex flex-col overflow-hidden flex-1">
            {/* Summary cards - Fixed with reduced spacing */}
            <div className="px-4 pt-4 pb-3 flex-shrink-0">
              <LeadCards />
            </div>

            {/* Action Bar - Fixed */}
            <div className="flex flex-col gap-3 px-4 pb-3 flex-shrink-0">
              {/* 🔹 Search + Primary Actions */}
              <div className="flex items-center gap-3 flex-wrap">
                <Input
                  placeholder="Search using Name, Phone or City"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="flex-1 min-w-[300px] h-10"
                />

                <div className="flex gap-2 items-center">
                  {/* Add Lead */}
                  <Button onClick={() => setEditingLead({})} className="h-10">
                    + Add Lead
                  </Button>

                  {/* 👇 Animated Kanban/Table Toggle Icon */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          onClick={() => setShowKanban((prev) => !prev)}
                          className="flex items-center justify-center w-10 h-10 p-0 relative overflow-hidden"
                        >
                          <AnimatePresence mode="wait" initial={false}>
                            {showKanban ? (
                              <motion.div
                                key="table"
                                initial={{ opacity: 0, rotate: -45, scale: 0.6 }}
                                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                                exit={{ opacity: 0, rotate: 45, scale: 0.6 }}
                                transition={{ duration: 0.25 }}
                                className="absolute"
                              >
                                <TableIcon className="w-5 h-5" />
                              </motion.div>
                            ) : (
                              <motion.div
                                key="kanban"
                                initial={{ opacity: 0, rotate: 45, scale: 0.6 }}
                                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                                exit={{ opacity: 0, rotate: -45, scale: 0.6 }}
                                transition={{ duration: 0.25 }}
                                className="absolute"
                              >
                                <LayoutGrid className="w-5 h-5" />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs">
                        {showKanban ? "Switch to Table View" : "Switch to Kanban View"}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  {/* Export Button */}
                  <ExportButton data={data} />
                </div>
              </div>

            </div>

            {/* 🔹 Kanban or Table View with Sticky Filters */}
            <div className="flex-1 overflow-hidden flex flex-col px-4">
              {showKanban ? (
                <div className="flex-1 overflow-y-auto">
                  <LeadKanbanView data={data} onReload={fetchLeads} />
                </div>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden sm:flex flex-1 overflow-hidden flex-col">
                    <LeadTable
                      data={data}
                      onEdit={setEditingLead}
                      fetchLeads={fetchLeads}
                      filters={filters}
                      onFiltersChange={setFilters}
                      services={services}
                      stages={stages}
                    />
                  </div>

                  {/* Mobile Cards */}
                  <div className="sm:hidden flex-1 overflow-y-auto">
                    <LeadCardsMobile
                      data={data}
                      onEdit={setEditingLead}
                      fetchLeads={fetchLeads}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Pagination - Fixed at Bottom */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-3 border-t border-border bg-muted/20 px-4 flex-shrink-0">
              <div className="text-sm text-muted-foreground">
                {totalCount > 0 ? (
                  <>
                    Showing <span className="font-medium text-foreground">{pageIndex * pageSize + 1}</span> to{" "}
                    <span className="font-medium text-foreground">{Math.min((pageIndex + 1) * pageSize, totalCount)}</span> of{" "}
                    <span className="font-medium text-foreground">{totalCount}</span> leads
                  </>
                ) : (
                  "No leads found"
                )}
              </div>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">Rows per page</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setPageIndex(0);
                    }}
                    className="h-9 w-20 rounded-md border border-input bg-background text-sm font-medium px-3 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    {[10, 20, 50, 100].map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    Page <span className="font-medium text-foreground">{pageIndex + 1}</span> of <span className="font-medium text-foreground">{Math.ceil(totalCount / pageSize) || 1}</span>
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pageIndex === 0}
                      onClick={() => setPageIndex(0)}
                      className="hidden sm:inline-flex h-9"
                    >
                      First
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pageIndex === 0}
                      onClick={() => setPageIndex((prev) => Math.max(prev - 1, 0))}
                      className="h-9"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={(pageIndex + 1) * pageSize >= totalCount}
                      onClick={() => setPageIndex((prev) => prev + 1)}
                      className="h-9"
                    >
                      Next
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={(pageIndex + 1) * pageSize >= totalCount}
                      onClick={() => setPageIndex(Math.ceil(totalCount / pageSize) - 1)}
                      className="hidden sm:inline-flex h-9"
                    >
                      Last
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Add/Edit Modal */}
            {editingLead && (
              <LeadFormModal
                lead={editingLead}
                onClose={() => setEditingLead(null)}
                onSave={fetchLeads}
              />
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}


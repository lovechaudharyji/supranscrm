"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { LeadsTable } from "@/components/employee/LeadsTable";
import { LeadSummaryCard } from "@/components/employee/LeadSummaryCard";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { usePageContext } from "@/contexts/PageContext";
import { PhoneOff } from "lucide-react";

interface Lead {
  whalesync_postgres_id: string;
  name?: string;
  mobile?: string;
  email?: string;
  city?: string;
  services?: string;
  source?: string;
  stage?: string;
  date_and_time?: string;
  follow_up_date?: string;
  call_connected?: string;
  assigned_to?: string;
}

export default function NotConnectedLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const { setSubtitle, setOnRefresh } = usePageContext();

  useEffect(() => {
    loadLeads();
  }, []);

  useEffect(() => {
    setSubtitle(`${leads.length} lead${leads.length !== 1 ? "s" : ""} awaiting connection`);
  }, [leads.length, setSubtitle]);

  useEffect(() => {
    setOnRefresh(() => loadLeads);
    return () => setOnRefresh(undefined);
  }, [setOnRefresh]);

  const loadLeads = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        toast.error("Please log in to view leads");
        setLoading(false);
        return;
      }

      // Get employee UUID from email
      const { data: employeeData, error: empError } = await supabase
        .from("Employee Directory")
        .select("whalesync_postgres_id")
        .eq("official_email", user.email)
        .single();

      if (empError || !employeeData) {
        toast.error("Employee not found");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("Leads")
        .select("*")
        .eq("assigned_to", employeeData.whalesync_postgres_id)
        .eq("stage", "Not Connected")
        .order("date_and_time", { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error: any) {
      console.error("Error loading leads:", error);
      toast.error("Failed to load leads");
    } finally {
      setLoading(false);
    }
  };

  // Calculate date-based counts
  const getLeadsInLastDays = (days: number) => {
    const now = new Date();
    const daysAgo = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return leads.filter((lead) => {
      if (!lead.date_and_time) return false;
      const leadDate = new Date(lead.date_and_time);
      return leadDate >= daysAgo;
    }).length;
  };

  const last7DaysCount = getLeadsInLastDays(7);
  const last30DaysCount = getLeadsInLastDays(30);

  if (loading) {
    return (
      <div className="h-full flex flex-col">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-4 pt-4 pb-3 flex-shrink-0">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <div className="flex-1 px-4 pb-4 min-h-0">
          <div className="h-full">
            <Skeleton className="h-full w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Summary Cards - Fixed */}
      <div className="px-4 pt-4 pb-3 flex-shrink-0">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <LeadSummaryCard
            title="Total Not Connected"
            count={leads.length}
            icon={PhoneOff}
          />
          <LeadSummaryCard
            title="Last 7 Days"
            count={last7DaysCount}
            icon={PhoneOff}
          />
          <LeadSummaryCard
            title="Last 30 Days"
            count={last30DaysCount}
            icon={PhoneOff}
          />
        </div>
      </div>
      
      {/* Table Area - Fixed height with internal scrolling */}
      <div className="flex-1 px-4 pb-4 min-h-0">
        <div className="h-full">
          <LeadsTable leads={leads} />
        </div>
      </div>
    </div>
  );
}


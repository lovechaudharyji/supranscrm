"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { LeadsTable } from "@/components/employee/LeadsTable";
import { LeadSummaryCardWithFilters } from "@/components/employee/LeadSummaryCardWithFilters";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { usePageContext } from "@/contexts/PageContext";
import { CalendarClock, Package, Palette, Building2, Video, Globe } from "lucide-react";

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

export default function FollowUpLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const { setSubtitle, setOnRefresh } = usePageContext();
  
  // State for date filters for each card
  const [selectedDates, setSelectedDates] = useState<{
    total: Date | null;
    dropshipping: Date | null;
    brandDevelopment: Date | null;
    usaLLC: Date | null;
    videoCall: Date | null;
    cantonFair: Date | null;
  }>({
    total: null,
    dropshipping: null,
    brandDevelopment: null,
    usaLLC: null,
    videoCall: null,
    cantonFair: null,
  });

  useEffect(() => {
    loadLeads();
  }, []);

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
        .eq("stage", "Follow Up Required")
        .order("follow_up_date", { ascending: true });

      if (error) throw error;
      setLeads(data || []);
    } catch (error: any) {
      console.error("Error loading leads:", error);
      toast.error("Failed to load leads");
    } finally {
      setLoading(false);
    }
  };

  const dueTodayCount = leads.filter((lead) => {
    if (!lead.follow_up_date) return false;
    const today = new Date().toISOString().split("T")[0];
    const followUpDate = new Date(lead.follow_up_date).toISOString().split("T")[0];
    return today === followUpDate;
  }).length;

  // Calculate service-based counts with date filtering
  const getServiceCount = (service: string, selectedDate: Date | null) => {
    const filteredLeads = leads.filter((lead) => {
      if (lead.services !== service) return false;
      if (!selectedDate) return true;
      
      // Filter by follow_up_date if available, otherwise by date_and_time
      const dateToCheck = lead.follow_up_date || lead.date_and_time;
      if (!dateToCheck) return false;
      
      const leadDate = new Date(dateToCheck);
      const filterDate = new Date(selectedDate);
      
      return leadDate.toDateString() === filterDate.toDateString();
    });
    
    return filteredLeads.length;
  };

  const getTotalCount = (selectedDate: Date | null) => {
    const filteredLeads = leads.filter((lead) => {
      if (!selectedDate) return true;
      
      const dateToCheck = lead.follow_up_date || lead.date_and_time;
      if (!dateToCheck) return false;
      
      const leadDate = new Date(dateToCheck);
      const filterDate = new Date(selectedDate);
      
      return leadDate.toDateString() === filterDate.toDateString();
    });
    
    return filteredLeads.length;
  };

  const serviceCounts = {
    "Dropshipping": getServiceCount("Dropshipping", selectedDates.dropshipping),
    "Brand Development": getServiceCount("Brand Development", selectedDates.brandDevelopment),
    "USA LLC Formation": getServiceCount("USA LLC Formation", selectedDates.usaLLC),
    "Video Call": getServiceCount("Video Call", selectedDates.videoCall),
    "Canton Fair": getServiceCount("Canton Fair", selectedDates.cantonFair),
  };

  const totalCount = getTotalCount(selectedDates.total);

  // Handler functions for date filters
  const handleDateFilter = (cardType: keyof typeof selectedDates, date: Date | null) => {
    setSelectedDates(prev => ({
      ...prev,
      [cardType]: date
    }));
  };

  useEffect(() => {
    let subtitle = `${leads.length} lead${leads.length !== 1 ? "s" : ""} requiring follow-up`;
    if (dueTodayCount > 0) {
      subtitle += ` • ${dueTodayCount} due today`;
    }
    setSubtitle(subtitle);
  }, [leads.length, dueTodayCount, setSubtitle]);

  useEffect(() => {
    setOnRefresh(() => loadLeads);
    return () => setOnRefresh(undefined);
  }, [setOnRefresh]);

  if (loading) {
    return (
      <div className="h-full flex flex-col">
        <div className="px-4 pt-4 pb-3 flex-shrink-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
        <div className="flex-1 px-4 pb-4">
          <Skeleton className="h-full w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Summary Cards - Fixed */}
      <div className="px-4 pt-4 pb-3 flex-shrink-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <LeadSummaryCardWithFilters
            title="Total Follow-up Leads"
            count={totalCount}
            icon={CalendarClock}
            onDateFilter={(date) => handleDateFilter('total', date)}
            selectedDate={selectedDates.total}
          />
          <LeadSummaryCardWithFilters
            title="Dropshipping"
            count={serviceCounts["Dropshipping"]}
            icon={Package}
            onDateFilter={(date) => handleDateFilter('dropshipping', date)}
            selectedDate={selectedDates.dropshipping}
          />
          <LeadSummaryCardWithFilters
            title="Brand Development"
            count={serviceCounts["Brand Development"]}
            icon={Palette}
            onDateFilter={(date) => handleDateFilter('brandDevelopment', date)}
            selectedDate={selectedDates.brandDevelopment}
          />
          <LeadSummaryCardWithFilters
            title="USA LLC Formation"
            count={serviceCounts["USA LLC Formation"]}
            icon={Building2}
            onDateFilter={(date) => handleDateFilter('usaLLC', date)}
            selectedDate={selectedDates.usaLLC}
          />
          <LeadSummaryCardWithFilters
            title="Video Call"
            count={serviceCounts["Video Call"]}
            icon={Video}
            onDateFilter={(date) => handleDateFilter('videoCall', date)}
            selectedDate={selectedDates.videoCall}
          />
          <LeadSummaryCardWithFilters
            title="Canton Fair"
            count={serviceCounts["Canton Fair"]}
            icon={Globe}
            onDateFilter={(date) => handleDateFilter('cantonFair', date)}
            selectedDate={selectedDates.cantonFair}
          />
        </div>
      </div>
      
      {/* Table Area - Fixed height with internal scrolling */}
      <div className="flex-1 px-4 pb-4 min-h-0">
        <div className="h-full">
          <LeadsTable leads={leads} showFollowUpDate={true} highlightDueToday={true} />
        </div>
      </div>
    </div>
  );
}


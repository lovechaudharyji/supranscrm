"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { CallSummaryCard } from "@/components/employee/CallSummaryCard";
import { CallLogsTable } from "@/components/employee/CallLogsTable";
import { Skeleton } from "@/components/ui/skeleton";
import { PhoneIncoming, PhoneOutgoing, PhoneMissed } from "lucide-react";
import { toast } from "sonner";
import { usePageContext } from "@/contexts/PageContext";

interface CallLog {
  whalesync_postgres_id: string;
  client_name?: string;
  client_number?: string;
  duration?: number;
  call_date?: string;
  sentiment?: string;
  call_type?: string;
  employee?: string;
}

export default function OutgoingCallsPage() {
  const [allCalls, setAllCalls] = useState<CallLog[]>([]);
  const [outgoingCalls, setOutgoingCalls] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { setSubtitle, setOnRefresh } = usePageContext();

  useEffect(() => {
    loadCalls();
  }, []);

  useEffect(() => {
    setSubtitle(`${outgoingCalls.length} outgoing call${outgoingCalls.length !== 1 ? "s" : ""}`);
  }, [outgoingCalls.length, setSubtitle]);

  useEffect(() => {
    setOnRefresh(() => loadCalls);
    return () => setOnRefresh(undefined);
  }, [setOnRefresh]);

  const loadCalls = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        toast.error("Please log in to view calls");
        setLoading(false);
        return;
      }

      // Get employee UUID from email
      const { data: employeeData } = await supabase
        .from("Employee Directory")
        .select("whalesync_postgres_id")
        .eq("official_email", user.email)
        .single();

      if (!employeeData) {
        toast.error("Employee not found");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("Calls")
        .select(`
          *,
          leads:leads (
            services
          )
        `)
        .eq("employee", employeeData.whalesync_postgres_id)
        .order("call_date", { ascending: false });

      if (error) throw error;

      setAllCalls(data || []);
      setOutgoingCalls((data || []).filter((call) => call.call_type === "Outgoing"));
    } catch (error: any) {
      console.error("Error loading calls:", error);
      toast.error("Failed to load calls");
    } finally {
      setLoading(false);
    }
  };

  const incomingCount = allCalls.filter((c) => c.call_type === "Incoming").length;
  const missedCount = allCalls.filter((c) => c.call_type === "Missed").length;

  if (loading) {
    return (
      <div className="h-full flex flex-col overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 pb-4 flex-shrink-0">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <div className="flex-1 overflow-hidden px-6 pb-6">
          <Skeleton className="h-full w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Sticky Cards */}
      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs md:grid-cols-3 p-6 pb-4 flex-shrink-0 bg-background">
        <CallSummaryCard
          title="Incoming Calls"
          count={incomingCount}
          icon={PhoneIncoming}
          color=""
        />
        <CallSummaryCard
          title="Outgoing Calls"
          count={outgoingCalls.length}
          icon={PhoneOutgoing}
          color=""
        />
        <CallSummaryCard
          title="Missed Calls"
          count={missedCount}
          icon={PhoneMissed}
          color=""
        />
      </div>

      {/* Scrollable Table Area */}
      <div className="flex-1 overflow-hidden px-6 pb-6">
        <CallLogsTable calls={outgoingCalls} />
      </div>
    </div>
  );
}


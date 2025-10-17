"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { CallSummaryCard } from "@/components/employee/CallSummaryCard";
import { CallLogsTable } from "@/components/employee/CallLogsTable";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { PhoneIncoming, PhoneOutgoing, PhoneMissed, RefreshCw, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

export default function DemoCallLogsPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const [allCalls, setAllCalls] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("incoming");

  useEffect(() => {
    if (email) {
      loadCalls();
    }
  }, [email]);

  const loadCalls = async () => {
    if (!email) return;
    
    setLoading(true);
    try {
      // Get employee UUID from email
      const { data: employeeData } = await supabase
        .from("Employee Directory")
        .select("whalesync_postgres_id")
        .eq("official_email", email)
        .single();

      if (!employeeData) {
        toast.error("Employee not found");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("Calls")
        .select("*")
        .eq("employee", employeeData.whalesync_postgres_id)
        .order("call_date", { ascending: false });

      if (error) throw error;
      setAllCalls(data || []);
    } catch (error: any) {
      console.error("Error loading calls:", error);
      toast.error("Failed to load calls");
    } finally {
      setLoading(false);
    }
  };

  const incomingCalls = allCalls.filter((c) => c.call_type === "Incoming");
  const outgoingCalls = allCalls.filter((c) => c.call_type === "Outgoing");
  const missedCalls = allCalls.filter((c) => c.call_type === "Missed");

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 p-4">
        <div className="container mx-auto">
          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            🚀 <strong>Demo Mode</strong> - Viewing data for: {email}
          </p>
        </div>
      </div>

      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href={`/employee/demo?email=${email}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Call Logs</h1>
            <p className="text-muted-foreground">View all your call history</p>
          </div>
          <Button onClick={loadCalls} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <CallSummaryCard
            title="Incoming Calls"
            count={incomingCalls.length}
            icon={PhoneIncoming}
            color="bg-green-500 text-white"
          />
          <CallSummaryCard
            title="Outgoing Calls"
            count={outgoingCalls.length}
            icon={PhoneOutgoing}
            color="bg-blue-500 text-white"
          />
          <CallSummaryCard
            title="Missed Calls"
            count={missedCalls.length}
            icon={PhoneMissed}
            color="bg-red-500 text-white"
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="incoming">Incoming ({incomingCalls.length})</TabsTrigger>
            <TabsTrigger value="outgoing">Outgoing ({outgoingCalls.length})</TabsTrigger>
            <TabsTrigger value="missed">Missed ({missedCalls.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="incoming" className="mt-6">
            <CallLogsTable calls={incomingCalls} />
          </TabsContent>

          <TabsContent value="outgoing" className="mt-6">
            <CallLogsTable calls={outgoingCalls} />
          </TabsContent>

          <TabsContent value="missed" className="mt-6">
            <CallLogsTable calls={missedCalls} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}


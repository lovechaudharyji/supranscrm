"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { LeadsTable } from "@/components/employee/LeadsTable";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { RefreshCw, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

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

export default function DemoNewLeadsPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (email) {
      loadLeads();
    }
  }, [email]);

  const loadLeads = async () => {
    if (!email) return;
    
    setLoading(true);
    try {
      // Get employee UUID from email
      const { data: empData, error: empError } = await supabase
        .from("Employee Directory")
        .select("whalesync_postgres_id")
        .eq("official_email", email)
        .single();

      if (empError || !empData) {
        toast.error("Employee not found");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("Leads")
        .select("*")
        .eq("assigned_to", empData.whalesync_postgres_id)
        .in("stage", ["New", "Assigned"])
        .order("date_and_time", { ascending: false });

      if (error) {
        console.error("Supabase error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        throw error;
      }
      setLeads(data || []);
      toast.success(`Loaded ${data?.length || 0} leads`);
    } catch (error: any) {
      console.error("Error loading leads:", error);
      toast.error(error.message || "Failed to load leads. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Skeleton className="h-8 w-48 mb-6" />
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
            <h1 className="text-3xl font-bold mb-2">New Leads</h1>
            <p className="text-muted-foreground">
              Showing {leads.length} lead{leads.length !== 1 ? "s" : ""} with stage "New" or "Assigned"
            </p>
          </div>
          <Button onClick={loadLeads} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <LeadsTable leads={leads} />
      </div>
    </div>
  );
}


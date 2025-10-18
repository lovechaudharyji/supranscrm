"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  TrendingUpIcon,
  UsersIcon,
  DollarSignIcon,
  ActivityIcon,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

// --- TYPE DEFINITIONS ---
interface Lead {
  whalesync_postgres_id: string;
  name: string;
  stage: string;
  deal_amount: number;
  date_and_time: string;
  assigned_to: string;
  email: string;
  mobile: string;
  city: string;
  source: string;
  client_budget: number;
  current_business_turnover: string;
  services: string;
  interested_in_products: string[];
  follow_up_date: string;
  call_remark: string;
  call_notes: string;
  employee_name: string;
  lead_tag: string;
  assignment_status: string;
  today_s_lead: string;
  whatsapp_link: string;
  profile_photo: string;
  age: number;
  any_other_interests: string;
  expected_closing: string;
  follow_up_day: string;
  last_callback_date: string;
  official_email: string;
  official_number: string;
  stage1: string;
  email_button: string;
  calls: string;
}

// --- SUPABASE HELPER FUNCTION ---
const fetchLeadsData = async (): Promise<Lead[]> => {
  const { data, error } = await supabase
    .from('Leads')
    .select('*')
    .order('date_and_time', { ascending: false });

  if (error) {
    throw new Error(`Supabase Error: ${error.message}`);
  }

  return data || [];
};

// --- HELPER COMPONENTS ---
const LoadingSpinner: React.FC = () => (
  <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="h-[126px] animate-pulse bg-muted rounded-lg"></div>
    ))}
  </div>
);

const ErrorDisplay: React.FC<{ error: Error }> = ({ error }) => (
  <div className="col-span-full border border-destructive bg-destructive/10 p-4 rounded-lg">
    <h3 className="font-bold text-destructive">Failed to Load KPI Data</h3>
    <p className="text-destructive/80 text-sm mt-1">{error.message}</p>
  </div>
);

// --- DYNAMIC KPI CARDS COMPONENT ---
export function KpiCards() {
  // --- STATE MANAGEMENT ---
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);

  // --- UTILITY ---
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
      const cleanedValue = value.replace(/[^0-9.-]+/g, "");
      const parsed = parseFloat(cleanedValue);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  // --- DATA FETCHING ---
  const fetchKpiData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const leadsData = await fetchLeadsData();
      setLeads(leadsData);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKpiData();
  }, [fetchKpiData]);

  // --- KPI CALCULATIONS ---
  const kpiData = useMemo(() => {
    const wonRecords = leads.filter(
      (r) => r.stage?.toLowerCase() === "converted"
    );
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const totalLeads = leads.length;
    const leadsConverted = wonRecords.length;
    const totalSales = wonRecords.reduce(
      (sum, r) => sum + parseCurrency(r.deal_amount),
      0
    );
    const salesThisMonth = wonRecords
      .filter((r) => r.date_and_time && new Date(r.date_and_time) >= startOfMonth)
      .reduce((sum, r) => sum + parseCurrency(r.deal_amount), 0);

    return { totalLeads, leadsConverted, totalSales, salesThisMonth };
  }, [leads]);

  // --- RENDER LOGIC ---
  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorDisplay error={error} />;
  }

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="flex items-center justify-between">
            <span>Total Sales</span>
            <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {currencyFormatter.format(kpiData.totalSales)}
          </CardTitle>
        </CardHeader>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="flex items-center justify-between">
            <span>Total Leads</span>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {kpiData.totalLeads}
          </CardTitle>
        </CardHeader>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="flex items-center justify-between">
            <span>Leads Converted</span>
            <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {kpiData.leadsConverted}
          </CardTitle>
        </CardHeader>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="flex items-center justify-between">
            <span>Sales This Month</span>
            <ActivityIcon className="h-4 w-4 text-muted-foreground" />
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {currencyFormatter.format(kpiData.salesThisMonth)}
          </CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
}


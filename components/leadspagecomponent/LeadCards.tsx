"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  UsersIcon,
  DollarSignIcon,
  ActivityIcon,
  CalendarCheckIcon,
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
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="h-[126px] animate-pulse bg-gradient-to-br from-muted to-transparent rounded-lg border"></div>
    ))}
  </div>
);

const ErrorDisplay: React.FC<{ error: Error }> = ({ error }) => (
  <div className="col-span-full border border-destructive bg-destructive/10 p-4 rounded-lg">
    <h3 className="font-bold text-destructive">Failed to Load Card Data</h3>
    <p className="text-destructive/80 text-sm mt-1">{error.message}</p>
  </div>
);

// --- DYNAMIC KPI CARDS COMPONENT ---
export default function LeadCards() {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);

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

  const kpiData = useMemo(() => {
    const todayString = new Date().toISOString().split("T")[0];

    const todayLeads = leads.filter(
      (r) =>
        r.date_and_time &&
        new Date(r.date_and_time).toISOString().split("T")[0] === todayString
    ).length;

    const totalLeads = leads.length;
    const todayFollowUps = leads.filter((r) => r.follow_up_day === todayString)
      .length;

    const wonRecords = leads.filter(
      (r) => r.stage?.toLowerCase() === "converted"
    );
    const totalSales = wonRecords.reduce(
      (sum, r) => sum + parseCurrency(r.deal_amount),
      0
    );

    return { todayLeads, totalLeads, todayFollowUps, totalSales };
  }, [leads]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorDisplay error={error} />;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="bg-gradient-to-t from-primary/5 to-card dark:bg-card shadow-sm">
        <CardHeader className="space-y-2">
          <CardDescription className="flex items-center justify-between text-sm">
            <span>Today's Leads</span>
            <ActivityIcon className="h-4 w-4 text-muted-foreground" />
          </CardDescription>
          <CardTitle className="text-3xl font-bold tracking-tight">
            {kpiData.todayLeads}
          </CardTitle>
        </CardHeader>
      </Card>

      <Card className="bg-gradient-to-t from-primary/5 to-card dark:bg-card shadow-sm">
        <CardHeader className="space-y-2">
          <CardDescription className="flex items-center justify-between text-sm">
            <span>Total Leads</span>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardDescription>
          <CardTitle className="text-3xl font-bold tracking-tight">
            {kpiData.totalLeads}
          </CardTitle>
        </CardHeader>
      </Card>

      <Card className="bg-gradient-to-t from-primary/5 to-card dark:bg-card shadow-sm">
        <CardHeader className="space-y-2">
          <CardDescription className="flex items-center justify-between text-sm">
            <span>Today's Follow Up</span>
            <CalendarCheckIcon className="h-4 w-4 text-muted-foreground" />
          </CardDescription>
          <CardTitle className="text-3xl font-bold tracking-tight">
            {kpiData.todayFollowUps}
          </CardTitle>
        </CardHeader>
      </Card>

      <Card className="bg-gradient-to-t from-primary/5 to-card dark:bg-card shadow-sm">
        <CardHeader className="space-y-2">
          <CardDescription className="flex items-center justify-between text-sm">
            <span>Total Sales</span>
            <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
          </CardDescription>
          <CardTitle className="text-3xl font-bold tracking-tight">
            {currencyFormatter.format(kpiData.totalSales)}
          </CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
}


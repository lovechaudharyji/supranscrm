"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  UsersIcon,
  DollarSignIcon,
  ActivityIcon,
  CalendarCheckIcon,
} from "lucide-react";

// --- AIRTABLE CONFIGURATION ---
const CONFIG = {
  API_KEY: process.env.NEXT_PUBLIC_AIRTABLE_API_KEY || "",
  BASE_ID: process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID || "",
  LEADS_TABLE_NAME: "Leads",
  COLUMN_MAP: {
    stage: "Stage",
    dealAmount: "Deal Amount",
    createdAt: "date_and_time",
    followUpDay: "Follow Up day",
  },
};

// --- TYPE DEFINITIONS ---
interface AirtableRecord {
  id: string;
  fields: { [key: string]: any };
}
interface Lead {
  id: string;
  [key: string]: any;
}

// --- API HELPER FUNCTION ---
const fetchTableData = async <T extends { id: string }>(
  tableName: string
): Promise<T[]> => {
  let allRecords: AirtableRecord[] = [];
  let offset: string | null = null;
  const url = `https://api.airtable.com/v0/${CONFIG.BASE_ID}/${encodeURIComponent(tableName)}`;

  do {
    const response = await fetch(`${url}${offset ? `?offset=${offset}` : ""}`, {
      headers: { Authorization: `Bearer ${CONFIG.API_KEY}` },
      cache: "no-store",
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `API Error for ${tableName}: ${error.error?.message || "Unknown error"}`
      );
    }
    const page = await response.json();
    allRecords.push(...page.records);
    offset = page.offset;
  } while (offset);

  return allRecords.map((r) => ({ ...r.fields, id: r.id })) as T[];
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
      const leadsData = await fetchTableData<Lead>(CONFIG.LEADS_TABLE_NAME);
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
    const C = CONFIG.COLUMN_MAP;
    const todayString = new Date().toISOString().split("T")[0];

    const todayLeads = leads.filter(
      (r) =>
        r[C.createdAt] &&
        new Date(r[C.createdAt]).toISOString().split("T")[0] === todayString
    ).length;

    const totalLeads = leads.length;
    const todayFollowUps = leads.filter((r) => r[C.followUpDay] === todayString)
      .length;

    const wonRecords = leads.filter(
      (r) => r[C.stage]?.toLowerCase() === "converted"
    );
    const totalSales = wonRecords.reduce(
      (sum, r) => sum + parseCurrency(r[C.dealAmount]),
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


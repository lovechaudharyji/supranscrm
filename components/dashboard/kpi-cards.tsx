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

// --- AIRTABLE CONFIGURATION ---
const CONFIG = {
  API_KEY: process.env.NEXT_PUBLIC_AIRTABLE_API_KEY || "",
  BASE_ID: process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID || "",
  LEADS_TABLE_NAME: "Leads",
  COLUMN_MAP: {
    stage: "Stage",
    dealAmount: "Deal Amount",
    createdAt: "date_and_time",
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

  // --- KPI CALCULATIONS ---
  const kpiData = useMemo(() => {
    const C = CONFIG.COLUMN_MAP;
    const wonRecords = leads.filter(
      (r) => r[C.stage]?.toLowerCase() === "converted"
    );
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const totalLeads = leads.length;
    const leadsConverted = wonRecords.length;
    const totalSales = wonRecords.reduce(
      (sum, r) => sum + parseCurrency(r[C.dealAmount]),
      0
    );
    const salesThisMonth = wonRecords
      .filter((r) => r[C.createdAt] && new Date(r[C.createdAt]) >= startOfMonth)
      .reduce((sum, r) => sum + parseCurrency(r[C.dealAmount]), 0);

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


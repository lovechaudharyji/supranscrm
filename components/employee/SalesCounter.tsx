"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2, TrendingUp } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface LeadRow {
  stage?: string | null;
  deal_amount?: number | string | null;
  date_and_time?: string | null;
  assigned_to?: string | null;
  services?: string | null;
}

function parseAmount(value: number | string | null | undefined): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/[^0-9.-]+/g, "");
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

function isWithin(dateStr: string | null | undefined, start: Date, end: Date): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  return d >= start && d < end;
}

export function SalesCounter() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [leads, setLeads] = useState<LeadRow[]>([]);

  useEffect(() => {
    loadEmployeeAndLeads();
  }, []);

  const loadEmployeeAndLeads = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      let employeeUUID: string | null = null;

      if (user?.email) {
        const { data: employeeData } = await supabase
          .from("Employee Directory")
          .select("whalesync_postgres_id")
          .eq("official_email", user.email)
          .single();
        employeeUUID = employeeData?.whalesync_postgres_id ?? null;
      }

      // Demo fallback: first employee
      if (!employeeUUID) {
        const { data: firstEmployee } = await supabase
          .from("Employee Directory")
          .select("whalesync_postgres_id")
          .limit(1)
          .single();
        employeeUUID = firstEmployee?.whalesync_postgres_id ?? null;
      }

      if (!employeeUUID) {
        setEmployeeId(null);
        setLeads([]);
        setLoading(false);
        return;
      }

      setEmployeeId(employeeUUID);

      // Fetch assigned leads; filter closed/won in JS (stage varies by data)
      const { data } = await supabase
        .from("Leads")
        .select("stage, deal_amount, date_and_time, assigned_to, services")
        .eq("assigned_to", employeeUUID);

      setLeads(data ?? []);
    } finally {
      setLoading(false);
    }
  };

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  const dayOfWeek = (now.getDay() + 6) % 7; // Monday=0
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  // Consider a sale when stage indicates success. Adjust as needed.
  const isSaleStage = (stage?: string | null) => {
    if (!stage) return false;
    const s = stage.toLowerCase();
    return s.includes("won") || s.includes("closed won") || s.includes("sale");
  };

  const stats = useMemo(() => {
    const filtered = leads.filter(l => isSaleStage(l.stage));
    const today = filtered.filter(l => isWithin(l.date_and_time ?? null, startOfDay, endOfDay));
    const week = filtered.filter(l => isWithin(l.date_and_time ?? null, startOfWeek, endOfWeek));
    const month = filtered.filter(l => isWithin(l.date_and_time ?? null, startOfMonth, endOfMonth));

    const sum = (arr: LeadRow[]) => arr.reduce((acc, r) => acc + parseAmount(r.deal_amount), 0);

    return {
      today: { count: today.length, amount: sum(today) },
      week: { count: week.length, amount: sum(week) },
      month: { count: month.length, amount: sum(month) },
    };
  }, [leads, startOfDay.getTime(), startOfWeek.getTime(), startOfMonth.getTime(), endOfDay.getTime(), endOfWeek.getTime(), endOfMonth.getTime()]);

  const currency = useMemo(() => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }), []);

  // Line chart: last 30 days sales amount (won only)
  const salesByDay = useMemo(() => {
    const filtered = leads.filter(l => isSaleStage(l.stage));
    const days: { [date: string]: number } = {};
    const d = new Date(now);
    for (let i = 29; i >= 0; i--) {
      const day = new Date(d);
      day.setDate(d.getDate() - i);
      const key = day.toISOString().slice(0, 10);
      days[key] = 0;
    }
    filtered.forEach(l => {
      if (!l.date_and_time) return;
      const key = new Date(l.date_and_time).toISOString().slice(0, 10);
      if (key in days) {
        days[key] += parseAmount(l.deal_amount);
      }
    });
    return Object.entries(days).map(([date, amount]) => ({ date, amount }));
  }, [leads, now.getTime()]);

  // Pie chart: current month sales by service
  const monthlyByService = useMemo(() => {
    const filtered = leads.filter(l => isSaleStage(l.stage) && isWithin(l.date_and_time ?? null, startOfMonth, endOfMonth));
    const map: { [service: string]: number } = {};
    filtered.forEach(l => {
      const key = (l.services && l.services.trim()) ? l.services : "Other";
      map[key] = (map[key] || 0) + parseAmount(l.deal_amount);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [leads, startOfMonth.getTime(), endOfMonth.getTime()]);

  const pieColors = ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#3B82F6", "#14B8A6", "#F43F5E", "#84CC16"]; // tailwind-like palette

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="h-9 px-3 flex items-center gap-2"
        onClick={() => setOpen(true)}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <TrendingUp className="h-4 w-4" />
        )}
        <span className="hidden sm:inline">Sales</span>
        <Badge variant="secondary" className="ml-1">
          {stats.month.count}
        </Badge>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Live Sales Counter</DialogTitle>
            <DialogDescription>
              Your closed sales by period (count and amount)
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
            <div className="border rounded-lg p-4">
              <div className="text-sm text-muted-foreground">Today</div>
              <div className="text-2xl font-semibold mt-1">{stats.today.count}</div>
              <div className="text-sm mt-1">{currency.format(stats.today.amount)}</div>
            </div>
            <div className="border rounded-lg p-4">
              <div className="text-sm text-muted-foreground">This Week</div>
              <div className="text-2xl font-semibold mt-1">{stats.week.count}</div>
              <div className="text-sm mt-1">{currency.format(stats.week.amount)}</div>
            </div>
            <div className="border rounded-lg p-4">
              <div className="text-sm text-muted-foreground">This Month</div>
              <div className="text-2xl font-semibold mt-1">{stats.month.count}</div>
              <div className="text-sm mt-1">{currency.format(stats.month.amount)}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            <div className="border rounded-lg p-4">
              <div className="text-sm text-muted-foreground">Last 30 days</div>
              <div className="text-base font-semibold mt-1">Sales Amount</div>
              <div className="h-56 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={salesByDay} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} tickMargin={8} minTickGap={24} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <RechartsTooltip formatter={(v: any) => currency.format(Number(v))} labelClassName="text-xs" />
                    <Line type="monotone" dataKey="amount" stroke="#6366F1" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="border rounded-lg p-4">
              <div className="text-sm text-muted-foreground">This Month</div>
              <div className="text-base font-semibold mt-1">Sales by Service</div>
              <div className="h-56 mt-2">
                <ChartContainer
                  config={{
                    services: Object.fromEntries(
                      monthlyByService.map((item, index) => [
                        item.name,
                        {
                          label: item.name,
                          color: pieColors[index % pieColors.length],
                        },
                      ])
                    ),
                  }}
                  className="w-full h-full"
                >
                  <PieChart>
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value) => [currency.format(Number(value)), "Sales"]}
                        />
                      }
                    />
                    <Pie
                      data={monthlyByService}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      strokeWidth={2}
                      stroke="#ffffff"
                    >
                      {monthlyByService.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={pieColors[index % pieColors.length]}
                          stroke="#ffffff"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default SalesCounter;



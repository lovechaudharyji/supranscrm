"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, TrendingUp } from "lucide-react";
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

interface LeadRow {
  stage?: string | null;
  deal_amount?: number | string | null;
  date_and_time?: string | null;
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

function isSaleStage(stage?: string | null) {
  if (!stage) return false;
  const s = stage.toLowerCase();
  return s.includes("won") || s.includes("closed won") || s.includes("sale");
}

export default function AdminSalesDetailPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);
  const [name, setName] = useState<string>("");
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const currency = useMemo(() => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }), []);

  useEffect(() => {
    if (id) load();
  }, [id]);

  const load = async () => {
    const [{ data: emp }, { data: lead }] = await Promise.all([
      supabase.from("Employee Directory").select("full_name").eq("whalesync_postgres_id", id).single(),
      supabase.from("Leads").select("stage, deal_amount, date_and_time, services").eq("assigned_to", id),
    ]);
    setName(emp?.full_name || "Employee");
    setLeads(lead ?? []);
  };

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const dayOfWeek = (now.getDay() + 6) % 7;
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const won = useMemo(() => leads.filter(l => isSaleStage(l.stage)), [leads]);

  const stats = useMemo(() => {
    const filterRange = (start: Date, end: Date) => won.filter(l => l.date_and_time && new Date(l.date_and_time) >= start && new Date(l.date_and_time) < end);
    const sum = (arr: LeadRow[]) => arr.reduce((acc, r) => acc + parseAmount(r.deal_amount), 0);
    const todayArr = filterRange(startOfDay, endOfDay);
    const weekArr = filterRange(startOfWeek, endOfWeek);
    const monthArr = filterRange(startOfMonth, endOfMonth);
    return {
      today: { c: todayArr.length, a: sum(todayArr) },
      week: { c: weekArr.length, a: sum(weekArr) },
      month: { c: monthArr.length, a: sum(monthArr) },
    };
  }, [won, startOfDay.getTime(), endOfDay.getTime(), startOfWeek.getTime(), endOfWeek.getTime(), startOfMonth.getTime(), endOfMonth.getTime()]);

  const salesByDay = useMemo(() => {
    const days: { [date: string]: number } = {};
    const d = new Date(now);
    for (let i = 29; i >= 0; i--) {
      const day = new Date(d);
      day.setDate(d.getDate() - i);
      const key = day.toISOString().slice(0, 10);
      days[key] = 0;
    }
    won.forEach(l => {
      if (!l.date_and_time) return;
      const key = new Date(l.date_and_time).toISOString().slice(0, 10);
      if (key in days) days[key] += parseAmount(l.deal_amount);
    });
    return Object.entries(days).map(([date, amount]) => ({ date, amount }));
  }, [won, now.getTime()]);

  const monthlyByService = useMemo(() => {
    const filtered = won.filter(l => l.date_and_time && new Date(l.date_and_time) >= startOfMonth && new Date(l.date_and_time) < endOfMonth);
    const map: { [service: string]: number } = {};
    filtered.forEach(l => {
      const key = (l.services && l.services.trim()) ? l.services : "Other";
      map[key] = (map[key] || 0) + parseAmount(l.deal_amount);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [won, startOfMonth.getTime(), endOfMonth.getTime()]);

  const pieColors = ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#3B82F6", "#14B8A6", "#F43F5E", "#84CC16"];

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex flex-col h-screen">
          <SiteHeader title="Sales" />
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto p-6 space-y-6">
              <div className="flex items-center gap-3">
                <Link href="/dashboard/sales"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
                <TrendingUp className="h-5 w-5" />
                <h1 className="text-2xl font-bold tracking-tight">{name} - Sales</h1>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4">
                  <div className="text-sm text-muted-foreground">Today</div>
                  <div className="text-2xl font-semibold mt-1">{stats.today.c}</div>
                  <div className="text-sm mt-1">{currency.format(stats.today.a)}</div>
                </Card>
                <Card className="p-4">
                  <div className="text-sm text-muted-foreground">This Week</div>
                  <div className="text-2xl font-semibold mt-1">{stats.week.c}</div>
                  <div className="text-sm mt-1">{currency.format(stats.week.a)}</div>
                </Card>
                <Card className="p-4">
                  <div className="text-sm text-muted-foreground">This Month</div>
                  <div className="text-2xl font-semibold mt-1">{stats.month.c}</div>
                  <div className="text-sm mt-1">{currency.format(stats.month.a)}</div>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="p-4">
                  <div className="text-sm text-muted-foreground">Last 30 days</div>
                  <div className="text-base font-semibold mt-1">Sales Amount</div>
                  <div className="h-72 mt-2">
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
                </Card>
                <Card className="p-4">
                  <div className="text-sm text-muted-foreground">This Month</div>
                  <div className="text-base font-semibold mt-1">Sales by Service</div>
                  <div className="h-72 mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={monthlyByService} dataKey="value" nameKey="name" outerRadius={96}>
                          {monthlyByService.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                          ))}
                        </Pie>
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <RechartsTooltip formatter={(v: any) => currency.format(Number(v))} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}



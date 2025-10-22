"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Search, TrendingUp, Grid3X3, List, ArrowUpDown, ArrowUp, ArrowDown, Settings, ChevronDown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface Employee {
  whalesync_postgres_id: string;
  full_name: string | null;
  profile_photo?: string | null;
  job_title?: string | null;
}

interface LeadRow {
  assigned_to?: string | null;
  stage?: string | null;
  deal_amount?: number | string | null;
  date_and_time?: string | null;
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

export default function AdminSalesOverviewPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [search, setSearch] = useState("");
  const [range, setRange] = useState<"week" | "month" | "last15">("month");
  const [viewType, setViewType] = useState<"cards" | "table">("table");
  const [visibleColumns, setVisibleColumns] = useState({
    name: true,
    today: true,
    week: true,
    month: true,
    last15: true,
    actions: true
  });
  const [sortField, setSortField] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const currency = useMemo(() => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }), []);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const [{ data: emp }, { data: lead }] = await Promise.all([
      supabase
        .from("Employee Directory")
        .select("whalesync_postgres_id, full_name, profile_photo, job_title")
        .ilike("job_title", "%sales%"),
      supabase.from("Leads").select("assigned_to, stage, deal_amount, date_and_time"),
    ]);
    setEmployees(emp ?? []);
    setLeads(lead ?? []);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />;
    return sortDirection === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
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
  const startOfLast15 = new Date(now);
  startOfLast15.setDate(now.getDate() - 14);
  startOfLast15.setHours(0,0,0,0);

  const list = useMemo(() => {
    const byEmployee: { [id: string]: { name: string; photo: string | null | undefined; today: { c: number; a: number }; week: { c: number; a: number }; month: { c: number; a: number }; last15: { c: number; a: number } } } = {};

    // initialize all employees with zero stats so they always show
    employees.forEach(e => {
      byEmployee[e.whalesync_postgres_id] = {
        name: e.full_name || "Unnamed",
        photo: e.profile_photo || null,
        today: { c: 0, a: 0 },
        week: { c: 0, a: 0 },
        month: { c: 0, a: 0 },
        last15: { c: 0, a: 0 },
      };
    });

    const won = leads.filter(l => isSaleStage(l.stage));
    won.forEach(l => {
      const id = String(l.assigned_to || "");
      if (!id) return;
      const amt = parseAmount(l.deal_amount);
      const d = l.date_and_time ? new Date(l.date_and_time) : null;
      if (byEmployee[id]) {
        if (d && d >= startOfDay && d < endOfDay) { byEmployee[id].today.c++; byEmployee[id].today.a += amt; }
        if (d && d >= startOfWeek && d < endOfWeek) { byEmployee[id].week.c++; byEmployee[id].week.a += amt; }
        if (d && d >= startOfMonth && d < endOfMonth) { byEmployee[id].month.c++; byEmployee[id].month.a += amt; }
        if (d && d >= startOfLast15 && d < endOfDay) { byEmployee[id].last15.c++; byEmployee[id].last15.a += amt; }
      }
    });
    return Object.entries(byEmployee)
      .map(([id, v]) => ({ id, name: v.name, photo: v.photo, today: v.today, week: v.week, month: v.month, last15: v.last15 }))
      .filter(item => item.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => {
        let aValue: any, bValue: any;
        
        switch (sortField) {
          case "name":
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
            break;
          case "today":
            aValue = a.today.a;
            bValue = b.today.a;
            break;
          case "week":
            aValue = a.week.a;
            bValue = b.week.a;
            break;
          case "month":
            aValue = a.month.a;
            bValue = b.month.a;
            break;
          case "last15":
            aValue = a.last15.a;
            bValue = b.last15.a;
            break;
          default:
            return 0;
        }
        
        if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
        if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
  }, [employees, leads, search]);

  const top = useMemo(() => {
    const picker = (it: any) => range === "week" ? it.week.a : range === "last15" ? it.last15.a : it.month.a;
    return [...list].sort((a, b) => picker(b) - picker(a)).slice(0, 3);
  }, [list, range]);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex flex-col h-screen font-sans">
          <SiteHeader title="Sales" />
          <div className="flex-1 overflow-hidden">
            <div className="w-full px-4 py-6 space-y-6 h-full flex flex-col">

              {/* Cards View */}
              {viewType === "cards" && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {top.map((emp, idx) => {
                      const val = range === "week" ? emp.week : range === "last15" ? emp.last15 : emp.month;
                      return (
                        <Card key={emp.id} className="bg-gradient-to-t from-primary/5 to-card dark:bg-card shadow-sm p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9">
                                <AvatarImage src={emp.photo || ""} alt={emp.name} />
                                <AvatarFallback>{emp.name.slice(0,1).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="text-sm text-muted-foreground">#{idx + 1}</div>
                                <div className="font-medium">{emp.name}</div>
                              </div>
                            </div>
                            <Link href={`/dashboard/sales/${emp.id}`}>
                              <Button size="sm" variant="outline">View</Button>
                            </Link>
                          </div>
                          <div className="mt-2">
                            <div className="text-xs text-muted-foreground">{range === "week" ? "This Week" : range === "last15" ? "Last 15 Days" : "This Month"}</div>
                            <div className="text-3xl font-bold tracking-tight">{currency.format(val.a)}</div>
                            <div className="text-sm">{val.c} sales</div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>

                  {/* Full list below top-3 */}
                  <div className="mt-6">
                    <h2 className="text-base font-semibold mb-3">All Salespeople</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {list.map(emp => (
                        <Card key={emp.id} className="p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={emp.photo || ""} alt={emp.name} />
                                <AvatarFallback>{emp.name.slice(0,1).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div className="font-medium">{emp.name}</div>
                            </div>
                            <Link href={`/dashboard/sales/${emp.id}`}>
                              <Button size="sm" variant="outline">View</Button>
                            </Link>
                          </div>
                          <div className="grid grid-cols-3 gap-3 text-sm">
                            <div>
                              <div className="text-muted-foreground">Today</div>
                              <div className="font-semibold">{emp.today.c}</div>
                              <div className="text-xs">{currency.format(emp.today.a)}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Week</div>
                              <div className="font-semibold">{emp.week.c}</div>
                              <div className="text-xs">{currency.format(emp.week.a)}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">{range === "last15" ? "Last 15" : "Month"}</div>
                              <div className="font-semibold">{(range === "last15" ? emp.last15.c : emp.month.c)}</div>
                              <div className="text-xs">{currency.format(range === "last15" ? emp.last15.a : emp.month.a)}</div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Table View */}
              {viewType === "table" && (
                <>
                  {/* Top Performers Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {top.map((emp, idx) => {
                      const val = range === "week" ? emp.week : range === "last15" ? emp.last15 : emp.month;
                      return (
                        <Card key={emp.id} className="bg-gradient-to-t from-primary/5 to-card dark:bg-card shadow-sm p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9">
                                <AvatarImage src={emp.photo || ""} alt={emp.name} />
                                <AvatarFallback>{emp.name.slice(0,1).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="text-sm text-muted-foreground">#{idx + 1}</div>
                                <div className="font-medium">{emp.name}</div>
                              </div>
                            </div>
                            <Link href={`/dashboard/sales/${emp.id}`}>
                              <Button size="sm" variant="outline">View</Button>
                            </Link>
                          </div>
                          <div className="mt-2">
                            <div className="text-xs text-muted-foreground">{range === "week" ? "This Week" : range === "last15" ? "Last 15 Days" : "This Month"}</div>
                            <div className="text-3xl font-bold tracking-tight">{currency.format(val.a)}</div>
                            <div className="text-sm">{val.c} sales</div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>

                  {/* Action Bar */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="relative flex-1 max-w-2xl">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search sales person..." className="pl-8 w-full" />
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant={range === "week" ? "default" : "outline"} onClick={() => setRange("week")}>This Week</Button>
                        <Button size="sm" variant={range === "last15" ? "default" : "outline"} onClick={() => setRange("last15")}>Last 15 Days</Button>
                        <Button size="sm" variant={range === "month" ? "default" : "outline"} onClick={() => setRange("month")}>This Month</Button>
                      </div>

                      {/* View Toggle */}
                      <ToggleGroup
                        type="single"
                        value={viewType}
                        onValueChange={(value) => setViewType(value as "cards" | "table")}
                        variant="outline"
                        className="flex"
                      >
                        <ToggleGroupItem value="cards" aria-label="Cards view">
                          <Grid3X3 className="h-4 w-4" />
                        </ToggleGroupItem>
                        <ToggleGroupItem value="table" aria-label="Table view">
                          <List className="h-4 w-4" />
                        </ToggleGroupItem>
                      </ToggleGroup>

                      {/* Customize Columns */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="ml-2">
                            <Settings className="h-4 w-4 mr-2" />
                            Customize Columns
                            <ChevronDown className="h-4 w-4 ml-2" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <div className="p-2">
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Show/Hide Columns</Label>
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id="name"
                                    checked={visibleColumns.name}
                                    onCheckedChange={(checked) => 
                                      setVisibleColumns(prev => ({ ...prev, name: checked as boolean }))
                                    }
                                  />
                                  <Label htmlFor="name" className="text-sm">Name</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id="today"
                                    checked={visibleColumns.today}
                                    onCheckedChange={(checked) => 
                                      setVisibleColumns(prev => ({ ...prev, today: checked as boolean }))
                                    }
                                  />
                                  <Label htmlFor="today" className="text-sm">Today</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id="week"
                                    checked={visibleColumns.week}
                                    onCheckedChange={(checked) => 
                                      setVisibleColumns(prev => ({ ...prev, week: checked as boolean }))
                                    }
                                  />
                                  <Label htmlFor="week" className="text-sm">This Week</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id="month"
                                    checked={visibleColumns.month}
                                    onCheckedChange={(checked) => 
                                      setVisibleColumns(prev => ({ ...prev, month: checked as boolean }))
                                    }
                                  />
                                  <Label htmlFor="month" className="text-sm">This Month</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id="last15"
                                    checked={visibleColumns.last15}
                                    onCheckedChange={(checked) => 
                                      setVisibleColumns(prev => ({ ...prev, last15: checked as boolean }))
                                    }
                                  />
                                  <Label htmlFor="last15" className="text-sm">Last 15 Days</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id="actions"
                                    checked={visibleColumns.actions}
                                    onCheckedChange={(checked) => 
                                      setVisibleColumns(prev => ({ ...prev, actions: checked as boolean }))
                                    }
                                  />
                                  <Label htmlFor="actions" className="text-sm">Actions</Label>
                                </div>
                              </div>
                              <div className="pt-2 border-t">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full"
                                  onClick={() => setVisibleColumns({
                                    name: true,
                                    today: true,
                                    week: true,
                                    month: true,
                                    last15: true,
                                    actions: true
                                  })}
                                >
                                  Reset to Default
                                </Button>
                              </div>
                            </div>
                          </div>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="rounded-md border flex-1 overflow-hidden">
                    <div className="overflow-y-auto h-full">
                      <Table>
                      <TableHeader className="sticky top-0 bg-background z-10">
                        <TableRow>
                          {visibleColumns.name && (
                            <TableHead className="w-[50px]">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSort("name")}
                                className="h-8 px-2 lg:px-3"
                              >
                                Name
                                {getSortIcon("name")}
                              </Button>
                            </TableHead>
                          )}
                          {visibleColumns.today && (
                            <TableHead className="w-[100px]">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSort("today")}
                                className="h-8 px-2 lg:px-3"
                              >
                                Today
                                {getSortIcon("today")}
                              </Button>
                            </TableHead>
                          )}
                          {visibleColumns.week && (
                            <TableHead className="w-[100px]">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSort("week")}
                                className="h-8 px-2 lg:px-3"
                              >
                                This Week
                                {getSortIcon("week")}
                              </Button>
                            </TableHead>
                          )}
                          {visibleColumns.month && (
                            <TableHead className="w-[100px]">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSort("month")}
                                className="h-8 px-2 lg:px-3"
                              >
                                This Month
                                {getSortIcon("month")}
                              </Button>
                            </TableHead>
                          )}
                          {visibleColumns.last15 && (
                            <TableHead className="w-[100px]">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSort("last15")}
                                className="h-8 px-2 lg:px-3"
                              >
                                Last 15 Days
                                {getSortIcon("last15")}
                              </Button>
                            </TableHead>
                          )}
                          {visibleColumns.actions && (
                            <TableHead className="w-[100px]">Actions</TableHead>
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {list.map((emp) => (
                          <TableRow key={emp.id}>
                            {visibleColumns.name && (
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={emp.photo || ""} alt={emp.name} />
                                    <AvatarFallback>{emp.name.slice(0,1).toUpperCase()}</AvatarFallback>
                                  </Avatar>
                                  <span className="truncate" title={emp.name}>{emp.name}</span>
                                </div>
                              </TableCell>
                            )}
                            {visibleColumns.today && (
                              <TableCell>
                                <div className="text-sm">
                                  <div className="font-semibold">{emp.today.c} sales</div>
                                  <div className="text-xs text-muted-foreground">{currency.format(emp.today.a)}</div>
                                </div>
                              </TableCell>
                            )}
                            {visibleColumns.week && (
                              <TableCell>
                                <div className="text-sm">
                                  <div className="font-semibold">{emp.week.c} sales</div>
                                  <div className="text-xs text-muted-foreground">{currency.format(emp.week.a)}</div>
                                </div>
                              </TableCell>
                            )}
                            {visibleColumns.month && (
                              <TableCell>
                                <div className="text-sm">
                                  <div className="font-semibold">{emp.month.c} sales</div>
                                  <div className="text-xs text-muted-foreground">{currency.format(emp.month.a)}</div>
                                </div>
                              </TableCell>
                            )}
                            {visibleColumns.last15 && (
                              <TableCell>
                                <div className="text-sm">
                                  <div className="font-semibold">{emp.last15.c} sales</div>
                                  <div className="text-xs text-muted-foreground">{currency.format(emp.last15.a)}</div>
                                </div>
                              </TableCell>
                            )}
                            {visibleColumns.actions && (
                              <TableCell>
                                <Link href={`/dashboard/sales/${emp.id}`}>
                                  <Button size="sm" variant="outline">View</Button>
                                </Link>
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    </div>
                  </div>
                </>
              )}
              
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}



"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarDays, Mail, MapPin, Phone, Briefcase, Globe, Calendar, Download, LayoutGrid, Columns, ArrowUpDown, ArrowUp, ArrowDown, Eye, Kanban } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import LeadKanbanView from "@/components/leadspagecomponent/LeadKanbanView";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  call_connected?: string;
  assigned_to?: string;
}

interface LeadsTableProps {
  leads: Lead[];
  showFollowUpDate?: boolean;
  highlightDueToday?: boolean;
}

type SortColumn = "date" | "name" | "mobile" | "email" | "service" | "city" | "source" | "stage" | "followup";
type SortDirection = "asc" | "desc" | null;

export function LeadsTable({ leads, showFollowUpDate = false, highlightDueToday = false }: LeadsTableProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [serviceFilter, setServiceFilter] = useState<string[]>([]);
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [columnVisibility, setColumnVisibility] = useState({
    date: true,
    name: true,
    mobile: true,
    email: true,
    service: true,
    city: true,
    source: true,
    stage: true,
    followup: showFollowUpDate,
  });

  // Get unique services and stages for filters
  const services = Array.from(new Set(leads.map((l) => l.services).filter(Boolean)));
  const stages = Array.from(new Set(leads.map((l) => l.stage).filter(Boolean)));

  // Load column visibility from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("employeeLeadsTableColumnVisibility");
    if (saved) {
      setColumnVisibility(JSON.parse(saved));
    }
  }, []);

  // Save column visibility to localStorage
  useEffect(() => {
    localStorage.setItem("employeeLeadsTableColumnVisibility", JSON.stringify(columnVisibility));
  }, [columnVisibility]);

  // Filter leads
  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      !searchTerm ||
      lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.mobile?.includes(searchTerm) ||
      lead.city?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesService = serviceFilter.length === 0 || serviceFilter.includes(lead.services || "");
    const matchesStage = stageFilter === "all" || lead.stage === stageFilter;

    // Date filter logic
    const matchesDate = !dateFilter || (() => {
      if (!lead.date_and_time) return false;
      const leadDate = new Date(lead.date_and_time);
      const filterDate = new Date(dateFilter);
      
      // Compare only the date part (ignore time)
      const leadDateOnly = new Date(leadDate.getFullYear(), leadDate.getMonth(), leadDate.getDate());
      const filterDateOnly = new Date(filterDate.getFullYear(), filterDate.getMonth(), filterDate.getDate());
      
      return leadDateOnly.getTime() === filterDateOnly.getTime();
    })();

    return matchesSearch && matchesService && matchesStage && matchesDate;
  });

  // Sort leads
  const sortedLeads = [...filteredLeads].sort((a, b) => {
    if (!sortColumn || !sortDirection) return 0;

    let aValue: any;
    let bValue: any;

    switch (sortColumn) {
      case "date":
        aValue = a.date_and_time ? new Date(a.date_and_time).getTime() : 0;
        bValue = b.date_and_time ? new Date(b.date_and_time).getTime() : 0;
        break;
      case "name":
        aValue = a.name?.toLowerCase() || "";
        bValue = b.name?.toLowerCase() || "";
        break;
      case "mobile":
        aValue = a.mobile || "";
        bValue = b.mobile || "";
        break;
      case "email":
        aValue = a.email?.toLowerCase() || "";
        bValue = b.email?.toLowerCase() || "";
        break;
      case "service":
        aValue = a.services?.toLowerCase() || "";
        bValue = b.services?.toLowerCase() || "";
        break;
      case "city":
        aValue = a.city?.toLowerCase() || "";
        bValue = b.city?.toLowerCase() || "";
        break;
      case "source":
        aValue = a.source?.toLowerCase() || "";
        bValue = b.source?.toLowerCase() || "";
        break;
      case "stage":
        aValue = a.stage?.toLowerCase() || "";
        bValue = b.stage?.toLowerCase() || "";
        break;
      case "followup":
        aValue = a.follow_up_date ? new Date(a.follow_up_date).getTime() : 0;
        bValue = b.follow_up_date ? new Date(b.follow_up_date).getTime() : 0;
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedLeads.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedLeads = sortedLeads.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, serviceFilter, stageFilter, dateFilter]);

  const getStageColor = (stage?: string) => {
    const s = stage?.toLowerCase() || "";
    if (s.includes("new")) return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
    if (s.includes("not connected")) return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
    if (s.includes("follow up required")) return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
    if (s.includes("converted")) return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
    if (s.includes("lost")) return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
  };

  const getServiceColor = (service?: string) => {
    const s = service?.toLowerCase() || "";
    if (s.includes("usa llc formation")) return "border-green-500/50 text-green-700 bg-green-50 dark:border-green-500/30 dark:text-green-400 dark:bg-green-950/30";
    if (s.includes("dropshipping")) return "border-orange-500/50 text-orange-700 bg-orange-50 dark:border-orange-500/30 dark:text-orange-400 dark:bg-orange-950/30";
    if (s.includes("brand development")) return "border-purple-500/50 text-purple-700 bg-purple-50 dark:border-purple-500/30 dark:text-purple-400 dark:bg-purple-950/30";
    if (s.includes("canton fair")) return "border-blue-500/50 text-blue-700 bg-blue-50 dark:border-blue-500/30 dark:text-blue-400 dark:bg-blue-950/30";
    return "border-gray-500/50 text-gray-700 bg-gray-50 dark:border-gray-500/30 dark:text-gray-400 dark:bg-gray-950/30";
  };

  const isDueToday = (date?: string) => {
    if (!date) return false;
    const today = new Date().toISOString().split("T")[0];
    const followUpDate = new Date(date).toISOString().split("T")[0];
    return today === followUpDate;
  };

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortDirection(null);
        setSortColumn(null);
      }
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="ml-1 h-3 w-3 inline opacity-50" />;
    }
    if (sortDirection === "asc") {
      return <ArrowUp className="ml-1 h-3 w-3 inline" />;
    }
    if (sortDirection === "desc") {
      return <ArrowDown className="ml-1 h-3 w-3 inline" />;
    }
    return <ArrowUpDown className="ml-1 h-3 w-3 inline opacity-50" />;
  };

  // Export to CSV function
  const exportToCSV = () => {
    const headers = [
      "Date",
      "Name",
      "Mobile",
      "Email",
      "Service",
      "City",
      "Source",
      "Stage",
      ...(showFollowUpDate ? ["Follow-up Date"] : []),
    ];
    
    const rows = [
      headers.join(","),
      ...sortedLeads.map((lead) => {
        const row = [
          lead.date_and_time ? new Date(lead.date_and_time).toLocaleDateString() : "",
          `"${(lead.name || "").replace(/"/g, '""')}"`,
          `"${(lead.mobile || "").replace(/"/g, '""')}"`,
          `"${(lead.email || "").replace(/"/g, '""')}"`,
          `"${(lead.services || "").replace(/"/g, '""')}"`,
          `"${(lead.city || "").replace(/"/g, '""')}"`,
          `"${(lead.source || "").replace(/"/g, '""')}"`,
          `"${(lead.stage || "").replace(/"/g, '""')}"`,
          ...(showFollowUpDate ? [`"${lead.follow_up_date ? new Date(lead.follow_up_date).toLocaleDateString() : ""}"`] : []),
        ];
        return row.join(",");
      }),
    ];
    
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `leads_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Top Filters Bar - Compact */}
      <div className="flex justify-between items-center gap-2 flex-wrap pb-2 flex-shrink-0 bg-background">
          {/* Left Side - Search */}
          <div className="w-full lg:flex-1 lg:max-w-xl">
            <Input
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-9 text-base"
            />
          </div>

          {/* Right Side - Filters and Actions */}
          <div className="flex flex-wrap items-center gap-1 w-full lg:w-auto">
            {/* Service Filter - Multi-selector */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[140px] h-9 justify-start text-left font-normal text-sm">
                  <Briefcase className="mr-2 h-4 w-4" />
                  {serviceFilter.length === 0 ? "All Services" : `${serviceFilter.length} selected`}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-0" align="start">
                <div className="p-3 border-b">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Filter by Services</span>
                    {serviceFilter.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setServiceFilter([])}
                        className="h-6 px-2 text-xs"
                      >
                        Clear All
                      </Button>
                    )}
                  </div>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  <div className="p-2">
                    <div className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded-md cursor-pointer"
                         onClick={() => setServiceFilter([])}>
                      <input
                        type="checkbox"
                        checked={serviceFilter.length === 0}
                        onChange={() => setServiceFilter([])}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">All Services</span>
                    </div>
                    {services.map((service) => (
                      <div key={service} className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded-md cursor-pointer"
                           onClick={() => {
                             if (serviceFilter.includes(service!)) {
                               setServiceFilter(serviceFilter.filter(s => s !== service));
                             } else {
                               setServiceFilter([...serviceFilter, service!]);
                             }
                           }}>
                        <input
                          type="checkbox"
                          checked={serviceFilter.includes(service!)}
                          onChange={() => {
                            if (serviceFilter.includes(service!)) {
                              setServiceFilter(serviceFilter.filter(s => s !== service));
                            } else {
                              setServiceFilter([...serviceFilter, service!]);
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">{service}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Stage Filter */}
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="w-[100px] h-9 text-sm">
                <SelectValue placeholder="Stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                {stages.map((stage) => (
                  <SelectItem key={stage} value={stage!}>
                    {stage}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Date Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[120px] h-9 justify-start text-left font-normal text-sm">
                  <Calendar className="mr-1 h-4 w-4" />
                  {dateFilter ? format(dateFilter, "MMM dd") : "All Dates"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <div className="flex flex-col">
                  <div className="p-3 border-b">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Filter by Date</span>
                      {dateFilter && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDateFilter(undefined)}
                          className="h-6 px-2 text-xs"
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                  </div>
                  <CalendarComponent
                    mode="single"
                    selected={dateFilter}
                    onSelect={setDateFilter}
                    initialFocus
                  />
                </div>
              </PopoverContent>
            </Popover>

            {/* Action Buttons */}
            <div className="flex items-center gap-1 ml-auto">
              {/* Kanban/Table View Toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode(viewMode === "table" ? "kanban" : "table")}
                title={viewMode === "table" ? "Switch to Kanban View" : "Switch to Table View"}
                className="h-9 w-9 p-0"
              >
                {viewMode === "table" ? <Kanban className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
              </Button>

              {/* Export Button */}
              <Button variant="outline" size="sm" className="h-9 text-sm gap-1" onClick={exportToCSV}>
                <Download className="h-4 w-4" />
                Export
              </Button>

              {/* Customize Columns */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 text-sm gap-1">
                    <Columns className="h-4 w-4" />
                    Columns
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={columnVisibility.date}
                    onCheckedChange={(value) =>
                      setColumnVisibility((prev) => ({ ...prev, date: value }))
                    }
                  >
                    Date
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={columnVisibility.name}
                    onCheckedChange={(value) =>
                      setColumnVisibility((prev) => ({ ...prev, name: value }))
                    }
                  >
                    Name
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={columnVisibility.mobile}
                    onCheckedChange={(value) =>
                      setColumnVisibility((prev) => ({ ...prev, mobile: value }))
                    }
                  >
                    Mobile
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={columnVisibility.email}
                    onCheckedChange={(value) =>
                      setColumnVisibility((prev) => ({ ...prev, email: value }))
                    }
                  >
                    Email
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={columnVisibility.service}
                    onCheckedChange={(value) =>
                      setColumnVisibility((prev) => ({ ...prev, service: value }))
                    }
                  >
                    Service
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={columnVisibility.city}
                    onCheckedChange={(value) =>
                      setColumnVisibility((prev) => ({ ...prev, city: value }))
                    }
                  >
                    City
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={columnVisibility.source}
                    onCheckedChange={(value) =>
                      setColumnVisibility((prev) => ({ ...prev, source: value }))
                    }
                  >
                    Source
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={columnVisibility.stage}
                    onCheckedChange={(value) =>
                      setColumnVisibility((prev) => ({ ...prev, stage: value }))
                    }
                  >
                    Stage
                  </DropdownMenuCheckboxItem>
                  {showFollowUpDate && (
                    <DropdownMenuCheckboxItem
                      checked={columnVisibility.followup}
                      onCheckedChange={(value) =>
                        setColumnVisibility((prev) => ({ ...prev, followup: value }))
                      }
                    >
                      Follow-up Date
                    </DropdownMenuCheckboxItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
      </div>

      {/* Table - Fixed height with internal scrolling */}
      <div className="w-full rounded-md border overflow-hidden flex-1 min-h-0 flex flex-col">
        {viewMode === "kanban" ? (
          <div className="h-full overflow-auto">
            <LeadKanbanView data={sortedLeads} />
          </div>
        ) : (
          <div className="flex-1 overflow-auto">
            <Table className="w-full">
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow className="hover:bg-transparent">
                  {columnVisibility.date && (
                    <TableHead 
                      className="h-10 px-3 text-sm font-semibold bg-background cursor-pointer select-none hover:bg-muted/50"
                      onClick={() => handleSort("date")}
                    >
                      Date{getSortIcon("date")}
                    </TableHead>
                  )}
                  {columnVisibility.name && (
                    <TableHead 
                      className="h-10 px-3 text-sm font-semibold bg-background cursor-pointer select-none hover:bg-muted/50"
                      onClick={() => handleSort("name")}
                    >
                      Name{getSortIcon("name")}
                    </TableHead>
                  )}
                  {columnVisibility.mobile && (
                    <TableHead 
                      className="h-10 px-3 text-sm font-semibold bg-background cursor-pointer select-none hover:bg-muted/50"
                      onClick={() => handleSort("mobile")}
                    >
                      Mobile{getSortIcon("mobile")}
                    </TableHead>
                  )}
                  {columnVisibility.email && (
                    <TableHead 
                      className="h-10 px-3 text-sm font-semibold bg-background cursor-pointer select-none hover:bg-muted/50"
                      onClick={() => handleSort("email")}
                    >
                      Email{getSortIcon("email")}
                    </TableHead>
                  )}
                  {columnVisibility.service && (
                    <TableHead 
                      className="h-10 px-3 text-sm font-semibold bg-background cursor-pointer select-none hover:bg-muted/50"
                      onClick={() => handleSort("service")}
                    >
                      Service{getSortIcon("service")}
                    </TableHead>
                  )}
                  {columnVisibility.city && (
                    <TableHead 
                      className="h-10 px-3 text-sm font-semibold bg-background cursor-pointer select-none hover:bg-muted/50"
                      onClick={() => handleSort("city")}
                    >
                      City{getSortIcon("city")}
                    </TableHead>
                  )}
                  {columnVisibility.source && (
                    <TableHead 
                      className="h-10 px-3 text-sm font-semibold bg-background cursor-pointer select-none hover:bg-muted/50"
                      onClick={() => handleSort("source")}
                    >
                      Source{getSortIcon("source")}
                    </TableHead>
                  )}
                  {columnVisibility.stage && (
                    <TableHead 
                      className="h-10 px-3 text-sm font-semibold bg-background cursor-pointer select-none hover:bg-muted/50"
                      onClick={() => handleSort("stage")}
                    >
                      Stage{getSortIcon("stage")}
                    </TableHead>
                  )}
                  {showFollowUpDate && columnVisibility.followup && (
                    <TableHead 
                      className="h-10 px-3 text-sm font-semibold bg-background cursor-pointer select-none hover:bg-muted/50"
                      onClick={() => handleSort("followup")}
                    >
                      Follow-up{getSortIcon("followup")}
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLeads.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={showFollowUpDate ? 9 : 8}
                      className="text-center py-8 text-xs text-muted-foreground"
                    >
                      No leads found.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedLeads.map((lead) => {
                  const dueToday = false;
                  return (
                    <TableRow
                      key={lead.whalesync_postgres_id}
                      className={`cursor-pointer hover:bg-muted/50 ${
                        dueToday ? "bg-yellow-50 dark:bg-yellow-900/10" : ""
                      }`}
                      onClick={() => router.push(`/employee/leads/${lead.whalesync_postgres_id}`)}
                    >
                      {columnVisibility.date && (
                        <TableCell className="px-3 py-3 text-sm whitespace-nowrap">
                          {lead.date_and_time
                            ? new Date(lead.date_and_time).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : "-"}
                        </TableCell>
                      )}
                      {columnVisibility.name && (
                        <TableCell 
                          className="px-3 py-3 text-sm font-medium"
                          onClick={(e) => {
                            if ((e.target as HTMLElement).closest('button[data-action]')) {
                              e.stopPropagation();
                            }
                          }}
                        >
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/employee/leads/${lead.whalesync_postgres_id}`);
                              }}
                              data-action="view"
                              className="h-6 w-6 hover:bg-muted flex-shrink-0"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <span className="text-sm font-medium truncate max-w-[100px]" title={lead.name || ""}>
                              {lead.name || "-"}
                            </span>
                          </div>
                        </TableCell>
                      )}
                      {columnVisibility.mobile && (
                        <TableCell className="px-3 py-3 text-sm whitespace-nowrap">{lead.mobile || "-"}</TableCell>
                      )}
                      {columnVisibility.email && (
                        <TableCell className="px-3 py-3 text-sm max-w-[120px] truncate">{lead.email || "-"}</TableCell>
                      )}
                      {columnVisibility.service && (
                        <TableCell className="px-3 py-3">
                          {lead.services ? (
                            <Badge variant="outline" className={`${getServiceColor(lead.services)} text-sm px-2 py-1 border`}>
                              {lead.services}
                            </Badge>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                      )}
                      {columnVisibility.city && (
                        <TableCell className="px-3 py-3 text-sm">{lead.city || "-"}</TableCell>
                      )}
                      {columnVisibility.source && (
                        <TableCell className="px-3 py-3 text-sm">{lead.source || "-"}</TableCell>
                      )}
                      {columnVisibility.stage && (
                        <TableCell className="px-3 py-3">
                          <Badge className={`${getStageColor(lead.stage)} text-sm px-2 py-1`}>
                            {lead.stage || "-"}
                          </Badge>
                        </TableCell>
                      )}
                      {showFollowUpDate && columnVisibility.followup && (
                        <TableCell className="px-3 py-3 text-sm">
                          {lead.follow_up_date ? (
                            <Badge variant="outline" className="text-sm px-2 py-1">
                              {new Date(lead.follow_up_date).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </Badge>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
            </Table>
          </div>
          )}

        </div>

      {/* Pagination Footer - Outside scrollable area */}
      <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm bg-background flex-shrink-0">
        <div className="text-sm text-muted-foreground">
          {sortedLeads.length > 0 ? (
            <>
              Showing <span className="font-medium text-foreground">{startIndex + 1}</span> to{" "}
              <span className="font-medium text-foreground">{Math.min(endIndex, sortedLeads.length)}</span> of{" "}
              <span className="font-medium text-foreground">{sortedLeads.length}</span> leads
            </>
          ) : (
            "No leads found"
          )}
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Rows:</span>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="h-8 w-20 rounded-md border border-input bg-background text-sm font-medium px-3 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              {[10, 20, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages || 1}
            </span>
            
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="h-8 px-3 text-sm"
              >
                First
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="h-8 px-3 text-sm"
              >
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages || totalPages === 0}
                className="h-8 px-3 text-sm"
              >
                Next
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages || totalPages === 0}
                className="h-8 px-3 text-sm"
              >
                Last
              </Button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}


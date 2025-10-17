"use client";

import { useState, useEffect } from "react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Calendar, Download, Columns, LayoutGrid, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

interface CallLog {
  whalesync_postgres_id: string;
  client_name?: string;
  client_number?: string;
  duration?: number;
  call_date?: string;
  sentiment?: string;
  call_type?: string;
  service?: string;
  leads?: {
    services?: string;
  };
}

interface CallLogsTableProps {
  calls: CallLog[];
}

type SortColumn = "name" | "mobile" | "service" | "duration" | "date" | "sentiment" | "type";
type SortDirection = "asc" | "desc" | null;

export function CallLogsTable({ calls }: CallLogsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [serviceFilter, setServiceFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Get unique services for filter
  const services = Array.from(
    new Set(
      calls
        .map((call) => call.service || call.leads?.services)
        .filter(Boolean)
    )
  );

  // Filter calls
  const filteredCalls = calls.filter((call) => {
    const service = call.service || call.leads?.services;
    
    const matchesSearch =
      !searchTerm ||
      call.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      call.client_number?.includes(searchTerm);

    const matchesService = serviceFilter === "all" || service === serviceFilter;

    return matchesSearch && matchesService;
  });

  // Sort calls
  const sortedCalls = [...filteredCalls].sort((a, b) => {
    if (!sortColumn || !sortDirection) return 0;

    let aValue: any;
    let bValue: any;

    switch (sortColumn) {
      case "name":
        aValue = a.client_name?.toLowerCase() || "";
        bValue = b.client_name?.toLowerCase() || "";
        break;
      case "mobile":
        aValue = a.client_number || "";
        bValue = b.client_number || "";
        break;
      case "service":
        aValue = (a.service || a.leads?.services || "").toLowerCase();
        bValue = (b.service || b.leads?.services || "").toLowerCase();
        break;
      case "duration":
        aValue = a.duration || 0;
        bValue = b.duration || 0;
        break;
      case "date":
        aValue = a.call_date ? new Date(a.call_date).getTime() : 0;
        bValue = b.call_date ? new Date(b.call_date).getTime() : 0;
        break;
      case "sentiment":
        aValue = a.sentiment?.toLowerCase() || "";
        bValue = b.sentiment?.toLowerCase() || "";
        break;
      case "type":
        aValue = a.call_type?.toLowerCase() || "";
        bValue = b.call_type?.toLowerCase() || "";
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedCalls.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedCalls = sortedCalls.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, serviceFilter, dateFilter]);

  const getCallTypeBadge = (type?: string) => {
    if (type === "Incoming") return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
    if (type === "Outgoing") return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
    if (type === "Missed") return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
    return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
  };

  const getSentimentBadge = (sentiment?: string) => {
    const s = sentiment?.toLowerCase() || "";
    if (s.includes("positive")) return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
    if (s.includes("neutral")) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
    if (s.includes("negative")) return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
    return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "0s";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${seconds}s`;
  };

  const getServiceColor = (service?: string) => {
    const s = service?.toLowerCase() || "";
    if (s.includes("usa llc formation")) return "border-green-500/50 text-green-700 bg-green-50 dark:border-green-500/30 dark:text-green-400 dark:bg-green-950/30";
    if (s.includes("dropshipping")) return "border-orange-500/50 text-orange-700 bg-orange-50 dark:border-orange-500/30 dark:text-orange-400 dark:bg-orange-950/30";
    if (s.includes("brand development")) return "border-purple-500/50 text-purple-700 bg-purple-50 dark:border-purple-500/30 dark:text-purple-400 dark:bg-purple-950/30";
    if (s.includes("canton fair")) return "border-blue-500/50 text-blue-700 bg-blue-50 dark:border-blue-500/30 dark:text-blue-400 dark:bg-blue-950/30";
    return "border-gray-500/50 text-gray-700 bg-gray-50 dark:border-gray-500/30 dark:text-gray-400 dark:bg-gray-950/30";
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

  return (
    <div className="w-full flex flex-col h-full overflow-hidden">
      {/* Filters Bar */}
      <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between flex-shrink-0 pb-3 bg-background">
        {/* Left Side - Search */}
        <div className="w-full lg:flex-1 lg:max-w-2xl">
          <Input
            placeholder="Search using Name or Phone"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-9 text-base"
          />
        </div>

        {/* Right Side - Filters and Actions */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Service Filter */}
          <Select value={serviceFilter} onValueChange={setServiceFilter}>
            <SelectTrigger className="w-[140px] h-9 text-sm">
              <SelectValue placeholder="All Services" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Services</SelectItem>
              {services.map((service) => (
                <SelectItem key={service} value={service || ""}>
                  {service}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2 h-9 text-sm">
                <Calendar className="h-4 w-4" />
                Filter by date
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <CalendarComponent
                mode="single"
                selected={dateFilter}
                onSelect={setDateFilter}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {/* Grid View Toggle */}
          <Button variant="outline" size="icon" className="h-9 w-9">
            <LayoutGrid className="h-4 w-4" />
          </Button>

          {/* Export */}
          <Button variant="outline" className="gap-2 h-9 text-sm">
            <Download className="h-4 w-4" />
            Export
          </Button>

          {/* Customize Columns */}
          <Button variant="outline" className="gap-2 h-9 text-sm">
            <Columns className="h-4 w-4" />
            Customize Columns
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="w-full rounded-md border flex-1 overflow-auto">
        <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow className="hover:bg-transparent">
                <TableHead 
                  className="h-10 px-3 text-sm font-semibold bg-background cursor-pointer select-none hover:bg-muted/50"
                  onClick={() => handleSort("name")}
                >
                  Name{getSortIcon("name")}
                </TableHead>
                <TableHead 
                  className="h-10 px-3 text-sm font-semibold bg-background cursor-pointer select-none hover:bg-muted/50"
                  onClick={() => handleSort("mobile")}
                >
                  Mobile{getSortIcon("mobile")}
                </TableHead>
                <TableHead 
                  className="h-10 px-3 text-sm font-semibold bg-background cursor-pointer select-none hover:bg-muted/50"
                  onClick={() => handleSort("service")}
                >
                  Service{getSortIcon("service")}
                </TableHead>
                <TableHead 
                  className="h-10 px-3 text-sm font-semibold bg-background cursor-pointer select-none hover:bg-muted/50"
                  onClick={() => handleSort("duration")}
                >
                  Duration{getSortIcon("duration")}
                </TableHead>
                <TableHead 
                  className="h-10 px-3 text-sm font-semibold bg-background cursor-pointer select-none hover:bg-muted/50"
                  onClick={() => handleSort("date")}
                >
                  Call Date{getSortIcon("date")}
                </TableHead>
                <TableHead 
                  className="h-10 px-3 text-sm font-semibold bg-background cursor-pointer select-none hover:bg-muted/50"
                  onClick={() => handleSort("sentiment")}
                >
                  Sentiment{getSortIcon("sentiment")}
                </TableHead>
                <TableHead 
                  className="h-10 px-3 text-sm font-semibold bg-background cursor-pointer select-none hover:bg-muted/50"
                  onClick={() => handleSort("type")}
                >
                  Call Type{getSortIcon("type")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedCalls.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-xs py-8 text-muted-foreground">
                    No call logs found.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedCalls.map((call) => {
                  const service = call.service || call.leads?.services;
                  return (
                <TableRow key={call.whalesync_postgres_id} className="hover:bg-muted/50">
                  <TableCell className="px-3 py-3 text-sm font-medium">{call.client_name || "-"}</TableCell>
                  <TableCell className="px-3 py-3 text-sm whitespace-nowrap">{call.client_number || "-"}</TableCell>
                  <TableCell className="px-3 py-3">
                    {service ? (
                      <Badge variant="outline" className={`${getServiceColor(service)} text-sm px-2 py-1 border`}>
                        {service}
                      </Badge>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="px-3 py-3 text-sm">{formatDuration(call.duration)}</TableCell>
                  <TableCell className="px-3 py-3 text-sm whitespace-nowrap">
                    {call.call_date
                      ? new Date(call.call_date).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "-"}
                  </TableCell>
                  <TableCell className="px-3 py-3">
                    <Badge className={`${getSentimentBadge(call.sentiment)} text-sm px-2 py-1`}>
                      {call.sentiment || "-"}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-3 py-3">
                    <Badge className={`${getCallTypeBadge(call.call_type)} text-sm px-2 py-1`}>
                      {call.call_type || "-"}
                    </Badge>
                  </TableCell>
                </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t px-4 py-3 text-sm bg-background">
            <div className="text-muted-foreground">
              Showing {startIndex + 1} to {Math.min(endIndex, sortedCalls.length)} of {sortedCalls.length} calls
            </div>
            
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Rows per page</span>
                <Select value={rowsPerPage.toString()} onValueChange={(value) => setRowsPerPage(Number(value))}>
                  <SelectTrigger className="h-8 w-20 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">
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
                    Previous
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
    </div>
  );
}


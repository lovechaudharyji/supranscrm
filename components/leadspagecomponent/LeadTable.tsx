"use client";

import { useState, useEffect } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
  VisibilityState,
  SortingState,
  getSortedRowModel,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Columns3, ArrowUpDown, ArrowUp, ArrowDown, Eye } from "lucide-react";
import LeadActions from "./LeadActions";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import LeadFilters from "./LeadFilters";
import { useRouter } from "next/navigation";

export default function LeadTable({
  data,
  onEdit,
  fetchLeads,
  filters,
  onFiltersChange,
  services,
  stages,
}: {
  data: any[];
  onEdit: (lead: any) => void;
  fetchLeads: () => void;
  filters?: any;
  onFiltersChange?: (filters: any) => void;
  services?: string[];
  stages?: string[];
}) {
  const router = useRouter();
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [sorting, setSorting] = useState<SortingState>([]);

  // Load column visibility from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("leadsTableColumnVisibility");
    if (saved) {
      setColumnVisibility(JSON.parse(saved));
    }
  }, []);

  // Save column visibility to localStorage
  useEffect(() => {
    localStorage.setItem("leadsTableColumnVisibility", JSON.stringify(columnVisibility));
  }, [columnVisibility]);
  const columns = [
    { 
      accessorKey: "date_and_time", 
      header: ({ column }: any) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-7 px-2 hover:bg-transparent text-xs font-semibold"
          >
            Date
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-1.5 h-3.5 w-3.5" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="ml-1.5 h-3.5 w-3.5" />
            ) : (
              <ArrowUpDown className="ml-1.5 h-3.5 w-3.5 opacity-50" />
            )}
          </Button>
        );
      },
      cell: ({ row }: any) => {
        const date = row.original.date_and_time;
        if (!date) return "-";
        return (
          <span className="text-xs whitespace-nowrap">
            {new Date(date).toLocaleDateString("en-US", { 
              month: "short", 
              day: "numeric",
              year: "numeric" 
            })}
          </span>
        );
      },
    },

    // 🧑 Avatar + Name column
    {
      accessorKey: "name",
      header: ({ column }: any) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-7 px-2 hover:bg-transparent text-xs font-semibold"
          >
            Name
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-1.5 h-3.5 w-3.5" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="ml-1.5 h-3.5 w-3.5" />
            ) : (
              <ArrowUpDown className="ml-1.5 h-3.5 w-3.5 opacity-50" />
            )}
          </Button>
        );
      },
      cell: ({ row }: any) => {
        const name = row.original.name;
        const avatar = row.original.profile_photo;
        const leadId = row.original.whalesync_postgres_id;

        return (
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/dashboard/leads/${leadId}`);
              }}
              data-action="view"
              className="h-6 w-6 hover:bg-muted flex-shrink-0"
            >
              <Eye className="h-3.5 w-3.5" />
            </Button>
            <Avatar className="h-6 w-6 flex-shrink-0">
              {avatar ? (
                <AvatarImage src={avatar} alt={name || "Lead"} />
              ) : (
                <AvatarFallback className="bg-muted text-muted-foreground text-[10px] font-semibold">
                  {name?.charAt(0)?.toUpperCase() || "?"}
                </AvatarFallback>
              )}
            </Avatar>
            <span className="text-xs font-medium truncate" title={name || ""}>
              {name || "Unnamed"}
            </span>
          </div>
        );
      },
    },

    // 📱 Mobile
    {
      accessorKey: "mobile",
      header: "Mobile",
      cell: ({ row }: any) => {
        const mobile = row.original.mobile;
        return (
          <span className="text-xs" title={mobile || ""}>
            {mobile || "-"}
          </span>
        );
      },
    },

    { 
      accessorKey: "email", 
      header: "Email",
      cell: ({ row }: any) => {
        const email = row.original.email;
        return (
          <span className="text-xs truncate block max-w-[140px]" title={email}>
            {email || "-"}
          </span>
        );
      },
    },

    // 🎨 Services with colored badges
    {
      accessorKey: "services",
      header: ({ column }: any) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-7 px-2 hover:bg-transparent text-xs font-semibold"
          >
            Services
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-1.5 h-3.5 w-3.5" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="ml-1.5 h-3.5 w-3.5" />
            ) : (
              <ArrowUpDown className="ml-1.5 h-3.5 w-3.5 opacity-50" />
            )}
          </Button>
        );
      },
      cell: ({ row }: any) => {
        const service = row.original.services;

        if (!service) {
          return (
            <span className="text-xs text-muted-foreground">-</span>
          );
        }

        const colorMap: Record<string, string> = {
          "Brand Development": "text-purple-700 border-purple-400 bg-purple-50 dark:text-purple-300 dark:border-purple-600 dark:bg-purple-950",
          "Canton Fair": "text-blue-700 border-blue-400 bg-blue-50 dark:text-blue-300 dark:border-blue-600 dark:bg-blue-950",
          "Video Call": "text-red-700 border-red-400 bg-red-50 dark:text-red-300 dark:border-red-600 dark:bg-red-950",
          "USA LLC Formation": "text-green-700 border-green-500 bg-green-50 dark:text-green-300 dark:border-green-600 dark:bg-green-950",
          Dropshipping: "text-yellow-700 border-yellow-500 bg-yellow-50 dark:text-yellow-300 dark:border-yellow-600 dark:bg-yellow-950",
        };

        const color = colorMap[service] || "border-border bg-muted/50";

        return (
          <span
            className={`px-1.5 py-0.5 text-[10px] font-medium border rounded-full whitespace-nowrap ${color}`}
            title={service}
          >
            {service}
          </span>
        );
      },
    },

    { 
      accessorKey: "city", 
      header: ({ column }: any) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-7 px-2 hover:bg-transparent text-xs font-semibold"
          >
            City
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-1.5 h-3.5 w-3.5" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="ml-1.5 h-3.5 w-3.5" />
            ) : (
              <ArrowUpDown className="ml-1.5 h-3.5 w-3.5 opacity-50" />
            )}
          </Button>
        );
      },
      cell: ({ row }: any) => (
        <span className="text-xs">{row.original.city || "-"}</span>
      ),
    },

    // 🧑 Assigned To with avatar + name
    {
      accessorKey: "assigned_to",
      header: "Assigned To",
      cell: ({ row }: any) => {
        const assigned = row.original.assigned_to;
        const name = assigned?.full_name;
        const avatar = assigned?.profile_photo;

        if (!assigned) {
          return (
            <div className="flex items-center gap-1.5">
              <Avatar className="h-6 w-6 flex-shrink-0">
                <AvatarFallback className="bg-muted text-muted-foreground text-[10px]">
                  ?
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground italic">
                Unassigned
              </span>
            </div>
          );
        }

        return (
          <div className="flex items-center gap-1.5">
            <Avatar className="h-6 w-6 flex-shrink-0">
              {avatar ? (
                <AvatarImage src={avatar} alt={name || "User"} />
              ) : (
                <AvatarFallback className="bg-muted text-muted-foreground text-[10px] font-semibold">
                  {name?.charAt(0)?.toUpperCase() || "?"}
                </AvatarFallback>
              )}
            </Avatar>
            <span className="text-xs font-medium truncate" title={name || ""}>{name || "Unassigned"}</span>
          </div>
        );
      },
    },

    // ⚙️ Actions column
    {
      id: "actions",
      header: "Actions",
      enableHiding: false,
      cell: ({ row }: any) => (
        <LeadActions
          lead={row.original}
          onEdit={onEdit}
          fetchLeads={fetchLeads}
        />
      ),
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onSortingChange: setSorting,
    state: {
      columnVisibility,
      sorting,
    },
  });

  return (
    <div className="w-full flex flex-col h-full overflow-hidden">
      {/* Filters and Customize Columns - Sticky */}
      <div className="flex justify-between items-center gap-3 flex-wrap pb-3 flex-shrink-0 bg-background">
        {/* Left Side - Filters */}
        <div className="flex-1">
          {filters && onFiltersChange && services && stages && (
            <LeadFilters
              filters={filters}
              onChange={onFiltersChange}
              services={services}
              stages={stages}
            />
          )}
        </div>

        {/* Right Side - Customize Columns */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Columns3 className="h-4 w-4" />
              Customize Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {column.id.replace(/_/g, " ")}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table - Scrollable */}
      <div className="w-full rounded-md border flex-1 overflow-auto">
      <Table className="w-full">
        <colgroup>
          <col className="w-[90px]" />
          <col className="w-[150px]" />
          <col className="w-[110px]" />
          <col className="w-[160px]" />
          <col className="w-[140px]" />
          <col className="w-[80px]" />
          <col className="w-[140px]" />
          <col className="w-[100px]" />
        </colgroup>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="bg-muted/50 hover:bg-muted/50">
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} className="text-xs font-semibold text-foreground px-2 py-2 h-10">
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>

        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow 
                key={row.id} 
                className="border-b border-border hover:bg-muted/30 transition-colors cursor-pointer"
                onClick={() => router.push(`/dashboard/leads/${row.original.whalesync_postgres_id}`)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell 
                    key={cell.id} 
                    className="py-3 px-2"
                    onClick={(e) => {
                      // Prevent row click when clicking on action buttons
                      if ((e.target as HTMLElement).closest('button[data-action]')) {
                        e.stopPropagation();
                      }
                    }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="text-center py-8 text-muted-foreground"
              >
                No leads found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      </div>
    </div>
  );
}


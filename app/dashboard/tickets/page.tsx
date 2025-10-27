"use client";

import { useState, useEffect } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Plus, 
  Search,
  Filter,
  Calendar,
  Users,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  MessageSquare,
  Eye,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Grid3X3,
  List,
  UserPlus,
  UserCheck,
  Edit,
  Trash2,
  GripVertical,
  Settings,
  ChevronDown,
  Share2,
  UserX
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";

interface Ticket {
  id: string;
  ticket_number: number;
  client_name: string;
  client_email: string;
  company: string;
  issue: string;
  status: 'New' | 'In Progress' | 'Escalated' | 'Resolved';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  assigned_to: string;
  created_at: string;
  updated_at: string;
  history?: TicketHistory[];
  chat?: TicketChat[];
}

interface TicketHistory {
  id: string;
  user_name: string;
  action: string;
  created_at: string;
}

interface TicketChat {
  id: string;
  user_name: string;
  message: string;
  sender_type: 'sent' | 'received';
  created_at: string;
}

interface Employee {
  whalesync_postgres_id: string;
  full_name: string;
  profile_photo?: string;
  job_title?: string;
}

interface TicketAssignment {
  id: string;
  ticket_id: string;
  employee_id: string;
  assigned_at: string;
  assigned_by: string;
  employee?: Employee;
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
  const [timeFilter, setTimeFilter] = useState<string[]>([]);
  const [visibleColumns, setVisibleColumns] = useState({
    ticketNumber: true,
    company: true,
    client: true,
    issue: true,
    status: true,
    priority: true,
    assignedTo: true,
    created: true,
    actions: true
  });
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [showKanban, setShowKanban] = useState(false);
  const [sortField, setSortField] = useState<string>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [draggedTicket, setDraggedTicket] = useState<Ticket | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    inProgress: 0,
    escalated: 0,
    resolved: 0
  });

  const [newTicket, setNewTicket] = useState({
    client_name: "",
    client_email: "",
    company: "",
    issue: "",
    priority: "Medium"
  });

  const [chatMessage, setChatMessage] = useState("");

  useEffect(() => {
    loadTickets();
    loadEmployees();
  }, []);

  const loadTickets = async () => {
    try {
      setLoading(true);
      
      const { data: ticketsData, error: ticketsError } = await supabase
        .from("tickets")
        .select("*")
        .order("created_at", { ascending: false });

      if (ticketsError) {
        console.error("Tickets error:", ticketsError);
        throw ticketsError;
      }

      setTickets(ticketsData || []);

      // Calculate stats
      const total = ticketsData?.length || 0;
      const newCount = ticketsData?.filter(t => t.status === 'New').length || 0;
      const inProgressCount = ticketsData?.filter(t => t.status === 'In Progress').length || 0;
      const escalatedCount = ticketsData?.filter(t => t.status === 'Escalated').length || 0;
      const resolvedCount = ticketsData?.filter(t => t.status === 'Resolved').length || 0;

      setStats({
        total,
        new: newCount,
        inProgress: inProgressCount,
        escalated: escalatedCount,
        resolved: resolvedCount
      });

    } catch (error) {
      console.error("Error loading tickets:", error);
      toast.error("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      console.log("Loading employees...");
      const { data, error } = await supabase
        .from("Employee Directory")
        .select("whalesync_postgres_id, full_name, profile_photo, job_title")
        .order("full_name");

      if (error) {
        console.error("Error loading employees:", error);
        return;
      }

      console.log("Loaded employees:", data);
      setEmployees(data || []);
    } catch (error) {
      console.error("Error loading employees:", error);
    }
  };

  const loadTicketDetails = async (ticketId: string) => {
    try {
      // Load ticket with history and chat
      const { data: ticketData, error: ticketError } = await supabase
        .from("tickets")
        .select("*")
        .eq("id", ticketId)
        .single();

      if (ticketError) throw ticketError;

      const { data: historyData, error: historyError } = await supabase
        .from("ticket_history")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });

      if (historyError) throw historyError;

      const { data: chatData, error: chatError } = await supabase
        .from("ticket_chat")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });

      if (chatError) throw chatError;

      setSelectedTicket({
        ...ticketData,
        history: historyData || [],
        chat: chatData || []
      });

    } catch (error) {
      console.error("Error loading ticket details:", error);
      toast.error("Failed to load ticket details");
    }
  };

  const handleCreateTicket = async () => {
    try {
      const { data, error } = await supabase
        .from("tickets")
        .insert({
          client_name: newTicket.client_name,
          client_email: newTicket.client_email,
          company: newTicket.company,
          issue: newTicket.issue,
          priority: newTicket.priority,
          status: 'New',
          assigned_to: 'Operations'
        })
        .select()
        .single();

      if (error) throw error;

      // Add initial history entry
      await supabase
        .from("ticket_history")
        .insert({
          ticket_id: data.id,
          user_name: "Admin",
          action: "Ticket created via Admin Portal."
        });

      toast.success(`New Ticket #${data.ticket_number} created!`);
      setIsCreateDialogOpen(false);
      setNewTicket({
        client_name: "",
        client_email: "",
        company: "",
        issue: "",
        priority: "Medium"
      });
      loadTickets();
    } catch (error) {
      console.error("Error creating ticket:", error);
      toast.error("Failed to create ticket");
    }
  };

  const handleUpdateTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("tickets")
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq("id", ticketId);

      if (error) throw error;

      // Add history entry
      await supabase
        .from("ticket_history")
        .insert({
          ticket_id: ticketId,
          user_name: "Admin",
          action: `Ticket status changed to ${newStatus}.`
        });

      toast.success(`Ticket status updated to ${newStatus}`);
      loadTickets();
      if (selectedTicket?.id === ticketId) {
        loadTicketDetails(ticketId);
      }
    } catch (error) {
      console.error("Error updating ticket:", error);
      toast.error("Failed to update ticket");
    }
  };

  const handleSendChat = async () => {
    if (!selectedTicket || !chatMessage.trim()) return;

    try {
      const { error } = await supabase
        .from("ticket_chat")
        .insert({
          ticket_id: selectedTicket.id,
          user_name: "Admin",
          message: chatMessage,
          sender_type: "sent"
        });

      if (error) throw error;

      // Add history entry
      await supabase
        .from("ticket_history")
        .insert({
          ticket_id: selectedTicket.id,
          user_name: "Admin",
          action: "Admin sent a chat message."
        });

      setChatMessage("");
      loadTicketDetails(selectedTicket.id);
      toast.success("Message sent");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    }
  };

  const handleAssignTicket = async (ticketId: string, employeeIds: string[]) => {
    try {
      // Remove existing assignments
      await supabase
        .from("ticket_assignments")
        .delete()
        .eq("ticket_id", ticketId);

      // Add new assignments
      if (employeeIds.length > 0) {
        const assignments = employeeIds.map(employeeId => ({
          ticket_id: ticketId,
          employee_id: employeeId,
          assigned_by: "Admin"
        }));

        const { error } = await supabase
          .from("ticket_assignments")
          .insert(assignments);

        if (error) throw error;

        // Add history entry
        const employeeNames = employees
          .filter(emp => employeeIds.includes(emp.whalesync_postgres_id))
          .map(emp => emp.full_name)
          .join(", ");

        await supabase
          .from("ticket_history")
          .insert({
            ticket_id: ticketId,
            user_name: "Admin",
            action: `Ticket assigned to: ${employeeNames}`
          });
      }

      toast.success("Ticket assignments updated successfully");
      setIsAssignDialogOpen(false);
      loadTickets();
    } catch (error) {
      console.error("Error assigning ticket:", error);
      toast.error("Failed to assign ticket");
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    if (!confirm("Are you sure you want to delete this ticket? This action cannot be undone.")) {
      return;
    }

    try {
      // Delete related records first
      await supabase
        .from("ticket_history")
        .delete()
        .eq("ticket_id", ticketId);

      await supabase
        .from("ticket_chat")
        .delete()
        .eq("ticket_id", ticketId);

      await supabase
        .from("ticket_assignments")
        .delete()
        .eq("ticket_id", ticketId);

      // Delete the ticket
      const { error } = await supabase
        .from("tickets")
        .delete()
        .eq("id", ticketId);

      if (error) throw error;

      toast.success("Ticket deleted successfully");
      loadTickets();
    } catch (error) {
      console.error("Error deleting ticket:", error);
      toast.error("Failed to delete ticket");
    }
  };

  const handleShareTicket = async () => {
    if (!selectedTicket || selectedEmployees.length === 0) return;

    try {
      // Create ticket assignments for selected employees
      const assignments = selectedEmployees.map(employeeId => ({
        ticket_id: selectedTicket.id,
        employee_id: employeeId,
        assigned_at: new Date().toISOString(),
        assigned_by: "Admin" // You can get this from current user context
      }));

      const { error } = await supabase
        .from("ticket_assignments")
        .insert(assignments);

      if (error) throw error;

      // Add history entry
      await supabase
        .from("ticket_history")
        .insert({
          ticket_id: selectedTicket.id,
          user_name: "Admin",
          action: `Ticket shared with ${selectedEmployees.length} employee(s).`
        });

      toast.success(`Ticket shared with ${selectedEmployees.length} employee(s)`);
      setIsShareDialogOpen(false);
      setSelectedEmployees([]);
      loadTickets();
    } catch (error) {
      console.error("Error sharing ticket:", error);
      toast.error("Failed to share ticket");
    }
  };

  const toggleEmployeeSelection = (employeeId: string) => {
    setSelectedEmployees(prev => 
      prev.includes(employeeId) 
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const toggleSelectAllEmployees = () => {
    if (selectedEmployees.length === employees.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(employees.map(emp => emp.whalesync_postgres_id));
    }
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
    if (sortField !== field) {
      return <ArrowUpDown className="ml-1.5 h-3.5 w-3.5 opacity-50" />;
    }
    return sortDirection === "asc" ? 
      <ArrowUp className="ml-1.5 h-3.5 w-3.5" /> : 
      <ArrowDown className="ml-1.5 h-3.5 w-3.5" />;
  };

  const handleDragStart = (e: React.DragEvent, ticket: Ticket) => {
    setDraggedTicket(ticket);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverColumn(status);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    setDragOverColumn(null);

    if (!draggedTicket || draggedTicket.status === newStatus) {
      setDraggedTicket(null);
      return;
    }

    try {
      const { error } = await supabase
        .from("tickets")
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq("id", draggedTicket.id);

      if (error) throw error;

      // Add history entry
      await supabase
        .from("ticket_history")
        .insert({
          ticket_id: draggedTicket.id,
          user_name: "Admin",
          action: `Ticket status changed from ${draggedTicket.status} to ${newStatus} via drag and drop.`
        });

      toast.success(`Ticket moved to ${newStatus}`);
      setDraggedTicket(null);
      loadTickets();
    } catch (error) {
      console.error("Error updating ticket status:", error);
      toast.error("Failed to update ticket status");
      setDraggedTicket(null);
    }
  };

  const filteredTickets = tickets
    .filter(ticket => {
      const matchesSearch = ticket.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           ticket.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           ticket.issue.toLowerCase().includes(searchTerm.toLowerCase());
      
      // If no filters are selected, show all tickets
      const matchesStatus = statusFilter.length === 0 || statusFilter.includes(ticket.status);
      const matchesPriority = priorityFilter.length === 0 || priorityFilter.includes(ticket.priority);
      
      let matchesTime = true;
      if (timeFilter.length > 0) {
        const ticketDate = new Date(ticket.created_at);
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        matchesTime = timeFilter.some(filter => {
          switch (filter) {
            case "Today": return ticketDate >= oneDayAgo;
            case "This Week": return ticketDate >= oneWeekAgo;
            case "This Month": return ticketDate >= oneMonthAgo;
            default: return true;
          }
        });
      }
      
      return matchesSearch && matchesStatus && matchesPriority && matchesTime;
    })
    .sort((a, b) => {
      let aValue: any = a[sortField as keyof typeof a];
      let bValue: any = b[sortField as keyof typeof b];

      // Handle different data types
      if (sortField === "created_at") {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else if (sortField === "ticket_number") {
        aValue = Number(aValue);
        bValue = Number(bValue);
      } else if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) {
        return sortDirection === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortDirection === "asc" ? 1 : -1;
      }
      return 0;
    });

  // Pagination logic
  const totalCount = filteredTickets.length;
  const totalPages = Math.ceil(totalCount / pageSize);
  const paginatedTickets = filteredTickets.slice(
    pageIndex * pageSize,
    (pageIndex + 1) * pageSize
  );

  // Reset to first page when filters change
  useEffect(() => {
    setPageIndex(0);
  }, [searchTerm, statusFilter, priorityFilter, timeFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "New": return "bg-blue-100 text-blue-800";
      case "In Progress": return "bg-yellow-100 text-yellow-800";
      case "Escalated": return "bg-orange-100 text-orange-800";
      case "Resolved": return "bg-green-100 text-green-800";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    return "border-primary";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex flex-col h-screen">
          {/* Header */}
          <SiteHeader title="Ticket Management" />

          {/* Main Content */}
          <div className="flex flex-col overflow-hidden flex-1">
            {/* Stats Cards */}
            <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 p-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">New</CardTitle>
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.new}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                  <Clock className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.inProgress}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Escalated</CardTitle>
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.escalated}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Resolved</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.resolved}</div>
                </CardContent>
              </Card>
            </div>

            {/* Action Bar */}
            <div className="flex flex-col gap-3 px-4 pb-3 flex-shrink-0">
              <div className="flex items-center gap-3 flex-wrap">
                <Input
                  placeholder="Search tickets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 min-w-[300px] h-10"
                />

                <div className="flex gap-2 items-center">
                  <Button onClick={() => setIsCreateDialogOpen(true)} className="h-10">
                    <Plus className="h-4 w-4 mr-2" />
                    Raise New Ticket
                  </Button>

                  {/* Status Filter */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-40 h-10 justify-between">
                        {statusFilter.length === 0 ? "All Status" : 
                         statusFilter.length === 1 ? statusFilter[0] : 
                         `${statusFilter.length} Status`}
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                      <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
                        Select Status
                      </div>
                      <div className="space-y-1">
                        {["New", "In Progress", "Escalated", "Resolved"].map(status => (
                          <div key={status} className="flex items-center space-x-2 px-2 py-1.5">
                            <Checkbox
                              id={`status-${status}`}
                              checked={statusFilter.includes(status)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setStatusFilter(prev => [...prev, status]);
                                } else {
                                  setStatusFilter(prev => prev.filter(s => s !== status));
                                }
                              }}
                            />
                            <Label htmlFor={`status-${status}`} className="text-sm cursor-pointer">
                              {status}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Priority Filter */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-40 h-10 justify-between">
                        {priorityFilter.length === 0 ? "All Priority" : 
                         priorityFilter.length === 1 ? priorityFilter[0] : 
                         `${priorityFilter.length} Priority`}
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                      <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
                        Select Priority
                      </div>
                      <div className="space-y-1">
                        {["Low", "Medium", "High", "Critical"].map(priority => (
                          <div key={priority} className="flex items-center space-x-2 px-2 py-1.5">
                            <Checkbox
                              id={`priority-${priority}`}
                              checked={priorityFilter.includes(priority)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setPriorityFilter(prev => [...prev, priority]);
                                } else {
                                  setPriorityFilter(prev => prev.filter(p => p !== priority));
                                }
                              }}
                            />
                            <Label htmlFor={`priority-${priority}`} className="text-sm cursor-pointer">
                              {priority}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Time Filter */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-40 h-10 justify-between">
                        {timeFilter.length === 0 ? "All Time" : 
                         timeFilter.length === 1 ? timeFilter[0] : 
                         `${timeFilter.length} Time`}
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                      <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
                        Select Time Range
                      </div>
                      <div className="space-y-1">
                        {["Today", "This Week", "This Month"].map(time => (
                          <div key={time} className="flex items-center space-x-2 px-2 py-1.5">
                            <Checkbox
                              id={`time-${time}`}
                              checked={timeFilter.includes(time)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setTimeFilter(prev => [...prev, time]);
                                } else {
                                  setTimeFilter(prev => prev.filter(t => t !== time));
                                }
                              }}
                            />
                            <Label htmlFor={`time-${time}`} className="text-sm cursor-pointer">
                              {time}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* View Toggle Buttons */}
                  <div className="flex items-center gap-1 border rounded-md p-1">
                    <Button
                      variant={!showKanban ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setShowKanban(false)}
                      className="h-8 w-8 p-0"
                      title="Table View"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={showKanban ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setShowKanban(true)}
                      className="h-8 w-8 p-0"
                      title="Kanban View"
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Customize Columns Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="h-10">
                        <Settings className="h-4 w-4 mr-2" />
                        Customize Columns
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
                        Show/Hide Columns
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2 px-2 py-1.5">
                          <Checkbox
                            id="dropdown-ticket-number"
                            checked={visibleColumns.ticketNumber}
                            onCheckedChange={(checked) => 
                              setVisibleColumns(prev => ({ ...prev, ticketNumber: !!checked }))
                            }
                          />
                          <Label htmlFor="dropdown-ticket-number" className="text-sm cursor-pointer">Ticket #</Label>
                        </div>
                        <div className="flex items-center space-x-2 px-2 py-1.5">
                          <Checkbox
                            id="dropdown-company"
                            checked={visibleColumns.company}
                            onCheckedChange={(checked) => 
                              setVisibleColumns(prev => ({ ...prev, company: !!checked }))
                            }
                          />
                          <Label htmlFor="dropdown-company" className="text-sm cursor-pointer">Company</Label>
                        </div>
                        <div className="flex items-center space-x-2 px-2 py-1.5">
                          <Checkbox
                            id="dropdown-client"
                            checked={visibleColumns.client}
                            onCheckedChange={(checked) => 
                              setVisibleColumns(prev => ({ ...prev, client: !!checked }))
                            }
                          />
                          <Label htmlFor="dropdown-client" className="text-sm cursor-pointer">Client</Label>
                        </div>
                        <div className="flex items-center space-x-2 px-2 py-1.5">
                          <Checkbox
                            id="dropdown-issue"
                            checked={visibleColumns.issue}
                            onCheckedChange={(checked) => 
                              setVisibleColumns(prev => ({ ...prev, issue: !!checked }))
                            }
                          />
                          <Label htmlFor="dropdown-issue" className="text-sm cursor-pointer">Issue</Label>
                        </div>
                        <div className="flex items-center space-x-2 px-2 py-1.5">
                          <Checkbox
                            id="dropdown-status"
                            checked={visibleColumns.status}
                            onCheckedChange={(checked) => 
                              setVisibleColumns(prev => ({ ...prev, status: !!checked }))
                            }
                          />
                          <Label htmlFor="dropdown-status" className="text-sm cursor-pointer">Status</Label>
                        </div>
                        <div className="flex items-center space-x-2 px-2 py-1.5">
                          <Checkbox
                            id="dropdown-priority"
                            checked={visibleColumns.priority}
                            onCheckedChange={(checked) => 
                              setVisibleColumns(prev => ({ ...prev, priority: !!checked }))
                            }
                          />
                          <Label htmlFor="dropdown-priority" className="text-sm cursor-pointer">Priority</Label>
                        </div>
                        <div className="flex items-center space-x-2 px-2 py-1.5">
                          <Checkbox
                            id="dropdown-assigned-to"
                            checked={visibleColumns.assignedTo}
                            onCheckedChange={(checked) => 
                              setVisibleColumns(prev => ({ ...prev, assignedTo: !!checked }))
                            }
                          />
                          <Label htmlFor="dropdown-assigned-to" className="text-sm cursor-pointer">Assigned To</Label>
                        </div>
                        <div className="flex items-center space-x-2 px-2 py-1.5">
                          <Checkbox
                            id="dropdown-created"
                            checked={visibleColumns.created}
                            onCheckedChange={(checked) => 
                              setVisibleColumns(prev => ({ ...prev, created: !!checked }))
                            }
                          />
                          <Label htmlFor="dropdown-created" className="text-sm cursor-pointer">Created</Label>
                        </div>
                        <div className="flex items-center space-x-2 px-2 py-1.5">
                          <Checkbox
                            id="dropdown-actions"
                            checked={visibleColumns.actions}
                            onCheckedChange={(checked) => 
                              setVisibleColumns(prev => ({ ...prev, actions: !!checked }))
                            }
                          />
                          <Label htmlFor="dropdown-actions" className="text-sm cursor-pointer">Actions</Label>
                        </div>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            {/* Tickets List */}
            <div className="flex-1 overflow-hidden px-4">
              <div className="h-full overflow-auto">
                {loading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-muted-foreground">Loading tickets...</div>
                  </div>
                ) : paginatedTickets.length > 0 ? (
                  showKanban ? (
                    // Kanban View
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* New Column */}
                      <div 
                        className={`space-y-3 p-3 rounded-lg transition-colors border ${
                          dragOverColumn === 'New' ? 'bg-primary/10 border-primary border-2 border-dashed' : 'bg-muted/30 border-border'
                        }`}
                        onDragOver={(e) => handleDragOver(e, 'New')}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, 'New')}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <h3 className="font-semibold text-foreground">New ({filteredTickets.filter(t => t.status === 'New').length})</h3>
                        </div>
                        {filteredTickets.filter(t => t.status === 'New').map(ticket => (
                          <Card 
                            key={ticket.id} 
                            className={`hover:shadow-md transition-shadow cursor-pointer border-l-4 ${getPriorityColor(ticket.priority)} ${
                              draggedTicket?.id === ticket.id ? 'opacity-50' : ''
                            }`}
                            draggable
                            onDragStart={(e) => handleDragStart(e, ticket)}
                            onClick={() => {
                              loadTicketDetails(ticket.id);
                              setIsDetailsDialogOpen(true);
                            }}
                          >
                            <CardContent className="p-3">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <GripVertical className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">#{ticket.ticket_number}</span>
                                  </div>
                                  <Badge variant="outline" className="text-xs">
                                    {ticket.priority}
                                  </Badge>
                                </div>
                                <h4 className="font-semibold text-sm line-clamp-1">{ticket.company}</h4>
                                <p className="text-xs text-muted-foreground line-clamp-2">{ticket.issue}</p>
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                  <span>{ticket.client_name}</span>
                                  <span>{formatDate(ticket.created_at)}</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      {/* In Progress Column */}
                      <div 
                        className={`space-y-3 p-3 rounded-lg transition-colors border ${
                          dragOverColumn === 'In Progress' ? 'bg-primary/10 border-primary border-2 border-dashed' : 'bg-muted/30 border-border'
                        }`}
                        onDragOver={(e) => handleDragOver(e, 'In Progress')}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, 'In Progress')}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                          <h3 className="font-semibold text-foreground">In Progress ({filteredTickets.filter(t => t.status === 'In Progress').length})</h3>
                        </div>
                        {filteredTickets.filter(t => t.status === 'In Progress').map(ticket => (
                          <Card 
                            key={ticket.id} 
                            className={`hover:shadow-md transition-shadow cursor-pointer border-l-4 ${getPriorityColor(ticket.priority)} ${
                              draggedTicket?.id === ticket.id ? 'opacity-50' : ''
                            }`}
                            draggable
                            onDragStart={(e) => handleDragStart(e, ticket)}
                            onClick={() => {
                              loadTicketDetails(ticket.id);
                              setIsDetailsDialogOpen(true);
                            }}
                          >
                            <CardContent className="p-3">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <GripVertical className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">#{ticket.ticket_number}</span>
                                  </div>
                                  <Badge variant="outline" className="text-xs">
                                    {ticket.priority}
                                  </Badge>
                                </div>
                                <h4 className="font-semibold text-sm line-clamp-1">{ticket.company}</h4>
                                <p className="text-xs text-muted-foreground line-clamp-2">{ticket.issue}</p>
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                  <span>{ticket.client_name}</span>
                                  <span>{formatDate(ticket.created_at)}</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      {/* Escalated Column */}
                      <div 
                        className={`space-y-3 p-3 rounded-lg transition-colors border ${
                          dragOverColumn === 'Escalated' ? 'bg-primary/10 border-primary border-2 border-dashed' : 'bg-muted/30 border-border'
                        }`}
                        onDragOver={(e) => handleDragOver(e, 'Escalated')}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, 'Escalated')}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                          <h3 className="font-semibold text-foreground">Escalated ({filteredTickets.filter(t => t.status === 'Escalated').length})</h3>
                        </div>
                        {filteredTickets.filter(t => t.status === 'Escalated').map(ticket => (
                          <Card 
                            key={ticket.id} 
                            className={`hover:shadow-md transition-shadow cursor-pointer border-l-4 ${getPriorityColor(ticket.priority)} ${
                              draggedTicket?.id === ticket.id ? 'opacity-50' : ''
                            }`}
                            draggable
                            onDragStart={(e) => handleDragStart(e, ticket)}
                            onClick={() => {
                              loadTicketDetails(ticket.id);
                              setIsDetailsDialogOpen(true);
                            }}
                          >
                            <CardContent className="p-3">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <GripVertical className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">#{ticket.ticket_number}</span>
                                  </div>
                                  <Badge variant="outline" className="text-xs">
                                    {ticket.priority}
                                  </Badge>
                                </div>
                                <h4 className="font-semibold text-sm line-clamp-1">{ticket.company}</h4>
                                <p className="text-xs text-muted-foreground line-clamp-2">{ticket.issue}</p>
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                  <span>{ticket.client_name}</span>
                                  <span>{formatDate(ticket.created_at)}</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      {/* Resolved Column */}
                      <div 
                        className={`space-y-3 p-3 rounded-lg transition-colors border ${
                          dragOverColumn === 'Resolved' ? 'bg-primary/10 border-primary border-2 border-dashed' : 'bg-muted/30 border-border'
                        }`}
                        onDragOver={(e) => handleDragOver(e, 'Resolved')}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, 'Resolved')}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <h3 className="font-semibold text-foreground">Resolved ({filteredTickets.filter(t => t.status === 'Resolved').length})</h3>
                        </div>
                        {filteredTickets.filter(t => t.status === 'Resolved').map(ticket => (
                          <Card 
                            key={ticket.id} 
                            className={`hover:shadow-md transition-shadow cursor-pointer border-l-4 ${getPriorityColor(ticket.priority)} ${
                              draggedTicket?.id === ticket.id ? 'opacity-50' : ''
                            }`}
                            draggable
                            onDragStart={(e) => handleDragStart(e, ticket)}
                            onClick={() => {
                              loadTicketDetails(ticket.id);
                              setIsDetailsDialogOpen(true);
                            }}
                          >
                            <CardContent className="p-3">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <GripVertical className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">#{ticket.ticket_number}</span>
                                  </div>
                                  <Badge variant="outline" className="text-xs">
                                    {ticket.priority}
                                  </Badge>
                                </div>
                                <h4 className="font-semibold text-sm line-clamp-1">{ticket.company}</h4>
                                <p className="text-xs text-muted-foreground line-clamp-2">{ticket.issue}</p>
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                  <span>{ticket.client_name}</span>
                                  <span>{formatDate(ticket.created_at)}</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ) : (
                    // Table View
                    <div className="w-full rounded-md border overflow-hidden">
                      <Table className="table-fixed w-full">
                        <colgroup>
                          <col className="w-[80px]" />
                          <col className="w-[120px]" />
                          <col className="w-[140px]" />
                          <col className="w-[200px]" />
                          <col className="w-[100px]" />
                          <col className="w-[100px]" />
                          <col className="w-[120px]" />
                          <col className="w-[120px]" />
                          <col className="w-[120px]" />
                        </colgroup>
                        <TableHeader>
                          <TableRow className="bg-muted/50 hover:bg-muted/50">
                            {visibleColumns.ticketNumber && (
                              <TableHead className="text-xs font-semibold text-foreground px-3 py-3">
                                <Button
                                  variant="ghost"
                                  onClick={() => handleSort("ticket_number")}
                                  className="h-7 px-2 hover:bg-transparent text-xs font-semibold"
                                >
                                  Ticket #
                                  {getSortIcon("ticket_number")}
                                </Button>
                              </TableHead>
                            )}
                            {visibleColumns.company && (
                              <TableHead className="text-xs font-semibold text-foreground px-3 py-3">
                                <Button
                                  variant="ghost"
                                  onClick={() => handleSort("company")}
                                  className="h-7 px-2 hover:bg-transparent text-xs font-semibold"
                                >
                                  Company
                                  {getSortIcon("company")}
                                </Button>
                              </TableHead>
                            )}
                            {visibleColumns.client && (
                              <TableHead className="text-xs font-semibold text-foreground px-3 py-3">
                                <Button
                                  variant="ghost"
                                  onClick={() => handleSort("client_name")}
                                  className="h-7 px-2 hover:bg-transparent text-xs font-semibold"
                                >
                                  Client
                                  {getSortIcon("client_name")}
                                </Button>
                              </TableHead>
                            )}
                            {visibleColumns.issue && (
                              <TableHead className="text-xs font-semibold text-foreground px-3 py-3">
                                <Button
                                  variant="ghost"
                                  onClick={() => handleSort("issue")}
                                  className="h-7 px-2 hover:bg-transparent text-xs font-semibold"
                                >
                                  Issue
                                  {getSortIcon("issue")}
                                </Button>
                              </TableHead>
                            )}
                            {visibleColumns.status && (
                              <TableHead className="text-xs font-semibold text-foreground px-3 py-3">
                                <Button
                                  variant="ghost"
                                  onClick={() => handleSort("status")}
                                  className="h-7 px-2 hover:bg-transparent text-xs font-semibold"
                                >
                                  Status
                                  {getSortIcon("status")}
                                </Button>
                              </TableHead>
                            )}
                            {visibleColumns.priority && (
                              <TableHead className="text-xs font-semibold text-foreground px-3 py-3">
                                <Button
                                  variant="ghost"
                                  onClick={() => handleSort("priority")}
                                  className="h-7 px-2 hover:bg-transparent text-xs font-semibold"
                                >
                                  Priority
                                  {getSortIcon("priority")}
                                </Button>
                              </TableHead>
                            )}
                            {visibleColumns.assignedTo && (
                              <TableHead className="text-xs font-semibold text-foreground px-3 py-3">
                                <Button
                                  variant="ghost"
                                  onClick={() => handleSort("assigned_to")}
                                  className="h-7 px-2 hover:bg-transparent text-xs font-semibold"
                                >
                                  Assigned To
                                  {getSortIcon("assigned_to")}
                                </Button>
                              </TableHead>
                            )}
                            {visibleColumns.created && (
                              <TableHead className="text-xs font-semibold text-foreground px-3 py-3">
                                <Button
                                  variant="ghost"
                                  onClick={() => handleSort("created_at")}
                                  className="h-7 px-2 hover:bg-transparent text-xs font-semibold"
                                >
                                  Created
                                  {getSortIcon("created_at")}
                                </Button>
                              </TableHead>
                            )}
                            {visibleColumns.actions && (
                              <TableHead className="text-xs font-semibold text-foreground px-3 py-3">Actions</TableHead>
                            )}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedTickets.map(ticket => (
                            <TableRow 
                              key={ticket.id} 
                              className="border-b border-border hover:bg-muted/30 transition-colors cursor-pointer"
                              onClick={() => {
                                loadTicketDetails(ticket.id);
                                setIsDetailsDialogOpen(true);
                              }}
                            >
                              {visibleColumns.ticketNumber && (
                                <TableCell className="py-3 px-3">
                                  <span className="text-sm font-medium text-muted-foreground">
                                    #{ticket.ticket_number}
                                  </span>
                                </TableCell>
                              )}
                              {visibleColumns.company && (
                                <TableCell className="py-3 px-3">
                                  <div className="font-semibold text-sm">{ticket.company}</div>
                                </TableCell>
                              )}
                              {visibleColumns.client && (
                                <TableCell className="py-3 px-3">
                                  <div className="text-sm truncate" title={ticket.client_name}>{ticket.client_name}</div>
                                  <div className="text-xs text-muted-foreground truncate" title={ticket.client_email}>{ticket.client_email}</div>
                                </TableCell>
                              )}
                              {visibleColumns.issue && (
                                <TableCell className="py-3 px-3">
                                  <div className="text-sm truncate" title={ticket.issue}>
                                    {ticket.issue}
                                  </div>
                                </TableCell>
                              )}
                              {visibleColumns.status && (
                                <TableCell className="py-3 px-3">
                                  <Badge className={getStatusColor(ticket.status)}>
                                    {ticket.status}
                                  </Badge>
                                </TableCell>
                              )}
                              {visibleColumns.priority && (
                                <TableCell className="py-3 px-3">
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs ${
                                      ticket.priority === 'Critical' ? 'border-red-500 text-red-700' :
                                      ticket.priority === 'High' ? 'border-orange-500 text-orange-700' :
                                      ticket.priority === 'Medium' ? 'border-yellow-500 text-yellow-700' :
                                      'border-green-500 text-green-700'
                                    }`}
                                  >
                                    {ticket.priority}
                                  </Badge>
                                </TableCell>
                              )}
                              {visibleColumns.assignedTo && (
                                <TableCell className="py-3 px-3">
                                  <div className="text-sm">{ticket.assigned_to}</div>
                                </TableCell>
                              )}
                              {visibleColumns.created && (
                                <TableCell className="py-3 px-3">
                                  <div className="text-sm">{formatDate(ticket.created_at)}</div>
                                </TableCell>
                              )}
                              {visibleColumns.actions && (
                                <TableCell className="py-3 px-3">
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      loadTicketDetails(ticket.id);
                                      setIsDetailsDialogOpen(true);
                                    }}
                                    className="h-8 px-2"
                                    title="View Ticket"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // For now, just open the details dialog for editing
                                      // You can implement a separate edit dialog later
                                      loadTicketDetails(ticket.id);
                                      setIsDetailsDialogOpen(true);
                                    }}
                                    className="h-8 px-2"
                                    title="Edit Ticket"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedTicket(ticket);
                                      setSelectedEmployees([]);
                                      setIsShareDialogOpen(true);
                                    }}
                                    className="h-8 px-2"
                                    title="Share Ticket"
                                  >
                                    <Share2 className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteTicket(ticket.id);
                                    }}
                                    className="h-8 px-2"
                                    title="Delete Ticket"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                                </TableCell>
                              )}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )
                ) : (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No tickets found</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Pagination */}
            {paginatedTickets.length > 0 && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-3 border-t border-border bg-muted/20 px-4 flex-shrink-0">
                <div className="text-sm text-muted-foreground">
                  Showing {pageIndex * pageSize + 1} to {Math.min((pageIndex + 1) * pageSize, totalCount)} of {totalCount} tickets
                </div>
                
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pageIndex === 0}
                    onClick={() => setPageIndex(0)}
                    className="h-9"
                  >
                    First
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pageIndex === 0}
                    onClick={() => setPageIndex((prev) => Math.max(prev - 1, 0))}
                    className="h-9"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={(pageIndex + 1) * pageSize >= totalCount}
                    onClick={() => setPageIndex((prev) => prev + 1)}
                    className="h-9"
                  >
                    Next
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={(pageIndex + 1) * pageSize >= totalCount}
                    onClick={() => setPageIndex(totalPages - 1)}
                    className="h-9"
                  >
                    Last
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Create Ticket Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Raise a New Query</DialogTitle>
              <DialogDescription>
                Create a new support ticket for a client.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="client_name">Client Name *</Label>
                <Input
                  id="client_name"
                  value={newTicket.client_name}
                  onChange={(e) => setNewTicket({ ...newTicket, client_name: e.target.value })}
                  placeholder="Enter client name"
                />
              </div>
              <div>
                <Label htmlFor="client_email">Client Email *</Label>
                <Input
                  id="client_email"
                  type="email"
                  value={newTicket.client_email}
                  onChange={(e) => setNewTicket({ ...newTicket, client_email: e.target.value })}
                  placeholder="Enter client email"
                />
              </div>
              <div>
                <Label htmlFor="company">Company Name *</Label>
                <Input
                  id="company"
                  value={newTicket.company}
                  onChange={(e) => setNewTicket({ ...newTicket, company: e.target.value })}
                  placeholder="Enter company name"
                />
              </div>
              <div>
                <Label htmlFor="issue">Issue / Query *</Label>
                <Textarea
                  id="issue"
                  rows={4}
                  value={newTicket.issue}
                  onChange={(e) => setNewTicket({ ...newTicket, issue: e.target.value })}
                  placeholder="Describe the issue or query"
                />
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={newTicket.priority} onValueChange={(value) => setNewTicket({ ...newTicket, priority: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTicket}>
                Create Ticket
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Ticket Details Dialog */}
        <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Ticket #{selectedTicket?.ticket_number}: {selectedTicket?.company}</DialogTitle>
              <DialogDescription>
                {selectedTicket?.issue}
              </DialogDescription>
            </DialogHeader>
            
            {selectedTicket && (
              <div className="space-y-6">
                {/* Ticket Actions */}
                <div className="flex flex-wrap gap-2">
                  {selectedTicket.status !== 'Resolved' && (
                    <Button
                      onClick={() => handleUpdateTicketStatus(selectedTicket.id, 'Resolved')}
                      className="bg-green-500 hover:bg-green-600"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark as Resolved
                    </Button>
                  )}
                  {selectedTicket.status === 'In Progress' && (
                    <Button
                      onClick={() => handleUpdateTicketStatus(selectedTicket.id, 'Escalated')}
                      className="bg-orange-500 hover:bg-orange-600"
                    >
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Escalate to Admin
                    </Button>
                  )}
                  <Button
                    onClick={() => setIsAssignDialogOpen(true)}
                    variant="outline"
                    className="border-blue-500 text-blue-500 hover:bg-blue-50"
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    Assign to Employee
                  </Button>
                </div>

                {/* Client Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Client Details</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>Contact:</strong> {selectedTicket.client_name}</p>
                      <p><strong>Email:</strong> {selectedTicket.client_email}</p>
                      <p><strong>Submitted:</strong> {formatDate(selectedTicket.created_at)}</p>
                      <p><strong>Updated:</strong> {formatDate(selectedTicket.updated_at)}</p>
                      <p><strong>Assigned:</strong> {selectedTicket.assigned_to}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Status & Priority</h4>
                    <div className="space-y-2">
                      <Badge className={getStatusColor(selectedTicket.status)}>
                        {selectedTicket.status}
                      </Badge>
                      <Badge variant="outline">
                        {selectedTicket.priority} Priority
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Chat Section */}
                <div>
                  <h4 className="font-semibold mb-4">Internal Chat</h4>
                  <div className="border rounded-lg p-4 max-h-60 overflow-y-auto space-y-4">
                    {selectedTicket.chat && selectedTicket.chat.length > 0 ? (
                      selectedTicket.chat.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.sender_type === 'sent' ? 'justify-end' : 'justify-start'}`}>
                          <div className="max-w-xs">
                            <p className="text-xs text-muted-foreground mb-1">
                              {msg.user_name}
                            </p>
                            <div className={`p-3 rounded-lg ${
                              msg.sender_type === 'sent' 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-gray-100 text-gray-900'
                            }`}>
                              <p className="text-sm">{msg.message}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-sm text-muted-foreground py-4">
                        No chat messages yet.
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 mt-4">
                    <Input
                      placeholder="Type message..."
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendChat()}
                    />
                    <Button onClick={handleSendChat} size="sm">
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Ticket History */}
                <div>
                  <h4 className="font-semibold mb-4">Ticket History</h4>
                  <div className="space-y-4">
                    {selectedTicket.history && selectedTicket.history.map((entry, index) => (
                      <div key={entry.id} className="flex items-start">
                        <div className="relative flex-shrink-0">
                          <div className="w-4 h-4 bg-gray-400 rounded-full mt-1"></div>
                          {index !== selectedTicket.history!.length - 1 && (
                            <div className="absolute top-5 left-1/2 -translate-x-1/2 w-0.5 h-full bg-gray-300"></div>
                          )}
                        </div>
                        <div className="ml-4 flex-1">
                          <p className="text-sm font-medium">{entry.action}</p>
                          <p className="text-xs text-muted-foreground">
                            {entry.user_name} • {formatDate(entry.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Assign Ticket Dialog */}
        <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Assign Ticket to Employees</DialogTitle>
              <DialogDescription>
                Select employees to assign this ticket to. You can assign to multiple employees.
              </DialogDescription>
            </DialogHeader>
            
            {selectedTicket && (
              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold">Ticket #{selectedTicket.ticket_number}</h4>
                  <p className="text-sm text-muted-foreground">{selectedTicket.company} - {selectedTicket.issue}</p>
                </div>
                
                <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-3">
                  {employees.map(employee => (
                    <div key={employee.whalesync_postgres_id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={employee.whalesync_postgres_id}
                        className="rounded border-gray-300"
                        onChange={(e) => {
                          // Handle checkbox change
                        }}
                      />
                      <label htmlFor={employee.whalesync_postgres_id} className="text-sm flex items-center gap-2">
                        {employee.profile_photo && (
                          <img 
                            src={employee.profile_photo} 
                            alt={employee.full_name}
                            className="w-6 h-6 rounded-full"
                          />
                        )}
                        {employee.full_name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                // Handle assignment
                const selectedEmployees = employees.filter(emp => {
                  const checkbox = document.getElementById(emp.whalesync_postgres_id) as HTMLInputElement;
                  return checkbox?.checked;
                }).map(emp => emp.whalesync_postgres_id);
                
                if (selectedTicket) {
                  handleAssignTicket(selectedTicket.id, selectedEmployees);
                }
              }}>
                <UserPlus className="h-4 w-4 mr-2" />
                Assign Ticket
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Share Ticket Dialog */}
        <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Share Ticket with Employees</DialogTitle>
              <DialogDescription>
                Select employees to share this ticket with. They will be able to view and collaborate on this ticket.
                {employees.length > 0 && ` (${employees.length} employees available)`}
              </DialogDescription>
            </DialogHeader>
            
            {selectedTicket && (
              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold">Ticket #{selectedTicket.ticket_number}</h4>
                  <p className="text-sm text-muted-foreground">{selectedTicket.company} - {selectedTicket.issue}</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Select Employees</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleSelectAllEmployees}
                      className="text-xs"
                    >
                      {selectedEmployees.length === employees.length ? "Deselect All" : "Select All"}
                    </Button>
                  </div>
                  
                  <div className="max-h-60 overflow-y-auto border rounded-md p-3 space-y-2">
                    {employees.length === 0 ? (
                      <div className="text-center text-muted-foreground py-4">
                        No employees found. Loading...
                      </div>
                    ) : (
                      employees.map(employee => (
                      <div key={employee.whalesync_postgres_id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`share-${employee.whalesync_postgres_id}`}
                          checked={selectedEmployees.includes(employee.whalesync_postgres_id)}
                          onCheckedChange={() => toggleEmployeeSelection(employee.whalesync_postgres_id)}
                        />
                        <label 
                          htmlFor={`share-${employee.whalesync_postgres_id}`} 
                          className="text-sm flex items-center gap-2 cursor-pointer flex-1"
                        >
                          {employee.profile_photo ? (
                            <img 
                              src={employee.profile_photo} 
                              alt={employee.full_name}
                              className="w-6 h-6 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                              {employee.full_name.charAt(0)}
                            </div>
                          )}
                          <span className="font-medium">{employee.full_name}</span>
                          <span className="text-muted-foreground text-xs">({employee.job_title || 'No Title'})</span>
                        </label>
                      </div>
                    ))
                    )}
                  </div>
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsShareDialogOpen(false);
                setSelectedEmployees([]);
              }}>
                Cancel
              </Button>
              <Button 
                onClick={handleShareTicket}
                disabled={selectedEmployees.length === 0}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share with {selectedEmployees.length} Employee{selectedEmployees.length !== 1 ? 's' : ''}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </SidebarInset>
    </SidebarProvider>
  );
}

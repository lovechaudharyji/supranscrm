"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  Table,
  Settings
} from "lucide-react";
import { Table as TableComponent, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors, useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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

export default function EmployeeTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [viewMode, setViewMode] = useState<'table' | 'list' | 'kanban'>('table');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    inProgress: 0,
    escalated: 0,
    resolved: 0
  });
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(null);
  const [showColumnPopover, setShowColumnPopover] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    ticket: true,
    company: true,
    client: true,
    status: true,
    priority: true,
    created: true,
    actions: true
  });
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [newTicket, setNewTicket] = useState({
    client_name: "",
    client_email: "",
    company: "",
    issue: "",
    priority: "Medium"
  });

  const [chatMessage, setChatMessage] = useState("");

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadTickets();
    }
  }, [currentUser, statusFilter, priorityFilter, timeFilter]);

  const loadCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("User not authenticated");
        return;
      }

      // Get employee data
      const { data: employeeData, error: employeeError } = await supabase
        .from("Employee Directory")
        .select("whalesync_postgres_id, full_name")
        .eq("official_email", user.email)
        .single();

      if (employeeError || !employeeData) {
        console.error("Employee lookup error:", employeeError);
        toast.error("Employee profile not found");
        return;
      }

      setCurrentUser(employeeData);
    } catch (error) {
      console.error("Error loading user:", error);
      toast.error("Failed to load user data");
    }
  };

  const loadTickets = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      
      // First get assigned tickets for this employee
      const { data: assignments, error: assignmentsError } = await supabase
        .from("ticket_assignments")
        .select("ticket_id")
        .eq("employee_id", currentUser.whalesync_postgres_id);

      if (assignmentsError) {
        console.error("Error loading assignments:", assignmentsError);
        throw assignmentsError;
      }

      if (!assignments || assignments.length === 0) {
        setTickets([]);
        setStats({ total: 0, new: 0, inProgress: 0, escalated: 0, resolved: 0 });
        return;
      }

      const ticketIds = assignments.map(a => a.ticket_id);

      // Build date filter
      let dateFilter = "";
      const now = new Date();
      switch (timeFilter) {
        case "yesterday":
          const yesterday = new Date(now);
          yesterday.setDate(yesterday.getDate() - 1);
          dateFilter = `created_at >= '${yesterday.toISOString().split('T')[0]}' AND created_at < '${now.toISOString().split('T')[0]}'`;
          break;
        case "7days":
          const weekAgo = new Date(now);
          weekAgo.setDate(weekAgo.getDate() - 7);
          dateFilter = `created_at >= '${weekAgo.toISOString()}'`;
          break;
        case "2weeks":
          const twoWeeksAgo = new Date(now);
          twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
          dateFilter = `created_at >= '${twoWeeksAgo.toISOString()}'`;
          break;
        case "thismonth":
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          dateFilter = `created_at >= '${startOfMonth.toISOString()}'`;
          break;
      }

      // Build query for assigned tickets only
      let query = supabase
        .from("tickets")
        .select("*")
        .in("id", ticketIds);
      
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }
      
      if (priorityFilter !== "all") {
        query = query.eq("priority", priorityFilter);
      }

      const { data: ticketsData, error: ticketsError } = await query
        .order("created_at", { ascending: false });

      if (ticketsError) {
        console.error("Tickets error:", ticketsError);
        throw ticketsError;
      }

      // Apply date filter in JavaScript if needed
      let filteredTickets = ticketsData || [];
      if (dateFilter && timeFilter !== "all") {
        const now = new Date();
        filteredTickets = ticketsData?.filter(ticket => {
          const ticketDate = new Date(ticket.created_at);
          switch (timeFilter) {
            case "yesterday":
              const yesterday = new Date(now);
              yesterday.setDate(yesterday.getDate() - 1);
              return ticketDate >= yesterday && ticketDate < now;
            case "7days":
              const weekAgo = new Date(now);
              weekAgo.setDate(weekAgo.getDate() - 7);
              return ticketDate >= weekAgo;
            case "2weeks":
              const twoWeeksAgo = new Date(now);
              twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
              return ticketDate >= twoWeeksAgo;
            case "thismonth":
              const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
              return ticketDate >= startOfMonth;
            default:
              return true;
          }
        }) || [];
      }

      setTickets(filteredTickets);

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
          user_name: "Employee",
          action: "Ticket created via Employee Portal."
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
          user_name: "Employee",
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
          user_name: "Employee",
          message: chatMessage,
          sender_type: "sent"
        });

      if (error) throw error;

      // Add history entry
      await supabase
        .from("ticket_history")
        .insert({
          ticket_id: selectedTicket.id,
          user_name: "Employee",
          action: "Employee sent a chat message."
        });

      setChatMessage("");
      loadTicketDetails(selectedTicket.id);
      toast.success("Message sent");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.issue.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Sort tickets
  const sortedTickets = [...filteredTickets].sort((a, b) => {
    if (!sortColumn || !sortDirection) return 0;

    let aValue: any;
    let bValue: any;

    switch (sortColumn) {
      case "ticket_number":
        aValue = a.ticket_number;
        bValue = b.ticket_number;
        break;
      case "company":
        aValue = a.company?.toLowerCase() || "";
        bValue = b.company?.toLowerCase() || "";
        break;
      case "client_name":
        aValue = a.client_name?.toLowerCase() || "";
        bValue = b.client_name?.toLowerCase() || "";
        break;
      case "status":
        aValue = a.status?.toLowerCase() || "";
        bValue = b.status?.toLowerCase() || "";
        break;
      case "priority":
        aValue = a.priority?.toLowerCase() || "";
        bValue = b.priority?.toLowerCase() || "";
        break;
      case "created_at":
        aValue = a.created_at ? new Date(a.created_at).getTime() : 0;
        bValue = b.created_at ? new Date(b.created_at).getTime() : 0;
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  // Pagination logic
  const totalCount = sortedTickets.length;
  const totalPages = Math.ceil(totalCount / pageSize);
  const paginatedTickets = sortedTickets.slice(
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
    switch (priority) {
      case "Low": return "border-green-500";
      case "Medium": return "border-yellow-500";
      case "High": return "border-orange-500";
      case "Critical": return "border-red-500";
      default: return "border-slate-300";
    }
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

  const handleSort = (column: string) => {
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

  const getSortIcon = (column: string) => {
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

  const toggleColumn = (column: string) => {
    setVisibleColumns(prev => ({
      ...prev,
      [column]: !prev[column]
    }));
  };

  const resetColumns = () => {
    setVisibleColumns({
      ticket: true,
      company: true,
      client: true,
      status: true,
      priority: true,
      created: true,
      actions: true
    });
  };

  // Drag and Drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const ticket = filteredTickets.find(t => t.id === active.id);
    setActiveTicket(ticket || null);
    setIsDragging(true);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTicket(null);
    setIsDragging(false);

    if (!over || !active) return;

    const ticketId = active.id as string;
    const newStatus = over.id as string;

    // Find the ticket
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket || ticket.status === newStatus) return;

    // Update ticket status
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
          user_name: "Employee",
          action: `Ticket status changed to ${newStatus} via drag and drop.`
        });

      toast.success(`Ticket status updated to ${newStatus}`);
      loadTickets();
    } catch (error) {
      console.error("Error updating ticket status:", error);
      toast.error("Failed to update ticket status");
    }
  };

  // Draggable Ticket Component
  const DraggableTicket = ({ ticket }: { ticket: Ticket }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: ticket.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    return (
      <Card
        ref={setNodeRef}
        style={style}
        className={`hover:shadow-md transition-shadow cursor-pointer border-l-4 ${getPriorityColor(ticket.priority)} bg-gradient-to-t from-primary/5 to-card shadow-xs ${
          isDragging ? 'opacity-50' : ''
        }`}
        onClick={() => {
          loadTicketDetails(ticket.id);
          setIsDetailsDialogOpen(true);
        }}
        {...attributes}
        {...listeners}
      >
        <CardContent className="p-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">#{ticket.ticket_number}</span>
              <Badge variant="outline" className="text-xs">
                {ticket.priority}
              </Badge>
            </div>
            <h4 className="text-sm font-medium line-clamp-1 text-foreground">{ticket.company}</h4>
            <p className="text-xs text-muted-foreground line-clamp-2">{ticket.issue}</p>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{ticket.client_name}</span>
              <span>{formatDate(ticket.created_at)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Droppable Column Component
  const DroppableColumn = ({ status, children }: { status: string; children: React.ReactNode }) => {
    const { isOver, setNodeRef } = useDroppable({
      id: status,
    });

    return (
      <div
        ref={setNodeRef}
        className={`space-y-3 min-h-[200px] p-2 rounded-lg transition-colors ${
          isOver ? 'bg-primary/10 border-2 border-primary border-dashed' : ''
        }`}
      >
        {children}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">

      {/* Main Content */}
      <div className="flex flex-col overflow-hidden flex-1">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 p-4">
          <Card className="bg-gradient-to-t from-primary/5 to-card shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.total}</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-t from-primary/5 to-card shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New</CardTitle>
              <AlertCircle className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.new}</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-t from-primary/5 to-card shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.inProgress}</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-t from-primary/5 to-card shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Escalated</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.escalated}</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-t from-primary/5 to-card shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.resolved}</div>
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
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40 h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Escalated">Escalated</SelectItem>
                  <SelectItem value="Resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-40 h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                </SelectContent>
              </Select>

              <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger className="w-40 h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="7days">Last 7 Days</SelectItem>
                  <SelectItem value="2weeks">Last 2 Weeks</SelectItem>
                  <SelectItem value="thismonth">This Month</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={() => setIsCreateDialogOpen(true)} className="h-10">
                <Plus className="h-4 w-4 mr-2" />
                Raise New Ticket
              </Button>

              {/* Custom Columns */}
              <Popover open={showColumnPopover} onOpenChange={setShowColumnPopover}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-10">
                    <Settings className="h-4 w-4 mr-2" />
                    Columns
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56" align="end">
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="ticket"
                          checked={visibleColumns.ticket}
                          onCheckedChange={() => toggleColumn("ticket")}
                        />
                        <label htmlFor="ticket" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Ticket
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="company"
                          checked={visibleColumns.company}
                          onCheckedChange={() => toggleColumn("company")}
                        />
                        <label htmlFor="company" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Company
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="client"
                          checked={visibleColumns.client}
                          onCheckedChange={() => toggleColumn("client")}
                        />
                        <label htmlFor="client" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Client
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="status"
                          checked={visibleColumns.status}
                          onCheckedChange={() => toggleColumn("status")}
                        />
                        <label htmlFor="status" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Status
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="priority"
                          checked={visibleColumns.priority}
                          onCheckedChange={() => toggleColumn("priority")}
                        />
                        <label htmlFor="priority" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Priority
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="created"
                          checked={visibleColumns.created}
                          onCheckedChange={() => toggleColumn("created")}
                        />
                        <label htmlFor="created" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Created
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="actions"
                          checked={visibleColumns.actions}
                          onCheckedChange={() => toggleColumn("actions")}
                        />
                        <label htmlFor="actions" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Actions
                        </label>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={resetColumns} className="w-full">
                      Reset All
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>

              {/* View Toggle Buttons */}
              <div className="flex items-center gap-1 border rounded-md p-1">
                <Button
                  variant={viewMode === 'table' ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className="h-8 w-8 p-0"
                  title="Table View"
                >
                  <Table className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="h-8 w-8 p-0"
                  title="List View"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'kanban' ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode('kanban')}
                  className="h-8 w-8 p-0"
                  title="Kanban View"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
              </div>
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
              viewMode === 'kanban' ? (
                // Kanban View with Drag and Drop
                <DndContext
                  sensors={sensors}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* New Column */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 p-3 bg-gradient-to-br from-muted/50 to-background border border-border/50 rounded-lg">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <h3 className="text-sm font-medium text-foreground">New ({filteredTickets.filter(t => t.status === 'New').length})</h3>
                      </div>
                      <SortableContext items={filteredTickets.filter(t => t.status === 'New').map(t => t.id)} strategy={verticalListSortingStrategy}>
                        <DroppableColumn status="New">
                          {filteredTickets.filter(t => t.status === 'New').map(ticket => (
                            <DraggableTicket key={ticket.id} ticket={ticket} />
                          ))}
                        </DroppableColumn>
                      </SortableContext>
                    </div>

                    {/* In Progress Column */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 p-3 bg-gradient-to-br from-muted/50 to-background border border-border/50 rounded-lg">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <h3 className="text-sm font-medium text-foreground">In Progress ({filteredTickets.filter(t => t.status === 'In Progress').length})</h3>
                      </div>
                      <SortableContext items={filteredTickets.filter(t => t.status === 'In Progress').map(t => t.id)} strategy={verticalListSortingStrategy}>
                        <DroppableColumn status="In Progress">
                          {filteredTickets.filter(t => t.status === 'In Progress').map(ticket => (
                            <DraggableTicket key={ticket.id} ticket={ticket} />
                          ))}
                        </DroppableColumn>
                      </SortableContext>
                    </div>

                    {/* Escalated Column */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 p-3 bg-gradient-to-br from-muted/50 to-background border border-border/50 rounded-lg">
                        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                        <h3 className="text-sm font-medium text-foreground">Escalated ({filteredTickets.filter(t => t.status === 'Escalated').length})</h3>
                      </div>
                      <SortableContext items={filteredTickets.filter(t => t.status === 'Escalated').map(t => t.id)} strategy={verticalListSortingStrategy}>
                        <DroppableColumn status="Escalated">
                          {filteredTickets.filter(t => t.status === 'Escalated').map(ticket => (
                            <DraggableTicket key={ticket.id} ticket={ticket} />
                          ))}
                        </DroppableColumn>
                      </SortableContext>
                    </div>

                    {/* Resolved Column */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 p-3 bg-gradient-to-br from-muted/50 to-background border border-border/50 rounded-lg">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <h3 className="text-sm font-medium text-foreground">Resolved ({filteredTickets.filter(t => t.status === 'Resolved').length})</h3>
                      </div>
                      <SortableContext items={filteredTickets.filter(t => t.status === 'Resolved').map(t => t.id)} strategy={verticalListSortingStrategy}>
                        <DroppableColumn status="Resolved">
                          {filteredTickets.filter(t => t.status === 'Resolved').map(ticket => (
                            <DraggableTicket key={ticket.id} ticket={ticket} />
                          ))}
                        </DroppableColumn>
                      </SortableContext>
                    </div>
                  </div>

                  <DragOverlay>
                    {activeTicket ? (
                      <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 bg-gradient-to-t from-primary/5 to-card shadow-xs opacity-90">
                        <CardContent className="p-3">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">#{activeTicket.ticket_number}</span>
                              <Badge variant="outline" className="text-xs">
                                {activeTicket.priority}
                              </Badge>
                            </div>
                            <h4 className="text-sm font-medium line-clamp-1 text-foreground">{activeTicket.company}</h4>
                            <p className="text-xs text-muted-foreground line-clamp-2">{activeTicket.issue}</p>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>{activeTicket.client_name}</span>
                              <span>{formatDate(activeTicket.created_at)}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ) : null}
                  </DragOverlay>
                </DndContext>
              ) : viewMode === 'list' ? (
                // List View
                <div className="space-y-2">
                  {paginatedTickets.map(ticket => (
                    <div key={ticket.id} className={`flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer border-l-4 ${getPriorityColor(ticket.priority)}`}
                         onClick={() => {
                           loadTicketDetails(ticket.id);
                           setIsDetailsDialogOpen(true);
                         }}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            <p className="text-sm text-muted-foreground">#{ticket.ticket_number}</p>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm truncate">{ticket.company}</h3>
                            <p className="text-xs text-muted-foreground truncate">{ticket.client_name}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 mx-4">
                        <p className="text-sm text-muted-foreground line-clamp-1">{ticket.issue}</p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <Badge className={getStatusColor(ticket.status)}>
                          {ticket.status}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {ticket.priority}
                        </Badge>
                        <div className="text-xs text-muted-foreground">{formatDate(ticket.created_at)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Table View (default)
                <div className="w-full rounded-md border overflow-hidden flex-1 min-h-0 flex flex-col">
                  <div className="flex-1 overflow-y-auto overflow-x-hidden">
                    <TableComponent className="w-full">
                      <TableHeader className="sticky top-0 bg-background z-10">
                        <TableRow className="hover:bg-transparent">
                          {visibleColumns.ticket && (
                            <TableHead 
                              className="h-10 px-3 text-sm font-semibold bg-background cursor-pointer select-none hover:bg-muted/50"
                              onClick={() => handleSort("ticket_number")}
                            >
                              Ticket{getSortIcon("ticket_number")}
                            </TableHead>
                          )}
                          {visibleColumns.company && (
                            <TableHead 
                              className="h-10 px-3 text-sm font-semibold bg-background cursor-pointer select-none hover:bg-muted/50"
                              onClick={() => handleSort("company")}
                            >
                              Company{getSortIcon("company")}
                            </TableHead>
                          )}
                          {visibleColumns.client && (
                            <TableHead 
                              className="h-10 px-3 text-sm font-semibold bg-background cursor-pointer select-none hover:bg-muted/50"
                              onClick={() => handleSort("client_name")}
                            >
                              Client{getSortIcon("client_name")}
                            </TableHead>
                          )}
                          {visibleColumns.status && (
                            <TableHead 
                              className="h-10 px-3 text-sm font-semibold bg-background cursor-pointer select-none hover:bg-muted/50"
                              onClick={() => handleSort("status")}
                            >
                              Status{getSortIcon("status")}
                            </TableHead>
                          )}
                          {visibleColumns.priority && (
                            <TableHead 
                              className="h-10 px-3 text-sm font-semibold bg-background cursor-pointer select-none hover:bg-muted/50"
                              onClick={() => handleSort("priority")}
                            >
                              Priority{getSortIcon("priority")}
                            </TableHead>
                          )}
                          {visibleColumns.created && (
                            <TableHead 
                              className="h-10 px-3 text-sm font-semibold bg-background cursor-pointer select-none hover:bg-muted/50"
                              onClick={() => handleSort("created_at")}
                            >
                              Created{getSortIcon("created_at")}
                            </TableHead>
                          )}
                          {visibleColumns.actions && (
                            <TableHead className="h-10 px-3 text-sm font-semibold bg-background">
                              Actions
                            </TableHead>
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedTickets.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={Object.values(visibleColumns).filter(Boolean).length}
                              className="text-center py-8 text-xs text-muted-foreground"
                            >
                              No tickets found.
                            </TableCell>
                          </TableRow>
                        ) : (
                          paginatedTickets.map(ticket => (
                            <TableRow key={ticket.id} className="cursor-pointer hover:bg-muted/50">
                              {visibleColumns.ticket && (
                                <TableCell className="px-3 py-3 text-sm">
                                  #{ticket.ticket_number}
                                </TableCell>
                              )}
                              {visibleColumns.company && (
                                <TableCell className="px-3 py-3">
                                  <div>
                                    <p className="text-sm font-medium">{ticket.company}</p>
                                    <p className="text-xs text-muted-foreground line-clamp-1">{ticket.issue}</p>
                                  </div>
                                </TableCell>
                              )}
                              {visibleColumns.client && (
                                <TableCell className="px-3 py-3 text-sm">
                                  {ticket.client_name}
                                </TableCell>
                              )}
                              {visibleColumns.status && (
                                <TableCell className="px-3 py-3">
                                  <Badge className={getStatusColor(ticket.status)}>
                                    {ticket.status}
                                  </Badge>
                                </TableCell>
                              )}
                              {visibleColumns.priority && (
                                <TableCell className="px-3 py-3">
                                  <Badge variant="outline" className="text-xs">
                                    {ticket.priority}
                                  </Badge>
                                </TableCell>
                              )}
                              {visibleColumns.created && (
                                <TableCell className="px-3 py-3 text-sm">
                                  {formatDate(ticket.created_at)}
                                </TableCell>
                              )}
                              {visibleColumns.actions && (
                                <TableCell className="px-3 py-3">
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        loadTicketDetails(ticket.id);
                                        setIsDetailsDialogOpen(true);
                                      }}
                                      className="h-6 w-6 hover:bg-muted flex-shrink-0"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              )}
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </TableComponent>
                  </div>
                </div>
              )
            ) : (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No assigned tickets found</p>
                  <p className="text-sm text-muted-foreground mt-2">Tickets assigned to you by admin will appear here</p>
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
                {selectedTicket.status === 'New' && (
                  <Button
                    onClick={() => handleUpdateTicketStatus(selectedTicket.id, 'In Progress')}
                    className="bg-blue-500 hover:bg-blue-600"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Start Working
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
    </div>
  );
}

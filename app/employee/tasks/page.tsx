"use client";

import { useState, useEffect } from "react";
// Removed duplicate sidebar imports - using layout components instead
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, Clock, AlertCircle, XCircle, Calendar, GripVertical, Search, Download, LayoutGrid, Table2, ArrowUpDown, ArrowUp, ArrowDown, CalendarDays, Edit, Save, X, Plus, Share } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  due_date?: string;
  assignee?: string;
  created_at?: string;
  updated_at?: string;
  completed_on?: string;
  is_overdue?: boolean;
  days_overdue?: number;
  update_count?: number;
}

export default function EmployeeTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  
  // Edit task states
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    due_date: "",
  });
  
  // Task assignment states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [createForm, setCreateForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    due_date: "",
    assignee: "",
  });
  
  // Task sharing states
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [sharingTask, setSharingTask] = useState<Task | null>(null);
  const [shareForm, setShareForm] = useState({
    assignee: "",
    message: "",
  });
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [viewMode, setViewMode] = useState("kanban");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [sortField, setSortField] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    loadCurrentUser();
    loadEmployees();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      console.log("Current auth user:", user);
      console.log("User metadata:", user.user_metadata);
      console.log("User app metadata:", user.app_metadata);
      if (user) {
        setCurrentUserId(user.id);
        console.log("Searching for employee with user ID:", user.id);
        console.log("User email:", user.email);
        
        // First get the user record from Users table
        const { data: userRecord, error: userError } = await supabase
          .from("Users")
          .select("employee")
          .eq("email", user.email)
          .single();
          
        console.log("User record query result:", { userRecord, userError });
          
        if (userError) {
          console.log("No user record found in Users table (this is expected for demo users)");
          console.log("User error details:", userError);
          
          // This is not an error - just means the user is not in the Users table
          // We'll use the fallback approach
        }
        
        if (!userRecord?.employee) {
          console.log("No employee record found for user");
          console.log("Available users in database:", [
            "sahil@startupsquad.in",
            "lakshay@startupsquad.in", 
            "hr@startupsquad.in",
            "lovekumar@startupsquad.in"
          ]);
        }
        
        // Try multiple methods to find the employee record
        let employeeFound = false;
        
        // Method 1: Try to find by email in personal_email or official_email
        console.log("Method 1: Trying to find employee record by email...");
        const { data: employeeByEmail } = await supabase
          .from("Employee Directory")
          .select("whalesync_postgres_id, full_name")
          .or(`personal_email.eq.${user.email},official_email.eq.${user.email}`)
          .single();
          
        if (employeeByEmail) {
          console.log("✅ Found employee by email:", employeeByEmail);
          loadTasks(employeeByEmail.whalesync_postgres_id);
          employeeFound = true;
        }
        
        // Method 2: Try to find by name from user metadata
        if (!employeeFound && user.user_metadata?.full_name) {
          console.log("Method 2: Trying to find employee by full name from metadata...");
          const { data: employeeByName } = await supabase
            .from("Employee Directory")
            .select("whalesync_postgres_id, full_name")
            .ilike("full_name", `%${user.user_metadata.full_name}%`)
            .single();
            
          if (employeeByName) {
            console.log("✅ Found employee by name:", employeeByName);
            loadTasks(employeeByName.whalesync_postgres_id);
            employeeFound = true;
          }
        }
        
        // Method 3: Try to find by email prefix (username part)
        if (!employeeFound) {
          console.log("Method 3: Trying to find employee by email prefix...");
          const emailPrefix = user.email?.split('@')[0];
          const { data: employeeByPrefix } = await supabase
            .from("Employee Directory")
            .select("whalesync_postgres_id, full_name")
            .ilike("full_name", `%${emailPrefix}%`)
            .single();
            
          if (employeeByPrefix) {
            console.log("✅ Found employee by email prefix:", employeeByPrefix);
            loadTasks(employeeByPrefix.whalesync_postgres_id);
            employeeFound = true;
          }
        }
        
        // Method 4: For demo purposes, show all available employees
        if (!employeeFound) {
          console.log("Method 4: No employee found, showing available employees...");
          const { data: allEmployees } = await supabase
            .from("Employee Directory")
            .select("whalesync_postgres_id, full_name, personal_email, official_email")
            .limit(10);
            
          console.log("Available employees:", allEmployees);
          
          // For demo, let's use the first employee as a fallback
          if (allEmployees && allEmployees.length > 0) {
            console.log("Using first employee as demo fallback:", allEmployees[0]);
            loadTasks(allEmployees[0].whalesync_postgres_id);
          } else {
            console.log("No employees found in database");
            setLoading(false);
          }
        }
      } else {
        setLoading(false);
      }
    } catch (error: any) {
      console.error("Error loading current user:", error);
      toast.error(`Failed to load user: ${error.message}`);
      setLoading(false);
    }
  };

  const loadTasks = async (userId: string) => {
    try {
      console.log("Loading tasks for user ID:", userId);
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("assignee", userId)
        .order("created_at", { ascending: false });

      console.log("Tasks query result:", { data, error });
      if (error) throw error;
      setTasks(data || []);
      console.log("Tasks loaded:", data?.length || 0);
    } catch (error: any) {
      console.error("Error loading tasks:", error);
      toast.error(`Failed to load tasks: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from("Employee Directory")
        .select("whalesync_postgres_id, full_name, profile_photo")
        .order("full_name");

      if (error) throw error;
      setEmployees(data || []);
    } catch (error: any) {
      console.error("Error loading employees:", error);
      toast.error(`Failed to load employees: ${error.message}`);
    }
  };

  const handleUpdateStatus = async (taskId: string, newStatus: string) => {
    try {
      const updateData: any = { 
        status: newStatus,
        updated_at: new Date().toISOString(),
      };
      
      if (newStatus === "completed") {
        updateData.completed_on = new Date().toISOString();
      }

      const { error } = await supabase
        .from("tasks")
        .update(updateData)
        .eq("id", taskId);

      if (error) throw error;

      // Update local state instead of reloading
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId ? { ...task, ...updateData } : task
        )
      );

      toast.success("Task status updated!");
    } catch (error: any) {
      console.error("Error updating task:", error);
      toast.error(`Failed to update task: ${error.message || 'Unknown error'}`);
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setEditForm({
      title: task.title,
      description: task.description || "",
      priority: task.priority,
      due_date: task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : "",
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingTask || !editForm.title.trim()) {
      toast.error("Please enter a task title");
      return;
    }

    try {
      const updateData = {
        title: editForm.title,
        description: editForm.description,
        priority: editForm.priority,
        due_date: editForm.due_date || null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("tasks")
        .update(updateData)
        .eq("id", editingTask.id);

      if (error) throw error;

      // Update local state
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === editingTask.id ? { ...task, ...updateData } : task
        )
      );

      setIsEditDialogOpen(false);
      setEditingTask(null);
      toast.success("Task updated successfully!");
    } catch (error: any) {
      console.error("Error updating task:", error);
      toast.error(`Failed to update task: ${error.message || 'Unknown error'}`);
    }
  };

  const handleCancelEdit = () => {
    setIsEditDialogOpen(false);
    setEditingTask(null);
    setEditForm({
      title: "",
      description: "",
      priority: "medium",
      due_date: "",
    });
  };

  const handleCreateTask = () => {
    setCreateForm({
      title: "",
      description: "",
      priority: "medium",
      due_date: "",
      assignee: "",
    });
    setIsCreateDialogOpen(true);
  };

  const handleSaveCreate = async () => {
    if (!createForm.title.trim()) {
      toast.error("Please enter a task title");
      return;
    }

    if (!createForm.assignee) {
      toast.error("Please select an assignee");
      return;
    }

    try {
      const newTask = {
        title: createForm.title,
        description: createForm.description,
        priority: createForm.priority,
        due_date: createForm.due_date || null,
        assignee: createForm.assignee,
        status: "pending",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("tasks")
        .insert([newTask])
        .select()
        .single();

      if (error) throw error;

      // Add to local state
      setTasks(prevTasks => [data, ...prevTasks]);

      setIsCreateDialogOpen(false);
      setCreateForm({
        title: "",
        description: "",
        priority: "medium",
        due_date: "",
        assignee: "",
      });
      toast.success("Task created successfully!");
    } catch (error: any) {
      console.error("Error creating task:", error);
      toast.error(`Failed to create task: ${error.message || 'Unknown error'}`);
    }
  };

  const handleCancelCreate = () => {
    setIsCreateDialogOpen(false);
    setCreateForm({
      title: "",
      description: "",
      priority: "medium",
      due_date: "",
      assignee: "",
    });
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", taskId);

      if (error) throw error;

      // Remove from local state
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
      toast.success("Task deleted successfully!");
    } catch (error: any) {
      console.error("Error deleting task:", error);
      toast.error(`Failed to delete task: ${error.message || 'Unknown error'}`);
    }
  };

  const handleShareTask = (task: Task) => {
    setSharingTask(task);
    setShareForm({
      assignee: "",
      message: "",
    });
    setIsShareDialogOpen(true);
  };

  const handleSaveShare = async () => {
    if (!sharingTask || !shareForm.assignee) {
      toast.error("Please select an employee to share with");
      return;
    }

    try {
      // Create a new task with the same details but assigned to the selected employee
      const sharedTask = {
        title: sharingTask.title,
        description: sharingTask.description,
        priority: sharingTask.priority,
        due_date: sharingTask.due_date,
        assignee: shareForm.assignee,
        status: "pending",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        shared_from: sharingTask.id, // Track the original task
        share_message: shareForm.message,
      };

      const { data, error } = await supabase
        .from("tasks")
        .insert([sharedTask])
        .select()
        .single();

      if (error) throw error;

      setIsShareDialogOpen(false);
      setSharingTask(null);
      setShareForm({
        assignee: "",
        message: "",
      });
      toast.success("Task shared successfully!");
    } catch (error: any) {
      console.error("Error sharing task:", error);
      toast.error(`Failed to share task: ${error.message || 'Unknown error'}`);
    }
  };

  const handleCancelShare = () => {
    setIsShareDialogOpen(false);
    setSharingTask(null);
    setShareForm({
      assignee: "",
      message: "",
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find(task => task.id === active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as string;

    // Find the task being moved
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    console.log("Drag end:", { taskId, currentStatus: task.status, newStatus });

    // If the status changed, update it
    if (task.status !== newStatus) {
      console.log("Status changed, updating task");
      handleUpdateStatus(taskId, newStatus);
    } else {
      console.log("Same status, no update needed");
      // No need to do anything for same-column moves
      // The task should remain visible in its current column
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
      return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />;
    }
    return sortDirection === "asc" ? 
      <ArrowUp className="h-4 w-4 text-foreground" /> : 
      <ArrowDown className="h-4 w-4 text-foreground" />;
  };

  const handleExport = () => {
    const csvContent = [
      ['Title', 'Description', 'Priority', 'Status', 'Due Date'],
      ...filteredTasks.map(task => [
        task.title,
        task.description || '',
        task.priority,
        task.status,
        task.due_date ? new Date(task.due_date).toLocaleDateString() : ''
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tasks-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Tasks exported successfully!');
  };



  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "destructive";
      case "medium": return "default";
      case "low": return "secondary";
      default: return "default";
    }
  };

  const getPriorityBadgeStyle = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-500 text-white";
      case "medium": return "bg-gray-500 text-white";
      case "low": return "bg-blue-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-500 text-white";
      case "in_progress": return "bg-blue-500 text-white";
      case "pending": return "bg-yellow-500 text-white";
      case "cancelled": return "bg-red-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  // Calendar view helper functions
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getTasksForDate = (date: Date) => {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    return filteredTasks.filter(task => {
      if (!task.due_date) return false;
      const taskDate = new Date(task.due_date).toISOString().split('T')[0];
      return taskDate === dateStr;
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const isOverdue = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "in_progress": return <AlertCircle className="h-4 w-4 text-blue-600" />;
      case "pending": return <Clock className="h-4 w-4 text-yellow-600" />;
      case "cancelled": return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  // Filter and sort tasks based on search, filters, and sorting
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = searchTerm === "" || 
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
    
    let matchesDate = true;
    if (dateFilter !== "all" && task.due_date) {
      const taskDate = new Date(task.due_date);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      
      switch (dateFilter) {
        case "today":
          matchesDate = taskDate.toDateString() === today.toDateString();
          break;
        case "tomorrow":
          matchesDate = taskDate.toDateString() === tomorrow.toDateString();
          break;
        case "this_week":
          matchesDate = taskDate >= today && taskDate <= nextWeek;
          break;
        case "overdue":
          matchesDate = taskDate < today;
          break;
      }
    }
    
    return matchesSearch && matchesStatus && matchesPriority && matchesDate;
  }).sort((a, b) => {
    if (!sortField) return 0;

    let aValue: any = a[sortField as keyof Task];
    let bValue: any = b[sortField as keyof Task];

    // Handle date sorting
    if (sortField === "due_date") {
      aValue = aValue ? new Date(aValue).getTime() : 0;
      bValue = bValue ? new Date(bValue).getTime() : 0;
    }

    // Handle string sorting
    if (typeof aValue === "string" && typeof bValue === "string") {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const pendingTasks = filteredTasks.filter(task => task.status === "pending");
  const inProgressTasks = filteredTasks.filter(task => task.status === "in_progress");
  const completedTasks = filteredTasks.filter(task => task.status === "completed");

  // Debug logging
  console.log("Tasks state:", { 
    totalTasks: tasks.length, 
    pending: pendingTasks.length, 
    inProgress: inProgressTasks.length, 
    completed: completedTasks.length 
  });

  // Droppable Column Component
  const DroppableColumn = ({ status, children, title, icon, count }: { 
    status: string; 
    children: React.ReactNode; 
    title: string; 
    icon: React.ReactNode; 
    count: number;
  }) => {
    const { setNodeRef, isOver } = useDroppable({
      id: status,
    });

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {icon}
            {title} ({count})
          </CardTitle>
        </CardHeader>
        <CardContent 
          ref={setNodeRef}
          className={`space-y-3 min-h-[200px] transition-all duration-200 ${isOver ? 'bg-muted/50 border-2 border-dashed border-muted-foreground/50' : ''}`}
        >
          {children}
          {count === 0 && (
            <div className="text-center text-sm text-muted-foreground mt-4">
              Drop tasks here
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Calendar View Component
  const CalendarView = () => {
    const days = getDaysInMonth(currentDate);
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    return (
      <div className="space-y-4">
        {/* Calendar Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('prev')}
            >
              ←
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date())}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('next')}
            >
              →
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-background border rounded-lg overflow-hidden">
          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b">
            {dayNames.map(day => (
              <div key={day} className="p-3 text-center font-medium text-sm text-muted-foreground border-r last:border-r-0">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7">
            {days.map((date, index) => {
              if (!date) {
                return <div key={index} className="h-24 border-r border-b last:border-r-0"></div>;
              }

              const tasksForDate = getTasksForDate(date);
              const isCurrentDay = isToday(date);
              const isOverdueDay = isOverdue(date);

              return (
                <div
                  key={index}
                  className={`h-24 border-r border-b last:border-r-0 p-2 ${
                    isCurrentDay ? 'bg-primary/10' : ''
                  } ${isOverdueDay ? 'bg-red-50' : ''} hover:bg-muted/50 transition-colors`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-medium ${
                      isCurrentDay ? 'text-primary' : ''
                    } ${isOverdueDay ? 'text-red-600' : ''}`}>
                      {date.getDate()}
                    </span>
                    {tasksForDate.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {tasksForDate.length}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    {tasksForDate.slice(0, 2).map(task => (
                      <div
                        key={task.id}
                        className={`text-xs p-1 rounded truncate cursor-pointer ${
                          task.status === 'completed' ? 'bg-green-100 text-green-800' :
                          task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          task.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}
                        title={task.title}
                      >
                        {task.title}
                      </div>
                    ))}
                    {tasksForDate.length > 2 && (
                      <div className="text-xs text-muted-foreground">
                        +{tasksForDate.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Sortable Task Component
  const SortableTask = ({ task }: { task: Task }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: task.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    return (
      <Card 
        ref={setNodeRef} 
        style={style}
        className={`p-3 cursor-move border-2 border-transparent hover:border-muted-foreground/20 ${isDragging ? 'opacity-50 shadow-lg scale-105 border-primary/50' : 'hover:shadow-md'} transition-all duration-200`}
        {...attributes}
        {...listeners}
      >
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md border border-border bg-muted/50 flex items-center justify-center">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </div>
              <h4 className="font-medium text-sm">{task.title}</h4>
            </div>
            <Badge variant={getPriorityColor(task.priority) as any} className="text-xs">
              {task.priority}
            </Badge>
          </div>
          {task.description && (
            <p className="text-xs text-muted-foreground">{task.description}</p>
          )}
          {task.due_date && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              Due: {new Date(task.due_date).toLocaleDateString()}
            </div>
          )}
          <div className="text-xs text-muted-foreground/60 italic">
            Drag card to move between columns
          </div>
          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            <Select
              value={task.status}
              onValueChange={(value) => handleUpdateStatus(task.id, value)}
            >
              <SelectTrigger className="h-8 text-xs flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEditTask(task)}
              className="h-8 px-2"
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleShareTask(task)}
              className="h-8 px-2"
              title="Share task with another employee"
            >
              <Share className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 rounded animate-pulse" />
          <div className="h-32 bg-gray-200 rounded animate-pulse" />
          <div className="h-64 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {/* Summary Cards */}
              <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-3">
                <Card className="@container/card">
                  <CardHeader>
                    <CardDescription className="flex items-center justify-between">
                      <span>Total Tasks</span>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                      {filteredTasks.length}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card className="@container/card">
                  <CardHeader>
                    <CardDescription className="flex items-center justify-between">
                      <span>In Progress</span>
                      <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    </CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                      {inProgressTasks.length}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card className="@container/card">
                  <CardHeader>
                    <CardDescription className="flex items-center justify-between">
                      <span>Completed</span>
                      <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                      {completedTasks.length}
                    </CardTitle>
                  </CardHeader>
                </Card>
              </div>

              {/* Filter Bar */}
              <div className="flex items-center justify-between gap-2 flex-wrap px-4 lg:px-6">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Search Input */}
                  <div className="flex-1 min-w-[300px]">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                       <Input
                         placeholder="Search using Name or Phone"
                         value={searchTerm}
                         onChange={(e) => setSearchTerm(e.target.value)}
                         className="pl-10 bg-background border-muted-foreground/30 focus:border-primary text-foreground"
                       />
                    </div>
                  </div>
                  
                  {/* Status Filter */}
                   <Select value={statusFilter} onValueChange={setStatusFilter}>
                     <SelectTrigger className="w-[120px] bg-background border-muted-foreground/30 text-foreground">
                       <SelectValue placeholder="All Status" />
                     </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {/* Priority Filter */}
                   <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                     <SelectTrigger className="w-[120px] bg-background border-muted-foreground/30 text-foreground">
                       <SelectValue placeholder="All Priority" />
                     </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priority</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {/* Date Filter */}
                   <Select value={dateFilter} onValueChange={setDateFilter}>
                     <SelectTrigger className="w-[120px] bg-background border-muted-foreground/30 text-foreground">
                       <SelectValue placeholder="All Dates" />
                     </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Dates</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="tomorrow">Tomorrow</SelectItem>
                      <SelectItem value="this_week">This Week</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {/* Create Task Button */}
                   <Button 
                     variant="default" 
                     className="gap-2"
                     onClick={handleCreateTask}
                   >
                     <Plus className="h-4 w-4" />
                     Create Task
                   </Button>
                   
                  {/* Export Button */}
                   <Button 
                     variant="outline" 
                     className="gap-2 bg-background border-muted-foreground/30 text-foreground"
                     onClick={handleExport}
                   >
                     <Download className="h-4 w-4" />
                     Export
                   </Button>
                   
                  {/* View Toggle Buttons */}
                  <div className="flex border border-muted-foreground/30 rounded-md overflow-hidden">
                    <Button
                      variant={viewMode === "kanban" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("kanban")}
                      className="rounded-none border-0 px-3"
                      title="Kanban View"
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "table" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("table")}
                      className="rounded-none border-0 px-3"
                      title="Table View"
                    >
                      <Table2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "calendar" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("calendar")}
                      className="rounded-none border-0 px-3"
                      title="Calendar View"
                    >
                      <CalendarDays className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Tasks View */}
              <div className="w-full">
                {viewMode === "kanban" ? (
                  <div className="space-y-2">
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {/* Pending Tasks */}
                    <DroppableColumn 
                      status="pending"
                      title="Pending"
                      icon={<Clock className="h-4 w-4 text-yellow-600" />}
                      count={pendingTasks.length}
                    >
                      <SortableContext items={pendingTasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
                        {pendingTasks.map((task) => (
                          <SortableTask key={task.id} task={task} />
                        ))}
                      </SortableContext>
                      {pendingTasks.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">No pending tasks</p>
                      )}
                    </DroppableColumn>

                    {/* In Progress Tasks */}
                    <DroppableColumn 
                      status="in_progress"
                      title="In Progress"
                      icon={<AlertCircle className="h-4 w-4 text-blue-600" />}
                      count={inProgressTasks.length}
                    >
                      <SortableContext items={inProgressTasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
                        {inProgressTasks.map((task) => (
                          <SortableTask key={task.id} task={task} />
                        ))}
                      </SortableContext>
                      {inProgressTasks.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">No tasks in progress</p>
                      )}
                    </DroppableColumn>

                    {/* Completed Tasks */}
                    <DroppableColumn 
                      status="completed"
                      title="Completed"
                      icon={<CheckCircle className="h-4 w-4 text-green-600" />}
                      count={completedTasks.length}
                    >
                      <SortableContext items={completedTasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
                        {completedTasks.map((task) => (
                          <SortableTask key={task.id} task={task} />
                        ))}
                      </SortableContext>
                      {completedTasks.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">No completed tasks</p>
                      )}
                    </DroppableColumn>
                    </div>
                    
                    <DragOverlay>
                      {activeTask ? (
                        <Card className="p-3 opacity-90 shadow-lg">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between">
                              <h4 className="font-medium text-sm">{activeTask.title}</h4>
                              <Badge variant={getPriorityColor(activeTask.priority) as any} className="text-xs">
                                {activeTask.priority}
                              </Badge>
                            </div>
                            {activeTask.description && (
                              <p className="text-xs text-muted-foreground">{activeTask.description}</p>
                            )}
                          </div>
                        </Card>
                      ) : null}
                    </DragOverlay>
                  </DndContext>
                  </div>
                 ) : viewMode === "calendar" ? (
                   <CalendarView />
                 ) : (
                   <div className="space-y-4">
                   <Table>
                     <TableHeader>
                       <TableRow className="border-0 hover:bg-transparent">
                         <TableHead 
                           className="cursor-pointer hover:bg-muted/30 transition-colors border-0 text-foreground font-semibold"
                           onClick={() => handleSort("title")}
                         >
                           <div className="flex items-center gap-2">
                             Task
                             {getSortIcon("title")}
                           </div>
                         </TableHead>
                         <TableHead 
                           className="cursor-pointer hover:bg-muted/30 transition-colors border-0 text-foreground font-semibold"
                           onClick={() => handleSort("priority")}
                         >
                           <div className="flex items-center gap-2">
                             Priority
                             {getSortIcon("priority")}
                           </div>
                         </TableHead>
                         <TableHead 
                           className="cursor-pointer hover:bg-muted/30 transition-colors border-0 text-foreground font-semibold"
                           onClick={() => handleSort("status")}
                         >
                           <div className="flex items-center gap-2">
                             Status
                             {getSortIcon("status")}
                           </div>
                         </TableHead>
                         <TableHead 
                           className="cursor-pointer hover:bg-muted/30 transition-colors border-0 text-foreground font-semibold"
                           onClick={() => handleSort("due_date")}
                         >
                           <div className="flex items-center gap-2">
                             Due Date
                             {getSortIcon("due_date")}
                           </div>
                         </TableHead>
                         <TableHead className="border-0 text-foreground font-semibold">Actions</TableHead>
                       </TableRow>
                     </TableHeader>
                     <TableBody>
                       {filteredTasks.length === 0 ? (
                         <TableRow className="border-0 hover:bg-transparent">
                           <TableCell colSpan={5} className="text-center py-8 text-muted-foreground border-0">
                             No tasks assigned to you yet.
                           </TableCell>
                         </TableRow>
                       ) : (
                         filteredTasks.map((task) => (
                           <TableRow key={task.id} className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                             <TableCell className="border-0 text-foreground">
                               <div>
                                 <div className="font-medium text-foreground">{task.title}</div>
                                 {task.description && (
                                   <div className="text-sm text-muted-foreground">{task.description}</div>
                                 )}
                               </div>
                             </TableCell>
                             <TableCell className="border-0">
                               <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadgeStyle(task.priority)}`}>
                                 {task.priority}
                               </span>
                             </TableCell>
                             <TableCell className="border-0">
                               <div className="flex items-center gap-2">
                                 {getStatusIcon(task.status)}
                                 <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                                   {task.status.replace('_', ' ')}
                                 </span>
                               </div>
                             </TableCell>
                             <TableCell className="border-0 text-foreground">
                               {task.due_date ? (
                                 <div className="flex items-center gap-1 text-sm">
                                   <Calendar className="h-3 w-3" />
                                   {new Date(task.due_date).toLocaleDateString()}
                                 </div>
                               ) : (
                                 <span className="text-muted-foreground">No due date</span>
                               )}
                             </TableCell>
                             <TableCell className="border-0">
                               <div className="flex gap-2">
                                 <Select
                                   value={task.status}
                                   onValueChange={(value) => handleUpdateStatus(task.id, value)}
                                 >
                                   <SelectTrigger className="h-8 text-xs w-32 bg-background border-muted-foreground/30 text-foreground">
                                     <SelectValue />
                                   </SelectTrigger>
                                   <SelectContent>
                                     <SelectItem value="in_progress">In Progress</SelectItem>
                                     <SelectItem value="completed">Completed</SelectItem>
                                     <SelectItem value="cancelled">Cancelled</SelectItem>
                                   </SelectContent>
                                 </Select>
                                 <Button
                                   variant="outline"
                                   size="sm"
                                   onClick={() => handleEditTask(task)}
                                   className="h-8 px-2"
                                 >
                                   <Edit className="h-3 w-3" />
                                 </Button>
                                 <Button
                                   variant="outline"
                                   size="sm"
                                   onClick={() => handleShareTask(task)}
                                   className="h-8 px-2"
                                   title="Share task with another employee"
                                 >
                                   <Share className="h-3 w-3" />
                                 </Button>
                                 <Button
                                   variant="outline"
                                   size="sm"
                                   onClick={() => handleDeleteTask(task.id)}
                                   className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                 >
                                   <X className="h-3 w-3" />
                                 </Button>
                               </div>
                             </TableCell>
                           </TableRow>
                         ))
                       )}
                     </TableBody>
                   </Table>
                   </div>
                 )}
              </div>
        </div>
      </div>

      {/* Edit Task Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>
              Update the task details below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-title">Task Title *</Label>
              <Input
                id="edit-title"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                placeholder="Enter task title"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="Enter task description"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-priority">Priority</Label>
              <Select
                value={editForm.priority}
                onValueChange={(value) => setEditForm({ ...editForm, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-due-date">Due Date</Label>
              <Input
                id="edit-due-date"
                type="date"
                value={editForm.due_date}
                onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelEdit}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Task Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>
              Assign a new task to an employee.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="create-title">Task Title *</Label>
              <Input
                id="create-title"
                value={createForm.title}
                onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                placeholder="Enter task title"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="create-description">Description</Label>
              <Textarea
                id="create-description"
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                placeholder="Enter task description"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="create-priority">Priority</Label>
              <Select
                value={createForm.priority}
                onValueChange={(value) => setCreateForm({ ...createForm, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="create-assignee">Assign To *</Label>
              <Select
                value={createForm.assignee}
                onValueChange={(value) => setCreateForm({ ...createForm, assignee: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.whalesync_postgres_id} value={employee.whalesync_postgres_id}>
                      {employee.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="create-due-date">Due Date</Label>
              <Input
                id="create-due-date"
                type="date"
                value={createForm.due_date}
                onChange={(e) => setCreateForm({ ...createForm, due_date: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelCreate}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button onClick={handleSaveCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Create Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Task Dialog */}
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Share Task</DialogTitle>
            <DialogDescription>
              Share this task with another employee. A copy will be created and assigned to them.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="share-assignee">Share With *</Label>
              <Select
                value={shareForm.assignee}
                onValueChange={(value) => setShareForm({ ...shareForm, assignee: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.whalesync_postgres_id} value={employee.whalesync_postgres_id}>
                      {employee.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="share-message">Message (Optional)</Label>
              <Textarea
                id="share-message"
                value={shareForm.message}
                onChange={(e) => setShareForm({ ...shareForm, message: e.target.value })}
                placeholder="Add a message about why you're sharing this task..."
                rows={3}
              />
            </div>
            {sharingTask && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <h4 className="font-medium text-sm mb-2">Task Details:</h4>
                <p className="text-sm text-muted-foreground">
                  <strong>Title:</strong> {sharingTask.title}
                </p>
                {sharingTask.description && (
                  <p className="text-sm text-muted-foreground">
                    <strong>Description:</strong> {sharingTask.description}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  <strong>Priority:</strong> {sharingTask.priority}
                </p>
                {sharingTask.due_date && (
                  <p className="text-sm text-muted-foreground">
                    <strong>Due Date:</strong> {new Date(sharingTask.due_date).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelShare}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button onClick={handleSaveShare}>
              <Share className="mr-2 h-4 w-4" />
              Share Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Calendar, User, Clock, CheckCircle, AlertCircle, XCircle, Grid3X3, Table, CalendarDays, LayoutGrid, Share, X, ArrowUpDown, ArrowUp, ArrowDown, Trash2, Search, Settings, ChevronDown, DollarSign, Users, TrendingUp, Upload, File, Paperclip } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Table as UITable, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";

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
  attachments?: Array<{
    name: string;
    path: string;
    size: number;
    type: string;
  }>;
}

interface Employee {
  whalesync_postgres_id: string;
  full_name: string;
  profile_photo?: string;
}

export default function TaskManagerPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [viewType, setViewType] = useState<"kanban" | "table" | "calendar">("table");
  const [sortField, setSortField] = useState<string>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
  const [timeFilter, setTimeFilter] = useState<string[]>([]);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium",
    due_date: "",
    assignee: "",
  });
  const [createAttachments, setCreateAttachments] = useState<File[]>([]);
  
  // Task modal states
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  
  // Task sharing states
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [sharingTask, setSharingTask] = useState<Task | null>(null);
  const [shareForm, setShareForm] = useState({
    assignee: "",
    message: "",
  });
  const [shareAttachments, setShareAttachments] = useState<File[]>([]);

  // Column customization states
  const [visibleColumns, setVisibleColumns] = useState({
    task: true,
    assignee: true,
    status: true,
    priority: true,
    dueDate: true,
    actions: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false });

      if (tasksError) {
        console.error("Task loading error:", tasksError);
        toast.error("Failed to load tasks");
        return;
      }

      setTasks(tasksData || []);

      // Load employees
      const { data: employeesData, error: employeesError } = await supabase
        .from("Employee Directory")
        .select("whalesync_postgres_id, full_name, profile_photo");

      if (employeesError) {
        console.error("Employee loading error:", employeesError);
        toast.error("Failed to load employees");
        return;
      }

      setEmployees(employeesData || []);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) {
      toast.error("Please enter a task title");
      return;
    }

    if (!newTask.assignee) {
      toast.error("Please select an assignee");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("tasks")
        .insert([
          {
            title: newTask.title,
            description: newTask.description,
            priority: newTask.priority,
            due_date: newTask.due_date || null,
            assignee: newTask.assignee,
            status: "pending",
          },
        ])
        .select();

      if (error) {
        console.error("Error creating task:", error);
        toast.error("Failed to create task");
        return;
      }

      if (data && data.length > 0) {
        // Upload files if any
        if (createAttachments.length > 0) {
          try {
            console.log("Uploading files for task:", data[0].id, "Files:", createAttachments.length);
            const uploadedFiles = await uploadFilesToSupabase(createAttachments, data[0].id);
            console.log("Uploaded files result:", uploadedFiles);
            
            // Update task with attachments
            const { error: updateError } = await supabase
              .from("tasks")
              .update({ attachments: uploadedFiles })
              .eq("id", data[0].id);
            
            if (updateError) {
              console.error("Error updating task with attachments:", {
                message: updateError.message,
                code: updateError.code,
                hint: updateError.hint,
                details: updateError.details
              });
              toast.error(`Failed to update task with attachments: ${updateError.message}`);
            } else {
              console.log("Successfully updated task with attachments");
            }
          } catch (uploadError: any) {
            console.error("Error in file upload process:", {
              message: uploadError.message,
              stack: uploadError.stack
            });
            toast.error(`Failed to upload attachments: ${uploadError.message}`);
          }
        }

        setTasks([data[0], ...tasks]);
        setNewTask({
          title: "",
          description: "",
          priority: "medium",
          due_date: "",
          assignee: "",
        });
        setCreateAttachments([]);
        setIsCreateDialogOpen(false);
        toast.success("Task created successfully");
      }
    } catch (error) {
      console.error("Error creating task:", error);
      toast.error("Failed to create task");
    }
  };

  const handleUpdateStatus = async (taskId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ status: newStatus })
        .eq("id", taskId);

      if (error) {
        console.error("Error updating task status:", error);
        toast.error("Failed to update task status");
        return;
      }

      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      ));
      toast.success("Task status updated");
    } catch (error) {
      console.error("Error updating task status:", error);
      toast.error("Failed to update task status");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", taskId);

      if (error) {
        console.error("Error deleting task:", error);
        toast.error("Failed to delete task");
        return;
      }

      setTasks(tasks.filter(task => task.id !== taskId));
      toast.success("Task deleted successfully");
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("Failed to delete task");
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

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
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

      // Upload files if any
      if (shareAttachments.length > 0) {
        const uploadedFiles = await uploadFilesToSupabase(shareAttachments, data.id);
        
        // Update task with attachments
        const { error: updateError } = await supabase
          .from("tasks")
          .update({ attachments: uploadedFiles })
          .eq("id", data.id);
        
        if (updateError) {
          console.error("Error updating shared task with attachments:", updateError);
        }
      }

      // Add to local state
      setTasks(prevTasks => [data, ...prevTasks]);

      setIsShareDialogOpen(false);
      setSharingTask(null);
      setShareForm({
        assignee: "",
        message: "",
      });
      setShareAttachments([]);
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
    setShareAttachments([]);
  };

  // File upload helper functions
  const handleFileUpload = (files: FileList | null, setAttachments: (files: File[]) => void) => {
    if (!files) return;
    
    const newFiles = Array.from(files);
    const validFiles = newFiles.filter(file => {
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        toast.error(`File ${file.name} is too large. Maximum size is 10MB.`);
        return false;
      }
      return true;
    });
    
    setAttachments(prev => [...prev, ...validFiles]);
    if (validFiles.length > 0) {
      toast.success(`${validFiles.length} file(s) added successfully!`);
    }
  };

  const removeFile = (index: number, setAttachments: (files: File[]) => void) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFilesToSupabase = async (files: File[], taskId: string) => {
    const uploadedFiles = [];
    
    console.log(`Starting upload of ${files.length} files for task ${taskId}`);
    
    // Check if storage bucket exists
    try {
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
      if (bucketError) {
        console.error('Error listing buckets:', bucketError);
        throw new Error(`Storage bucket error: ${bucketError.message}`);
      }
      
      const documentsBucket = buckets?.find(bucket => bucket.name === 'documents');
      if (!documentsBucket) {
        console.error('Documents bucket not found. Available buckets:', buckets?.map(b => b.name));
        throw new Error('Documents storage bucket not found. Please check your Supabase storage configuration.');
      }
      
      console.log('Documents bucket found:', documentsBucket);
    } catch (bucketCheckError: any) {
      console.error('Bucket check failed:', bucketCheckError);
      toast.error(`Storage configuration error: ${bucketCheckError.message}`);
      return uploadedFiles;
    }
    
    for (const file of files) {
      try {
        console.log(`Uploading file: ${file.name}, size: ${file.size} bytes`);
        
        const fileExt = file.name.split('.').pop();
        const fileName = `${taskId}-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `task-attachments/${fileName}`;
        
        console.log(`File path: ${filePath}`);
        
        const { data, error } = await supabase.storage
          .from('documents')
          .upload(filePath, file);
        
        if (error) {
          console.error('Supabase storage error:', {
            message: error.message,
            code: error.statusCode,
            error: error.error
          });
          throw error;
        }
        
        console.log(`Successfully uploaded: ${file.name}`);
        
        uploadedFiles.push({
          name: file.name,
          path: filePath,
          size: file.size,
          type: file.type
        });
      } catch (error: any) {
        console.error('Error uploading file:', {
          fileName: file.name,
          error: error.message,
          code: error.code,
          statusCode: error.statusCode
        });
        toast.error(`Failed to upload ${file.name}: ${error.message}`);
        // Continue with other files instead of stopping
      }
    }
    
    console.log(`Upload complete. ${uploadedFiles.length} files uploaded successfully`);
    return uploadedFiles;
  };

  const downloadFile = async (file: { name: string; path: string; size: number; type: string }) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(file.path);
      
      if (error) throw error;
      
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success(`Downloaded ${file.name}`);
    } catch (error: any) {
      console.error('Error downloading file:', error);
      toast.error(`Failed to download ${file.name}: ${error.message}`);
    }
  };

  const handleDragEnd = async (result: any) => {
    const { destination, source, draggableId } = result;

    // If dropped outside a droppable area
    if (!destination) {
      return;
    }

    // If dropped in the same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newStatus = destination.droppableId;
    const taskId = draggableId;

    try {
      // Update task status in database
      const { error } = await supabase
        .from("tasks")
        .update({ status: newStatus })
        .eq("id", taskId);

      if (error) {
        console.error("Error updating task status:", error);
        toast.error("Failed to update task status");
        return;
      }

      // Update local state
      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      ));

      toast.success("Task moved successfully");
    } catch (error) {
      console.error("Error updating task status:", error);
      toast.error("Failed to update task status");
    }
  };

  const getAssigneeName = (assigneeId: string) => {
    const employee = employees.find(emp => emp.whalesync_postgres_id === assigneeId);
    return employee?.full_name || "Unknown";
  };

  const getAssigneePhoto = (assigneeId: string) => {
    const employee = employees.find(emp => emp.whalesync_postgres_id === assigneeId);
    return employee?.profile_photo || "";
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "default";
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
      return <ArrowUpDown className="h-4 w-4" />;
    }
    return sortDirection === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  // Calculate task statistics
  const taskStats = {
    pending: tasks.filter(task => task.status === 'pending').length,
    inProgress: tasks.filter(task => task.status === 'in_progress').length,
    completed: tasks.filter(task => task.status === 'completed').length,
  };

  // Filter tasks based on search and filters
  const filteredTasks = tasks.filter((task) => {
    // Search filter
    if (searchTerm && !task.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !task.description.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    // Status filter
    if (statusFilter.length > 0 && !statusFilter.includes(task.status)) {
      return false;
    }

    // Priority filter
    if (priorityFilter.length > 0 && !priorityFilter.includes(task.priority)) {
      return false;
    }

    // Time filter
    if (timeFilter.length > 0) {
      const now = new Date();
      const taskDate = new Date(task.due_date);
      
      for (const filter of timeFilter) {
        if (filter === "today") {
          const isToday = taskDate.toDateString() === now.toDateString();
          if (isToday) return true;
        } else if (filter === "week") {
          const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 6);
          if (taskDate >= weekStart && taskDate <= weekEnd) return true;
        } else if (filter === "month") {
          const isThisMonth = taskDate.getMonth() === now.getMonth() && taskDate.getFullYear() === now.getFullYear();
          if (isThisMonth) return true;
        } else if (filter === "overdue") {
          if (taskDate < now && task.status !== "completed") return true;
        }
      }
      return false;
    }

    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex flex-col h-screen">
            <SiteHeader />
            <div className="flex-1 p-6">
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p>Loading tasks...</p>
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex flex-col h-screen font-sans">
          <SiteHeader />
          <div className="flex-1 p-6">
            <div className="space-y-6">

              {/* Task Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Pending Tasks Card */}
                <Card className="bg-gradient-to-t from-primary/5 to-card dark:bg-card shadow-xs">
                  <CardHeader>
                    <CardDescription className="flex items-center justify-between">
                      <span>Pending Tasks</span>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums">
                      {taskStats.pending}
                    </CardTitle>
                  </CardHeader>
                </Card>

                {/* In Progress Tasks Card */}
                <Card className="bg-gradient-to-t from-primary/5 to-card dark:bg-card shadow-xs">
                  <CardHeader>
                    <CardDescription className="flex items-center justify-between">
                      <span>In Progress</span>
                      <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    </CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums">
                      {taskStats.inProgress}
                    </CardTitle>
                  </CardHeader>
                </Card>

                {/* Completed Tasks Card */}
                <Card className="bg-gradient-to-t from-primary/5 to-card dark:bg-card shadow-xs">
                  <CardHeader>
                    <CardDescription className="flex items-center justify-between">
                      <span>Completed</span>
                      <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums">
                      {taskStats.completed}
                    </CardTitle>
                  </CardHeader>
                </Card>
              </div>

              {/* Action Bar */}
              <div className="flex items-center gap-3 flex-wrap">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search tasks..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Create Task Button */}
                <Button onClick={() => setIsCreateDialogOpen(true)} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create Task
                </Button>

                {/* Status Filter */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-[140px] justify-between bg-background border-border hover:bg-muted/50">
                      {statusFilter.length === 0 ? "All Status" : `${statusFilter.length} selected`}
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 bg-background border-border shadow-lg">
                    <div className="px-4 py-3 border-b border-border">
                      <span className="text-sm font-semibold text-foreground">Filter by Status</span>
                    </div>
                    <div className="py-2">
                      {["pending", "in_progress", "completed", "cancelled"].map((status) => (
                        <div key={status} className="px-4 py-2 hover:bg-muted/50 cursor-pointer">
                          <div className="flex items-center space-x-3">
                            <Checkbox
                              id={`status-${status}`}
                              checked={statusFilter.includes(status)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setStatusFilter([...statusFilter, status]);
                                } else {
                                  setStatusFilter(statusFilter.filter(s => s !== status));
                                }
                              }}
                              className="border-border"
                            />
                            <Label htmlFor={`status-${status}`} className="text-sm text-foreground cursor-pointer capitalize">
                              {status.replace('_', ' ')}
                            </Label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Priority Filter */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-[140px] justify-between bg-background border-border hover:bg-muted/50">
                      {priorityFilter.length === 0 ? "All Priority" : `${priorityFilter.length} selected`}
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 bg-background border-border shadow-lg">
                    <div className="px-4 py-3 border-b border-border">
                      <span className="text-sm font-semibold text-foreground">Filter by Priority</span>
                    </div>
                    <div className="py-2">
                      {["low", "medium", "high"].map((priority) => (
                        <div key={priority} className="px-4 py-2 hover:bg-muted/50 cursor-pointer">
                          <div className="flex items-center space-x-3">
                            <Checkbox
                              id={`priority-${priority}`}
                              checked={priorityFilter.includes(priority)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setPriorityFilter([...priorityFilter, priority]);
                                } else {
                                  setPriorityFilter(priorityFilter.filter(p => p !== priority));
                                }
                              }}
                              className="border-border"
                            />
                            <Label htmlFor={`priority-${priority}`} className="text-sm text-foreground cursor-pointer capitalize">
                              {priority}
                            </Label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Time Filter */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-[140px] justify-between bg-background border-border hover:bg-muted/50">
                      {timeFilter.length === 0 ? "All Time" : `${timeFilter.length} selected`}
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 bg-background border-border shadow-lg">
                    <div className="px-4 py-3 border-b border-border">
                      <span className="text-sm font-semibold text-foreground">Filter by Time</span>
                    </div>
                    <div className="py-2">
                      {["today", "week", "month", "overdue"].map((time) => (
                        <div key={time} className="px-4 py-2 hover:bg-muted/50 cursor-pointer">
                          <div className="flex items-center space-x-3">
                            <Checkbox
                              id={`time-${time}`}
                              checked={timeFilter.includes(time)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setTimeFilter([...timeFilter, time]);
                                } else {
                                  setTimeFilter(timeFilter.filter(t => t !== time));
                                }
                              }}
                              className="border-border"
                            />
                            <Label htmlFor={`time-${time}`} className="text-sm text-foreground cursor-pointer capitalize">
                              {time === "week" ? "This Week" : time === "month" ? "This Month" : time}
                            </Label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* View Toggle */}
                <ToggleGroup
                  type="single"
                  value={viewType}
                  onValueChange={(value) => setViewType(value as "kanban" | "table" | "calendar")}
                  variant="outline"
                  className="flex"
                >
                  <ToggleGroupItem value="kanban" aria-label="Kanban view">
                    <Grid3X3 className="h-4 w-4" />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="table" aria-label="Table view">
                    <Table className="h-4 w-4" />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="calendar" aria-label="Calendar view">
                    <CalendarDays className="h-4 w-4" />
                  </ToggleGroupItem>
                </ToggleGroup>

                {/* Customize Columns Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Customize Columns
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    <div className="flex items-center justify-between p-2">
                      <span className="text-sm font-medium">Column Filter</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setVisibleColumns({
                            task: true,
                            assignee: true,
                            status: true,
                            priority: true,
                            dueDate: true,
                            actions: true,
                          });
                        }}
                        className="h-6 px-2 text-xs"
                      >
                        Clear All
                      </Button>
                    </div>
                    <div className="space-y-1 p-2">
                      {Object.entries(visibleColumns).map(([key, value]) => (
                        <div key={key} className="flex items-center space-x-2">
                          <Checkbox
                            id={`column-${key}`}
                            checked={value}
                            onCheckedChange={(checked) => {
                              setVisibleColumns(prev => ({
                                ...prev,
                                [key]: checked
                              }));
                            }}
                          />
                          <Label htmlFor={`column-${key}`} className="text-sm capitalize">
                            {key === 'task' ? 'Task' :
                             key === 'assignee' ? 'Assignee' :
                             key === 'status' ? 'Status' :
                             key === 'priority' ? 'Priority' :
                             key === 'dueDate' ? 'Due Date' :
                             key === 'actions' ? 'Actions' : key}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Task Views */}
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
                          <Label htmlFor="title">Task Title *</Label>
                          <Input
                            id="title"
                            value={newTask.title}
                            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                            placeholder="Enter task title"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            value={newTask.description}
                            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                            placeholder="Enter task description"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="priority">Priority</Label>
                          <Select
                            value={newTask.priority}
                            onValueChange={(value) => setNewTask({ ...newTask, priority: value })}
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
                          <Label htmlFor="due_date">Due Date</Label>
                          <Input
                            id="due_date"
                            type="date"
                            value={newTask.due_date}
                            onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="assignee">Assign To *</Label>
                          <Select
                            value={newTask.assignee}
                            onValueChange={(value) => setNewTask({ ...newTask, assignee: value })}
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
                        
                        {/* File Attachments */}
                        <div className="grid gap-2">
                          <Label>Attachments (Optional)</Label>
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <Input
                                type="file"
                                multiple
                                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.xlsx,.xls,.ppt,.pptx"
                                onChange={(e) => handleFileUpload(e.target.files, setCreateAttachments)}
                                className="flex-1"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => document.getElementById('create-file-input')?.click()}
                                className="gap-2"
                              >
                                <Upload className="h-4 w-4" />
                                Upload
                              </Button>
                            </div>
                            
                            {createAttachments.length > 0 && (
                              <div className="space-y-2">
                                <p className="text-sm font-medium">Selected Files:</p>
                                {createAttachments.map((file, index) => (
                                  <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                                    <div className="flex items-center gap-2">
                                      <File className="h-4 w-4 text-muted-foreground" />
                                      <span className="text-sm">{file.name}</span>
                                      <span className="text-xs text-muted-foreground">
                                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                      </span>
                                    </div>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeFile(index, setCreateAttachments)}
                                      className="h-6 w-6 p-0"
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleCreateTask}>Create Task</Button>
                      </DialogFooter>
                    </DialogContent>
              </Dialog>

              {filteredTasks.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <div className="text-center">
                      <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold">No tasks yet</h3>
                      <p className="text-muted-foreground">Create your first task to get started.</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Kanban View */}
                  {viewType === "kanban" && (
                    <DragDropContext onDragEnd={handleDragEnd}>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {["pending", "in_progress", "completed"].map((status) => (
                          <div key={status} className="space-y-4">
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${getStatusColor(status)}`} />
                              <h3 className="font-semibold capitalize">{status.replace('_', ' ')}</h3>
                              <Badge variant="secondary" className="ml-auto">
                                {filteredTasks.filter(task => task.status === status).length}
                              </Badge>
                            </div>
                            <Droppable droppableId={status}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.droppableProps}
                                  className={`space-y-3 min-h-[200px] p-2 rounded-lg transition-colors ${
                                    snapshot.isDraggingOver ? 'bg-primary/5' : ''
                                  }`}
                                >
                                  {filteredTasks
                                    .filter(task => task.status === status)
                                    .map((task, index) => (
                                      <Draggable key={task.id} draggableId={task.id} index={index}>
                                        {(provided, snapshot) => (
                                          <Card 
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            className={`hover:shadow-md transition-shadow cursor-pointer ${
                                              snapshot.isDragging ? 'shadow-lg rotate-2' : ''
                                            }`}
                                          >
                                            <CardHeader className="pb-3">
                                              <div className="flex items-start justify-between">
                                                <div className="space-y-1">
                                                  <CardTitle className="text-sm">{task.title}</CardTitle>
                                                  {task.description && (
                                                    <CardDescription className="text-xs">
                                                      {task.description}
                                                    </CardDescription>
                                                  )}
                                                </div>
                                                <Badge variant={getPriorityColor(task.priority) as any} className="text-xs">
                                                  {task.priority}
                                                </Badge>
                                              </div>
                                            </CardHeader>
                                            <CardContent className="pt-0">
                                              <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                  <Avatar className="h-5 w-5">
                                                    <AvatarImage src={getAssigneePhoto(task.assignee || "")} />
                                                    <AvatarFallback className="text-xs">
                                                      {getAssigneeName(task.assignee || "").slice(0, 2).toUpperCase()}
                                                    </AvatarFallback>
                                                  </Avatar>
                                                  <span className="text-xs">{getAssigneeName(task.assignee || "")}</span>
                                                </div>
                                                
                                                {task.due_date && (
                                                  <div className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3 text-muted-foreground" />
                                                    <span className="text-xs text-muted-foreground">
                                                      {new Date(task.due_date).toLocaleDateString()}
                                                    </span>
                                                  </div>
                                                )}
                                                
                                                {/* Attachments */}
                                                {task.attachments && task.attachments.length > 0 && (
                                                  <div className="space-y-1">
                                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                      <Paperclip className="h-3 w-3" />
                                                      <span>Attachments ({task.attachments.length})</span>
                                                    </div>
                                                    <div className="space-y-1">
                                                      {task.attachments.slice(0, 2).map((file, index) => (
                                                        <div
                                                          key={index}
                                                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            downloadFile(file);
                                                          }}
                                                          title={`Download ${file.name}`}
                                                        >
                                                          <File className="h-3 w-3" />
                                                          <span className="truncate">{file.name}</span>
                                                        </div>
                                                      ))}
                                                      {task.attachments.length > 2 && (
                                                        <div className="text-xs text-muted-foreground">
                                                          +{task.attachments.length - 2} more files
                                                        </div>
                                                      )}
                                                    </div>
                                                  </div>
                                                )}
                                                
                                                <div className="flex gap-2 pt-2">
                                                  <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      handleShareTask(task);
                                                    }}
                                                    className="h-7 px-2 text-xs"
                                                    title="Share task with another employee"
                                                  >
                                                    <Share className="h-3 w-3 mr-1" />
                                                    Share
                                                  </Button>
                                                  <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      handleDeleteTask(task.id);
                                                    }}
                                                    className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                                                  >
                                                    <X className="h-3 w-3 mr-1" />
                                                    Delete
                                                  </Button>
                                                </div>
                                              </div>
                                            </CardContent>
                                          </Card>
                                        )}
                                      </Draggable>
                                    ))}
                                  {provided.placeholder}
                                </div>
                              )}
                            </Droppable>
                          </div>
                        ))}
                      </div>
                    </DragDropContext>
                  )}

                  {/* Table View */}
                  {viewType === "table" && (
                    <div className="w-full rounded-md border">
                      <UITable className="w-full">
                        <TableHeader>
                          <TableRow className="bg-muted/50 hover:bg-muted/50">
                            {visibleColumns.task && (
                              <TableHead className="text-xs font-semibold text-foreground px-3 py-3">
                                <Button
                                  variant="ghost"
                                  onClick={() => handleSort("title")}
                                  className="h-7 px-2 hover:bg-transparent text-xs font-semibold"
                                >
                                  Task
                                  {getSortIcon("title")}
                                </Button>
                              </TableHead>
                            )}
                            {visibleColumns.assignee && (
                              <TableHead className="text-xs font-semibold text-foreground px-3 py-3">
                                <Button
                                  variant="ghost"
                                  onClick={() => handleSort("assignee")}
                                  className="h-7 px-2 hover:bg-transparent text-xs font-semibold"
                                >
                                  Assignee
                                  {getSortIcon("assignee")}
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
                            {visibleColumns.dueDate && (
                              <TableHead className="text-xs font-semibold text-foreground px-3 py-3">
                                <Button
                                  variant="ghost"
                                  onClick={() => handleSort("due_date")}
                                  className="h-7 px-2 hover:bg-transparent text-xs font-semibold"
                                >
                                  Due Date
                                  {getSortIcon("due_date")}
                                </Button>
                              </TableHead>
                            )}
                            {visibleColumns.actions && (
                              <TableHead className="text-xs font-semibold text-foreground px-3 py-3">
                                Actions
                              </TableHead>
                            )}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredTasks
                            .sort((a, b) => {
                              let aValue: any = a[sortField as keyof Task];
                              let bValue: any = b[sortField as keyof Task];
                              
                              if (sortField === "due_date") {
                                aValue = aValue ? new Date(aValue).getTime() : 0;
                                bValue = bValue ? new Date(bValue).getTime() : 0;
                              } else if (sortField === "assignee") {
                                aValue = getAssigneeName(a.assignee || "");
                                bValue = getAssigneeName(b.assignee || "");
                              } else if (typeof aValue === "string") {
                                aValue = aValue.toLowerCase();
                                bValue = bValue.toLowerCase();
                              }
                              
                              if (sortDirection === "asc") {
                                return aValue > bValue ? 1 : -1;
                              } else {
                                return aValue < bValue ? 1 : -1;
                              }
                            })
                            .map((task) => (
                              <TableRow key={task.id} className="hover:bg-muted/50">
                                {visibleColumns.task && (
                                  <TableCell className="px-3 py-3">
                                    <div>
                                      <div className="font-medium text-sm">{task.title}</div>
                                      {task.description && (
                                        <div className="text-xs text-muted-foreground truncate max-w-[200px]" title={task.description}>
                                          {task.description}
                                        </div>
                                      )}
                                      {task.attachments && task.attachments.length > 0 && (
                                        <div className="flex items-center gap-1 mt-1">
                                          <Paperclip className="h-3 w-3 text-muted-foreground" />
                                          <span className="text-xs text-muted-foreground">
                                            {task.attachments.length} attachment(s)
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </TableCell>
                                )}
                                {visibleColumns.assignee && (
                                  <TableCell className="px-3 py-3">
                                    <div className="flex items-center gap-2">
                                      <Avatar className="h-6 w-6">
                                        <AvatarImage src={getAssigneePhoto(task.assignee || "")} />
                                        <AvatarFallback className="text-xs">
                                          {getAssigneeName(task.assignee || "").slice(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="text-sm truncate">{getAssigneeName(task.assignee || "")}</span>
                                    </div>
                                  </TableCell>
                                )}
                                {visibleColumns.status && (
                                  <TableCell className="px-3 py-3">
                                    <Select
                                      value={task.status}
                                      onValueChange={(value) => handleUpdateStatus(task.id, value)}
                                    >
                                      <SelectTrigger className="h-8 text-xs w-32">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="in_progress">In Progress</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </TableCell>
                                )}
                                {visibleColumns.priority && (
                                  <TableCell className="px-3 py-3">
                                    <Badge variant={getPriorityColor(task.priority) as any}>
                                      {task.priority}
                                    </Badge>
                                  </TableCell>
                                )}
                                {visibleColumns.dueDate && (
                                  <TableCell className="px-3 py-3">
                                    {task.due_date ? (
                                      <span className="text-sm">
                                        {new Date(task.due_date).toLocaleDateString()}
                                      </span>
                                    ) : (
                                      <span className="text-muted-foreground text-sm">No due date</span>
                                    )}
                                  </TableCell>
                                )}
                                {visibleColumns.actions && (
                                  <TableCell className="px-3 py-3">
                                    <div className="flex gap-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleShareTask(task)}
                                        className="h-8 w-8 p-0"
                                        title="Share task"
                                      >
                                        <Share className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteTask(task.id)}
                                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                        title="Delete task"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                )}
                              </TableRow>
                            ))}
                        </TableBody>
                      </UITable>
                    </div>
                  )}

                  {/* Calendar View */}
                  {viewType === "calendar" && (
                    <div className="space-y-4">
                      {/* Calendar Grid */}
                      <div className="bg-card border rounded-lg p-4">
                        <div className="grid grid-cols-7 gap-1 mb-4">
                          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                            <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                              {day}
                            </div>
                          ))}
                        </div>
                        
                        <div className="grid grid-cols-7 gap-1">
                          {(() => {
                            const today = new Date();
                            const currentMonth = today.getMonth();
                            const currentYear = today.getFullYear();
                            const firstDay = new Date(currentYear, currentMonth, 1);
                            const lastDay = new Date(currentYear, currentMonth + 1, 0);
                            const startDate = new Date(firstDay);
                            startDate.setDate(startDate.getDate() - firstDay.getDay());
                            
                            const days = [];
                            const currentDate = new Date(startDate);
                            
                            // Generate 42 days (6 weeks)
                            for (let i = 0; i < 42; i++) {
                              const isCurrentMonth = currentDate.getMonth() === currentMonth;
                              const isToday = currentDate.toDateString() === today.toDateString();
                              
                              // Get tasks for this date
                              const dayTasks = filteredTasks.filter(task => {
                                if (!task.due_date) return false;
                                const taskDate = new Date(task.due_date);
                                return taskDate.toDateString() === currentDate.toDateString();
                              });
                              
                              days.push(
                                <div
                                  key={i}
                                  className={`min-h-[100px] p-2 border rounded-lg ${
                                    isCurrentMonth ? 'bg-background' : 'bg-muted/30'
                                  } ${isToday ? 'ring-2 ring-primary' : ''}`}
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <span className={`text-sm font-medium ${
                                      isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'
                                    }`}>
                                      {currentDate.getDate()}
                                    </span>
                                    {dayTasks.length > 0 && (
                                      <Badge variant="secondary" className="text-xs">
                                        {dayTasks.length}
                                      </Badge>
                                    )}
                                  </div>
                                  
                                  <div className="space-y-1">
                                    {dayTasks.slice(0, 3).map((task) => (
                                      <div
                                        key={task.id}
                                        className="p-1 bg-primary/10 rounded text-xs cursor-pointer hover:bg-primary/20 transition-colors"
                                        title={`${task.title} - ${getAssigneeName(task.assignee || "")}`}
                                        onClick={() => handleTaskClick(task)}
                                      >
                                        <div className="flex items-center gap-1">
                                          <div className={`w-2 h-2 rounded-full ${
                                            task.priority === 'high' ? 'bg-red-500' :
                                            task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                                          }`} />
                                          <span className="truncate">{task.title}</span>
                                        </div>
                                        <div className="text-xs text-muted-foreground truncate">
                                          {getAssigneeName(task.assignee || "")}
                                        </div>
                                      </div>
                                    ))}
                                    {dayTasks.length > 3 && (
                                      <div className="text-xs text-muted-foreground text-center">
                                        +{dayTasks.length - 3} more
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                              
                              currentDate.setDate(currentDate.getDate() + 1);
                            }
                            
                            return days;
                          })()}
                        </div>
                      </div>
                      
                      {/* Task Summary by Assignee */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {(() => {
                          const assigneeTasks = filteredTasks.reduce((acc, task) => {
                            const assigneeName = getAssigneeName(task.assignee || "");
                            if (!acc[assigneeName]) {
                              acc[assigneeName] = [];
                            }
                            acc[assigneeName].push(task);
                            return acc;
                          }, {} as Record<string, Task[]>);
                          
                          return Object.entries(assigneeTasks).map(([assigneeName, tasks]) => (
                            <Card key={assigneeName} className="hover:shadow-md transition-shadow">
                              <CardHeader className="pb-3">
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={getAssigneePhoto(tasks[0].assignee || "")} />
                                    <AvatarFallback>
                                      {assigneeName.slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <CardTitle className="text-sm">{assigneeName}</CardTitle>
                                    <p className="text-xs text-muted-foreground">{tasks.length} tasks</p>
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent className="pt-0">
                                <div className="space-y-2">
                                  {tasks.slice(0, 3).map((task) => (
                                    <div key={task.id} className="flex items-center justify-between p-2 bg-muted/30 rounded cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleTaskClick(task)}>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium truncate">{task.title}</p>
                                        <p className="text-xs text-muted-foreground">
                                          {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}
                                        </p>
                                      </div>
                                      <Badge variant={getPriorityColor(task.priority) as any} className="text-xs ml-2">
                                        {task.priority}
                                      </Badge>
                                    </div>
                                  ))}
                                  {tasks.length > 3 && (
                                    <p className="text-xs text-muted-foreground text-center">
                                      +{tasks.length - 3} more tasks
                                    </p>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ));
                        })()}
                      </div>
                    </div>
                  )}

                </>
              )}
            </div>
          </div>
        </div>
      </SidebarInset>

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
            
            {/* File Attachments */}
            <div className="grid gap-2">
              <Label>Additional Attachments (Optional)</Label>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.xlsx,.xls,.ppt,.pptx"
                    onChange={(e) => handleFileUpload(e.target.files, setShareAttachments)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('share-file-input')?.click()}
                    className="gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Upload
                  </Button>
                </div>
                
                {shareAttachments.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Selected Files:</p>
                    {shareAttachments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                        <div className="flex items-center gap-2">
                          <File className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{file.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index, setShareAttachments)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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

      {/* Task Details Modal */}
      <Dialog open={isTaskModalOpen} onOpenChange={setIsTaskModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Task Details</DialogTitle>
            <DialogDescription>
              View and manage task information
            </DialogDescription>
          </DialogHeader>
          {selectedTask && (
            <div className="space-y-6">
              {/* Task Header */}
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">{selectedTask.title}</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant={getPriorityColor(selectedTask.priority) as any}>
                      {selectedTask.priority}
                    </Badge>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedTask.status)}`}>
                      {selectedTask.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={getAssigneePhoto(selectedTask.assignee || "")} />
                    <AvatarFallback>
                      {getAssigneeName(selectedTask.assignee || "").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-sm">
                    <p className="font-medium">{getAssigneeName(selectedTask.assignee || "")}</p>
                    <p className="text-muted-foreground">Assigned to</p>
                  </div>
                </div>
              </div>

              {/* Task Description */}
              {selectedTask.description && (
                <div className="space-y-2">
                  <h4 className="font-medium">Description</h4>
                  <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                    {selectedTask.description}
                  </p>
                </div>
              )}

              {/* Task Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Due Date</h4>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {selectedTask.due_date ? new Date(selectedTask.due_date).toLocaleDateString() : 'No due date'}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Created</h4>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {new Date(selectedTask.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Task Actions */}
              <div className="flex items-center gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleShareTask(selectedTask)}
                >
                  <Share className="h-4 w-4 mr-2" />
                  Share Task
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Add edit functionality here
                    toast.info("Edit functionality coming soon");
                  }}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Edit Task
                </Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTaskModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </SidebarProvider>
  );
}

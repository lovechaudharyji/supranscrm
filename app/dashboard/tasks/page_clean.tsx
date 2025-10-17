"use client";

import { useState, useEffect } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Calendar, User, Clock, CheckCircle, AlertCircle, XCircle, Grid3X3, Table, CalendarDays, LayoutGrid } from "lucide-react";
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
  const [viewType, setViewType] = useState<"kanban" | "table" | "calendar" | "cards">("kanban");
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium",
    due_date: "",
    assignee: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from("Tasks")
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
        .from("Tasks")
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
        setTasks([data[0], ...tasks]);
        setNewTask({
          title: "",
          description: "",
          priority: "medium",
          due_date: "",
          assignee: "",
        });
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
        .from("Tasks")
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
        .from("Tasks")
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
        <div className="flex flex-col h-screen">
          <SiteHeader />
          <div className="flex-1 p-6">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold">Task Manager</h1>
                  <p className="text-muted-foreground">Manage and assign tasks to employees</p>
                </div>
                <div className="flex items-center gap-4">
                  {/* View Toggle */}
                  <ToggleGroup
                    type="single"
                    value={viewType}
                    onValueChange={(value) => setViewType(value as "kanban" | "table" | "calendar" | "cards")}
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
                    <ToggleGroupItem value="cards" aria-label="Cards view">
                      <LayoutGrid className="h-4 w-4" />
                    </ToggleGroupItem>
                  </ToggleGroup>
                  
                  <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Task
                      </Button>
                    </DialogTrigger>
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
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleCreateTask}>Create Task</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* Task Views */}
              {tasks.length === 0 ? (
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {["pending", "in_progress", "completed"].map((status) => (
                        <div key={status} className="space-y-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${getStatusColor(status)}`} />
                            <h3 className="font-semibold capitalize">{status.replace('_', ' ')}</h3>
                            <Badge variant="secondary" className="ml-auto">
                              {tasks.filter(task => task.status === status).length}
                            </Badge>
                          </div>
                          <div className="space-y-3">
                            {tasks
                              .filter(task => task.status === status)
                              .map((task) => (
                                <Card key={task.id} className="hover:shadow-md transition-shadow cursor-pointer">
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
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Table View */}
                  {viewType === "table" && (
                    <div className="border rounded-lg">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="border-b">
                            <tr>
                              <th className="text-left p-4 font-medium">Task</th>
                              <th className="text-left p-4 font-medium">Assignee</th>
                              <th className="text-left p-4 font-medium">Status</th>
                              <th className="text-left p-4 font-medium">Priority</th>
                              <th className="text-left p-4 font-medium">Due Date</th>
                              <th className="text-left p-4 font-medium">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {tasks.map((task) => (
                              <tr key={task.id} className="border-b hover:bg-muted/50">
                                <td className="p-4">
                                  <div>
                                    <div className="font-medium">{task.title}</div>
                                    {task.description && (
                                      <div className="text-sm text-muted-foreground">{task.description}</div>
                                    )}
                                  </div>
                                </td>
                                <td className="p-4">
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-6 w-6">
                                      <AvatarImage src={getAssigneePhoto(task.assignee || "")} />
                                      <AvatarFallback className="text-xs">
                                        {getAssigneeName(task.assignee || "").slice(0, 2).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm">{getAssigneeName(task.assignee || "")}</span>
                                  </div>
                                </td>
                                <td className="p-4">
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
                                </td>
                                <td className="p-4">
                                  <Badge variant={getPriorityColor(task.priority) as any}>
                                    {task.priority}
                                  </Badge>
                                </td>
                                <td className="p-4">
                                  {task.due_date ? (
                                    <span className="text-sm">
                                      {new Date(task.due_date).toLocaleDateString()}
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground">No due date</span>
                                  )}
                                </td>
                                <td className="p-4">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteTask(task.id)}
                                    className="text-destructive hover:text-destructive"
                                  >
                                    Delete
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Calendar View */}
                  {viewType === "calendar" && (
                    <div className="space-y-4">
                      <div className="text-center">
                        <h3 className="text-lg font-semibold">Task Calendar</h3>
                        <p className="text-muted-foreground">Tasks organized by due date</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {tasks
                          .filter(task => task.due_date)
                          .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
                          .map((task) => (
                            <Card key={task.id} className="hover:shadow-md transition-shadow">
                              <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                  <div className="space-y-1">
                                    <CardTitle className="text-sm">{task.title}</CardTitle>
                                    <div className="flex items-center gap-2">
                                      <Calendar className="h-3 w-3 text-muted-foreground" />
                                      <span className="text-xs text-muted-foreground">
                                        {new Date(task.due_date!).toLocaleDateString()}
                                      </span>
                                    </div>
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
                                  <div className="flex items-center gap-2">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                                      {task.status.replace('_', ' ')}
                                    </span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Cards View */}
                  {viewType === "cards" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {tasks.map((task) => (
                        <Card key={task.id} className="hover:shadow-md transition-shadow">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <CardTitle className="text-lg">{task.title}</CardTitle>
                                {task.description && (
                                  <CardDescription className="text-sm">
                                    {task.description}
                                  </CardDescription>
                                )}
                              </div>
                              <div className="flex flex-col gap-2">
                                <Badge variant={getPriorityColor(task.priority) as any}>
                                  {task.priority}
                                </Badge>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                                  {task.status.replace('_', ' ')}
                                </span>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-6 w-6">
                                    <AvatarImage src={getAssigneePhoto(task.assignee || "")} />
                                    <AvatarFallback className="text-xs">
                                      {getAssigneeName(task.assignee || "").slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm">{getAssigneeName(task.assignee || "")}</span>
                                </div>
                              </div>
                              
                              {task.due_date && (
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm text-muted-foreground">
                                    Due: {new Date(task.due_date).toLocaleDateString()}
                                  </span>
                                </div>
                              )}

                              <div className="flex gap-2">
                                <Select
                                  value={task.status}
                                  onValueChange={(value) => handleUpdateStatus(task.id, value)}
                                >
                                  <SelectTrigger className="h-8 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending">
                                      <div className="flex items-center gap-2">
                                        <Clock className="h-3 w-3" />
                                        Pending
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="in_progress">
                                      <div className="flex items-center gap-2">
                                        <AlertCircle className="h-3 w-3" />
                                        In Progress
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="completed">
                                      <div className="flex items-center gap-2">
                                        <CheckCircle className="h-3 w-3" />
                                        Completed
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="cancelled">
                                      <div className="flex items-center gap-2">
                                        <XCircle className="h-3 w-3" />
                                        Cancelled
                                      </div>
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteTask(task.id)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

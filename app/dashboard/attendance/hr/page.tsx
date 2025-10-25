"use client";

import { useState, useEffect } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { HRSidebar } from "@/components/hr-sidebar";
import { useUserRole } from "@/contexts/UserRoleContext";
import { SiteHeader } from "@/components/site-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Calendar,
  BarChart3,
  PieChart,
  Download,
  Settings,
  Eye,
  Edit,
  Trash2,
  Plus,
  Filter,
  Search,
  RefreshCw,
  Bell,
  Shield,
  Target,
  Activity,
  Zap,
  ChevronDown,
  Grid3X3,
  User,
  List,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Building2,
  DollarSign,
  UserCheck,
  UserX,
  ClockIn,
  ClockOut,
  CalendarDays,
  FileText,
  Award,
  TrendingDown
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { toast } from "sonner";

interface AttendanceRecord {
  id: string;
  employee_name: string;
  employee_id: string;
  department: string;
  date: string;
  status: string;
  time_in?: string;
  time_out?: string;
  working_hours?: number;
  punctuality_status?: string;
  marked_by: string;
  marked_at: string;
  notes?: string;
}

interface Employee {
  id: string;
  name: string;
  employee_id: string;
  department: string;
  position: string;
  email: string;
  profile_photo?: string;
}

interface DepartmentStats {
  department: string;
  total_employees: number;
  present_today: number;
  attendance_rate: number;
  avg_working_hours: number;
}

export default function HRAttendancePage() {
  const { userRole, isLoading: roleLoading } = useUserRole();
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredData, setFilteredData] = useState<AttendanceRecord[]>([]);
  const [departmentStats, setDepartmentStats] = useState<DepartmentStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [departmentFilter, setDepartmentFilter] = useState<string[]>([]);
  const [timeFilter, setTimeFilter] = useState<string[]>([]);
  const [visibleColumns, setVisibleColumns] = useState({
    employee: true,
    department: true,
    date: true,
    status: true,
    timeIn: true,
    timeOut: true,
    workingHours: true,
    markedBy: true,
    actions: true
  });
  const [sortField, setSortField] = useState<string>("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [viewType, setViewType] = useState<"table" | "kanban">("table");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isMarkAttendanceOpen, setIsMarkAttendanceOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [attendanceForm, setAttendanceForm] = useState({
    status: 'Present',
    timeIn: '09:00',
    timeOut: '17:00',
    notes: ''
  });
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showRankings, setShowRankings] = useState(false);
  const [isTopPerformersOpen, setIsTopPerformersOpen] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log("Starting to load data from Supabase...");
      
      // Import Supabase client
      const { supabase } = await import('@/lib/supabaseClient');
      
      // Fetch employees from Employee Directory
      const { data: employeesData, error: employeesError } = await supabase
        .from('Employee Directory')
        .select(`
          whalesync_postgres_id,
          full_name,
          employee_id,
          department,
          profile_photo,
          official_email,
          status
        `)
        .eq('status', 'Active');
      
      if (employeesError) {
        console.error('Error fetching employees:', employeesError);
        throw employeesError;
      }
      
      // Fetch departments
      const { data: departmentsData, error: departmentsError } = await supabase
        .from('Departments')
        .select('whalesync_postgres_id, department_name, display_name');
      
      if (departmentsError) {
        console.error('Error fetching departments:', departmentsError);
        throw departmentsError;
      }
      
      // Create department lookup
      const departmentLookup = {};
      departmentsData?.forEach(dept => {
        departmentLookup[dept.whalesync_postgres_id] = dept.display_name || dept.department_name;
      });
      
      // Transform employees data
      const transformedEmployees = employeesData?.map(emp => ({
        id: emp.whalesync_postgres_id,
        name: emp.full_name,
        employee_id: emp.employee_id,
        department: departmentLookup[emp.department] || 'Unknown',
        position: 'Employee', // Default position
        email: emp.official_email,
        profile_photo: emp.profile_photo
      })) || [];
      
      console.log("Setting employees:", transformedEmployees);
      setEmployees(transformedEmployees);
      
      // Fetch attendance data
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('Attendance')
        .select(`
          whalesync_postgres_id,
          date,
          status,
          time_in,
          time_out,
          working_hours,
          punctuality_status,
          notes,
          employee,
          employee_id_from_employee,
          full_name_from_employee,
          department_name_from_employee
        `)
        .order('date', { ascending: false })
        .limit(100); // Limit to recent records
      
      if (attendanceError) {
        console.error('Error fetching attendance:', attendanceError);
        throw attendanceError;
      }
      
      // Transform attendance data
      const transformedAttendance = attendanceData?.map(record => ({
        id: record.whalesync_postgres_id,
        employee_name: record.full_name_from_employee || 'Unknown',
        employee_id: record.employee_id_from_employee || 'Unknown',
        department: departmentLookup[record.department_name_from_employee] || 'Unknown',
        date: record.date,
        status: record.status || 'Not Marked',
        time_in: record.time_in ? `${Math.floor(record.time_in)}:${String(Math.round((record.time_in % 1) * 60)).padStart(2, '0')}` : null,
        time_out: record.time_out ? `${Math.floor(record.time_out)}:${String(Math.round((record.time_out % 1) * 60)).padStart(2, '0')}` : null,
        working_hours: record.working_hours || 0,
        punctuality_status: record.punctuality_status || 'Not Marked',
        marked_by: 'HR', // Default value
        marked_at: new Date().toISOString(),
        notes: record.notes || ''
      })) || [];
      
      console.log("Setting attendance data:", transformedAttendance);
      setAttendanceData(transformedAttendance);
      setFilteredData(transformedAttendance);
      
      // Calculate department stats
      calculateDepartmentStats(transformedAttendance, transformedEmployees);
      
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load attendance data");
    } finally {
      setLoading(false);
    }
  };

  const calculateDepartmentStats = (attendance: AttendanceRecord[], employees: Employee[]) => {
    const today = new Date().toISOString().split('T')[0];
    const departments = [...new Set(employees.map(emp => emp.department).filter(Boolean))];
    
    const stats = departments.map(dept => {
      const deptEmployees = employees.filter(emp => emp.department === dept);
      const todayAttendance = attendance.filter(r => r.department === dept && r.date === today);
      const presentToday = todayAttendance.filter(r => r.status === 'Present').length;
      const attendanceRate = deptEmployees.length > 0 ? (presentToday / deptEmployees.length) * 100 : 0;
      const avgHours = todayAttendance.length > 0 ? 
        todayAttendance.reduce((sum, r) => sum + (r.working_hours || 0), 0) / todayAttendance.length : 0;

      return {
        department: dept || 'Unknown',
        total_employees: deptEmployees.length,
        present_today: presentToday,
        attendance_rate: Math.round(attendanceRate),
        avg_working_hours: Math.round(avgHours * 10) / 10
      };
    });

    setDepartmentStats(stats);
  };

  const applyFilters = () => {
    console.log("Applying filters...");
    console.log("attendanceData length:", attendanceData.length);
    console.log("searchTerm:", searchTerm);
    console.log("statusFilter:", statusFilter);
    console.log("departmentFilter:", departmentFilter);
    console.log("timeFilter:", timeFilter);
    
    let filtered = [...attendanceData];
    console.log("Initial filtered length:", filtered.length);

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(record => 
        record.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.employee_id.toLowerCase().includes(searchTerm.toLowerCase())
      );
      console.log("After search filter:", filtered.length);
    }

    // Status filter
    if (statusFilter.length > 0) {
      filtered = filtered.filter(record => statusFilter.includes(record.status));
      console.log("After status filter:", filtered.length);
    }

    // Department filter
    if (departmentFilter.length > 0) {
      filtered = filtered.filter(record => departmentFilter.includes(record.department));
      console.log("After department filter:", filtered.length);
    }

    // Time filter
    if (timeFilter.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      filtered = filtered.filter(record => {
        if (timeFilter.includes('Today') && record.date === today) return true;
        if (timeFilter.includes('Yesterday') && record.date === yesterday) return true;
        if (timeFilter.includes('Last 7 Days') && record.date >= lastWeek) return true;
        return false;
      });
      console.log("After time filter:", filtered.length);
    }

    // Sort the filtered data
    filtered.sort((a, b) => {
      let aValue: any = a[sortField as keyof typeof a];
      let bValue: any = b[sortField as keyof typeof b];

      if (sortField === "date") {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (sortField === "working_hours") {
        aValue = parseFloat(aValue) || 0;
        bValue = parseFloat(bValue) || 0;
      }

      if (sortDirection === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    console.log("Final filtered data:", filtered);
    setFilteredData(filtered);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, statusFilter, departmentFilter, timeFilter, sortField, sortDirection, attendanceData]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, departmentFilter, timeFilter]);

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

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const { draggableId, destination } = result;
    const newStatus = destination.droppableId;

    // Update local state optimistically
    const updatedData = filteredData.map(record => 
      record.id === draggableId ? { ...record, status: newStatus } : record
    );
    setFilteredData(updatedData);
    setAttendanceData(prev => 
      prev.map(record => 
        record.id === draggableId ? { ...record, status: newStatus } : record
      )
    );

    // Update database (skip for mock data)
    const record = filteredData.find(r => r.id === draggableId);
    if (record && record.employee_name) {
      // This is mock data, just show success
      toast.success('Attendance status updated successfully');
      return;
    }

    supabase
      .from('Attendance')
      .update({ status: newStatus, marked_at: new Date().toISOString() })
      .eq('id', draggableId)
      .then(({ error }) => {
        if (error) {
          console.error('Error updating attendance status:', error);
          toast.error('Failed to update attendance status');
          // Revert local state on error
          setFilteredData(filteredData);
          setAttendanceData(prev => 
            prev.map(record => 
              record.id === draggableId ? { ...record, status: record.status } : record
            )
          );
        } else {
          toast.success('Attendance status updated successfully');
        }
      });
  };

  // Pagination functions
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleFirstPage = () => {
    setCurrentPage(1);
  };

  const handleLastPage = () => {
    setCurrentPage(totalPages);
  };

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const handleViewRecord = (record: AttendanceRecord) => {
    setSelectedRecord(record);
    setIsDetailsOpen(true);
  };

  const handleEditRecord = (record: AttendanceRecord) => {
    // Open a modal or navigate to edit the record
    alert(`Editing attendance record for ${record.employee_name} on ${record.date}`);
  };

  const getMonthlyStats = (employeeId: string, month: number, year: number) => {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);
    
    const monthlyRecords = attendanceData.filter(record => {
      const recordDate = new Date(record.date);
      return record.employee_id === employeeId && 
             recordDate >= startDate && 
             recordDate <= endDate;
    });

    const present = monthlyRecords.filter(r => r.status === 'Present').length;
    const absent = monthlyRecords.filter(r => r.status === 'Absent').length;
    const halfDay = monthlyRecords.filter(r => r.status === 'Half Day').length;
    const holiday = monthlyRecords.filter(r => r.status === 'Holiday').length;
    const totalDays = endDate.getDate();
    const workingDays = totalDays - holiday;

    return {
      present,
      absent,
      halfDay,
      holiday,
      totalDays,
      workingDays,
      attendanceRate: workingDays > 0 ? Math.round((present + halfDay * 0.5) / workingDays * 100) : 0
    };
  };

  const getCalendarDays = (month: number, year: number) => {
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
      const date = new Date(year, month, day);
      const dateString = date.toISOString().split('T')[0];
      const record = selectedRecord ? attendanceData.find(r => 
        r.employee_id === selectedRecord.employee_id && r.date === dateString
      ) : null;
      
      days.push({
        day,
        date: dateString,
        record,
        isToday: dateString === new Date().toISOString().split('T')[0]
      });
    }
    
    return days;
  };

  const getTopPerformers = () => {
    const employeeStats = employees.map(emp => {
      const empRecords = attendanceData.filter(record => record.employee_id === emp.employee_id);
      const present = empRecords.filter(r => r.status === 'Present').length;
      const halfDay = empRecords.filter(r => r.status === 'Half Day').length;
      const total = empRecords.length;
      const attendanceRate = total > 0 ? Math.round(((present + halfDay * 0.5) / total) * 100) : 0;
      
      return {
        ...emp,
        present,
        halfDay,
        total,
        attendanceRate
      };
    });

    return employeeStats
      .sort((a, b) => b.attendanceRate - a.attendanceRate)
      .slice(0, 3);
  };

  const handleMarkAttendance = async (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsMarkAttendanceOpen(true);
  };

  const handleSubmitAttendance = async () => {
    if (!selectedEmployee) return;

    try {
      const workingHours = calculateWorkingHours(attendanceForm.timeIn, attendanceForm.timeOut);
      
      // Import Supabase client
      const { supabase } = await import('@/lib/supabaseClient');

      // Convert time strings to decimal format (e.g., "09:00" -> 9.0, "17:30" -> 17.5)
      const timeInDecimal = parseFloat(attendanceForm.timeIn.replace(':', '.'));
      const timeOutDecimal = parseFloat(attendanceForm.timeOut.replace(':', '.'));

      const { error } = await supabase
        .from('Attendance')
        .insert({
          employee: selectedEmployee.id,
          employee_id_from_employee: selectedEmployee.employee_id,
          full_name_from_employee: selectedEmployee.name,
          date: selectedDate,
          status: attendanceForm.status,
          time_in: timeInDecimal,
          time_out: timeOutDecimal,
          working_hours: workingHours,
          punctuality_status: attendanceForm.timeIn <= '09:00' ? 'On Time' : 'Late',
          notes: attendanceForm.notes,
          date_status: selectedDate === new Date().toISOString().split('T')[0] ? 'Today' : 'Before Today',
          day_name_of_date: new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' })
        });

      if (error) throw error;

      toast.success(`Attendance marked for ${selectedEmployee.name}`);
      setIsMarkAttendanceOpen(false);
      setSelectedEmployee(null);
      setAttendanceForm({
        status: 'Present',
        timeIn: '09:00',
        timeOut: '17:00',
        notes: ''
      });
      
      loadData(); // Reload data
    } catch (error) {
      console.error("Error marking attendance:", error);
      toast.error("Failed to mark attendance");
    }
  };

  const calculateWorkingHours = (timeIn: string, timeOut: string) => {
    const [inHour, inMin] = timeIn.split(':').map(Number);
    const [outHour, outMin] = timeOut.split(':').map(Number);
    const inMinutes = inHour * 60 + inMin;
    const outMinutes = outHour * 60 + outMin;
    const diffMinutes = outMinutes - inMinutes;
    return Math.round((diffMinutes / 60) * 10) / 10;
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-3 py-1 rounded-full text-sm font-medium";
    switch (status) {
      case 'Present':
        return <Badge className="bg-green-100 text-green-800 rounded-full px-2 py-0.5 text-xs">Present</Badge>;
      case 'Absent':
        return <Badge className="bg-red-100 text-red-800 rounded-full px-2 py-0.5 text-xs">Absent</Badge>;
      case 'Half Day':
        return <Badge className="bg-yellow-100 text-yellow-800 rounded-full px-2 py-0.5 text-xs">Half Day</Badge>;
      case 'Holiday':
        return <Badge className="bg-purple-100 text-purple-800 rounded-full px-2 py-0.5 text-xs">Holiday</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 rounded-full px-2 py-0.5 text-xs">{status}</Badge>;
    }
  };


  // Check if user is HR
  if (roleLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (userRole !== 'hr') {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-4">You don't have permission to access this page.</p>
          <Button onClick={() => window.location.href = '/login'}>
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
  return (
      <SidebarProvider>
        <HRSidebar />
        <SidebarInset>
          <div className="flex flex-col h-screen" suppressHydrationWarning>
            <SiteHeader title="HR Attendance Management" />
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-slate-600">Loading attendance data...</p>
      </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <HRSidebar />
      <SidebarInset className="h-screen">
        <div className="flex flex-col h-screen bg-background text-foreground" suppressHydrationWarning>
          <SiteHeader title="HR Attendance Management" />
          
          <div className="flex-1 flex flex-col bg-background">
            <div className="p-1 space-y-1 bg-background flex-1 flex flex-col min-h-0">
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 mb-2">
                <Card className="bg-gradient-to-t from-primary/5 to-card dark:bg-card shadow-xs">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                    <CardDescription className="text-sm font-medium">
                      Total Employees
                    </CardDescription>
                    <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
                    <CardTitle className="text-xl font-bold">
                      {employees.length}
                    </CardTitle>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-t from-primary/5 to-card dark:bg-card shadow-xs">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                    <CardDescription className="text-sm font-medium">
                      Present Today
                    </CardDescription>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <CardTitle className="text-xl font-bold">
                      {attendanceData.filter(r => r.date === new Date().toISOString().split('T')[0] && r.status === 'Present').length}
                    </CardTitle>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-t from-primary/5 to-card dark:bg-card shadow-xs">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                    <CardDescription className="text-sm font-medium">
                      Attendance Rate
                    </CardDescription>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <CardTitle className="text-xl font-bold">
                      {employees.length > 0 ? Math.round((attendanceData.filter(r => r.date === new Date().toISOString().split('T')[0] && r.status === 'Present').length / employees.length) * 100) : 0}%
                    </CardTitle>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-t from-primary/5 to-card dark:bg-card shadow-xs">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                    <CardDescription className="text-sm font-medium">
                      Departments
                    </CardDescription>
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <CardTitle className="text-xl font-bold">
                      {departmentStats.length}
                    </CardTitle>
                  </CardContent>
                </Card>
              </div>

              {/* Main Content Tabs */}
              <Tabs defaultValue="analytics" className="space-y-2">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                  <TabsTrigger value="mark-attendance">Mark Attendance</TabsTrigger>
                  <TabsTrigger value="departments">Departments</TabsTrigger>
                  <TabsTrigger value="reports">Reports</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                {/* Analytics Tab */}
                <TabsContent value="analytics" className="space-y-0">
                  {/* Action Bar */}
                  <div className="flex items-center gap-2 flex-wrap -mt-2">
              <Input
                      placeholder="Search employees..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-1 min-w-[300px] h-10"
                    />
                    
                    {/* Status Filter */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="h-10">
                          <Filter className="h-4 w-4 mr-2" />
                          {statusFilter.length > 0 ? `${statusFilter.length} Status` : "All Status"}
                          <ChevronDown className="h-4 w-4 ml-2" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-56">
                        <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
                          Select Status
            </div>
                        <div className="space-y-1">
                          {["Present", "Absent", "Half Day", "Holiday"].map(status => (
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
                              <Label htmlFor={`status-${status}`} className="text-sm">
                                {status}
                              </Label>
            </div>
                          ))}
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Department Filter */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="h-10">
                          <Filter className="h-4 w-4 mr-2" />
                          {departmentFilter.length > 0 ? `${departmentFilter.length} Departments` : "All Departments"}
                          <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-56">
                        <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
                          Select Departments
                        </div>
                        <div className="space-y-1">
                          {[...new Set(employees.map(emp => emp.department))].map(dept => (
                            <div key={dept} className="flex items-center space-x-2 px-2 py-1.5">
                              <Checkbox
                                id={`dept-${dept}`}
                                checked={departmentFilter.includes(dept)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setDepartmentFilter(prev => [...prev, dept]);
                                  } else {
                                    setDepartmentFilter(prev => prev.filter(d => d !== dept));
                                  }
                                }}
                              />
                              <Label htmlFor={`dept-${dept}`} className="text-sm">
                                {dept}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Time Filter */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="h-10">
                          <Filter className="h-4 w-4 mr-2" />
                          {timeFilter.length > 0 ? `${timeFilter.length} Time` : "All Time"}
                          <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-56">
                        <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
                          Select Time Period
            </div>
                        <div className="space-y-1">
                          {["Today", "Yesterday", "Last 7 Days"].map(time => (
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
                              <Label htmlFor={`time-${time}`} className="text-sm">
                                {time}
                              </Label>
          </div>
                          ))}
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* View Toggle */}
                    <div className="flex border rounded-md">
                      <Button
                        variant={viewType === "table" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setViewType("table")}
                        className="rounded-r-none"
                        title="Table View"
                      >
                        <List className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={viewType === "kanban" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setViewType("kanban")}
                        className="rounded-l-none"
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
                          <ChevronDown className="h-4 w-4 ml-2" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-56">
                        <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
                          Toggle Columns
                        </div>
                        <div className="space-y-1">
                          {Object.entries(visibleColumns).map(([key, value]) => (
                            <div key={key} className="flex items-center space-x-2 px-2 py-1.5">
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
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                              </Label>
                            </div>
                          ))}
                        </div>
                        <div className="px-2 py-1.5 border-t">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setVisibleColumns({
                              employee: true,
                              department: true,
                              date: true,
                              status: true,
                              timeIn: true,
                              timeOut: true,
                              workingHours: true,
                              markedBy: true,
                              actions: true
                            })}
                            className="w-full justify-start"
                          >
                            Reset to Default
                          </Button>
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>


                        {/* Table View */}
                        {viewType === "table" && (
                          <div className="flex flex-col h-[60vh]">
                            <div className="flex-1 overflow-y-auto border rounded-md bg-background">
                              <div className="p-0 -mt-1">
                                <Table className="rounded-none">
                                  <TableHeader className="rounded-none sticky top-0 bg-background z-10">
                                    <TableRow className="h-7">
                                      {visibleColumns.employee && (
                                        <TableHead className="py-2 px-3">
                                          <Button
                                            variant="ghost"
                                            onClick={() => handleSort("employee_name")}
                                            className="h-auto p-0 font-semibold hover:bg-transparent"
                                          >
                                            Employee
                                            {getSortIcon("employee_name")}
                                          </Button>
                                        </TableHead>
                                      )}
                                      {visibleColumns.department && (
                                        <TableHead className="py-2 px-3">
                                          <Button
                                            variant="ghost"
                                            onClick={() => handleSort("department")}
                                            className="h-auto p-0 font-semibold hover:bg-transparent"
                                          >
                                            Department
                                            {getSortIcon("department")}
                                          </Button>
                                        </TableHead>
                                      )}
                                      {visibleColumns.date && (
                                        <TableHead className="py-2 px-3">
                                          <Button
                                            variant="ghost"
                                            onClick={() => handleSort("date")}
                                            className="h-auto p-0 font-semibold hover:bg-transparent"
                                          >
                                            Date
                                            {getSortIcon("date")}
                                          </Button>
                                        </TableHead>
                                      )}
                                      {visibleColumns.status && (
                                        <TableHead className="py-2 px-3">
                                          <Button
                                            variant="ghost"
                                            onClick={() => handleSort("status")}
                                            className="h-auto p-0 font-semibold hover:bg-transparent"
                                          >
                                            Status
                                            {getSortIcon("status")}
                                          </Button>
                                        </TableHead>
                                      )}
                                      {visibleColumns.timeIn && (
                                        <TableHead className="py-2 px-3">
                                          <Button
                                            variant="ghost"
                                            onClick={() => handleSort("time_in")}
                                            className="h-auto p-0 font-semibold hover:bg-transparent"
                                          >
                                            Time In
                                            {getSortIcon("time_in")}
                                          </Button>
                                        </TableHead>
                                      )}
                                      {visibleColumns.timeOut && (
                                        <TableHead className="py-2 px-3">
                                          <Button
                                            variant="ghost"
                                            onClick={() => handleSort("time_out")}
                                            className="h-auto p-0 font-semibold hover:bg-transparent"
                                          >
                                            Time Out
                                            {getSortIcon("time_out")}
                                          </Button>
                                        </TableHead>
                                      )}
                                      {visibleColumns.workingHours && (
                                        <TableHead className="py-2 px-3">
                                          <Button
                                            variant="ghost"
                                            onClick={() => handleSort("working_hours")}
                                            className="h-auto p-0 font-semibold hover:bg-transparent"
                                          >
                                            Working Hours
                                            {getSortIcon("working_hours")}
                                          </Button>
                                        </TableHead>
                                      )}
                                      {visibleColumns.markedBy && (
                                        <TableHead className="py-2 px-3">
                                          <Button
                                            variant="ghost"
                                            onClick={() => handleSort("marked_by")}
                                            className="h-auto p-0 font-semibold hover:bg-transparent"
                                          >
                                            Marked By
                                            {getSortIcon("marked_by")}
                                          </Button>
                                        </TableHead>
                                      )}
                                      {visibleColumns.actions && <TableHead className="py-0 px-2">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                                    {paginatedData.length === 0 ? (
                  <TableRow>
                                        <TableCell colSpan={Object.values(visibleColumns).filter(Boolean).length} className="text-center py-8">
                      <div className="text-center">
                                            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-slate-700">No Records Found</h3>
                                            <p className="text-gray-500">Try adjusting your filters or check back later.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                                      paginatedData.map((record) => (
                                         <TableRow key={record.id} className="h-9">
                                          {visibleColumns.employee && (
                                            <TableCell className="py-2 px-3">
                          <div>
                                                <div className="font-medium text-sm">{record.employee_name}</div>
                                                <div className="text-sm text-gray-500">{record.employee_id}</div>
                                              </div>
                                            </TableCell>
                                          )}
                                          {visibleColumns.department && <TableCell className="py-2 px-3 text-sm">{record.department}</TableCell>}
                                          {visibleColumns.date && <TableCell className="py-2 px-3 text-sm">{record.date}</TableCell>}
                                          {visibleColumns.status && <TableCell className="py-2 px-3">{getStatusBadge(record.status)}</TableCell>}
                                          {visibleColumns.timeIn && <TableCell className="py-2 px-3 text-sm">{record.time_in}</TableCell>}
                                          {visibleColumns.timeOut && <TableCell className="py-2 px-3 text-sm">{record.time_out}</TableCell>}
                                          {visibleColumns.workingHours && <TableCell className="py-2 px-3 text-sm">{record.working_hours}h</TableCell>}
                                          {visibleColumns.markedBy && <TableCell className="py-2 px-3 text-sm">{record.marked_by}</TableCell>}
                                          {visibleColumns.actions && (
                                            <TableCell className="py-2 px-3">
                                              <div className="flex gap-2">
                                                <Button 
                                                  size="sm" 
                                                  variant="ghost"
                                                  className="border-0 h-6 w-6 p-0"
                                                  onClick={() => handleViewRecord(record)}
                                                >
                                                  <Eye className="h-3 w-3" />
                                                </Button>
                                                <Button 
                                                  size="sm" 
                                                  variant="ghost"
                                                  className="border-0 h-6 w-6 p-0"
                                                  onClick={() => handleEditRecord(record)}
                                                >
                                                  <Edit className="h-3 w-3" />
                                                </Button>
                            </div>
                                            </TableCell>
                                          )}
                                        </TableRow>
                                      ))
                                    )}
                                  </TableBody>
                                </Table>
                          </div>
                        </div>

                            {/* Pagination */}
                            {filteredData.length > 0 && (
                              <div className="flex items-center justify-between px-4 py-2 border-t bg-background -mb-2">
                                <div className="flex items-center gap-4">
                                  <div className="text-sm text-muted-foreground">
                                    Showing {startIndex + 1} to {Math.min(endIndex, filteredData.length)} of {filteredData.length} records
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">Rows per page:</span>
                                    <select 
                                      value={itemsPerPage} 
                                      onChange={(e) => setItemsPerPage(Number(e.target.value))}
                                      className="px-2 py-1 border rounded text-sm"
                                    >
                                      <option value={5}>5</option>
                                      <option value={10}>10</option>
                                      <option value={25}>25</option>
                                      <option value={50}>50</option>
                                      <option value={100}>100</option>
                                    </select>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleFirstPage}
                                    disabled={currentPage === 1}
                                    className="rounded-none"
                                  >
                                    First
                            </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handlePrevPage}
                                    disabled={currentPage === 1}
                                    className="rounded-none"
                                  >
                                    Previous
                                  </Button>
                                  <span className="text-sm">
                                    Page {currentPage} of {totalPages}
                                  </span>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleNextPage}
                                    disabled={currentPage === totalPages}
                                    className="rounded-none"
                                  >
                                    Next
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleLastPage}
                                    disabled={currentPage === totalPages}
                                    className="rounded-none"
                                  >
                                    Last
                            </Button>
                          </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Kanban View */}
                        {viewType === "kanban" && (
                          <div className="flex flex-col h-[60vh] font-sans">
                            <div className="flex-1 overflow-y-auto border rounded-md bg-background">
                              <div className="p-0 -mt-1">
                                <DragDropContext onDragEnd={handleDragEnd}>
                                  <div className="flex gap-4 p-4">
                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                                    {/* Present Column */}
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2 p-3 bg-card border border-border rounded-none shadow-sm">
                                        <CheckCircle className="h-4 w-4 text-gray-600" />
                                        <span className="font-semibold text-foreground text-sm">Present</span>
                                        <Badge variant="secondary" className="ml-auto rounded-none">
                                          {paginatedData.filter(record => record.status === 'Present').length}
                                        </Badge>
                                      </div>
                                      <Droppable droppableId="Present">
                                        {(provided, snapshot) => (
                                          <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className={`min-h-[200px] p-2 rounded-none transition-colors ${
                                              snapshot.isDraggingOver ? 'bg-muted/50' : 'bg-muted/20'
                                            }`}
                                          >
                                            {paginatedData
                                              .filter(record => record.status === 'Present')
                                              .map((record, index) => (
                                                <Draggable key={record.id} draggableId={record.id} index={index}>
                                                  {(provided, snapshot) => (
                                                    <div
                                                      ref={provided.innerRef}
                                                      {...provided.draggableProps}
                                                      {...provided.dragHandleProps}
                                                      className={`p-3 bg-card border border-border rounded-none shadow-sm mb-2 cursor-move hover:shadow-md transition-all ${
                                                        snapshot.isDragging ? 'rotate-2 scale-105 shadow-lg' : ''
                                                      }`}
                                                    >
                                                      <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                        <div className="font-medium text-foreground text-sm">{record.employee_name}</div>
                                                        <div className="text-xs text-muted-foreground">{record.department}</div>
                                                          <div className="text-xs text-gray-400 mt-1">
                                                            {record.time_in} - {record.time_out}
                                                          </div>
                                                          <div className="text-xs text-muted-foreground">
                                                            {record.working_hours}h worked
                                                          </div>
                                                        </div>
                                                        <div className="flex gap-1">
                                                          <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-6 w-6 p-0 rounded-none"
                                                            onClick={(e) => {
                                                              e.stopPropagation();
                                                              handleViewRecord(record);
                                                            }}
                                                          >
                                                            <Eye className="h-3 w-3" />
                                                          </Button>
                                                          <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-6 w-6 p-0 rounded-none"
                                                            onClick={(e) => {
                                                              e.stopPropagation();
                                                              handleViewRecord(record);
                                                            }}
                                                          >
                                                            <Edit className="h-3 w-3" />
                                                          </Button>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  )}
                                                </Draggable>
                                              ))}
                                            {provided.placeholder}
                                          </div>
                                        )}
                                      </Droppable>
                                    </div>

                                    {/* Absent Column */}
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2 p-3 bg-card border border-border rounded-none shadow-sm">
                                        <AlertTriangle className="h-4 w-4 text-gray-600" />
                                        <span className="font-semibold text-foreground text-sm">Absent</span>
                                        <Badge variant="secondary" className="ml-auto rounded-none">
                                          {paginatedData.filter(record => record.status === 'Absent').length}
                                        </Badge>
                                      </div>
                                      <Droppable droppableId="Absent">
                                        {(provided, snapshot) => (
                                          <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className={`min-h-[200px] p-2 rounded-none transition-colors ${
                                              snapshot.isDraggingOver ? 'bg-muted/50' : 'bg-muted/20'
                                            }`}
                                          >
                                            {paginatedData
                                              .filter(record => record.status === 'Absent')
                                              .map((record, index) => (
                                                <Draggable key={record.id} draggableId={record.id} index={index}>
                                                  {(provided, snapshot) => (
                                                    <div
                                                      ref={provided.innerRef}
                                                      {...provided.draggableProps}
                                                      {...provided.dragHandleProps}
                                                      className={`p-3 bg-card border border-border rounded-none shadow-sm mb-2 cursor-move hover:shadow-md transition-all ${
                                                        snapshot.isDragging ? 'rotate-2 scale-105 shadow-lg' : ''
                                                      }`}
                                                    >
                                                      <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                        <div className="font-medium text-foreground text-sm">{record.employee_name}</div>
                                                        <div className="text-xs text-muted-foreground">{record.department}</div>
                                                          <div className="text-xs text-gray-400 mt-1">
                                                            {record.date}
                                                          </div>
                                                          {record.notes && (
                                                            <div className="text-xs text-gray-400 mt-1">
                                                              {record.notes}
                                                            </div>
                                                          )}
                                                        </div>
                                                        <div className="flex gap-1">
                                                          <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-6 w-6 p-0 rounded-none"
                                                            onClick={(e) => {
                                                              e.stopPropagation();
                                                              handleViewRecord(record);
                                                            }}
                                                          >
                                                            <Eye className="h-3 w-3" />
                            </Button>
                                                          <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-6 w-6 p-0 rounded-none"
                                                            onClick={(e) => {
                                                              e.stopPropagation();
                                                              handleViewRecord(record);
                                                            }}
                                                          >
                                                            <Edit className="h-3 w-3" />
                            </Button>
                          </div>
                                                      </div>
                                                    </div>
                                                  )}
                                                </Draggable>
                                              ))}
                                            {provided.placeholder}
                                          </div>
                                        )}
                                      </Droppable>
                                    </div>

                                    {/* Half Day Column */}
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2 p-3 bg-card border border-border rounded-none shadow-sm">
                                        <Clock className="h-4 w-4 text-gray-600" />
                                        <span className="font-semibold text-foreground text-sm">Half Day</span>
                                        <Badge variant="secondary" className="ml-auto rounded-none">
                                          {paginatedData.filter(record => record.status === 'Half Day').length}
                                        </Badge>
                                      </div>
                                      <Droppable droppableId="Half Day">
                                        {(provided, snapshot) => (
                                          <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className={`min-h-[200px] p-2 rounded-none transition-colors ${
                                              snapshot.isDraggingOver ? 'bg-muted/50' : 'bg-muted/20'
                                            }`}
                                          >
                                            {paginatedData
                                              .filter(record => record.status === 'Half Day')
                                              .map((record, index) => (
                                                <Draggable key={record.id} draggableId={record.id} index={index}>
                                                  {(provided, snapshot) => (
                                                    <div
                                                      ref={provided.innerRef}
                                                      {...provided.draggableProps}
                                                      {...provided.dragHandleProps}
                                                      className={`p-3 bg-card border border-border rounded-none shadow-sm mb-2 cursor-move hover:shadow-md transition-all ${
                                                        snapshot.isDragging ? 'rotate-2 scale-105 shadow-lg' : ''
                                                      }`}
                                                    >
                                                      <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                        <div className="font-medium text-foreground text-sm">{record.employee_name}</div>
                                                        <div className="text-xs text-muted-foreground">{record.department}</div>
                                                          <div className="text-xs text-gray-400 mt-1">
                                                            {record.time_in} - {record.time_out}
                                                          </div>
                                                          <div className="text-xs text-muted-foreground">
                                                            {record.working_hours}h worked
                                                          </div>
                                                        </div>
                                                        <div className="flex gap-1">
                                                          <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-6 w-6 p-0 rounded-none"
                                                            onClick={(e) => {
                                                              e.stopPropagation();
                                                              handleViewRecord(record);
                                                            }}
                                                          >
                                                            <Eye className="h-3 w-3" />
                                                          </Button>
                                                          <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-6 w-6 p-0 rounded-none"
                                                            onClick={(e) => {
                                                              e.stopPropagation();
                                                              handleViewRecord(record);
                                                            }}
                                                          >
                                                            <Edit className="h-3 w-3" />
                                                          </Button>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  )}
                                                </Draggable>
                                              ))}
                                            {provided.placeholder}
                                          </div>
                                        )}
                                      </Droppable>
                                    </div>

                                    {/* Holiday Column */}
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2 p-3 bg-card border border-border rounded-none shadow-sm">
                                        <Calendar className="h-4 w-4 text-gray-600" />
                                        <span className="font-semibold text-foreground text-sm">Holiday</span>
                                        <Badge variant="secondary" className="ml-auto rounded-none">
                                          {paginatedData.filter(record => record.status === 'Holiday').length}
                                        </Badge>
                                      </div>
                                      <Droppable droppableId="Holiday">
                                        {(provided, snapshot) => (
                                          <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className={`min-h-[200px] p-2 rounded-none transition-colors ${
                                              snapshot.isDraggingOver ? 'bg-muted/50' : 'bg-muted/20'
                                            }`}
                                          >
                                            {paginatedData
                                              .filter(record => record.status === 'Holiday')
                                              .map((record, index) => (
                                                <Draggable key={record.id} draggableId={record.id} index={index}>
                                                  {(provided, snapshot) => (
                                                    <div
                                                      ref={provided.innerRef}
                                                      {...provided.draggableProps}
                                                      {...provided.dragHandleProps}
                                                      className={`p-3 bg-card border border-border rounded-none shadow-sm mb-2 cursor-move hover:shadow-md transition-all ${
                                                        snapshot.isDragging ? 'rotate-2 scale-105 shadow-lg' : ''
                                                      }`}
                                                    >
                                                      <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                        <div className="font-medium text-foreground text-sm">{record.employee_name}</div>
                                                        <div className="text-xs text-muted-foreground">{record.department}</div>
                                                          <div className="text-xs text-gray-400 mt-1">
                                                            {record.date}
                                                          </div>
                                                          {record.notes && (
                                                            <div className="text-xs text-gray-400 mt-1">
                                                              {record.notes}
                                                            </div>
                                                          )}
                                                        </div>
                                                        <div className="flex gap-1">
                        <Button
                                                            size="sm"
                          variant="outline"
                                                            className="h-6 w-6 p-0 rounded-none"
                                                            onClick={(e) => {
                                                              e.stopPropagation();
                                                              handleViewRecord(record);
                                                            }}
                                                          >
                                                            <Eye className="h-3 w-3" />
                                                          </Button>
                                                          <Button
                          size="sm"
                                                            variant="outline"
                                                            className="h-6 w-6 p-0 rounded-none"
                                                            onClick={(e) => {
                                                              e.stopPropagation();
                                                              handleViewRecord(record);
                                                            }}
                        >
                                                            <Edit className="h-3 w-3" />
                        </Button>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  )}
                                                </Draggable>
                                              ))}
                                            {provided.placeholder}
                                          </div>
                                        )}
                                      </Droppable>
                                    </div>
                                    </div>

                                    {/* Top Performers Icon */}
                                    <div className="flex items-center justify-center">
                                      <Button
                                        variant="outline"
                                        size="lg"
                                        className="h-16 w-16 rounded-none border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                                        onClick={() => setIsTopPerformersOpen(true)}
                                        title="Top Attendance Performers"
                                      >
                                        <TrendingUp className="h-8 w-8 text-gray-600" />
                                      </Button>
                                    </div>
                                  </div>
                                </DragDropContext>
                              </div>
                            </div>

                            {/* Pagination for Kanban */}
                            {filteredData.length > 0 && (
                              <div className="flex items-center justify-between px-4 py-2 border-t bg-background -mb-2">
                                <div className="flex items-center gap-4">
                                  <div className="text-sm text-muted-foreground">
                                    Showing {startIndex + 1} to {Math.min(endIndex, filteredData.length)} of {filteredData.length} records
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">Rows per page:</span>
                                    <select 
                                      value={itemsPerPage} 
                                      onChange={(e) => setItemsPerPage(Number(e.target.value))}
                                      className="px-2 py-1 border rounded text-sm"
                                    >
                                      <option value={5}>5</option>
                                      <option value={10}>10</option>
                                      <option value={25}>25</option>
                                      <option value={50}>50</option>
                                      <option value={100}>100</option>
                                    </select>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleFirstPage}
                                    disabled={currentPage === 1}
                                    className="rounded-none"
                                  >
                                    First
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handlePrevPage}
                                    disabled={currentPage === 1}
                                    className="rounded-none"
                                  >
                                    Previous
                                  </Button>
                                  <span className="text-sm">
                                    Page {currentPage} of {totalPages}
                                  </span>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleNextPage}
                                    disabled={currentPage === totalPages}
                                    className="rounded-none"
                                  >
                                    Next
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleLastPage}
                                    disabled={currentPage === totalPages}
                                    className="rounded-none"
                                  >
                                    Last
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                </TabsContent>

                {/* Mark Attendance Tab */}
                <TabsContent value="mark-attendance" className="space-y-4 flex-1 flex flex-col min-h-0">
                  <Card className="rounded-none">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <UserCheck className="h-5 w-5 text-primary" />
                        Mark Employee Attendance
                      </CardTitle>
                      <CardDescription>Mark attendance for any employee in the system</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="date">Date</Label>
                            <Input
                              id="date"
                              type="date"
                              value={selectedDate}
                              onChange={(e) => setSelectedDate(e.target.value)}
                              className="mt-1"
                            />
    </div>
                          <div>
                            <Label>Quick Actions</Label>
                            <div className="flex gap-2 mt-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                              >
                                Today
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedDate(new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0])}
                              >
                                Yesterday
                              </Button>
                            </div>
                          </div>
                        </div>

                        <div className="grid gap-4">
                          <h3 className="text-lg font-semibold">Select Employee to Mark Attendance</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {employees.map((employee) => (
                              <Card key={employee.id} className="cursor-pointer hover:shadow-md transition-shadow">
                                <CardContent className="p-4">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                        <span className="text-sm font-semibold">
                                          {employee.name.split(' ').map(n => n[0]).join('')}
                                        </span>
                                      </div>
                                      <div>
                                        <h4 className="font-semibold">{employee.name}</h4>
                                        <p className="text-sm text-muted-foreground">{employee.department}</p>
                                        <p className="text-xs text-muted-foreground">{employee.position}</p>
                                      </div>
                                    </div>
                                    <Button
                                      size="sm"
                                      onClick={() => handleMarkAttendance(employee)}
                                      className="rounded-none"
                                    >
                                      <UserCheck className="h-4 w-4 mr-1" />
                                      Mark
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Departments Tab */}
                <TabsContent value="departments" className="space-y-4">
                  <Card className="rounded-none">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-primary" />
                        Department Performance
                      </CardTitle>
                      <CardDescription>Real-time attendance statistics by department</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="grid gap-3 p-4">
                        {departmentStats.length === 0 ? (
                          <div className="text-center py-8">
                            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-muted-foreground">No Department Data</h3>
                            <p className="text-sm text-muted-foreground">Department statistics will appear here once data is available.</p>
                          </div>
                        ) : (
                          departmentStats.map((dept, index) => {
                          const getDepartmentIcon = (deptName: string) => {
                            if (!deptName) return <Building2 className="h-4 w-4 text-gray-600" />;
                            switch (deptName.toLowerCase()) {
                              case 'sales': return <Target className="h-4 w-4 text-blue-600" />;
                              case 'marketing': return <TrendingUp className="h-4 w-4 text-purple-600" />;
                              case 'hr': return <Users className="h-4 w-4 text-green-600" />;
                              case 'it': return <Zap className="h-4 w-4 text-orange-600" />;
                              case 'finance': return <DollarSign className="h-4 w-4 text-emerald-600" />;
                              default: return <Building2 className="h-4 w-4 text-gray-600" />;
                            }
                          };

                          const getAttendanceColor = (rate: number) => {
                            if (rate >= 95) return 'text-green-600 bg-green-50 border-green-200';
                            if (rate >= 85) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
                            return 'text-red-600 bg-red-50 border-red-200';
                          };

                          const getProgressColor = (rate: number) => {
                            if (rate >= 95) return 'bg-gradient-to-r from-green-500 to-green-600';
                            if (rate >= 85) return 'bg-gradient-to-r from-yellow-500 to-yellow-600';
                            return 'bg-gradient-to-r from-red-500 to-red-600';
  };

  return (
                            <Card key={dept.department} className="border-l-4 border-l-primary/20 hover:shadow-md transition-all duration-200">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-primary/5">
                                      {getDepartmentIcon(dept.department)}
                                    </div>
      <div>
                                      <h3 className="font-semibold text-lg">{dept.department}</h3>
                                      <p className="text-sm text-muted-foreground">
                                        {dept.present_today} of {dept.total_employees} employees present
        </p>
      </div>
                                  </div>
                                  <div className="text-right">
                                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${getAttendanceColor(dept.attendance_rate)}`}>
                                      {dept.attendance_rate}%
                                    </div>
                                    <div className="text-sm text-muted-foreground mt-1">
                                      Avg: {dept.avg_working_hours}h
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="space-y-2">
                                  <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Attendance Rate</span>
                                    <span>{dept.attendance_rate}%</span>
                                  </div>
                                  <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full transition-all duration-500 ${getProgressColor(dept.attendance_rate)}`}
                                      style={{ width: `${dept.attendance_rate}%` }}
                                    ></div>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between mt-3 pt-3 border-t">
                                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                      <CheckCircle className="h-3 w-3 text-green-600" />
                                      <span>{dept.present_today} Present</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-3 w-3 text-blue-600" />
                                      <span>{dept.avg_working_hours}h avg</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    {dept.attendance_rate >= 95 && <Badge className="bg-green-100 text-green-800 text-xs">Excellent</Badge>}
                                    {dept.attendance_rate >= 85 && dept.attendance_rate < 95 && <Badge className="bg-yellow-100 text-yellow-800 text-xs">Good</Badge>}
                                    {dept.attendance_rate < 85 && <Badge className="bg-red-100 text-red-800 text-xs">Needs Attention</Badge>}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Reports Tab */}
                <TabsContent value="reports" className="space-y-4">
                  <Card className="rounded-none">
                    <CardHeader>
                      <CardTitle>Attendance Reports</CardTitle>
                      <CardDescription>Generate and export attendance reports</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Card>
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3">
                                <FileText className="h-8 w-8 text-blue-600" />
      <div>
                                  <h3 className="font-semibold">Daily Report</h3>
                                  <p className="text-sm text-muted-foreground">Generate daily attendance report</p>
      </div>
                              </div>
                              <Button className="w-full mt-3 rounded-none">
                                <Download className="h-4 w-4 mr-2" />
                                Download Report
                              </Button>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3">
                                <CalendarDays className="h-8 w-8 text-green-600" />
      <div>
                                  <h3 className="font-semibold">Monthly Report</h3>
                                  <p className="text-sm text-muted-foreground">Generate monthly attendance report</p>
      </div>
                              </div>
                              <Button className="w-full mt-3 rounded-none">
                                <Download className="h-4 w-4 mr-2" />
                                Download Report
                              </Button>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Settings Tab */}
                <TabsContent value="settings" className="space-y-4">
                  <Card className="rounded-none">
                    <CardHeader>
                      <CardTitle>HR Attendance Settings</CardTitle>
                      <CardDescription>Configure attendance policies and rules</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
      <div>
                            <Label htmlFor="auto-approval">Auto-approve attendance</Label>
                            <p className="text-sm text-muted-foreground">Automatically approve attendance submissions</p>
      </div>
                          <Switch id="auto-approval" />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="late-alerts">Late attendance alerts</Label>
                            <p className="text-sm text-muted-foreground">Send alerts for late attendance marking</p>
                          </div>
                          <Switch id="late-alerts" defaultChecked />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </SidebarInset>

      {/* Mark Attendance Dialog */}
      <Dialog open={isMarkAttendanceOpen} onOpenChange={setIsMarkAttendanceOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mark Attendance</DialogTitle>
            <DialogDescription>
              Mark attendance for {selectedEmployee?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
      <div>
        <Label htmlFor="status">Status</Label>
              <Select value={attendanceForm.status} onValueChange={(value) => {
                setAttendanceForm(prev => ({ 
                  ...prev, 
                  status: value,
                  // Auto-set times for Half Day
                  timeIn: value === 'Half Day' ? '09:00' : prev.timeIn,
                  timeOut: value === 'Half Day' ? '13:00' : prev.timeOut
                }));
              }}>
                <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Present">Present</SelectItem>
            <SelectItem value="Absent">Absent</SelectItem>
            <SelectItem value="Half Day">Half Day</SelectItem>
                  <SelectItem value="Holiday">Holiday</SelectItem>
          </SelectContent>
        </Select>
      </div>
            
                {(attendanceForm.status === 'Present' || attendanceForm.status === 'Half Day') && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
      <div>
                        <Label htmlFor="timeIn">Time In</Label>
                        <Input
                          id="timeIn"
                          type="time"
                          value={attendanceForm.timeIn}
                          onChange={(e) => setAttendanceForm(prev => ({ ...prev, timeIn: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="timeOut">Time Out</Label>
                        <Input
                          id="timeOut"
                          type="time"
                          value={attendanceForm.timeOut}
                          onChange={(e) => setAttendanceForm(prev => ({ ...prev, timeOut: e.target.value }))}
                        />
                      </div>
                    </div>
                    
                    {/* Quick Time Buttons */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Quick Time Presets</Label>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setAttendanceForm(prev => ({ 
                            ...prev, 
                            status: 'Present',
                            timeIn: "09:00", 
                            timeOut: "17:00" 
                          }))}
                          className="text-xs"
                        >
                          Full Day (9-5)
                        </Button>
                        <Button
                          type="button"
                          variant="default"
                          size="sm"
                          onClick={() => setAttendanceForm(prev => ({ 
                            ...prev, 
                            status: 'Half Day',
                            timeIn: "09:00", 
                            timeOut: "13:00" 
                          }))}
                          className="text-xs bg-orange-500 hover:bg-orange-600 text-white"
                        >
                          🕐 Half Day (9-1)
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setAttendanceForm(prev => ({ 
                            ...prev, 
                            timeIn: "09:00", 
                            timeOut: "12:00" 
                          }))}
                          className="text-xs"
                        >
                          Morning (9-12)
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setAttendanceForm(prev => ({ 
                            ...prev, 
                            timeIn: "13:00", 
                            timeOut: "17:00" 
                          }))}
                          className="text-xs"
                        >
                          Afternoon (1-5)
                        </Button>
                      </div>
                    </div>
                  </>
                )}
            
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
        <Textarea
          id="notes"
                placeholder="Add any notes about this attendance record..."
                value={attendanceForm.notes}
                onChange={(e) => setAttendanceForm(prev => ({ ...prev, notes: e.target.value }))}
        />
      </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsMarkAttendanceOpen(false)}>
          Cancel
        </Button>
            <Button onClick={handleSubmitAttendance}>
              Mark Attendance
        </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Employee Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-background">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <User className="h-5 w-5" />
              Employee Attendance Details
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Detailed attendance information and calendar view for {selectedRecord?.employee_name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedRecord && (
            <div className="space-y-6">
              {/* Employee Info */}
              <Card className="bg-gradient-to-t from-primary/5 to-card dark:bg-card shadow-xs rounded-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-foreground">Employee Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-background/50 rounded-lg border">
                      <Label className="text-sm font-medium text-muted-foreground">Employee Name</Label>
                      <p className="text-lg font-semibold text-foreground mt-1">{selectedRecord.employee_name}</p>
                    </div>
                    <div className="p-4 bg-background/50 rounded-lg border">
                      <Label className="text-sm font-medium text-muted-foreground">Employee ID</Label>
                      <p className="text-lg font-semibold text-foreground mt-1">{selectedRecord.employee_id}</p>
                    </div>
                    <div className="p-4 bg-background/50 rounded-lg border">
                      <Label className="text-sm font-medium text-muted-foreground">Department</Label>
                      <p className="text-lg font-semibold text-foreground mt-1">{selectedRecord.department}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Monthly Statistics */}
              <Card className="bg-gradient-to-t from-primary/5 to-card dark:bg-card shadow-xs rounded-lg">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-foreground">Monthly Statistics</CardTitle>
                    <div className="flex items-center gap-2">
                      <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                        <SelectTrigger className="w-32 bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => (
                            <SelectItem key={i} value={i.toString()}>
                              {new Date(2024, i).toLocaleString('default', { month: 'long' })}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                        <SelectTrigger className="w-24 bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 5 }, (_, i) => {
                            const year = new Date().getFullYear() - 2 + i;
                            return (
                              <SelectItem key={year} value={year.toString()}>
                                {year}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const stats = getMonthlyStats(selectedRecord.employee_id, selectedMonth, selectedYear);
                    return (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-gradient-to-t from-green-500/10 to-green-600/5 border border-green-200/20 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">{stats.present}</div>
                          <div className="text-sm text-green-700">Present</div>
                        </div>
                        <div className="text-center p-4 bg-gradient-to-t from-red-500/10 to-red-600/5 border border-red-200/20 rounded-lg">
                          <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
                          <div className="text-sm text-red-700">Absent</div>
                        </div>
                        <div className="text-center p-4 bg-gradient-to-t from-orange-500/10 to-orange-600/5 border border-orange-200/20 rounded-lg">
                          <div className="text-2xl font-bold text-orange-600">{stats.halfDay}</div>
                          <div className="text-sm text-orange-700">Half Day</div>
                        </div>
                        <div className="text-center p-4 bg-gradient-to-t from-blue-500/10 to-blue-600/5 border border-blue-200/20 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">{stats.attendanceRate}%</div>
                          <div className="text-sm text-blue-700">Attendance Rate</div>
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* Calendar View */}
              <Card className="bg-gradient-to-t from-primary/5 to-card dark:bg-card shadow-xs rounded-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-foreground">Attendance Calendar</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Calendar Header */}
                    <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium text-muted-foreground">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="p-2">{day}</div>
                      ))}
                    </div>
                    
                    {/* Calendar Days */}
                    <div className="grid grid-cols-7 gap-1">
                      {getCalendarDays(selectedMonth, selectedYear).map((day, index) => (
                        <div
                          key={index}
                          className={`
                            aspect-square p-2 text-center text-sm border rounded-lg
                            ${day ? 'bg-background border-border' : 'bg-muted/20'}
                            ${day?.isToday ? 'ring-2 ring-primary' : ''}
                            ${day?.record ? 'cursor-pointer hover:bg-muted/50' : ''}
                          `}
                          onClick={() => day?.record && handleViewRecord(day.record)}
                        >
                          {day && (
                            <>
                              <div className="font-medium text-foreground">{day.day}</div>
                              {day.record && (
                                <div className="mt-1">
                                  {day.record.status === 'Present' && (
                                    <div className="w-2 h-2 bg-green-500 rounded-full mx-auto"></div>
                                  )}
                                  {day.record.status === 'Absent' && (
                                    <div className="w-2 h-2 bg-red-500 rounded-full mx-auto"></div>
                                  )}
                                  {day.record.status === 'Half Day' && (
                                    <div className="w-2 h-2 bg-orange-500 rounded-full mx-auto"></div>
                                  )}
                                  {day.record.status === 'Holiday' && (
                                    <div className="w-2 h-2 bg-blue-500 rounded-full mx-auto"></div>
                                  )}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    {/* Legend */}
                    <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span>Present</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span>Absent</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                        <span>Half Day</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span>Holiday</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Attendance Records */}
              <Card className="bg-gradient-to-t from-primary/5 to-card dark:bg-card shadow-xs rounded-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-foreground">Recent Attendance Records</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {attendanceData
                      .filter(record => record.employee_id === selectedRecord.employee_id)
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .slice(0, 10)
                      .map((record, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg bg-background/50">
                          <div className="flex items-center gap-3">
                            <div className="text-sm font-medium text-foreground">{record.date}</div>
                            <div className={`px-2 py-1 text-xs rounded-lg ${
                              record.status === 'Present' ? 'bg-green-100 text-green-800' :
                              record.status === 'Absent' ? 'bg-red-100 text-red-800' :
                              record.status === 'Half Day' ? 'bg-orange-100 text-orange-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {record.status}
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {record.time_in && record.time_out ? `${record.time_in} - ${record.time_out}` : 'N/A'}
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Top Performers Dialog */}
      <Dialog open={isTopPerformersOpen} onOpenChange={setIsTopPerformersOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Top Attendance Performers
            </DialogTitle>
            <DialogDescription>
              Best performing employees based on attendance records
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Top 3 Performers */}
            <Card className="rounded-none">
              <CardHeader>
                <CardTitle className="text-lg">🏆 Top 3 Performers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {getTopPerformers().map((performer, index) => (
                    <div key={performer.id} className="p-4 bg-card border border-border rounded-none shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 text-gray-600 font-bold text-lg">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-foreground text-lg">{performer.name}</div>
                          <div className="text-sm text-muted-foreground">{performer.department}</div>
                          <div className="text-xs text-muted-foreground mt-1">Employee ID: {performer.employee_id}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-foreground">{performer.attendanceRate}%</div>
                          <div className="text-sm text-muted-foreground">{performer.present} present days</div>
                          <div className="text-xs text-muted-foreground">{performer.halfDay} half days</div>
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="flex justify-between text-sm text-muted-foreground mb-1">
                          <span>Attendance Rate</span>
                          <span>{performer.attendanceRate}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-none h-3">
                          <div 
                            className="bg-green-500 h-3 rounded-none transition-all duration-500"
                            style={{ width: `${performer.attendanceRate}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* All Employees Ranking */}
            <Card className="rounded-none">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Complete Rankings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {employees.map((emp, index) => {
                    const empRecords = attendanceData.filter(record => record.employee_id === emp.employee_id);
                    const present = empRecords.filter(r => r.status === 'Present').length;
                    const halfDay = empRecords.filter(r => r.status === 'Half Day').length;
                    const total = empRecords.length;
                    const attendanceRate = total > 0 ? Math.round(((present + halfDay * 0.5) / total) * 100) : 0;
                    
                    return (
                      <div key={emp.id} className="flex items-center justify-between p-3 border border-border rounded-none">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-sm font-bold text-gray-600">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium text-foreground">{emp.name}</div>
                            <div className="text-sm text-muted-foreground">{emp.department}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-sm font-bold text-foreground">{attendanceRate}%</div>
                            <div className="text-xs text-muted-foreground">{present} present</div>
                          </div>
                          <div className="w-20 bg-muted rounded-none h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-none"
                              style={{ width: `${attendanceRate}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Statistics Summary */}
            <Card className="rounded-none">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Team Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-none">
                    <div className="text-2xl font-bold text-blue-600">
                      {Math.round(employees.reduce((acc, emp) => {
                        const empRecords = attendanceData.filter(record => record.employee_id === emp.employee_id);
                        const present = empRecords.filter(r => r.status === 'Present').length;
                        const halfDay = empRecords.filter(r => r.status === 'Half Day').length;
                        const total = empRecords.length;
                        return acc + (total > 0 ? ((present + halfDay * 0.5) / total) * 100 : 0);
                      }, 0) / employees.length)}
                    </div>
                    <div className="text-sm text-blue-700">Average Attendance Rate</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 border border-green-200 rounded-none">
                    <div className="text-2xl font-bold text-green-600">
                      {attendanceData.filter(r => r.status === 'Present').length}
                    </div>
                    <div className="text-sm text-green-700">Total Present Days</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 border border-orange-200 rounded-none">
                    <div className="text-2xl font-bold text-orange-600">
                      {employees.length}
                    </div>
                    <div className="text-sm text-orange-700">Total Employees</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
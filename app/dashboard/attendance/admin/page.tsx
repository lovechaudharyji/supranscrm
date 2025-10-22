"use client";

import { useState, useEffect } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
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
  List,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Building2,
  DollarSign
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
  time_in: string;
  time_out: string;
  working_hours: number;
  punctuality_status: string;
  marked_by: string;
  marked_at: string;
  notes: string;
}

interface DepartmentStats {
  department: string;
  total_employees: number;
  present_today: number;
  attendance_rate: number;
  avg_working_hours: number;
}

interface ExceptionAlert {
  id: string;
  type: 'late_marking' | 'missing_record' | 'discrepancy' | 'policy_violation';
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  department: string;
  created_at: string;
  status: 'open' | 'resolved';
}

export default function AdminAttendancePage() {
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [departmentStats, setDepartmentStats] = useState<DepartmentStats[]>([]);
  const [exceptionAlerts, setExceptionAlerts] = useState<ExceptionAlert[]>([]);
  const [filteredData, setFilteredData] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [dateRange, setDateRange] = useState("7");
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
  const [viewType, setViewType] = useState<"table" | "kanban" | "rankings">("table");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [settings, setSettings] = useState({
    autoApproval: false,
    lateMarkingAlerts: true,
    exceptionNotifications: true
  });

  // Executive Dashboard Stats
  const [dashboardStats, setDashboardStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    overallAttendanceRate: 0,
    departmentsWithIssues: 0,
    pendingExceptions: 0,
    avgWorkingHours: 0
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Always use mock data for now to ensure it works
      console.log("Loading mock attendance data...");
      const mockEmployees = generateMockEmployeeData();
      const mockAttendance = generateMockAttendanceData();
      
      console.log("Mock employees:", mockEmployees);
      console.log("Mock attendance:", mockAttendance);
      
      processAttendanceData(mockAttendance, mockEmployees);
      
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateMockEmployeeData = () => {
    return [
      { whalesync_postgres_id: "1", full_name: "John Smith", department: "Sales" },
      { whalesync_postgres_id: "2", full_name: "Sarah Johnson", department: "Marketing" },
      { whalesync_postgres_id: "3", full_name: "Mike Wilson", department: "Sales" },
      { whalesync_postgres_id: "4", full_name: "Emily Davis", department: "HR" },
      { whalesync_postgres_id: "5", full_name: "David Brown", department: "IT" },
      { whalesync_postgres_id: "6", full_name: "Lisa Anderson", department: "Marketing" },
      { whalesync_postgres_id: "7", full_name: "Tom Miller", department: "Sales" },
      { whalesync_postgres_id: "8", full_name: "Anna Garcia", department: "HR" },
      { whalesync_postgres_id: "9", full_name: "Chris Lee", department: "IT" },
      { whalesync_postgres_id: "10", full_name: "Maria Rodriguez", department: "Finance" }
    ];
  };

  const generateMockAttendanceData = () => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const employees = [
      { id: "1", name: "John Smith", employee_id: "EMP001", department: "Sales" },
      { id: "2", name: "Sarah Johnson", employee_id: "EMP002", department: "Marketing" },
      { id: "3", name: "Mike Wilson", employee_id: "EMP003", department: "Sales" },
      { id: "4", name: "Emily Davis", employee_id: "EMP004", department: "HR" },
      { id: "5", name: "David Brown", employee_id: "EMP005", department: "IT" },
      { id: "6", name: "Lisa Anderson", employee_id: "EMP006", department: "Marketing" },
      { id: "7", name: "Tom Miller", employee_id: "EMP007", department: "Sales" },
      { id: "8", name: "Anna Garcia", employee_id: "EMP008", department: "HR" },
      { id: "9", name: "Chris Lee", employee_id: "EMP009", department: "IT" },
      { id: "10", name: "Maria Rodriguez", employee_id: "EMP010", department: "Finance" }
    ];

    // Deterministic data to avoid hydration mismatch
    const attendanceData = [
      // John Smith
      { id: "1_today", employee_name: "John Smith", employee_id: "EMP001", department: "Sales", date: today, status: "Present", time_in: "09:00", time_out: "17:00", working_hours: 8, punctuality_status: "On Time", marked_by: "HR", marked_at: today + "T10:00:00Z", notes: "" },
      { id: "1_yesterday", employee_name: "John Smith", employee_id: "EMP001", department: "Sales", date: yesterday, status: "Present", time_in: "08:45", time_out: "17:15", working_hours: 8.25, punctuality_status: "On Time", marked_by: "HR", marked_at: yesterday + "T10:00:00Z", notes: "" },
      { id: "1_twoDaysAgo", employee_name: "John Smith", employee_id: "EMP001", department: "Sales", date: twoDaysAgo, status: "Present", time_in: "09:15", time_out: "17:30", working_hours: 8.25, punctuality_status: "On Time", marked_by: "HR", marked_at: twoDaysAgo + "T10:00:00Z", notes: "" },
      
      // Sarah Johnson
      { id: "2_today", employee_name: "Sarah Johnson", employee_id: "EMP002", department: "Marketing", date: today, status: "Present", time_in: "09:30", time_out: "18:00", working_hours: 8.5, punctuality_status: "On Time", marked_by: "HR", marked_at: today + "T10:00:00Z", notes: "" },
      { id: "2_yesterday", employee_name: "Sarah Johnson", employee_id: "EMP002", department: "Marketing", date: yesterday, status: "Half Day", time_in: "09:00", time_out: "13:00", working_hours: 4, punctuality_status: "On Time", marked_by: "HR", marked_at: yesterday + "T10:00:00Z", notes: "Medical appointment" },
      { id: "2_twoDaysAgo", employee_name: "Sarah Johnson", employee_id: "EMP002", department: "Marketing", date: twoDaysAgo, status: "Present", time_in: "08:30", time_out: "17:00", working_hours: 8.5, punctuality_status: "On Time", marked_by: "HR", marked_at: twoDaysAgo + "T10:00:00Z", notes: "" },
      
      // Mike Wilson
      { id: "3_today", employee_name: "Mike Wilson", employee_id: "EMP003", department: "Sales", date: today, status: "Present", time_in: "09:00", time_out: "17:00", working_hours: 8, punctuality_status: "On Time", marked_by: "HR", marked_at: today + "T10:00:00Z", notes: "" },
      { id: "3_yesterday", employee_name: "Mike Wilson", employee_id: "EMP003", department: "Sales", date: yesterday, status: "Present", time_in: "08:45", time_out: "17:15", working_hours: 8.25, punctuality_status: "On Time", marked_by: "HR", marked_at: yesterday + "T10:00:00Z", notes: "" },
      { id: "3_twoDaysAgo", employee_name: "Mike Wilson", employee_id: "EMP003", department: "Sales", date: twoDaysAgo, status: "Absent", time_in: "N/A", time_out: "N/A", working_hours: 0, punctuality_status: "On Time", marked_by: "HR", marked_at: twoDaysAgo + "T10:00:00Z", notes: "Sick leave" },
      
      // Emily Davis
      { id: "4_today", employee_name: "Emily Davis", employee_id: "EMP004", department: "HR", date: today, status: "Present", time_in: "09:00", time_out: "17:00", working_hours: 8, punctuality_status: "On Time", marked_by: "HR", marked_at: today + "T10:00:00Z", notes: "" },
      { id: "4_yesterday", employee_name: "Emily Davis", employee_id: "EMP004", department: "HR", date: yesterday, status: "Present", time_in: "08:30", time_out: "17:30", working_hours: 9, punctuality_status: "On Time", marked_by: "HR", marked_at: yesterday + "T10:00:00Z", notes: "" },
      { id: "4_twoDaysAgo", employee_name: "Emily Davis", employee_id: "EMP004", department: "HR", date: twoDaysAgo, status: "Present", time_in: "09:15", time_out: "17:15", working_hours: 8, punctuality_status: "On Time", marked_by: "HR", marked_at: twoDaysAgo + "T10:00:00Z", notes: "" },
      
      // David Brown
      { id: "5_today", employee_name: "David Brown", employee_id: "EMP005", department: "IT", date: today, status: "Present", time_in: "09:00", time_out: "17:00", working_hours: 8, punctuality_status: "On Time", marked_by: "HR", marked_at: today + "T10:00:00Z", notes: "" },
      { id: "5_yesterday", employee_name: "David Brown", employee_id: "EMP005", department: "IT", date: yesterday, status: "Present", time_in: "08:45", time_out: "17:15", working_hours: 8.25, punctuality_status: "On Time", marked_by: "HR", marked_at: yesterday + "T10:00:00Z", notes: "" },
      { id: "5_twoDaysAgo", employee_name: "David Brown", employee_id: "EMP005", department: "IT", date: twoDaysAgo, status: "Present", time_in: "09:00", time_out: "17:00", working_hours: 8, punctuality_status: "On Time", marked_by: "HR", marked_at: twoDaysAgo + "T10:00:00Z", notes: "" },
      
      // Lisa Anderson
      { id: "6_today", employee_name: "Lisa Anderson", employee_id: "EMP006", department: "Marketing", date: today, status: "Present", time_in: "09:30", time_out: "18:00", working_hours: 8.5, punctuality_status: "On Time", marked_by: "HR", marked_at: today + "T10:00:00Z", notes: "" },
      { id: "6_yesterday", employee_name: "Lisa Anderson", employee_id: "EMP006", department: "Marketing", date: yesterday, status: "Present", time_in: "09:00", time_out: "17:00", working_hours: 8, punctuality_status: "On Time", marked_by: "HR", marked_at: yesterday + "T10:00:00Z", notes: "" },
      { id: "6_twoDaysAgo", employee_name: "Lisa Anderson", employee_id: "EMP006", department: "Marketing", date: twoDaysAgo, status: "Present", time_in: "08:30", time_out: "17:30", working_hours: 9, punctuality_status: "On Time", marked_by: "HR", marked_at: twoDaysAgo + "T10:00:00Z", notes: "" },
      
      // Tom Miller
      { id: "7_today", employee_name: "Tom Miller", employee_id: "EMP007", department: "Sales", date: today, status: "Present", time_in: "09:00", time_out: "17:00", working_hours: 8, punctuality_status: "On Time", marked_by: "HR", marked_at: today + "T10:00:00Z", notes: "" },
      { id: "7_yesterday", employee_name: "Tom Miller", employee_id: "EMP007", department: "Sales", date: yesterday, status: "Present", time_in: "08:45", time_out: "17:15", working_hours: 8.25, punctuality_status: "On Time", marked_by: "HR", marked_at: yesterday + "T10:00:00Z", notes: "" },
      { id: "7_twoDaysAgo", employee_name: "Tom Miller", employee_id: "EMP007", department: "Sales", date: twoDaysAgo, status: "Present", time_in: "09:15", time_out: "17:15", working_hours: 8, punctuality_status: "On Time", marked_by: "HR", marked_at: twoDaysAgo + "T10:00:00Z", notes: "" },
      
      // Anna Garcia
      { id: "8_today", employee_name: "Anna Garcia", employee_id: "EMP008", department: "HR", date: today, status: "Present", time_in: "09:00", time_out: "17:00", working_hours: 8, punctuality_status: "On Time", marked_by: "HR", marked_at: today + "T10:00:00Z", notes: "" },
      { id: "8_yesterday", employee_name: "Anna Garcia", employee_id: "EMP008", department: "HR", date: yesterday, status: "Present", time_in: "08:30", time_out: "17:30", working_hours: 9, punctuality_status: "On Time", marked_by: "HR", marked_at: yesterday + "T10:00:00Z", notes: "" },
      { id: "8_twoDaysAgo", employee_name: "Anna Garcia", employee_id: "EMP008", department: "HR", date: twoDaysAgo, status: "Present", time_in: "09:00", time_out: "17:00", working_hours: 8, punctuality_status: "On Time", marked_by: "HR", marked_at: twoDaysAgo + "T10:00:00Z", notes: "" },
      
      // Chris Lee
      { id: "9_today", employee_name: "Chris Lee", employee_id: "EMP009", department: "IT", date: today, status: "Present", time_in: "09:00", time_out: "17:00", working_hours: 8, punctuality_status: "On Time", marked_by: "HR", marked_at: today + "T10:00:00Z", notes: "" },
      { id: "9_yesterday", employee_name: "Chris Lee", employee_id: "EMP009", department: "IT", date: yesterday, status: "Present", time_in: "08:45", time_out: "17:15", working_hours: 8.25, punctuality_status: "On Time", marked_by: "HR", marked_at: yesterday + "T10:00:00Z", notes: "" },
      { id: "9_twoDaysAgo", employee_name: "Chris Lee", employee_id: "EMP009", department: "IT", date: twoDaysAgo, status: "Present", time_in: "09:00", time_out: "17:00", working_hours: 8, punctuality_status: "On Time", marked_by: "HR", marked_at: twoDaysAgo + "T10:00:00Z", notes: "" },
      
      // Maria Rodriguez
      { id: "10_today", employee_name: "Maria Rodriguez", employee_id: "EMP010", department: "Finance", date: today, status: "Present", time_in: "09:00", time_out: "17:00", working_hours: 8, punctuality_status: "On Time", marked_by: "HR", marked_at: today + "T10:00:00Z", notes: "" },
      { id: "10_yesterday", employee_name: "Maria Rodriguez", employee_id: "EMP010", department: "Finance", date: yesterday, status: "Present", time_in: "08:30", time_out: "17:30", working_hours: 9, punctuality_status: "On Time", marked_by: "HR", marked_at: yesterday + "T10:00:00Z", notes: "" },
      { id: "10_twoDaysAgo", employee_name: "Maria Rodriguez", employee_id: "EMP010", department: "Finance", date: twoDaysAgo, status: "Present", time_in: "09:00", time_out: "17:00", working_hours: 8, punctuality_status: "On Time", marked_by: "HR", marked_at: twoDaysAgo + "T10:00:00Z", notes: "" }
    ];

    return attendanceData;
  };

  const processAttendanceData = (attendance: any[], employees: any[]) => {
    console.log("Processing attendance data:", attendance);
    console.log("Processing employees data:", employees);
    
    const processedAttendance = attendance.map(record => ({
      id: record.whalesync_postgres_id || record.id,
      employee_name: record.employee_name || record.name || "Unknown",
      employee_id: record.employee_id || "N/A",
      department: record.department || "Unknown",
      date: record.date,
      status: record.status,
      time_in: record.time_in || "N/A",
      time_out: record.time_out || "N/A",
      working_hours: record.working_hours || 0,
      punctuality_status: record.punctuality_status || "On Time",
      marked_by: record.marked_by || "HR",
      marked_at: record.marked_at || record.created_at || new Date().toISOString(),
      notes: record.notes || ""
    }));

    console.log("Processed attendance:", processedAttendance);
    
    // Force set some test data if processedAttendance is empty
    if (processedAttendance.length === 0) {
      console.log("No processed attendance, setting test data");
      const testData = [{
        id: "test_1",
        employee_name: "Test Employee",
        employee_id: "TEST001",
        department: "Test",
        date: new Date().toISOString().split('T')[0],
        status: "Present",
        time_in: "09:00",
        time_out: "17:00",
        working_hours: 8,
        punctuality_status: "On Time",
        marked_by: "HR",
        marked_at: new Date().toISOString(),
        notes: ""
      }];
      setAttendanceData(testData);
      setFilteredData(testData);
    } else {
      setAttendanceData(processedAttendance);
      setFilteredData(processedAttendance);
    }

    // Calculate department stats
    const deptStats = calculateDepartmentStats(processedAttendance, employees);
    setDepartmentStats(deptStats);

    // Generate exception alerts
    const alerts = generateExceptionAlerts(processedAttendance);
    setExceptionAlerts(alerts);

    // Calculate dashboard stats
    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = processedAttendance.filter(r => r.date === today);
    const totalEmployees = employees.length;
    const presentToday = todayAttendance.filter(r => r.status === 'Present').length;
    const overallRate = totalEmployees > 0 ? (presentToday / totalEmployees) * 100 : 0;

    setDashboardStats({
      totalEmployees,
      presentToday,
      overallAttendanceRate: Math.round(overallRate),
      departmentsWithIssues: deptStats.filter(d => d.attendance_rate < 80).length,
      pendingExceptions: alerts.filter(a => a.status === 'open').length,
      avgWorkingHours: todayAttendance.length > 0 ? 
        todayAttendance.reduce((sum, r) => sum + r.working_hours, 0) / todayAttendance.length : 0
    });
  };

  const calculateDepartmentStats = (attendance: AttendanceRecord[], employees: any[]) => {
    const departments = [...new Set(employees.map(emp => emp.department))];
    
    return departments.map(dept => {
      const deptEmployees = employees.filter(emp => emp.department === dept);
      const today = new Date().toISOString().split('T')[0];
      const todayAttendance = attendance.filter(r => r.department === dept && r.date === today);
      const presentToday = todayAttendance.filter(r => r.status === 'Present').length;
      const attendanceRate = deptEmployees.length > 0 ? (presentToday / deptEmployees.length) * 100 : 0;
      const avgHours = todayAttendance.length > 0 ? 
        todayAttendance.reduce((sum, r) => sum + r.working_hours, 0) / todayAttendance.length : 0;

      return {
        department: dept,
        total_employees: deptEmployees.length,
        present_today: presentToday,
        attendance_rate: Math.round(attendanceRate),
        avg_working_hours: Math.round(avgHours * 10) / 10
      };
    });
  };

  const generateExceptionAlerts = (attendance: AttendanceRecord[]) => {
    const alerts: ExceptionAlert[] = [];
    const today = new Date().toISOString().split('T')[0];

    // Generate deterministic exception alerts
    alerts.push({
      id: 'late_1',
      type: 'late_marking',
      severity: 'medium',
      title: 'Late Attendance Marking',
      description: 'Attendance for John Smith was marked late',
      department: 'Sales',
      created_at: today + 'T11:30:00Z',
      status: 'open'
    });

    alerts.push({
      id: 'missing_1',
      type: 'missing_record',
      severity: 'high',
      title: 'Missing Attendance Record',
      description: 'No attendance record found for Mike Wilson today',
      department: 'Sales',
      created_at: today + 'T12:00:00Z',
      status: 'open'
    });

    alerts.push({
      id: 'discrepancy_1',
      type: 'discrepancy',
      severity: 'low',
      title: 'Time Discrepancy',
      description: 'Working hours mismatch for Sarah Johnson',
      department: 'Marketing',
      created_at: today + 'T10:15:00Z',
      status: 'open'
    });

    return alerts;
  };

  const applyFilters = () => {
    let filtered = [...attendanceData];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(record => 
        record.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.employee_id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter.length > 0) {
      filtered = filtered.filter(record => statusFilter.includes(record.status));
    }

    // Department filter
    if (departmentFilter.length > 0) {
      filtered = filtered.filter(record => departmentFilter.includes(record.department));
    }

    // Time filter (based on date)
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
    }

    // Sort the filtered data
    filtered.sort((a, b) => {
      let aValue: any = a[sortField as keyof typeof a];
      let bValue: any = b[sortField as keyof typeof b];

      // Handle date sorting
      if (sortField === "date") {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      // Handle numeric sorting
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

    setFilteredData(filtered);
  };

  useEffect(() => {
    applyFilters();
  }, [selectedDepartment, searchTerm, statusFilter, departmentFilter, timeFilter, sortField, sortDirection, attendanceData]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, departmentFilter, timeFilter]);

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 rounded-none text-xs font-medium";
    switch (status) {
      case 'Present':
        return <Badge className="bg-green-100 text-green-800 rounded-none">Present</Badge>;
      case 'Absent':
        return <Badge className="bg-red-100 text-red-800 rounded-none">Absent</Badge>;
      case 'Half Day':
        return <Badge className="bg-yellow-100 text-yellow-800 rounded-none">Half Day</Badge>;
      case 'Holiday':
        return <Badge className="bg-purple-100 text-purple-800 rounded-none">Holiday</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 rounded-none">{status}</Badge>;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high':
        return <Badge className="bg-red-100 text-red-800">High</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
      case 'low':
        return <Badge className="bg-green-100 text-green-800">Low</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{severity}</Badge>;
    }
  };

  const handleViewRecord = (record: AttendanceRecord) => {
    console.log("Viewing record:", record);
    // Implement view functionality
  };

  const handleEditRecord = (record: AttendanceRecord) => {
    console.log("Editing record:", record);
    // Implement edit functionality
  };

  const handleResolveException = (alertId: string) => {
    setExceptionAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, status: 'resolved' as const }
          : alert
      )
    );
    console.log("Resolved exception:", alertId);
  };

  const handleExportData = () => {
    const csvContent = [
      ['Employee Name', 'Employee ID', 'Department', 'Date', 'Status', 'Time In', 'Time Out', 'Working Hours', 'Marked By'],
      ...filteredData.map(record => [
        record.employee_name,
        record.employee_id,
        record.department,
        record.date,
        record.status,
        record.time_in,
        record.time_out,
        record.working_hours.toString(),
        record.marked_by
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleGenerateReport = (reportType: string) => {
    console.log("Generating report:", reportType);
    // Implement report generation
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

  // Pagination logic
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleFirstPage = () => setCurrentPage(1);
  const handleLastPage = () => setCurrentPage(totalPages);
  const handlePrevPage = () => setCurrentPage(prev => Math.max(1, prev - 1));
  const handleNextPage = () => setCurrentPage(prev => Math.min(totalPages, prev + 1));

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    
    // If dropped in the same position, do nothing
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    // Get the new status from the destination droppable
    const newStatus = destination.droppableId;
    
    // Find the record being moved
    const record = filteredData.find(r => r.id === draggableId);
    if (!record) return;

    // Update the record's status
    const updatedRecord = { ...record, status: newStatus };
    
    // Update the local state immediately for better UX
    setFilteredData(prev => 
      prev.map(r => r.id === draggableId ? updatedRecord : r)
    );
    
    setAttendanceData(prev => 
      prev.map(r => r.id === draggableId ? updatedRecord : r)
    );

    // Update the database
    try {
      // Check if this is mock data (has employee_name field) or real database data
      if (record.employee_name) {
        // This is mock data, just show success message
        toast.success(`Moved ${record.employee_name} to ${newStatus}`);
        console.log(`Successfully moved ${record.employee_name} to ${newStatus} (mock data)`);
        return;
      }

      // This is real database data, update the database
      const { error } = await supabase
        .from('Attendance')
        .update({ 
          status: newStatus,
          marked_at: new Date().toISOString()
        })
        .eq('id', draggableId);

      if (error) {
        console.error('Error updating attendance status:', error);
        // Revert the local state if database update fails
        setFilteredData(prev => 
          prev.map(r => r.id === draggableId ? record : r)
        );
        setAttendanceData(prev => 
          prev.map(r => r.id === draggableId ? record : r)
        );
        toast.error('Failed to update attendance status');
        return;
      }

      // Show success message
      toast.success(`Moved ${record.employee_name || record.full_name_from_employee} to ${newStatus}`);
      console.log(`Successfully moved ${record.employee_name || record.full_name_from_employee} to ${newStatus}`);
    } catch (error) {
      console.error('Error updating attendance status:', error);
      // Revert the local state if database update fails
      setFilteredData(prev => 
        prev.map(r => r.id === draggableId ? record : r)
      );
      setAttendanceData(prev => 
        prev.map(r => r.id === draggableId ? record : r)
      );
      toast.error('Failed to update attendance status');
    }
  };

  if (loading) {
  return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex flex-col h-screen">
            <SiteHeader title="Attendance" />
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
      <AppSidebar />
      <SidebarInset className="h-screen">
        <div className="flex flex-col h-screen">
          <SiteHeader title="Attendance" />
          
          <div className="flex-1 overflow-y-auto">
            <div className="p-1 space-y-1">
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
                      {dashboardStats.totalEmployees}
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
                      {dashboardStats.presentToday}
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
                      {dashboardStats.attendanceRate}%
                    </CardTitle>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-t from-primary/5 to-card dark:bg-card shadow-xs">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                    <CardDescription className="text-sm font-medium">
                      Avg Working Hours
                    </CardDescription>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <CardTitle className="text-xl font-bold">
                      {dashboardStats.avgWorkingHours}h
                    </CardTitle>
                  </CardContent>
                </Card>
              </div>

              {/* Main Content Tabs */}
              <Tabs defaultValue="analytics" className="space-y-2">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                  <TabsTrigger value="departments">Departments</TabsTrigger>
                  <TabsTrigger value="exceptions">Exceptions</TabsTrigger>
                  <TabsTrigger value="reports">Reports</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                {/* Analytics Tab */}
                <TabsContent value="analytics" className="space-y-1">
                  {/* Action Bar - Outside the card */}
                  <div className="flex items-center gap-2 flex-wrap">
              <Input
                            placeholder="Search employees..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="flex-1 min-w-[300px] h-10"
                          />

                          <div className="flex gap-2 items-center">
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
                                      <Label htmlFor={`status-${status}`} className="text-sm cursor-pointer">
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
                                <Button variant="outline" className="w-40 h-10 justify-between">
                                  {departmentFilter.length === 0 ? "All Departments" : 
                                   departmentFilter.length === 1 ? departmentFilter[0] : 
                                   `${departmentFilter.length} Departments`}
                                  <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start" className="w-56">
                                <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
                                  Select Department
                                </div>
                                <div className="space-y-1">
                                  {["Sales", "Marketing", "HR", "IT", "Finance"].map(dept => (
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
                                      <Label htmlFor={`dept-${dept}`} className="text-sm cursor-pointer">
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
                                <Button variant="outline" className="w-40 h-10 justify-between">
                                  {timeFilter.length === 0 ? "All Time" : 
                                   timeFilter.length === 1 ? timeFilter[0] : 
                                   `${timeFilter.length} Time`}
                                  <ChevronDown className="ml-2 h-4 w-4" />
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
                                      <Label htmlFor={`time-${time}`} className="text-sm cursor-pointer">
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
                                className="rounded-none"
                                title="Kanban View"
                              >
                                <Grid3X3 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant={viewType === "rankings" ? "default" : "ghost"}
                                size="sm"
                                onClick={() => setViewType("rankings")}
                                className="rounded-l-none"
                                title="Top Attendance Rankings"
                              >
                                <TrendingUp className="h-4 w-4" />
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
                                      id="dropdown-employee"
                                      checked={visibleColumns.employee}
                                      onCheckedChange={(checked) => 
                                        setVisibleColumns(prev => ({ ...prev, employee: !!checked }))
                                      }
                                    />
                                    <Label htmlFor="dropdown-employee" className="text-sm cursor-pointer">Employee</Label>
                                  </div>
                                  <div className="flex items-center space-x-2 px-2 py-1.5">
                                    <Checkbox
                                      id="dropdown-department"
                                      checked={visibleColumns.department}
                                      onCheckedChange={(checked) => 
                                        setVisibleColumns(prev => ({ ...prev, department: !!checked }))
                                      }
                                    />
                                    <Label htmlFor="dropdown-department" className="text-sm cursor-pointer">Department</Label>
                                  </div>
                                  <div className="flex items-center space-x-2 px-2 py-1.5">
                                    <Checkbox
                                      id="dropdown-date"
                                      checked={visibleColumns.date}
                                      onCheckedChange={(checked) => 
                                        setVisibleColumns(prev => ({ ...prev, date: !!checked }))
                                      }
                                    />
                                    <Label htmlFor="dropdown-date" className="text-sm cursor-pointer">Date</Label>
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
                                      id="dropdown-timeIn"
                                      checked={visibleColumns.timeIn}
                                      onCheckedChange={(checked) => 
                                        setVisibleColumns(prev => ({ ...prev, timeIn: !!checked }))
                                      }
                                    />
                                    <Label htmlFor="dropdown-timeIn" className="text-sm cursor-pointer">Time In</Label>
                                  </div>
                                  <div className="flex items-center space-x-2 px-2 py-1.5">
                                    <Checkbox
                                      id="dropdown-timeOut"
                                      checked={visibleColumns.timeOut}
                                      onCheckedChange={(checked) => 
                                        setVisibleColumns(prev => ({ ...prev, timeOut: !!checked }))
                                      }
                                    />
                                    <Label htmlFor="dropdown-timeOut" className="text-sm cursor-pointer">Time Out</Label>
                                  </div>
                                  <div className="flex items-center space-x-2 px-2 py-1.5">
                                    <Checkbox
                                      id="dropdown-workingHours"
                                      checked={visibleColumns.workingHours}
                                      onCheckedChange={(checked) => 
                                        setVisibleColumns(prev => ({ ...prev, workingHours: !!checked }))
                                      }
                                    />
                                    <Label htmlFor="dropdown-workingHours" className="text-sm cursor-pointer">Working Hours</Label>
                                  </div>
                                  <div className="flex items-center space-x-2 px-2 py-1.5">
                                    <Checkbox
                                      id="dropdown-markedBy"
                                      checked={visibleColumns.markedBy}
                                      onCheckedChange={(checked) => 
                                        setVisibleColumns(prev => ({ ...prev, markedBy: !!checked }))
                                      }
                                    />
                                    <Label htmlFor="dropdown-markedBy" className="text-sm cursor-pointer">Marked By</Label>
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

                  <Card className="rounded-none mt-0">
                    <CardContent className="p-0">
                      <div className="space-y-0">
                        {/* Table View */}
                        {viewType === "table" && (
                          <div className="flex flex-col h-full">
                            <div className="flex-1 overflow-y-auto border rounded-md">
                              <div className="p-0 -mt-1">
            <Table className="rounded-none">
              <TableHeader className="rounded-none sticky top-0 bg-background z-10">
                <TableRow className="h-4">
                  {visibleColumns.employee && (
                    <TableHead className="py-0 px-2">
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
                    <TableHead className="py-0 px-2">
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
                    <TableHead className="py-0 px-2">
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
                    <TableHead className="py-0 px-2">
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
                    <TableHead className="py-0 px-2">
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
                    <TableHead className="py-0 px-2">
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
                    <TableHead className="py-0 px-2">
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
                    <TableHead className="py-0 px-2">
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
                  {visibleColumns.actions && <TableHead className="py-1 px-2">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                              {console.log("Filtered data length:", filteredData.length, "Filtered data:", filteredData)}
                {paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={Object.values(visibleColumns).filter(Boolean).length} className="text-center py-8">
                      <div className="text-center">
                        <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-slate-700">No Records Found</h3>
                        <p className="text-slate-500">Try adjusting your filters or check back later.</p>
              </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((record) => (
                    <TableRow key={record.id} className="h-4">
                      {visibleColumns.employee && (
                        <TableCell className="py-0 px-2">
              <div>
                            <div className="font-medium">{record.employee_name}</div>
                            <div className="text-sm text-slate-500">{record.employee_id}</div>
              </div>
                        </TableCell>
                      )}
                      {visibleColumns.department && <TableCell>{record.department}</TableCell>}
                      {visibleColumns.date && <TableCell>{record.date}</TableCell>}
                      {visibleColumns.status && <TableCell>{getStatusBadge(record.status)}</TableCell>}
                      {visibleColumns.timeIn && <TableCell>{record.time_in}</TableCell>}
                      {visibleColumns.timeOut && <TableCell>{record.time_out}</TableCell>}
                      {visibleColumns.workingHours && <TableCell>{record.working_hours}h</TableCell>}
                      {visibleColumns.markedBy && <TableCell>{record.marked_by}</TableCell>}
                      {visibleColumns.actions && (
                        <TableCell className="py-0 px-2">
            <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="rounded-none"
                              onClick={() => handleViewRecord(record)}
                            >
                              <Eye className="h-4 w-4" />
              </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="rounded-none"
                              onClick={() => handleEditRecord(record)}
                            >
                              <Edit className="h-4 w-4" />
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

                            {/* Pagination - Outside Table */}
                            {filteredData.length > 0 && (
                              <div className="flex items-center justify-between px-4 py-2 border-t bg-background -mb-2">
                                <div className="text-sm text-muted-foreground">
                                  Showing {startIndex + 1} to {Math.min(endIndex, filteredData.length)} of {filteredData.length} records
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
                          <div className="flex flex-col h-full">
                            <div className="flex-1 overflow-y-auto border rounded-md">
                              <div className="p-0">
                            <DragDropContext onDragEnd={handleDragEnd}>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {["Present", "Absent", "Half Day", "Holiday"].map(status => {
                                  const statusRecords = paginatedData.filter(record => record.status === status);
                                return (
                                  <div key={status} className="space-y-3">
                                    <div className="flex items-center justify-between">
                                      <h3 className="font-semibold text-sm">{status}</h3>
                                      <Badge variant="secondary" className="text-xs">
                                        {statusRecords.length}
                                      </Badge>
              </div>
                                    <Droppable droppableId={status}>
                                      {(provided, snapshot) => (
                                        <div
                                          ref={provided.innerRef}
                                          {...provided.droppableProps}
                                          className={`space-y-2 min-h-[200px] p-2 rounded-lg transition-colors ${
                                            snapshot.isDraggingOver ? 'bg-muted/50' : ''
                                          }`}
                                        >
                                          {statusRecords.map((record, index) => (
                                            <Draggable key={record.id} draggableId={record.id} index={index}>
                                              {(provided, snapshot) => (
                                                <div
                                                  ref={provided.innerRef}
                                                  {...provided.draggableProps}
                                                  {...provided.dragHandleProps}
                                                  className={`transition-transform ${
                                                    snapshot.isDragging ? 'rotate-2 scale-105' : ''
                                                  }`}
                                                >
                                                  <Card className="p-3 cursor-move hover:shadow-md transition-shadow rounded-none">
                                                    <div className="space-y-2">
                                                      <div className="flex items-center justify-between">
              <div>
                                                          <p className="font-medium text-sm">{record.employee_name}</p>
                                                          <p className="text-xs text-muted-foreground">{record.employee_id}</p>
              </div>
                                                        {getStatusBadge(record.status)}
            </div>
                                                      <div className="text-xs text-muted-foreground">
                                                        <p>Department: {record.department}</p>
                                                        <p>Date: {record.date}</p>
                                                        {record.time_in && <p>Time In: {record.time_in}</p>}
                                                        {record.time_out && <p>Time Out: {record.time_out}</p>}
                                                        {record.working_hours && <p>Hours: {record.working_hours}h</p>}
                                                      </div>
                                                      <div className="flex gap-1 pt-2">
                                                        <Button 
                                                          size="sm" 
                                                          variant="outline"
                                                          className="rounded-none h-7 px-2"
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
                                                          className="rounded-none h-7 px-2"
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleEditRecord(record);
                                                          }}
                                                        >
                                                          <Edit className="h-3 w-3" />
                                                        </Button>
                                                      </div>
                                                    </div>
        </Card>
                                                </div>
                                              )}
                                            </Draggable>
                                          ))}
                                          {provided.placeholder}
                                        </div>
                                      )}
                                    </Droppable>
                                  </div>
                                );
                              })}
                            </div>
                            </DragDropContext>
                              </div>
                            </div>
                          
                            {/* Kanban Pagination - Outside Kanban */}
                            {filteredData.length > 0 && (
                              <div className="flex items-center justify-between px-4 py-2 border-t bg-background -mb-2">
                              <div className="text-sm text-muted-foreground">
                                Showing {startIndex + 1} to {Math.min(endIndex, filteredData.length)} of {filteredData.length} records
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

                        {/* Rankings View */}
                        {viewType === "rankings" && (
                          <div className="flex flex-col h-full">
                            <div className="flex-1 overflow-y-auto border rounded-md">
                              <div className="p-4">
                                <div className="space-y-4">
                                  <div className="text-center mb-6">
                                    <h3 className="text-lg font-semibold mb-2">Top Attendance Rankings</h3>
                                    <p className="text-sm text-muted-foreground">Best performers this month</p>
                                  </div>
                                  
                                  {(() => {
                                    // Calculate top performers based on attendance rate
                                    const employeeStats = attendanceData.reduce((acc, record) => {
                                      if (!acc[record.employee_name]) {
                                        acc[record.employee_name] = {
                                          name: record.employee_name,
                                          department: record.department,
                                          totalDays: 0,
                                          presentDays: 0,
                                          totalHours: 0
                                        };
                                      }
                                      acc[record.employee_name].totalDays++;
                                      if (record.status === 'Present') {
                                        acc[record.employee_name].presentDays++;
                                        acc[record.employee_name].totalHours += record.working_hours || 0;
                                      }
                                      return acc;
                                    }, {} as Record<string, any>);

                                    const topPerformers = Object.values(employeeStats)
                                      .map((emp: any) => ({
                                        ...emp,
                                        attendanceRate: Math.round((emp.presentDays / emp.totalDays) * 100),
                                        avgHours: emp.presentDays > 0 ? Math.round((emp.totalHours / emp.presentDays) * 10) / 10 : 0
                                      }))
                                      .sort((a, b) => b.attendanceRate - a.attendanceRate)
                                      .slice(0, 3);

                                    return topPerformers.map((performer, index) => {
                                      const getRankIcon = (rank: number) => {
                                        switch (rank) {
                                          case 0: return <div className="w-8 h-8 bg-yellow-100 text-yellow-800 rounded-full flex items-center justify-center font-bold text-sm">🥇</div>;
                                          case 1: return <div className="w-8 h-8 bg-gray-100 text-gray-800 rounded-full flex items-center justify-center font-bold text-sm">🥈</div>;
                                          case 2: return <div className="w-8 h-8 bg-orange-100 text-orange-800 rounded-full flex items-center justify-center font-bold text-sm">🥉</div>;
                                          default: return <div className="w-8 h-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center font-bold text-sm">{rank + 1}</div>;
                                        }
                                      };

                                      const getRankColor = (rank: number) => {
                                        switch (rank) {
                                          case 0: return 'border-yellow-200 bg-yellow-50';
                                          case 1: return 'border-gray-200 bg-gray-50';
                                          case 2: return 'border-orange-200 bg-orange-50';
                                          default: return 'border-blue-200 bg-blue-50';
                                        }
                                      };

                                      return (
                                        <Card key={performer.name} className={`border-l-4 border-l-primary/30 ${getRankColor(index)}`}>
                                          <CardContent className="p-4">
                                            <div className="flex items-center justify-between">
                                              <div className="flex items-center gap-4">
                                                {getRankIcon(index)}
                                                <div>
                                                  <h4 className="font-semibold text-lg">{performer.name}</h4>
                                                  <p className="text-sm text-muted-foreground">{performer.department}</p>
                                                </div>
                                              </div>
                                              <div className="text-right">
                                                <div className="text-2xl font-bold text-primary">
                                                  {performer.attendanceRate}%
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                  {performer.avgHours}h avg
                                                </div>
                                              </div>
                                            </div>
                                            <div className="mt-3">
                                              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                                <span>Attendance Rate</span>
                                                <span>{performer.attendanceRate}%</span>
                                              </div>
                                              <div className="w-full bg-muted rounded-full h-2">
                                                <div 
                                                  className="bg-gradient-to-r from-primary to-primary/80 h-2 rounded-full transition-all duration-500"
                                                  style={{ width: `${performer.attendanceRate}%` }}
                                                ></div>
                                              </div>
                                            </div>
                                            <div className="flex items-center justify-between mt-3 pt-3 border-t">
                                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                <div className="flex items-center gap-1">
                                                  <CheckCircle className="h-3 w-3 text-green-600" />
                                                  <span>{performer.presentDays} days present</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                  <Clock className="h-3 w-3 text-blue-600" />
                                                  <span>{performer.avgHours}h average</span>
                                                </div>
                                              </div>
                                              <Badge className="bg-primary/10 text-primary">
                                                Rank #{index + 1}
                                              </Badge>
                                            </div>
                                          </CardContent>
                                        </Card>
                                      );
                                    });
                                  })()}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
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
                        {departmentStats.map((dept, index) => {
                          const getDepartmentIcon = (deptName: string) => {
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
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Exceptions Tab */}
                <TabsContent value="exceptions" className="space-y-4">
        <Card>
                    <CardHeader>
                      <CardTitle>Exception Alerts</CardTitle>
                      <CardDescription>Attendance issues and discrepancies</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {exceptionAlerts.length === 0 ? (
                          <div className="text-center py-8">
                            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-slate-700">No Exceptions</h3>
                            <p className="text-slate-500">All attendance records are in good standing.</p>
              </div>
                        ) : (
                          exceptionAlerts.map((alert) => (
                            <Card key={alert.id} className="border-l-4 border-l-yellow-500">
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <h3 className="font-semibold">{alert.title}</h3>
                                      {getSeverityBadge(alert.severity)}
                                    </div>
                                    <p className="text-sm text-slate-600">{alert.description}</p>
                                    <p className="text-xs text-slate-500 mt-1">
                                      {alert.department} • {new Date(alert.created_at).toLocaleDateString()}
                                    </p>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => handleViewRecord({} as AttendanceRecord)}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      size="sm"
                                      onClick={() => handleResolveException(alert.id)}
                                    >
                                      Resolve
                                    </Button>
              </div>
            </div>
          </CardContent>
        </Card>
                          ))
                        )}
      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Reports Tab */}
                <TabsContent value="reports" className="space-y-4">
      <Card>
        <CardHeader>
                      <CardTitle>Custom Reports</CardTitle>
                      <CardDescription>Generate and export attendance reports</CardDescription>
        </CardHeader>
        <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <Card 
                          className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => handleGenerateReport('monthly')}
                        >
                          <div className="flex items-center gap-3">
                            <BarChart3 className="h-8 w-8 text-blue-600" />
                            <div>
                              <h3 className="font-semibold">Monthly Summary</h3>
                              <p className="text-sm text-slate-600">Department-wise attendance</p>
                      </div>
                          </div>
                        </Card>

                        <Card 
                          className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => handleGenerateReport('trends')}
                        >
                        <div className="flex items-center gap-3">
                            <PieChart className="h-8 w-8 text-green-600" />
                          <div>
                              <h3 className="font-semibold">Trend Analysis</h3>
                              <p className="text-sm text-slate-600">Attendance patterns</p>
                            </div>
                            </div>
                        </Card>

                        <Card 
                          className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                          onClick={handleExportData}
                        >
                        <div className="flex items-center gap-3">
                            <Download className="h-8 w-8 text-purple-600" />
                            <div>
                              <h3 className="font-semibold">Export Data</h3>
                              <p className="text-sm text-slate-600">CSV/Excel export</p>
                          </div>
                        </div>
                        </Card>
          </div>
        </CardContent>
      </Card>
                </TabsContent>

                {/* Settings Tab */}
                <TabsContent value="settings" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Attendance Settings</CardTitle>
                      <CardDescription>Configure attendance policies and rules</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="auto-approval">Auto-approve attendance</Label>
                            <p className="text-sm text-slate-600">Automatically approve attendance within policy</p>
    </div>
                          <Switch 
                            id="auto-approval" 
                            checked={settings.autoApproval}
                            onCheckedChange={(checked) => 
                              setSettings(prev => ({ ...prev, autoApproval: checked }))
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="late-marking-alerts">Late marking alerts</Label>
                            <p className="text-sm text-slate-600">Get notified when attendance is marked late</p>
                          </div>
                          <Switch 
                            id="late-marking-alerts" 
                            checked={settings.lateMarkingAlerts}
                            onCheckedChange={(checked) => 
                              setSettings(prev => ({ ...prev, lateMarkingAlerts: checked }))
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="exception-notifications">Exception notifications</Label>
                            <p className="text-sm text-slate-600">Receive alerts for attendance exceptions</p>
                          </div>
                          <Switch 
                            id="exception-notifications" 
                            checked={settings.exceptionNotifications}
                            onCheckedChange={(checked) => 
                              setSettings(prev => ({ ...prev, exceptionNotifications: checked }))
                            }
                          />
                        </div>
                      </div>

                      <div className="pt-4 border-t">
                        <h3 className="font-semibold mb-4">Holiday Calendar</h3>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <p className="font-medium">New Year's Day</p>
                              <p className="text-sm text-slate-600">January 1, 2024</p>
                            </div>
                            <Button size="sm" variant="outline">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <p className="font-medium">Independence Day</p>
                              <p className="text-sm text-slate-600">July 4, 2024</p>
                            </div>
                            <Button size="sm" variant="outline">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <Button className="mt-4" variant="outline">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Holiday
                        </Button>
          </div>
        </CardContent>
      </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
    </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
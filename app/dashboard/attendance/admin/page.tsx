"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, CheckCircle, Clock, AlertCircle, XCircle } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface AttendanceRecord {
  whalesync_postgres_id: string;
  date: string;
  status: string;
  time_in: number | null;
  time_out: number | null;
  working_hours: number | null;
  notes: string | null;
  punctuality_status: string | null;
  employee: string;
  full_name_from_employee: string;
  employee_id_from_employee: string;
  department_name_from_employee: string;
  profile_photo: string | null;
}

interface AttendanceStats {
  total: number;
  present: number;
  late: number;
  absent: number;
}

export default function AdminAttendancePage() {
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [filteredData, setFilteredData] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats>({ total: 0, present: 0, late: 0, absent: 0 });
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    loadAttendanceData();
  }, []);

  const loadAttendanceData = async () => {
    try {
      console.log("Loading attendance data...");
      
      // First try the join query
      const { data, error } = await supabase
        .from("Attendance")
        .select(`
          *,
          employee:Employee Directory!inner(
            whalesync_postgres_id,
            full_name,
            employee_id,
            department,
            profile_photo
          )
        `)
        .order("date", { ascending: false });

      console.log("Supabase response:", { data, error });

      if (error) {
        console.error("Join query failed, trying simple query...");
        console.error("Supabase error details:", error);
        
        // Fallback to simple query without join
        const { data: simpleData, error: simpleError } = await supabase
          .from("Attendance")
          .select("*")
          .order("date", { ascending: false });

        if (simpleError) {
          console.error("Simple query also failed:", simpleError);
          throw simpleError;
        }

        console.log("Simple query successful:", simpleData);
        
        // Format data without employee details
        const formattedData = simpleData?.map(record => ({
          ...record,
          full_name_from_employee: "Unknown Employee",
          employee_id_from_employee: record.employee || "N/A",
          department_name_from_employee: "Unknown Department",
          profile_photo: null
        })) || [];

        setAttendanceData(formattedData);
        setFilteredData(formattedData);
        calculateStats(formattedData);
        return;
      }
      
      const formattedData = data?.map(record => ({
        ...record,
        full_name_from_employee: record.employee?.full_name || "",
        employee_id_from_employee: record.employee?.employee_id || "",
        department_name_from_employee: record.employee?.department || "",
        profile_photo: record.employee?.profile_photo || null
      })) || [];

      setAttendanceData(formattedData);
      setFilteredData(formattedData);
      calculateStats(formattedData);
    } catch (error) {
      console.error("Error loading attendance data:", error);
      console.error("Error details:", {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        error: error
      });
    }
  };

  const calculateStats = (data: AttendanceRecord[]) => {
    const total = data.length;
    const present = data.filter(r => r.status === 'Present' || r.status === 'Half Day').length;
    const late = data.filter(r => r.punctuality_status === 'Late').length;
    const absent = total - present;

    setStats({ total, present, late, absent });
  };

  const applyFilters = () => {
    let filtered = attendanceData;

    if (startDate && endDate) {
      filtered = filtered.filter(record => {
        const recordDate = new Date(record.date);
        const start = new Date(startDate);
        const end = new Date(endDate);
        return recordDate >= start && recordDate <= end;
      });
    } else if (startDate) {
      filtered = filtered.filter(record => new Date(record.date) >= new Date(startDate));
    } else if (endDate) {
      filtered = filtered.filter(record => new Date(record.date) <= new Date(endDate));
    }

    setFilteredData(filtered);
    calculateStats(filtered);
  };

  const resetFilters = () => {
    setStartDate("");
    setEndDate("");
    setFilteredData(attendanceData);
    calculateStats(attendanceData);
  };

  const formatTimeFromSeconds = (seconds: number | null) => {
    if (seconds === null || isNaN(seconds)) return "---";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  const formatWorkingHours = (hours: number | null) => {
    if (hours === null || isNaN(hours) || hours <= 0) return "---";
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2.5 py-0.5 text-xs font-medium rounded-full inline-block";
    switch (status) {
      case 'Present':
        return <span className={`bg-green-100 text-green-800 ${baseClasses}`}>Present</span>;
      case 'Absent':
        return <span className={`bg-red-100 text-red-800 ${baseClasses}`}>Absent</span>;
      case 'Half Day':
        return <span className={`bg-yellow-100 text-yellow-800 ${baseClasses}`}>Half Day</span>;
      case 'Office Holiday':
        return <span className={`bg-purple-100 text-purple-800 ${baseClasses}`}>Holiday</span>;
      default:
        return <span className={`bg-slate-100 text-slate-800 ${baseClasses}`}>{status || 'N/A'}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Attendance - Admin Portal</h1>
        <p className="text-slate-500 mt-1">View attendance summaries and records.</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={applyFilters} className="flex-1">
                Filter
              </Button>
              <Button onClick={resetFilters} variant="outline" className="flex-1">
                Reset
              </Button>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Hint: To filter by a single day, set both Start and End Date to the same day.
          </p>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 text-blue-600 p-3 rounded-full">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Records</p>
                <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="bg-green-100 text-green-600 p-3 rounded-full">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Present</p>
                <p className="text-2xl font-bold text-slate-800">{stats.present}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="bg-yellow-100 text-yellow-600 p-3 rounded-full">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Late</p>
                <p className="text-2xl font-bold text-slate-800">{stats.late}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="bg-red-100 text-red-600 p-3 rounded-full">
                <XCircle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Absent / Other</p>
                <p className="text-2xl font-bold text-slate-800">{stats.absent}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
          <CardDescription>
            {filteredData.length} records found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time In</TableHead>
                  <TableHead>Time Out</TableHead>
                  <TableHead>Working Hours</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-16">
                      <div className="text-center">
                        <h3 className="text-lg font-semibold text-slate-700">No Records Found</h3>
                        <p className="text-slate-500 mt-1">Try adjusting your filters or resetting the view.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((record) => (
                    <TableRow key={record.whalesync_postgres_id} className="hover:bg-slate-50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <img
                            className="w-10 h-10 rounded-full"
                            src={record.profile_photo || `https://placehold.co/100x100/E2E8F0/475569?text=${record.full_name_from_employee.charAt(0)}`}
                            alt={record.full_name_from_employee}
                          />
                          <div>
                            <div className="font-semibold text-slate-800">
                              {record.full_name_from_employee}
                            </div>
                            <div className="text-xs text-slate-500">
                              {record.employee_id_from_employee} - {record.department_name_from_employee}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{record.date}</TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
                      <TableCell className="font-mono">{formatTimeFromSeconds(record.time_in)}</TableCell>
                      <TableCell className="font-mono">{formatTimeFromSeconds(record.time_out)}</TableCell>
                      <TableCell>{formatWorkingHours(record.working_hours)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


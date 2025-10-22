"use client";

import { useState, useEffect } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";

interface MonthlySummary {
  employee_id: string;
  full_name: string;
  department: string;
  profile_photo: string | null;
  present: number;
  absent: number;
  halfDay: number;
  late: number;
  holiday: number;
}

interface AttendanceRecord {
  date: string;
  status: string;
  punctuality_status: string | null;
  employee_id_from_employee: string;
  full_name_from_employee: string;
  department_name_from_employee: string;
  profile_photo: string | null;
}

export default function AccountsAttendancePage() {
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary[]>([]);
  const [selectedMonth, setSelectedMonth] = useState("");

  useEffect(() => {
    // Set default month to current month
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(currentMonth);
  }, []);

  const loadAttendanceData = async () => {
    try {
      const { data, error } = await supabase
        .from("Attendance")
        .select(`
          date,
          status,
          punctuality_status,
          employee_id,
          employee_name,
          department,
          profile_photo
        `)
        .order("date", { ascending: false });

      if (error) throw error;
      
      const formattedData = data?.map(record => ({
        date: record.date,
        status: record.status,
        punctuality_status: record.punctuality_status,
        employee_id_from_employee: record.employee_id || "",
        full_name_from_employee: record.employee_name || "",
        department_name_from_employee: record.department || "",
        profile_photo: record.profile_photo || null
      })) || [];

      setAttendanceData(formattedData);
    } catch (error) {
      console.error("Error loading attendance data:", error);
      toast.error("Failed to load attendance data");
    }
  };

  const calculateMonthlySummary = (data: AttendanceRecord[], month: string) => {
    const summary: { [key: string]: MonthlySummary } = {};
    const filteredData = data.filter(record => record.date.startsWith(month));

    filteredData.forEach(record => {
      const empId = record.employee_id_from_employee;
      if (!summary[empId]) {
        summary[empId] = {
          employee_id: empId,
          full_name: record.full_name_from_employee,
          department: record.department_name_from_employee,
          profile_photo: record.profile_photo,
          present: 0,
          absent: 0,
          halfDay: 0,
          late: 0,
          holiday: 0,
        };
      }
      
      switch(record.status) {
        case 'Present':
          summary[empId].present++;
          break;
        case 'Absent':
          summary[empId].absent++;
          break;
        case 'Half Day':
          summary[empId].halfDay++;
          break;
        case 'Office Holiday':
          summary[empId].holiday++;
          break;
      }

      if (record.punctuality_status === 'Late') {
        summary[empId].late++;
      }
    });

    return Object.values(summary);
  };

  const generateSummary = () => {
    if (!selectedMonth) {
      toast.error("Please select a month.");
      return;
    }
    
    const summary = calculateMonthlySummary(attendanceData, selectedMonth);
    setMonthlySummary(summary);
    toast.success(`Summary generated for ${selectedMonth}`);
  };

  const exportToCSV = () => {
    if (monthlySummary.length === 0) {
      toast.error("No summary data to export. Please generate a summary first.");
      return;
    }

    const headers = ['Employee ID', 'Full Name', 'Department', 'Present Days', 'Absent Days', 'Half Days', 'Late Days', 'Holidays'];
    const csvContent = [
      headers.join(','),
      ...monthlySummary.map(item => [
        item.employee_id,
        `"${item.full_name}"`,
        `"${item.department}"`,
        item.present,
        item.absent,
        item.halfDay,
        item.late,
        item.holiday
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance_summary_${selectedMonth}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("CSV file downloaded successfully");
  };

  useEffect(() => {
    loadAttendanceData();
  }, []);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex flex-col h-screen">
          {/* Header */}
          <SiteHeader title="Attendance" />

          {/* Main Content */}
          <div className="flex flex-col overflow-hidden flex-1">
            <div className="px-4 pt-4 pb-4">
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold text-slate-800">Attendance - Accounts Portal</h1>
                  <p className="text-slate-500 mt-1">View monthly employee attendance summaries for salary processing.</p>
                </div>

      {/* Month Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Monthly Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <Label htmlFor="monthPicker">Select Month</Label>
              <Input
                id="monthPicker"
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Button onClick={generateSummary} className="w-full">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Generate Summary
              </Button>
            </div>
            <div>
              <Button onClick={exportToCSV} variant="outline" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Export to CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Attendance Summary</CardTitle>
          <CardDescription>
            {monthlySummary.length > 0 ? `${monthlySummary.length} employees` : "Select a month and generate summary"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead className="text-center">Present</TableHead>
                  <TableHead className="text-center">Absent</TableHead>
                  <TableHead className="text-center">Half Day</TableHead>
                  <TableHead className="text-center">Late</TableHead>
                  <TableHead className="text-center">Holidays</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthlySummary.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-16">
                      <div className="text-center">
                        <h3 className="text-lg font-semibold text-slate-700">No Summary Generated</h3>
                        <p className="text-slate-500 mt-1">Select a month and click "Generate Summary" to view data.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  monthlySummary.map((emp) => (
                    <TableRow key={emp.employee_id} className="hover:bg-slate-50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <img
                            className="w-10 h-10 rounded-full"
                            src={emp.profile_photo || `https://placehold.co/100x100/E2E8F0/475569?text=${emp.full_name.charAt(0)}`}
                            alt={emp.full_name}
                          />
                          <div>
                            <div className="font-semibold text-slate-800">{emp.full_name}</div>
                            <div className="text-xs text-slate-500">
                              {emp.employee_id} - {emp.department}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-medium text-green-600">
                        {emp.present}
                      </TableCell>
                      <TableCell className="text-center font-medium text-red-600">
                        {emp.absent}
                      </TableCell>
                      <TableCell className="text-center font-medium text-yellow-600">
                        {emp.halfDay}
                      </TableCell>
                      <TableCell className="text-center font-medium text-orange-600">
                        {emp.late}
                      </TableCell>
                      <TableCell className="text-center font-medium text-purple-600">
                        {emp.holiday}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}


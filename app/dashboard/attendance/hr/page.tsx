"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Clock, Users, CheckCircle, AlertCircle, XCircle, Edit, Save, X } from "lucide-react";
import { toast } from "sonner";
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

interface Employee {
  whalesync_postgres_id: string;
  full_name: string;
  employee_id: string;
  department: string;
  profile_photo: string | null;
}

export default function HRAttendancePage() {
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredData, setFilteredData] = useState<AttendanceRecord[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [editingCell, setEditingCell] = useState<{ recordId: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    loadEmployees();
    loadAttendanceData();
  }, []);

  const loadEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from("Employee Directory")
        .select("whalesync_postgres_id, full_name, employee_id, department, profile_photo")
        .eq("status", "Active");

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error("Error loading employees:", error);
      toast.error("Failed to load employees");
    }
  };

  const loadAttendanceData = async () => {
    try {
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

      if (error) throw error;
      
      const formattedData = data?.map(record => ({
        ...record,
        full_name_from_employee: record.employee?.full_name || "",
        employee_id_from_employee: record.employee?.employee_id || "",
        department_name_from_employee: record.employee?.department || "",
        profile_photo: record.employee?.profile_photo || null
      })) || [];

      setAttendanceData(formattedData);
      setFilteredData(formattedData);
    } catch (error) {
      console.error("Error loading attendance data:", error);
      toast.error("Failed to load attendance data");
    }
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
  };

  const resetFilters = () => {
    setStartDate("");
    setEndDate("");
    setFilteredData(attendanceData);
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

  const handleCellEdit = (recordId: string, field: string, currentValue: number | null) => {
    setEditingCell({ recordId, field });
    setEditValue(currentValue ? formatTimeFromSeconds(currentValue) : "");
  };

  const handleCellSave = async () => {
    if (!editingCell) return;

    try {
      const seconds = editValue ? 
        editValue.split(':').reduce((acc, val, i) => 
          i === 0 ? acc + parseInt(val) * 3600 : acc + parseInt(val) * 60, 0) : null;

      const { error } = await supabase
        .from("Attendance")
        .update({ [editingCell.field]: seconds })
        .eq("whalesync_postgres_id", editingCell.recordId);

      if (error) throw error;

      toast.success("Attendance updated successfully");
      setEditingCell(null);
      setEditValue("");
      loadAttendanceData();
    } catch (error) {
      console.error("Error updating attendance:", error);
      toast.error("Failed to update attendance");
    }
  };

  const handleCellCancel = () => {
    setEditingCell(null);
    setEditValue("");
  };

  const handleEditRecord = (record: AttendanceRecord) => {
    setSelectedRecord(record);
    setIsEditModalOpen(true);
  };

  const handleUpdateRecord = async (formData: any) => {
    if (!selectedRecord) return;

    try {
      const timeInSeconds = formData.time_in ? 
        formData.time_in.split(':').reduce((acc: number, val: string, i: number) => 
          i === 0 ? acc + parseInt(val) * 3600 : acc + parseInt(val) * 60, 0) : null;
      
      const timeOutSeconds = formData.time_out ? 
        formData.time_out.split(':').reduce((acc: number, val: string, i: number) => 
          i === 0 ? acc + parseInt(val) * 3600 : acc + parseInt(val) * 60, 0) : null;

      const { error } = await supabase
        .from("Attendance")
        .update({
          status: formData.status,
          time_in: timeInSeconds,
          time_out: timeOutSeconds,
          notes: formData.notes
        })
        .eq("whalesync_postgres_id", selectedRecord.whalesync_postgres_id);

      if (error) throw error;

      toast.success("Attendance record updated successfully");
      setIsEditModalOpen(false);
      setSelectedRecord(null);
      loadAttendanceData();
    } catch (error) {
      console.error("Error updating record:", error);
      toast.error("Failed to update attendance record");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Attendance - HR Portal</h1>
        <p className="text-slate-500 mt-1">Manage and edit employee attendance records.</p>
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
            Hint: Click on 'Time In' or 'Time Out' cells for quick inline editing.
          </p>
        </CardContent>
      </Card>

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
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-16">
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
                      <TableCell>
                        {editingCell?.recordId === record.whalesync_postgres_id && editingCell?.field === 'time_in' ? (
                          <div className="flex items-center gap-2">
                            <Input
                              type="time"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="w-24"
                              autoFocus
                            />
                            <Button size="sm" onClick={handleCellSave}>
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={handleCellCancel}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <span
                            className="font-mono cursor-pointer hover:bg-slate-100 px-2 py-1 rounded"
                            onClick={() => handleCellEdit(record.whalesync_postgres_id, 'time_in', record.time_in)}
                          >
                            {formatTimeFromSeconds(record.time_in)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingCell?.recordId === record.whalesync_postgres_id && editingCell?.field === 'time_out' ? (
                          <div className="flex items-center gap-2">
                            <Input
                              type="time"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="w-24"
                              autoFocus
                            />
                            <Button size="sm" onClick={handleCellSave}>
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={handleCellCancel}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <span
                            className="font-mono cursor-pointer hover:bg-slate-100 px-2 py-1 rounded"
                            onClick={() => handleCellEdit(record.whalesync_postgres_id, 'time_out', record.time_out)}
                          >
                            {formatTimeFromSeconds(record.time_out)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{formatWorkingHours(record.working_hours)}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditRecord(record)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Attendance</DialogTitle>
            <DialogDescription>
              Update attendance details for {selectedRecord?.full_name_from_employee}
            </DialogDescription>
          </DialogHeader>
          {selectedRecord && (
            <EditAttendanceForm
              record={selectedRecord}
              onSave={handleUpdateRecord}
              onCancel={() => setIsEditModalOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface EditAttendanceFormProps {
  record: AttendanceRecord;
  onSave: (formData: any) => void;
  onCancel: () => void;
}

function EditAttendanceForm({ record, onSave, onCancel }: EditAttendanceFormProps) {
  const [formData, setFormData] = useState({
    time_in: record.time_in ? formatTimeFromSeconds(record.time_in) : "",
    time_out: record.time_out ? formatTimeFromSeconds(record.time_out) : "",
    status: record.status,
    notes: record.notes || ""
  });

  const formatTimeFromSeconds = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Employee</Label>
        <p className="mt-1 text-slate-800 font-semibold">
          {record.full_name_from_employee} ({record.employee_id_from_employee})
        </p>
      </div>
      <div>
        <Label>Date</Label>
        <p className="mt-1 text-slate-800 font-semibold">{record.date}</p>
      </div>
      <div>
        <Label htmlFor="time_in">Time In</Label>
        <Input
          id="time_in"
          type="time"
          value={formData.time_in}
          onChange={(e) => setFormData({ ...formData, time_in: e.target.value })}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="time_out">Time Out</Label>
        <Input
          id="time_out"
          type="time"
          value={formData.time_out}
          onChange={(e) => setFormData({ ...formData, time_out: e.target.value })}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="status">Status</Label>
        <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Present">Present</SelectItem>
            <SelectItem value="Absent">Absent</SelectItem>
            <SelectItem value="Half Day">Half Day</SelectItem>
            <SelectItem value="Office Holiday">Office Holiday</SelectItem>
            <SelectItem value="Not Marked">Not Marked</SelectItem>
            <SelectItem value="In Office">In Office</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          rows={3}
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="mt-1"
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          Save Changes
        </Button>
      </DialogFooter>
    </form>
  );
}


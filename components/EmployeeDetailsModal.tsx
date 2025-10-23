"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Phone,
  Linkedin,
  Edit2,
  Download,
  ExternalLink,
  Loader2,
  Plus,
  CheckCircle,
  AlertTriangle,
  FileText,
  DollarSign,
  Building2,
  CreditCard,
  Calendar,
  Clock,
  XCircle,
  BarChart3,
  PhoneCall,
  ArrowDownToLine,
  ArrowUpFromLine,
} from "lucide-react";
import { toast } from "sonner";

interface DepartmentData {
  whalesync_postgres_id: string;
  department_name: string;
}

interface EmployeeData {
  id?: number;
  whalesync_postgres_id: string;
  full_name: string;
  official_email?: string;
  official_contact_number?: string;
  job_title?: string;
  date_of_joining?: string;
  employment_type?: string;
  status?: string;
  profile_photo?: string;
  linkedin_profile?: string;
  department?: string; // UUID reference to Departments
  reporting_manager?: string; // UUID reference to Employee Directory
  monthly_payroll?: number;
  bank_details?: string;
  dob?: string;
  permanent_address?: string;
  created_at?: string;
  // Joined data
  department_data?: DepartmentData;
  manager_data?: EmployeeData;
}

interface CallData {
  whalesync_postgres_id: string;
  employee: string; // UUID
  client_name?: string;
  client_number?: string;
  call_date: string;
  duration: number;
  call_type: string;
  created_at?: string;
}

interface AttendanceData {
  id?: number;
  employee: string; // UUID
  date: string;
  status: string;
  created_at?: string;
}

interface DocumentData {
  whalesync_postgres_id: string;
  employee: string; // UUID
  document_name: string;
  document_type?: string;
  collection_status: string;
  issued_date?: string;
  attachment?: string;
  created_at?: string;
}

interface EmployeeDetailsModalProps {
  employeeId: number | null;
  open: boolean;
  onClose: () => void;
}

export function EmployeeDetailsModal({ employeeId, open, onClose }: EmployeeDetailsModalProps) {
  const [loading, setLoading] = useState(false);
  const [employeeData, setEmployeeData] = useState<EmployeeData | null>(null);
  const [allEmployees, setAllEmployees] = useState<EmployeeData[]>([]);
  const [calls, setCalls] = useState<CallData[]>([]);
  const [attendance, setAttendance] = useState<AttendanceData[]>([]);
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  
  const [activeTab, setActiveTab] = useState("detail");
  const [activeDocTab, setActiveDocTab] = useState("submitted");
  const [addDocModalOpen, setAddDocModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM format
  const [callsDate, setCallsDate] = useState("");
  const [callsSearch, setCallsSearch] = useState("");
  
  // Add Document Form States
  const [docName, setDocName] = useState("");
  const [docType, setDocType] = useState("");
  const [docStatus, setDocStatus] = useState("Not Submitted");
  const [docIssuedDate, setDocIssuedDate] = useState("");
  const [docAttachment, setDocAttachment] = useState("");
  const [isSubmittingDoc, setIsSubmittingDoc] = useState(false);

  useEffect(() => {
    if (open && employeeId) {
      loadEmployeeData();
    }
  }, [employeeId, open]);

  const loadEmployeeData = async () => {
    if (!employeeId) return;
    
    setLoading(true);

    try {
      // Try to fetch employee directly by id (numeric) or whalesync_postgres_id
      let employee = null;
      let employeeUUID = null;

      // First try by id field
      const { data: empById, error: idError } = await supabase
        .from("Employee Directory")
        .select(`
          *,
          department_data:department(whalesync_postgres_id, department_name),
          manager_data:reporting_manager(whalesync_postgres_id, full_name, profile_photo, job_title, official_email)
        `)
        .eq("id", employeeId)
        .maybeSingle();

      if (empById) {
        employee = empById;
        employeeUUID = empById.whalesync_postgres_id;
      } else {
        // If not found by id, try by whalesync_postgres_id
        const { data: empByUUID, error: uuidError } = await supabase
          .from("Employee Directory")
          .select(`
            *,
            department_data:department(whalesync_postgres_id, department_name),
            manager_data:reporting_manager(whalesync_postgres_id, full_name, profile_photo, job_title, official_email)
          `)
          .eq("whalesync_postgres_id", employeeId.toString())
          .single();

        if (uuidError || !empByUUID) {
          throw new Error("Employee not found");
        }
        employee = empByUUID;
        employeeUUID = empByUUID.whalesync_postgres_id;
      }

      if (!employee || !employeeUUID) {
        throw new Error("Employee not found");
      }

      setEmployeeData(employee);

      const [
        { data: employeesData },
        { data: callsData },
        { data: attendanceData },
        { data: documentsData },
      ] = await Promise.all([
        supabase.from("Employee Directory").select(`
          *,
          department_data:department(whalesync_postgres_id, department_name)
        `),
        supabase.from("Calls").select("*").eq("employee", employeeUUID).order("call_date", { ascending: false }),
        supabase.from("Attendance").select("*").eq("employee", employeeUUID).order("date", { ascending: false }),
        supabase.from("Employee Documents").select("*").eq("employee", employeeUUID),
      ]);

      setAllEmployees(employeesData || []);
      setCalls(callsData || []);
      setAttendance(attendanceData || []);
      setDocuments(documentsData || []);
    } catch (err: any) {
      console.error("Error loading data:", err);
      toast.error("Failed to load employee data");
    } finally {
      setLoading(false);
    }
  };

  const getManager = () => {
    // First check if we have joined manager data
    if (employeeData?.manager_data) {
      return employeeData.manager_data;
    }
    // Fallback to finding in allEmployees
    if (!employeeData?.reporting_manager) return null;
    return allEmployees.find((emp) => emp.whalesync_postgres_id === employeeData.reporting_manager);
  };

  const getDirectReports = () => {
    if (!employeeData?.whalesync_postgres_id) return [];
    return allEmployees.filter((emp) => emp.reporting_manager === employeeData.whalesync_postgres_id);
  };

  const getDepartmentName = () => {
    return employeeData?.department_data?.department_name || "N/A";
  };

  const handleDownloadDocument = (url: string, filename: string) => {
    try {
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || 'document';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      
      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Download started");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download document");
    }
  };

  const handleAddDocument = async () => {
    if (!docName.trim()) {
      toast.error("Please enter a document name");
      return;
    }

    if (!employeeData?.whalesync_postgres_id) {
      toast.error("Employee data not found");
      return;
    }

    setIsSubmittingDoc(true);

    try {
      const { data, error } = await supabase
        .from("Employee Documents")
        .insert({
          employee: employeeData.whalesync_postgres_id,
          document_name: docName.trim(),
          document_type: docType.trim() || null,
          collection_status: docStatus,
          issued_date: docIssuedDate || null,
          attachment: docAttachment.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Add the new document to the local state
      setDocuments([...documents, data]);
      
      // Reset form
      setDocName("");
      setDocType("");
      setDocStatus("Not Submitted");
      setDocIssuedDate("");
      setDocAttachment("");
      setAddDocModalOpen(false);
      
      toast.success("Document added successfully");
    } catch (error: any) {
      console.error("Error adding document:", error);
      toast.error("Failed to add document: " + (error.message || "Unknown error"));
    } finally {
      setIsSubmittingDoc(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase() || "";
    if (s === "present") return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Present</Badge>;
    if (s === "absent") return <Badge variant="destructive">Absent</Badge>;
    if (s === "half day") return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">Half Day</Badge>;
    if (s === "leave") return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">Leave</Badge>;
    if (s === "holiday") return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">Holiday</Badge>;
    return <Badge variant="secondary">{status || "N/A"}</Badge>;
  };

  const getCallTypeBadge = (type: string) => {
    if (type === "Incoming") return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Incoming</Badge>;
    if (type === "Outgoing") return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">Outgoing</Badge>;
    return <Badge variant="secondary">{type}</Badge>;
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const filteredCalls = calls.filter((call) => {
    let matches = true;
    if (callsDate) matches = matches && (call.call_date?.startsWith(callsDate) || false);
    if (callsSearch) {
      const search = callsSearch.toLowerCase();
      matches = matches && (
        (call.client_name?.toLowerCase().includes(search) || false) ||
        (call.client_number?.includes(search) || false)
      );
    }
    return matches;
  });

  const submittedDocs = documents.filter((doc) => doc.collection_status === "Submitted");
  const notSubmittedDocs = documents.filter((doc) => doc.collection_status !== "Submitted");
  const incomingCalls = calls.filter((c) => c.call_type === "Incoming").length;
  const outgoingCalls = calls.filter((c) => c.call_type === "Outgoing").length;
  const selectedDateRecord = attendance.find((a) => a.date === selectedDate);
  
  // Filter attendance by selected month
  const filteredAttendance = attendance.filter((record) => {
    const recordDate = new Date(record.date);
    const recordMonth = recordDate.toISOString().slice(0, 7); // YYYY-MM format
    return recordMonth === selectedMonth;
  });

  // Get available months from attendance data
  const availableMonths = Array.from(new Set(
    attendance.map(record => {
      const recordDate = new Date(record.date);
      return recordDate.toISOString().slice(0, 7); // YYYY-MM format
    })
  )).sort().reverse(); // Most recent first

  const manager = getManager();
  const directReports = getDirectReports();

  if (!employeeData && !loading) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-lg font-semibold">Employee Details</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="mt-3 text-sm text-muted-foreground">Loading employee details...</p>
          </div>
        ) : (
          <div className="overflow-hidden h-[calc(90vh-5rem)]">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
              <div className="border-b px-6 sticky top-0 bg-background z-10 flex-shrink-0">
                <TabsList className="bg-transparent h-auto p-0 w-full justify-start overflow-x-auto">
                  {["detail", "document", "payroll", "attendance", "calls"].map((tab) => (
                    <TabsTrigger
                      key={tab}
                      value={tab}
                      className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent px-4 py-3 capitalize text-sm font-medium"
                    >
                      {tab === "calls" ? `Calls (${calls.length})` : tab}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                {/* Detail Tab */}
                <TabsContent value="detail" className="mt-0">
                  {/* Header Section */}
                  <div className="flex items-start gap-6 mb-6">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={employeeData?.profile_photo} alt={employeeData?.full_name} />
                      <AvatarFallback className="text-2xl font-semibold">{employeeData?.full_name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h2 className="text-2xl font-bold text-foreground">{employeeData?.full_name}</h2>
                          <p className="text-lg text-muted-foreground">{employeeData?.job_title || "No Position"}</p>
                          <p className="text-sm text-muted-foreground">{employeeData?.official_email}</p>
                        </div>
                        <Button variant="outline" size="sm" className="h-8">
                          <Edit2 className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      </div>
                      <div className="flex items-center gap-6 mt-4">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            ID: {employeeData?.whalesync_postgres_id?.substring(0, 8)}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {getDepartmentName()}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Information Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Personal Information */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Personal Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Phone</span>
                          <span className="text-sm font-medium">{employeeData?.official_contact_number || "N/A"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Personal Email</span>
                          <span className="text-sm font-medium">{employeeData?.personal_email || "N/A"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Date of Birth</span>
                          <span className="text-sm font-medium">
                            {employeeData?.dob ? new Date(employeeData.dob).toLocaleDateString("en-GB") : "N/A"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">LinkedIn</span>
                          {employeeData?.linkedin_profile ? (
                            <a
                              href={employeeData.linkedin_profile.startsWith("http") ? employeeData.linkedin_profile : `https://${employeeData.linkedin_profile}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline flex items-center gap-1"
                            >
                              <Linkedin className="h-3 w-3" />
                              Profile
                            </a>
                          ) : (
                            <span className="text-sm text-muted-foreground">N/A</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Employment Information */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Employment Details</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Department</span>
                          <span className="text-sm font-medium">{getDepartmentName()}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Position</span>
                          <span className="text-sm font-medium">{employeeData?.job_title || "N/A"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Joining Date</span>
                          <span className="text-sm font-medium">
                            {employeeData?.date_of_joining
                              ? new Date(employeeData.date_of_joining).toLocaleDateString("en-GB")
                              : "N/A"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Employment Type</span>
                          <span className="text-sm font-medium">{employeeData?.employment_type || "N/A"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Work Mode</span>
                          <span className="text-sm font-medium">{employeeData?.work_mode || "N/A"}</span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Management Information */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Management</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Manager</span>
                          <span className="text-sm font-medium">{manager?.full_name || "No Manager"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Direct Reports</span>
                          <span className="text-sm font-medium">{directReports.length} employees</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Status</span>
                          <Badge variant={employeeData?.status === "Active" ? "default" : "secondary"} className="text-xs">
                            {employeeData?.status || "Unknown"}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Monthly Payroll</span>
                          <span className="text-sm font-medium">
                            {employeeData?.monthly_payroll ? `₹${employeeData.monthly_payroll.toLocaleString()}` : "N/A"}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Document Tab */}
                <TabsContent value="document" className="mt-0">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-lg font-semibold">Document Management</h3>
                      <p className="text-sm text-muted-foreground">Manage employee documents and submissions</p>
                    </div>
                    <Button onClick={() => setAddDocModalOpen(true)} className="h-9">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Document
                    </Button>
                  </div>

                  {/* Document Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card className="bg-gradient-to-t from-primary/5 to-card shadow-xs">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Total Documents</p>
                            <p className="text-2xl font-bold text-foreground">{documents.length}</p>
                          </div>
                          <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 text-sm font-semibold">{documents.length}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-t from-primary/5 to-card shadow-xs">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Submitted</p>
                            <p className="text-2xl font-bold text-foreground">{submittedDocs.length}</p>
                          </div>
                          <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-t from-primary/5 to-card shadow-xs">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Pending</p>
                            <p className="text-2xl font-bold text-foreground">{notSubmittedDocs.length}</p>
                          </div>
                          <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                            <AlertTriangle className="h-4 w-4 text-orange-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Document Filter Tabs */}
                  <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit mb-6">
                    <Button
                      variant={activeDocTab === "submitted" ? "default" : "ghost"}
                      size="sm"
                      className="h-8"
                      onClick={() => setActiveDocTab("submitted")}
                    >
                      Submitted ({submittedDocs.length})
                    </Button>
                    <Button
                      variant={activeDocTab === "not-submitted" ? "default" : "ghost"}
                      size="sm"
                      className="h-8"
                      onClick={() => setActiveDocTab("not-submitted")}
                    >
                      Pending ({notSubmittedDocs.length})
                    </Button>
                  </div>

                  {/* Document List */}
                  {activeDocTab === "submitted" ? (
                    <div className="space-y-3">
                      {submittedDocs.length === 0 ? (
                        <Card>
                          <CardContent className="p-8 text-center">
                            <div className="text-muted-foreground">
                              <div className="h-12 w-12 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                                <FileText className="h-6 w-6" />
                              </div>
                              <p className="text-lg font-medium">No submitted documents</p>
                              <p className="text-sm">All documents are pending submission</p>
                            </div>
                          </CardContent>
                        </Card>
                      ) : (
                        submittedDocs.map((doc) => (
                          <Card key={doc.whalesync_postgres_id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                  </div>
                                  <div>
                                    <h4 className="font-medium">{doc.document_name}</h4>
                                    <p className="text-sm text-muted-foreground">
                                      {doc.document_type || "General Document"} • 
                                      {doc.issued_date ? new Date(doc.issued_date).toLocaleDateString() : "No date"}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  {doc.attachment ? (
                                    <>
                                      <Button variant="outline" size="sm" asChild>
                                        <a href={doc.attachment} target="_blank" rel="noopener noreferrer">
                                          <ExternalLink className="h-4 w-4 mr-1" />
                                          View
                                        </a>
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => handleDownloadDocument(doc.attachment!, doc.document_name)}
                                      >
                                        <Download className="h-4 w-4" />
                                      </Button>
                                    </>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">No attachment</span>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {notSubmittedDocs.length === 0 ? (
                        <Card>
                          <CardContent className="p-8 text-center">
                            <div className="text-muted-foreground">
                              <div className="h-12 w-12 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                                <CheckCircle className="h-8 w-8 text-green-600" />
                              </div>
                              <p className="text-lg font-medium">All documents submitted</p>
                              <p className="text-sm">Great job! All required documents are complete</p>
                            </div>
                          </CardContent>
                        </Card>
                      ) : (
                        notSubmittedDocs.map((doc) => (
                          <Card key={doc.whalesync_postgres_id} className="border-orange-200 bg-orange-50/50">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                                  </div>
                                  <div>
                                    <h4 className="font-medium">{doc.document_name}</h4>
                                    <p className="text-sm text-muted-foreground">
                                      {doc.document_type || "General Document"} • Pending submission
                                    </p>
                                  </div>
                                </div>
                                <Badge variant="outline" className="text-orange-600 border-orange-200">
                                  Pending
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  )}
                </TabsContent>

                {/* Payroll Tab */}
                <TabsContent value="payroll" className="mt-0">
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2">Payroll Information</h3>
                    <p className="text-sm text-muted-foreground">Current salary details and payment history</p>
                  </div>

                  {/* Payroll Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <Card className="bg-gradient-to-t from-primary/5 to-card shadow-xs">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Monthly Salary</p>
                            <p className="text-2xl font-bold text-foreground">
                              {employeeData?.monthly_payroll
                                ? `₹${Number(employeeData.monthly_payroll).toLocaleString()}`
                                : "N/A"}
                            </p>
                          </div>
                          <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-green-600 text-sm font-semibold">₹</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-t from-primary/5 to-card shadow-xs">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Annual Salary</p>
                            <p className="text-xl font-bold text-foreground">
                              {employeeData?.monthly_payroll
                                ? `₹${(Number(employeeData.monthly_payroll) * 12).toLocaleString()}`
                                : "N/A"}
                            </p>
                          </div>
                          <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <BarChart3 className="h-4 w-4 text-blue-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-t from-primary/5 to-card shadow-xs">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Bank</p>
                            <p className="text-sm font-medium text-foreground">
                              {employeeData?.bank_details 
                                ? employeeData.bank_details.split("\n").find((l) => l.includes("Bank Name"))?.split("-")[1]?.trim() || "N/A"
                                : "N/A"}
                            </p>
                          </div>
                          <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <Building2 className="h-4 w-4 text-purple-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-t from-primary/5 to-card shadow-xs">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Account</p>
                            <p className="text-sm font-medium text-foreground">
                              {employeeData?.bank_details 
                                ? employeeData.bank_details.split("\n").find((l) => l.includes("Account No"))?.split("-")[1]?.trim() || "N/A"
                                : "N/A"}
                            </p>
                          </div>
                          <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                            <CreditCard className="h-4 w-4 text-orange-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Bank Details */}
                  {employeeData?.bank_details && (
                    <Card className="mb-6">
                      <CardHeader>
                        <CardTitle className="text-base">Banking Information</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Bank Name</span>
                              <span className="text-sm font-medium">
                                {employeeData.bank_details.split("\n").find((l) => l.includes("Bank Name"))?.split("-")[1]?.trim() || "N/A"}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Account Number</span>
                              <span className="text-sm font-medium font-mono">
                                {employeeData.bank_details.split("\n").find((l) => l.includes("Account No"))?.split("-")[1]?.trim() || "N/A"}
                              </span>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">IFSC Code</span>
                              <span className="text-sm font-medium font-mono">
                                {employeeData.bank_details.split("\n").find((l) => l.includes("IFSC Code"))?.split("-")[1]?.trim() || "N/A"}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Account Type</span>
                              <span className="text-sm font-medium">Salary Account</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Payment History</h3>
                    <Button variant="outline" size="sm">
                      Export Records
                    </Button>
                  </div>
                  <Card>
                    <CardContent className="p-8 text-center">
                      <div className="text-muted-foreground">
                        <div className="h-12 w-12 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                          <DollarSign className="h-6 w-6" />
                        </div>
                        <p className="text-lg font-medium">No payment records</p>
                        <p className="text-sm">Payment history will appear here once transactions are recorded</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Attendance Tab */}
                <TabsContent value="attendance" className="mt-0">
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2">Attendance Management</h3>
                    <p className="text-sm text-muted-foreground">Track employee attendance and working hours</p>
                  </div>

                  {/* Attendance Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <Card className="bg-gradient-to-t from-primary/5 to-card shadow-xs">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Total Days</p>
                            <p className="text-2xl font-bold">{filteredAttendance.length}</p>
                            <p className="text-xs text-muted-foreground">
                              {attendance.length > 0 && `(${attendance.length} total)`}
                            </p>
                          </div>
                          <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Calendar className="h-4 w-4 text-blue-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-t from-primary/5 to-card shadow-xs">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Present</p>
                            <p className="text-2xl font-bold text-green-600">
                              {filteredAttendance.filter(a => a.status === 'Present').length}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {attendance.length > 0 && `(${attendance.filter(a => a.status === 'Present').length} total)`}
                            </p>
                          </div>
                          <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-t from-primary/5 to-card shadow-xs">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Late</p>
                            <p className="text-2xl font-bold text-yellow-600">
                              {filteredAttendance.filter(a => a.status === 'Late').length}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {attendance.length > 0 && `(${attendance.filter(a => a.status === 'Late').length} total)`}
                            </p>
                          </div>
                          <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                            <Clock className="h-4 w-4 text-yellow-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-t from-primary/5 to-card shadow-xs">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Absent</p>
                            <p className="text-2xl font-bold text-red-600">
                              {filteredAttendance.filter(a => a.status === 'Absent').length}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {attendance.length > 0 && `(${attendance.filter(a => a.status === 'Absent').length} total)`}
                            </p>
                          </div>
                          <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                            <XCircle className="h-4 w-4 text-red-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Date Selector */}
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle className="text-base">Check Attendance by Date</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center space-x-4">
                        <div className="flex-1">
                          <Label htmlFor="attendance-date" className="text-sm font-medium">
                            Select Date
                          </Label>
                          <Input
                            id="attendance-date"
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div className="flex-1">
                          {selectedDateRecord ? (
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-muted-foreground">Status:</span>
                              {getStatusBadge(selectedDateRecord.status)}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              No record for {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-GB", { weekday: "long" })}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Month Filter */}
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle className="text-base">Filter by Month</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center space-x-4">
                        <div className="flex-1">
                          <Label htmlFor="month-filter" className="text-sm font-medium">
                            Select Month
                          </Label>
                          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select month" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableMonths.length > 0 ? (
                                availableMonths.map((month) => {
                                  const date = new Date(month + '-01');
                                  const monthName = date.toLocaleDateString('en-US', { 
                                    year: 'numeric', 
                                    month: 'long' 
                                  });
                                  return (
                                    <SelectItem key={month} value={month}>
                                      {monthName}
                                    </SelectItem>
                                  );
                                })
                              ) : (
                                <SelectItem value={selectedMonth}>
                                  {new Date(selectedMonth + '-01').toLocaleDateString('en-US', { 
                                    year: 'numeric', 
                                    month: 'long' 
                                  })}
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex-1">
                          <div className="text-sm text-muted-foreground">
                            <p className="font-medium">Records for selected month: {filteredAttendance.length}</p>
                            <p className="text-xs">
                              {new Date(selectedMonth + '-01').toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'long' 
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Attendance History</h3>
                    <Button variant="outline" size="sm">
                      Export Records
                    </Button>
                  </div>

                  <Card>
                    <CardContent className="p-0">
                      {filteredAttendance.length === 0 ? (
                        <div className="p-8 text-center">
                          <div className="text-muted-foreground">
                            <div className="h-12 w-12 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                              <BarChart3 className="h-6 w-6" />
                            </div>
                            <p className="text-lg font-medium">
                              {attendance.length === 0 
                                ? "No attendance records" 
                                : "No records for selected month"
                              }
                            </p>
                            <p className="text-sm">
                              {attendance.length === 0 
                                ? "Attendance data will appear here once recorded" 
                                : "Try selecting a different month or check if attendance was recorded"
                              }
                            </p>
                          </div>
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredAttendance
                              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                              .map((record, index) => (
                                <TableRow key={record.id || `${record.date}-${index}`}>
                                  <TableCell className="font-medium">
                                    {new Date(record.date + "T00:00:00").toLocaleDateString("en-GB", {
                                      day: "numeric",
                                      month: "long",
                                      year: "numeric",
                                    })}
                                  </TableCell>
                                  <TableCell>{getStatusBadge(record.status)}</TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Calls Tab */}
                <TabsContent value="calls" className="mt-0">
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2">Call Management</h3>
                    <p className="text-sm text-muted-foreground">Track employee call logs and communication history</p>
                  </div>

                  {/* Call Statistics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card className="bg-gradient-to-t from-primary/5 to-card shadow-xs">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Total Calls</p>
                            <p className="text-2xl font-bold text-foreground">{calls.length}</p>
                          </div>
                          <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <PhoneCall className="h-4 w-4 text-blue-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-t from-primary/5 to-card shadow-xs">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Incoming</p>
                            <p className="text-2xl font-bold text-foreground">{incomingCalls}</p>
                          </div>
                          <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                            <ArrowDownToLine className="h-4 w-4 text-green-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-t from-primary/5 to-card shadow-xs">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Outgoing</p>
                            <p className="text-2xl font-bold text-foreground">{outgoingCalls}</p>
                          </div>
                          <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <ArrowUpFromLine className="h-4 w-4 text-purple-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Filters */}
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle className="text-base">Filter & Search</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="calls-date" className="text-sm font-medium">
                            Filter by Date
                          </Label>
                          <Input 
                            id="calls-date" 
                            type="date" 
                            value={callsDate} 
                            onChange={(e) => setCallsDate(e.target.value)} 
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="calls-search" className="text-sm font-medium">
                            Search by Name or Number
                          </Label>
                          <Input
                            id="calls-search"
                            type="text"
                            placeholder="Search calls..."
                            value={callsSearch}
                            onChange={(e) => setCallsSearch(e.target.value)}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Call History</h3>
                    <Button variant="outline" size="sm">
                      Export Logs
                    </Button>
                  </div>

                  <Card>
                    <CardContent className="p-0">
                      {filteredCalls.length === 0 ? (
                        <div className="p-8 text-center">
                          <div className="text-muted-foreground">
                            <div className="h-12 w-12 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                              <PhoneCall className="h-6 w-6" />
                            </div>
                            <p className="text-lg font-medium">No calls recorded</p>
                            <p className="text-sm">Call logs will appear here once calls are made</p>
                          </div>
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Time</TableHead>
                              <TableHead>Client</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Duration</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredCalls
                              .sort((a, b) => new Date(b.call_date).getTime() - new Date(a.call_date).getTime())
                              .map((call) => (
                                <TableRow key={call.whalesync_postgres_id} className="cursor-pointer hover:bg-muted/50">
                                  <TableCell className="font-medium">
                                    {new Date(call.call_date).toLocaleTimeString("en-US", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </TableCell>
                                  <TableCell>
                                    <div className="font-medium">{call.client_name || "Unknown Client"}</div>
                                    <div className="text-sm text-muted-foreground">{call.client_number || ""}</div>
                                  </TableCell>
                                  <TableCell>{getCallTypeBadge(call.call_type)}</TableCell>
                                  <TableCell>{formatDuration(call.duration)}</TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

              </div>
            </Tabs>
          </div>
        )}
      </DialogContent>

      {/* Add Document Modal */}
      <Dialog open={addDocModalOpen} onOpenChange={setAddDocModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="doc-name">Document Name *</Label>
              <Input
                id="doc-name"
                placeholder="e.g., Aadhar Card"
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="doc-type">Document Type</Label>
              <Select value={docType} onValueChange={setDocType}>
                <SelectTrigger id="doc-type">
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Identity & KYC Proof">Identity & KYC Proof</SelectItem>
                  <SelectItem value="Education & Qualification Proof">Education & Qualification Proof</SelectItem>
                  <SelectItem value="N/A">N/A</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="doc-status">Collection Status</Label>
              <Select value={docStatus} onValueChange={setDocStatus}>
                <SelectTrigger id="doc-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Submitted">Submitted</SelectItem>
                  <SelectItem value="Not Submitted">Not Submitted</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="doc-issued-date">Issued Date</Label>
              <Input
                id="doc-issued-date"
                type="date"
                value={docIssuedDate}
                onChange={(e) => setDocIssuedDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="doc-attachment">Attachment URL</Label>
              <Input
                id="doc-attachment"
                placeholder="https://example.com/document.pdf"
                value={docAttachment}
                onChange={(e) => setDocAttachment(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setAddDocModalOpen(false);
                  setDocName("");
                  setDocType("");
                  setDocStatus("Not Submitted");
                  setDocIssuedDate("");
                  setDocAttachment("");
                }}
                disabled={isSubmittingDoc}
              >
                Cancel
              </Button>
              <Button onClick={handleAddDocument} disabled={isSubmittingDoc}>
                {isSubmittingDoc ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Document"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}


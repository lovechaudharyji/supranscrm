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
  const manager = getManager();
  const directReports = getDirectReports();

  if (!employeeData && !loading) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden p-0">
        <DialogHeader className="px-4 pt-4 pb-3 border-b">
          <DialogTitle className="text-base">Employee Details</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="mt-3 text-sm text-muted-foreground">Loading employee details...</p>
          </div>
        ) : (
          <div className="overflow-hidden h-[calc(85vh-4rem)]">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
              <div className="border-b px-4 sticky top-0 bg-background z-10 flex-shrink-0">
                <TabsList className="bg-transparent h-auto p-0 w-full justify-start overflow-x-auto">
                  {["detail", "document", "payroll", "attendance", "calls"].map((tab) => (
                    <TabsTrigger
                      key={tab}
                      value={tab}
                      className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent px-3 py-2 capitalize text-sm"
                    >
                      {tab === "calls" ? `Calls (${calls.length})` : tab}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              <div className="p-4 overflow-y-auto flex-1">
                {/* Detail Tab */}
                <TabsContent value="detail" className="mt-0 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Profile Card */}
                    <Card className="bg-muted/30">
                      <CardContent className="p-3 flex flex-col items-center text-center">
                        <Avatar className="h-16 w-16 mb-2">
                          <AvatarImage src={employeeData?.profile_photo} alt={employeeData?.full_name} />
                          <AvatarFallback className="text-xl">{employeeData?.full_name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <h3 className="text-sm font-bold">{employeeData?.full_name}</h3>
                        <p className="text-xs text-muted-foreground">{employeeData?.official_email}</p>
                        <div className="mt-1">
                          <p className="text-xs font-semibold text-primary">{employeeData?.job_title || "N/A"}</p>
                          <p className="text-xs text-muted-foreground">
                            ID: {employeeData?.whalesync_postgres_id?.substring(0, 8) || "N/A"}
                          </p>
                        </div>
                        <div className="mt-2 grid grid-cols-1 gap-1.5 text-xs w-full">
                          <Card className="bg-background">
                            <CardContent className="p-2">
                              <p className="text-muted-foreground text-xs">Department</p>
                              <p className="font-semibold text-sm">{getDepartmentName()}</p>
                            </CardContent>
                          </Card>
                          <Card className="bg-background">
                            <CardContent className="p-2">
                              <p className="text-muted-foreground text-xs">Joining Date</p>
                              <p className="font-semibold text-sm">
                                {employeeData?.date_of_joining
                                  ? new Date(employeeData.date_of_joining).toLocaleDateString("en-GB", {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    })
                                  : "N/A"}
                              </p>
                            </CardContent>
                          </Card>
                          <Card className="bg-background">
                            <CardContent className="p-2">
                              <p className="text-muted-foreground text-xs">Manager</p>
                              <p className="font-semibold text-sm">{manager?.full_name || "N/A"}</p>
                            </CardContent>
                          </Card>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Contact Details & Employment */}
                    <div className="md:col-span-2 space-y-3">
                      {/* Contact Details Section */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="text-sm font-semibold">Contact Details</h4>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <div className="space-y-2">
                          <Card className="bg-muted/30">
                            <CardContent className="p-2 flex items-center">
                              <Phone className="h-3.5 w-3.5 text-muted-foreground mr-2" />
                              <span className="text-xs">{employeeData?.official_contact_number || "N/A"}</span>
                            </CardContent>
                          </Card>
                          {employeeData?.linkedin_profile && (
                            <Card className="bg-muted/30">
                              <CardContent className="p-2 flex items-center">
                                <Linkedin className="h-3.5 w-3.5 text-muted-foreground mr-2" />
                                <a
                                  href={employeeData.linkedin_profile.startsWith("http") ? employeeData.linkedin_profile : `https://${employeeData.linkedin_profile}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-primary hover:underline"
                                >
                                  View LinkedIn Profile
                                </a>
                              </CardContent>
                            </Card>
                          )}
                        </div>
                      </div>

                      {/* Employment Details Section */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="text-sm font-semibold">Employment Details</h4>
                        </div>
                        <div className="space-y-2">
                          <Card className="bg-muted/30">
                            <CardContent className="p-2 flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">Position</span>
                              <div className="flex items-center space-x-2">
                                <Badge variant="secondary" className="text-xs">{employeeData?.employment_type || "N/A"}</Badge>
                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                  <Edit2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>

                          <Card className="bg-muted/30">
                            <CardContent className="p-2 flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">Manager</span>
                              <div className="flex items-center space-x-2">
                                {manager && (
                                  <>
                                    <Avatar className="h-6 w-6">
                                      <AvatarImage src={manager.profile_photo} alt={manager.full_name} />
                                      <AvatarFallback className="text-xs">{manager.full_name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <span className="text-xs font-medium">{manager.full_name}</span>
                                  </>
                                )}
                                {!manager && <span className="text-xs text-muted-foreground">No manager assigned</span>}
                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                  <Edit2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>

                          <Card className="bg-muted/30">
                            <CardContent className="p-2 flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">Direct Reports</span>
                              <div className="flex items-center space-x-2">
                                <div className="flex -space-x-1.5">
                                  {directReports.slice(0, 4).map((report) => (
                                    <Avatar key={report.whalesync_postgres_id} className="h-6 w-6 border-2 border-background">
                                      <AvatarImage src={report.profile_photo} alt={report.full_name} />
                                      <AvatarFallback className="text-xs">{report.full_name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                  ))}
                                  {directReports.length > 4 && (
                                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold border-2 border-background">
                                      +{directReports.length - 4}
                                    </div>
                                  )}
                                </div>
                                {directReports.length === 0 && <span className="text-xs text-muted-foreground">No direct reports</span>}
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Document Tab */}
                <TabsContent value="document" className="mt-0 space-y-2">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-semibold">Documents</h3>
                    <div className="flex items-center gap-2">
                      <Button
                        variant={activeDocTab === "submitted" ? "default" : "outline"}
                        size="sm"
                        className="text-xs h-7"
                        onClick={() => setActiveDocTab("submitted")}
                      >
                        Submitted
                      </Button>
                      <Button
                        variant={activeDocTab === "not-submitted" ? "default" : "outline"}
                        size="sm"
                        className="text-xs h-7"
                        onClick={() => setActiveDocTab("not-submitted")}
                      >
                        Not Submitted
                      </Button>
                      <Button onClick={() => setAddDocModalOpen(true)} size="sm" className="text-xs h-7">
                        Add Document
                      </Button>
                    </div>
                  </div>

                  {activeDocTab === "submitted" ? (
                    <div className="mt-4">
                      <Card>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Document Name</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Issued Date</TableHead>
                              <TableHead>Action</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {submittedDocs.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground">
                                  No submitted documents found.
                                </TableCell>
                              </TableRow>
                            ) : (
                              submittedDocs.map((doc) => (
                                <TableRow key={doc.whalesync_postgres_id}>
                                  <TableCell className="font-medium">{doc.document_name}</TableCell>
                                  <TableCell>{doc.document_type || "N/A"}</TableCell>
                                  <TableCell>
                                    {doc.issued_date ? new Date(doc.issued_date).toLocaleDateString() : "N/A"}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center space-x-2">
                                      {doc.attachment ? (
                                        <>
                                          <Button variant="link" size="sm" asChild>
                                            <a href={doc.attachment} target="_blank" rel="noopener noreferrer">
                                              <ExternalLink className="h-4 w-4 mr-1" />
                                              View
                                            </a>
                                          </Button>
                                          <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-8 w-8"
                                            onClick={() => handleDownloadDocument(doc.attachment!, doc.document_name)}
                                          >
                                            <Download className="h-4 w-4" />
                                          </Button>
                                        </>
                                      ) : (
                                        <span className="text-xs text-muted-foreground">N/A</span>
                                      )}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </Card>
                    </div>
                  ) : (
                    <div className="mt-4">
                      <Card>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Document Name</TableHead>
                              <TableHead>Type</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {notSubmittedDocs.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={2} className="text-center text-muted-foreground">
                                  No pending documents.
                                </TableCell>
                              </TableRow>
                            ) : (
                              notSubmittedDocs.map((doc) => (
                                <TableRow key={doc.whalesync_postgres_id}>
                                  <TableCell className="font-medium">{doc.document_name}</TableCell>
                                  <TableCell>{doc.document_type || "N/A"}</TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </Card>
                    </div>
                  )}
                </TabsContent>

                {/* Payroll Tab */}
                <TabsContent value="payroll" className="mt-0 space-y-3">
                  <Card className="bg-muted/30">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Current Payroll Details</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-muted-foreground">Current Salary</p>
                          <p className="font-bold">
                            {employeeData?.monthly_payroll
                              ? `$${Number(employeeData.monthly_payroll).toLocaleString()}`
                              : "N/A"}
                          </p>
                        </div>
                        {employeeData?.bank_details && (
                          <>
                            <div>
                              <p className="text-muted-foreground">Bank Name</p>
                              <p className="font-bold">
                                {employeeData.bank_details.split("\n").find((l) => l.includes("Bank Name"))?.split("-")[1]?.trim() || "N/A"}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Bank Account Number</p>
                              <p className="font-bold">
                                {employeeData.bank_details.split("\n").find((l) => l.includes("Account No"))?.split("-")[1]?.trim() || "N/A"}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">IFSC Code</p>
                              <p className="font-bold">
                                {employeeData.bank_details.split("\n").find((l) => l.includes("IFSC Code"))?.split("-")[1]?.trim() || "N/A"}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <h3 className="text-sm font-semibold">Transactions</h3>
                  <Card>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Salary For</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground">
                            There are no transactions right now.
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </Card>
                </TabsContent>

                {/* Attendance Tab */}
                <TabsContent value="attendance" className="mt-0 space-y-3">
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Check Attendance by Date</h3>
                    <Card className="bg-muted/30">
                      <CardContent className="p-2 flex items-end space-x-2">
                        <div>
                          <Label htmlFor="attendance-date" className="text-xs">
                            Select a Date
                          </Label>
                          <Input
                            id="attendance-date"
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="text-xs h-8"
                          />
                        </div>
                        <div className="flex-grow">
                          {selectedDateRecord ? (
                            <p className="text-xs font-medium">
                              Status on {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-GB", { weekday: "long" })}: {getStatusBadge(selectedDateRecord.status)}
                            </p>
                          ) : (
                            <p className="text-sm font-medium text-muted-foreground">
                              No record for {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-GB", { weekday: "long" })}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold mb-2">Attendance Log</h3>
                    <Card className="max-h-48 overflow-y-auto">
                      <Table>
                        <TableHeader className="sticky top-0 bg-background">
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {attendance.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={2} className="text-center text-muted-foreground">
                                No attendance records found.
                              </TableCell>
                            </TableRow>
                          ) : (
                            attendance
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
                              ))
                          )}
                        </TableBody>
                      </Table>
                    </Card>
                  </div>
                </TabsContent>

                {/* Calls Tab */}
                <TabsContent value="calls" className="mt-0 h-full flex flex-col space-y-2 overflow-hidden">
                  {/* Compact Metrics Cards */}
                  <div className="grid grid-cols-3 gap-2 flex-shrink-0">
                    <Card className="bg-muted/50 border-muted">
                      <CardContent className="p-1.5 text-center">
                        <p className="text-[10px] font-medium text-muted-foreground uppercase">Total</p>
                        <p className="text-lg font-bold">{calls.length}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-muted/50 border-muted">
                      <CardContent className="p-1.5 text-center">
                        <p className="text-[10px] font-medium text-muted-foreground uppercase">Incoming</p>
                        <p className="text-lg font-bold">{incomingCalls}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-muted/50 border-muted">
                      <CardContent className="p-1.5 text-center">
                        <p className="text-[10px] font-medium text-muted-foreground uppercase">Outgoing</p>
                        <p className="text-lg font-bold">{outgoingCalls}</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Filters */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 flex-shrink-0">
                    <div>
                      <Label htmlFor="calls-date" className="text-xs">
                        Filter by Date
                      </Label>
                      <Input id="calls-date" type="date" value={callsDate} onChange={(e) => setCallsDate(e.target.value)} className="text-xs h-8" />
                    </div>
                    <div>
                      <Label htmlFor="calls-search" className="text-xs">
                        Search by Name or Number
                      </Label>
                      <Input
                        id="calls-search"
                        type="text"
                        placeholder="Search..."
                        value={callsSearch}
                        onChange={(e) => setCallsSearch(e.target.value)}
                        className="text-xs h-8"
                      />
                    </div>
                  </div>

                  {/* Expanded Call Log Section - Only this scrolls */}
                  <div className="flex flex-col flex-1 min-h-0">
                    <h3 className="text-sm font-semibold mb-2 flex-shrink-0">Call Log</h3>
                    <Card className="flex-1 min-h-0 overflow-hidden flex flex-col">
                      <div className="overflow-y-auto flex-1">
                        <Table>
                          <TableHeader className="sticky top-0 bg-background z-10">
                            <TableRow>
                              <TableHead className="text-xs">Time</TableHead>
                              <TableHead className="text-xs">Client</TableHead>
                              <TableHead className="text-xs">Type</TableHead>
                              <TableHead className="text-xs">Duration</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredCalls.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground text-xs py-8">
                                  No calls recorded matching criteria.
                                </TableCell>
                              </TableRow>
                            ) : (
                              filteredCalls
                                .sort((a, b) => new Date(b.call_date).getTime() - new Date(a.call_date).getTime())
                                .map((call) => (
                                  <TableRow key={call.whalesync_postgres_id} className="cursor-pointer hover:bg-muted/50">
                                    <TableCell className="font-medium text-xs">
                                      {new Date(call.call_date).toLocaleTimeString("en-US", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </TableCell>
                                    <TableCell className="text-xs">
                                      <div className="font-medium">{call.client_name || "Unknown Client"}</div>
                                      <div className="text-[10px] text-muted-foreground">{call.client_number || ""}</div>
                                    </TableCell>
                                    <TableCell className="text-xs">{getCallTypeBadge(call.call_type)}</TableCell>
                                    <TableCell className="text-xs">{formatDuration(call.duration)}</TableCell>
                                  </TableRow>
                                ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </Card>
                  </div>
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


"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SiteHeader } from "@/components/site-header";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import {
  ArrowLeft,
  Phone,
  Linkedin,
  Edit2,
  Download,
  ExternalLink,
  Loader2,
  AlertTriangle,
  Plus,
  Save,
  X,
  StickyNote,
} from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

interface EmployeeData {
  id: number;
  whalesync_postgres_id?: string;
  full_name: string;
  official_email: string;
  official_contact_number?: string;
  job_title?: string;
  date_of_joining?: string;
  employment_type?: string;
  status?: string;
  profile_photo?: string;
  linkedin_profile?: string;
  department?: number;
  reporting_manager?: number;
  monthly_payroll?: number;
  bank_details?: string;
  dob?: string;
  permanent_address?: string;
  Notes?: string;
  teams?: {
    team_name: string;
  };
}

interface CallData {
  whalesync_postgres_id: string;
  employee: string;
  client_name?: string;
  client_number?: string;
  call_date: string;
  duration: number;
  call_type: string;
}

interface AttendanceData {
  employee: string;
  date: string;
  status: string;
}

interface DocumentData {
  id?: number;
  employee: string;
  document_name: string;
  document_type: string;
  collection_status: string;
  issued_date?: string;
  attachment?: string;
}

interface Department {
  whalesync_postgres_id: string;
  department_name: string;
}

export default function EmployeeDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const employeeId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [employeeData, setEmployeeData] = useState<EmployeeData | null>(null);
  const [allEmployees, setAllEmployees] = useState<EmployeeData[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [calls, setCalls] = useState<CallData[]>([]);
  const [attendance, setAttendance] = useState<AttendanceData[]>([]);
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  
  const [activeTab, setActiveTab] = useState("detail");
  const [activeDocTab, setActiveDocTab] = useState("submitted");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editType, setEditType] = useState("");
  const [addDocModalOpen, setAddDocModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [callsDate, setCallsDate] = useState("");
  const [callsSearch, setCallsSearch] = useState("");
  
  // Quick Notes state
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  useEffect(() => {
    loadEmployeeData();
  }, [employeeId]);

  // Update notes value when employee data changes
  useEffect(() => {
    if (employeeData?.Notes) {
      setNotesValue(employeeData.Notes);
    }
  }, [employeeData]);

  const loadEmployeeData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch employee with teams relationship
      const { data: employee, error: empError } = await supabase
        .from("Employee Directory")
        .select(`
          *,
          teams:teams(*),
          reporting_manager:reporting_manager(*)
        `)
        .eq("id", employeeId)
        .single();

      if (empError) throw empError;
      if (!employee) throw new Error("Employee not found");

      setEmployeeData(employee);

      // Fetch all other data
      const [
        { data: employeesData, error: allEmpError },
        { data: departmentsData, error: deptError },
        { data: callsData, error: callsError },
        { data: attendanceData, error: attError },
        { data: documentsData, error: docsError },
      ] = await Promise.all([
        supabase.from("Employee Directory").select(`
          *,
          teams:teams(*)
        `),
        supabase.from("Teams").select("id, team_name"),
        supabase.from("Calls").select("*").eq("employee", employeeId),
        supabase.from("Attendance").select("*").eq("employee", employeeId),
        supabase.from("Employee Documents").select("*").eq("employee", employeeId),
      ]);

      if (allEmpError) console.warn("Error loading all employees:", allEmpError);
      if (deptError) console.warn("Error loading departments:", deptError);

      setAllEmployees(employeesData || []);
      setDepartments(departmentsData?.map(d => ({ whalesync_postgres_id: String(d.id), department_name: d.team_name })) || []);
      setCalls(callsData || []);
      setAttendance(attendanceData || []);
      setDocuments(documentsData || []);
    } catch (err) {
      console.error("Error loading data:", err);
      setError(err instanceof Error ? err.message : "Failed to load employee data");
    } finally {
      setLoading(false);
    }
  };

  const getManager = () => {
    if (!employeeData?.reporting_manager) return null;
    return allEmployees.find((emp) => emp.id === employeeData.reporting_manager);
  };

  const getDepartment = () => {
    if (!employeeData?.teams) return null;
    return { department_name: employeeData.teams.team_name };
  };

  const getDirectReports = () => {
    return allEmployees.filter((emp) => emp.reporting_manager === employeeData?.id);
  };

  // Quick Notes functions
  const handleSaveNotes = async () => {
    if (!employeeData?.id) return;
    
    setIsSavingNotes(true);
    try {
      const { error } = await supabase
        .from("Employee Directory")
        .update({ Notes: notesValue })
        .eq("id", employeeData.id);

      if (error) throw error;

      // Update local state
      setEmployeeData(prev => prev ? { ...prev, Notes: notesValue } : null);
      setIsEditingNotes(false);
      toast.success("Notes saved successfully!");
    } catch (err) {
      console.error("Error saving notes:", err);
      toast.error(`Failed to save notes: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleCancelNotes = () => {
    setNotesValue(employeeData?.Notes || "");
    setIsEditingNotes(false);
  };

  const handleEditNotes = () => {
    setIsEditingNotes(true);
  };

  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase() || "";
    if (s === "present") return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Present</Badge>;
    if (s === "absent") return <Badge variant="destructive">Absent</Badge>;
    if (s === "half day") return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">Half Day</Badge>;
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

  if (loading) {
    return (
      <div className="flex h-screen bg-background">
        <SidebarProvider>
          <AppSidebar />
          <div className="flex-1 flex flex-col">
            <SiteHeader title="Employee Details" />
            <div className="flex flex-col items-center justify-center flex-1">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="mt-4 text-muted-foreground">Loading employee details...</p>
            </div>
          </div>
        </SidebarProvider>
      </div>
    );
  }

  if (error || !employeeData) {
    return (
      <div className="flex h-screen bg-background">
        <SidebarProvider>
          <AppSidebar />
          <div className="flex-1 flex flex-col">
            <SiteHeader title="Employee Details" />
            <div className="flex flex-col items-center justify-center flex-1">
              <AlertTriangle className="h-12 w-12 text-destructive" />
              <h3 className="mt-2 text-lg font-medium">Could not load employee details</h3>
              <p className="mt-1 text-sm text-muted-foreground">{error || "No data found"}</p>
              <Button onClick={() => router.back()} className="mt-4" variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
            </div>
          </div>
        </SidebarProvider>
      </div>
    );
  }

  const manager = getManager();
  const department = getDepartment();
  const directReports = getDirectReports();

  return (
    <div className="flex h-screen bg-background overflow-hidden">
        <SidebarProvider>
          <AppSidebar />
          <div className="flex flex-col flex-1 overflow-hidden">
            <SiteHeader title="Employee Details" />

          <div className="flex-1 overflow-y-auto">
            <div className="max-w-6xl mx-auto p-4">
              <Button onClick={() => router.back()} variant="ghost" className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Employees
              </Button>

              {/* Quick Notes Section */}
              <Card className="shadow-sm mb-4 border-primary/20">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <StickyNote className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">Quick Notes</CardTitle>
                    </div>
                    <div className="flex gap-2">
                      {!isEditingNotes ? (
                        <Button
                          onClick={handleEditNotes}
                          variant="outline"
                          size="sm"
                        >
                          <Edit2 className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      ) : (
                        <>
                          <Button
                            onClick={handleCancelNotes}
                            variant="outline"
                            size="sm"
                            disabled={isSavingNotes}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Cancel
                          </Button>
                          <Button
                            onClick={handleSaveNotes}
                            size="sm"
                            disabled={isSavingNotes}
                          >
                            {isSavingNotes ? (
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                              <Save className="h-4 w-4 mr-1" />
                            )}
                            Save
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {isEditingNotes ? (
                    <Textarea
                      value={notesValue}
                      onChange={(e) => setNotesValue(e.target.value)}
                      placeholder="Add notes about this employee..."
                      className="min-h-[120px] resize-none"
                      disabled={isSavingNotes}
                    />
                  ) : (
                    <div className="min-h-[120px] p-3 rounded-md bg-muted/30 text-sm">
                      {notesValue || (
                        <span className="text-muted-foreground italic">
                          No notes added yet. Click Edit to add notes.
                        </span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardContent className="p-0">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <div className="border-b px-4">
                      <TabsList className="bg-transparent h-auto p-0 w-full justify-start overflow-x-auto">
                        {["detail", "employment", "document", "payroll", "attendance", "calls", "settings"].map((tab) => (
                          <TabsTrigger
                            key={tab}
                            value={tab}
                            className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent px-4 py-3 capitalize"
                          >
                            {tab === "calls" ? `Calls (${calls.length})` : tab}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    </div>

                    <div className="p-4 max-h-[calc(100vh-16rem)] overflow-y-auto">
                      {/* Detail Tab */}
                      <TabsContent value="detail" className="mt-0 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Profile Card */}
                          <Card className="bg-muted/30">
                            <CardContent className="p-4 flex flex-col items-center text-center">
                              <Avatar className="h-20 w-20 mb-3">
                                <AvatarImage src={employeeData.profile_photo} alt={employeeData.full_name} />
                                <AvatarFallback className="text-2xl">{employeeData.full_name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <h3 className="text-md font-bold">{employeeData.full_name}</h3>
                              <p className="text-xs text-muted-foreground">{employeeData.official_email}</p>
                              <div className="mt-2">
                                <p className="text-sm font-semibold text-primary">{employeeData.job_title || "N/A"}</p>
                                <p className="text-xs text-muted-foreground">ID: {employeeData.id}</p>
                              </div>
                              <div className="mt-3 grid grid-cols-1 gap-2 text-xs w-full">
                                <Card className="bg-background">
                                  <CardContent className="p-2">
                                    <p className="text-muted-foreground text-xs">Department</p>
                                    <p className="font-semibold text-sm">{department?.department_name || "N/A"}</p>
                                  </CardContent>
                                </Card>
                                <Card className="bg-background">
                                  <CardContent className="p-2">
                                    <p className="text-muted-foreground text-xs">Joining Date</p>
                                    <p className="font-semibold text-sm">
                                      {employeeData.date_of_joining
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

                          {/* Contact Details */}
                          <div className="md:col-span-2">
                            <div className="flex justify-between items-center mb-3">
                              <h4 className="text-md font-semibold">Contact Details</h4>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="space-y-3">
                              <Card className="bg-muted/30">
                                <CardContent className="p-3 flex items-center">
                                  <Phone className="h-4 w-4 text-muted-foreground mr-3" />
                                  <span className="text-sm">{employeeData.official_contact_number || "N/A"}</span>
                                </CardContent>
                              </Card>
                              {employeeData.linkedin_profile && (
                                <Card className="bg-muted/30">
                                  <CardContent className="p-3 flex items-center">
                                    <Linkedin className="h-4 w-4 text-muted-foreground mr-3" />
                                    <a
                                      href={employeeData.linkedin_profile.startsWith("http") ? employeeData.linkedin_profile : `https://${employeeData.linkedin_profile}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-sm text-primary hover:underline"
                                    >
                                      View LinkedIn Profile
                                    </a>
                                  </CardContent>
                                </Card>
                              )}
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      {/* Employment Tab */}
                      <TabsContent value="employment" className="mt-0 space-y-3">
                        <Card className="bg-muted/30">
                          <CardContent className="p-3 flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Position</span>
                            <div className="flex items-center space-x-2">
                              <Badge variant="secondary">{employeeData.employment_type || "N/A"}</Badge>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="bg-muted/30">
                          <CardContent className="p-3 flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Manager</span>
                            <div className="flex items-center space-x-2">
                              {manager && (
                                <>
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={manager.profile_photo} alt={manager.full_name} />
                                    <AvatarFallback>{manager.full_name.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm font-medium">{manager.full_name}</span>
                                </>
                              )}
                              {!manager && <span className="text-sm text-muted-foreground">No manager assigned</span>}
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="bg-muted/30">
                          <CardContent className="p-3 flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Who Reports to {employeeData.full_name}</span>
                            <div className="flex items-center space-x-2">
                              <div className="flex -space-x-2">
                                {directReports.slice(0, 4).map((report) => (
                                  <Avatar key={report.id} className="h-8 w-8 border-2 border-background">
                                    <AvatarImage src={report.profile_photo} alt={report.full_name} />
                                    <AvatarFallback>{report.full_name.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                ))}
                                {directReports.length > 4 && (
                                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold border-2 border-background">
                                    +{directReports.length - 4}
                                  </div>
                                )}
                              </div>
                              {directReports.length === 0 && <span className="text-sm text-muted-foreground">No direct reports</span>}
                              <Button variant="ghost" size="icon" className="h-6 w-6">
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="bg-muted/30">
                          <CardContent className="p-3 flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Office</span>
                            <div className="flex items-center space-x-2">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-xs">SS</AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium">Startup Squad Pvt. Ltd.</span>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>

                      {/* Document Tab */}
                      <TabsContent value="document" className="mt-0 space-y-3">
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-bold">Documents</h3>
                          <Button onClick={() => setAddDocModalOpen(true)} size="sm">
                            Add Document
                          </Button>
                        </div>

                        <Tabs value={activeDocTab} onValueChange={setActiveDocTab}>
                          <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="submitted">Submitted</TabsTrigger>
                            <TabsTrigger value="not-submitted">Not Submitted</TabsTrigger>
                          </TabsList>

                          <TabsContent value="submitted" className="mt-4">
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
                                      <TableRow key={doc.id}>
                                        <TableCell className="font-medium">{doc.document_name}</TableCell>
                                        <TableCell>{doc.document_type}</TableCell>
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
                                                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                                  <a href={doc.attachment} download>
                                                    <Download className="h-4 w-4" />
                                                  </a>
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
                          </TabsContent>

                          <TabsContent value="not-submitted" className="mt-4">
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
                                      <TableRow key={doc.id}>
                                        <TableCell className="font-medium">{doc.document_name}</TableCell>
                                        <TableCell>{doc.document_type}</TableCell>
                                      </TableRow>
                                    ))
                                  )}
                                </TableBody>
                              </Table>
                            </Card>
                          </TabsContent>
                        </Tabs>
                      </TabsContent>

                      {/* Payroll Tab */}
                      <TabsContent value="payroll" className="mt-0 space-y-4">
                        <Card className="bg-muted/30">
                          <CardHeader>
                            <CardTitle className="text-md">Current Payroll Details</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                              <div>
                                <p className="text-muted-foreground">Current Salary</p>
                                <p className="font-bold">
                                  {employeeData.monthly_payroll
                                    ? `$${Number(employeeData.monthly_payroll).toLocaleString()}`
                                    : "N/A"}
                                </p>
                              </div>
                              {employeeData.bank_details && (
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

                        <h3 className="text-lg font-bold">Transactions</h3>
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
                      <TabsContent value="attendance" className="mt-0 space-y-4">
                        <div>
                          <h3 className="text-lg font-bold mb-2">Check Attendance by Date</h3>
                          <Card className="bg-muted/30">
                            <CardContent className="p-3 flex items-end space-x-3">
                              <div>
                                <Label htmlFor="attendance-date" className="text-xs">
                                  Select a Date
                                </Label>
                                <Input
                                  id="attendance-date"
                                  type="date"
                                  value={selectedDate}
                                  onChange={(e) => setSelectedDate(e.target.value)}
                                  className="text-sm"
                                />
                              </div>
                              <div className="flex-grow">
                                {selectedDateRecord ? (
                                  <p className="text-sm font-medium">
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
                          <h3 className="text-lg font-bold mb-2">Attendance Log</h3>
                          <Card className="max-h-72 overflow-y-auto">
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
                                      <TableRow key={index}>
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
                      <TabsContent value="calls" className="mt-0 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <Card className="bg-blue-100 dark:bg-blue-900/30">
                            <CardContent className="p-3 text-center">
                              <p className="text-xs font-medium text-blue-800 dark:text-blue-300">Total Calls</p>
                              <p className="text-2xl font-bold text-blue-900 dark:text-blue-200">{calls.length}</p>
                            </CardContent>
                          </Card>
                          <Card className="bg-green-100 dark:bg-green-900/30">
                            <CardContent className="p-3 text-center">
                              <p className="text-xs font-medium text-green-800 dark:text-green-300">Incoming</p>
                              <p className="text-2xl font-bold text-green-900 dark:text-green-200">{incomingCalls}</p>
                            </CardContent>
                          </Card>
                          <Card className="bg-orange-100 dark:bg-orange-900/30">
                            <CardContent className="p-3 text-center">
                              <p className="text-xs font-medium text-orange-800 dark:text-orange-300">Outgoing</p>
                              <p className="text-2xl font-bold text-orange-900 dark:text-orange-200">{outgoingCalls}</p>
                            </CardContent>
                          </Card>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="calls-date" className="text-sm">
                              Filter by Date
                            </Label>
                            <Input id="calls-date" type="date" value={callsDate} onChange={(e) => setCallsDate(e.target.value)} className="text-sm" />
                          </div>
                          <div>
                            <Label htmlFor="calls-search" className="text-sm">
                              Search by Name or Number
                            </Label>
                            <Input
                              id="calls-search"
                              type="text"
                              placeholder="Search..."
                              value={callsSearch}
                              onChange={(e) => setCallsSearch(e.target.value)}
                              className="text-sm"
                            />
                          </div>
                        </div>

                        <div>
                          <h3 className="text-lg font-bold mb-2">Call Log</h3>
                          <Card className="max-h-72 overflow-y-auto">
                            <Table>
                              <TableHeader className="sticky top-0 bg-background">
                                <TableRow>
                                  <TableHead>Time</TableHead>
                                  <TableHead>Client</TableHead>
                                  <TableHead>Type</TableHead>
                                  <TableHead>Duration</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {filteredCalls.length === 0 ? (
                                  <TableRow>
                                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                                      No calls recorded matching criteria.
                                    </TableCell>
                                  </TableRow>
                                ) : (
                                  filteredCalls
                                    .sort((a, b) => new Date(b.call_date).getTime() - new Date(a.call_date).getTime())
                                    .map((call) => (
                                      <TableRow
                                        key={call.whalesync_postgres_id}
                                        className="cursor-pointer hover:bg-muted/50"
                                        onClick={() => router.push(`/dashboard/calls/${call.whalesync_postgres_id}`)}
                                      >
                                        <TableCell className="font-medium">
                                          {new Date(call.call_date).toLocaleTimeString("en-US", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })}
                                        </TableCell>
                                        <TableCell>
                                          <div>{call.client_name || "Unknown Client"}</div>
                                          <div className="text-xs text-muted-foreground">{call.client_number || ""}</div>
                                        </TableCell>
                                        <TableCell>{getCallTypeBadge(call.call_type)}</TableCell>
                                        <TableCell>{formatDuration(call.duration)}</TableCell>
                                      </TableRow>
                                    ))
                                )}
                              </TableBody>
                            </Table>
                          </Card>
                        </div>
                      </TabsContent>

                      {/* Settings Tab */}
                      <TabsContent value="settings" className="mt-0">
                        <div className="text-center text-muted-foreground py-8">Settings tab content will go here.</div>
                      </TabsContent>
                    </div>
                  </Tabs>
                </CardContent>
              </Card>

              <div className="mt-4 text-xs text-muted-foreground text-right">
                Design & Developed by Startup Squad Pvt. Ltd.
              </div>
            </div>
          </div>
        </div>
      </SidebarProvider>

      {/* Add Document Modal */}
      <Dialog open={addDocModalOpen} onOpenChange={setAddDocModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="doc-name">
                Document Name <span className="text-destructive">*</span>
              </Label>
              <Input id="doc-name" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="doc-type">Document Type</Label>
                <Select defaultValue="Identity & KYC Proof">
                  <SelectTrigger id="doc-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Identity & KYC Proof">Identity & KYC Proof</SelectItem>
                    <SelectItem value="Employment & Company Records">Employment & Company Records</SelectItem>
                    <SelectItem value="Education & Qualification Proof">Education & Qualification Proof</SelectItem>
                    <SelectItem value="General">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="doc-status">Collection Status</Label>
                <Select defaultValue="Submitted">
                  <SelectTrigger id="doc-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Submitted">Submitted</SelectItem>
                    <SelectItem value="Not Submitted">Not Submitted</SelectItem>
                    <SelectItem value="N/A">N/A</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="doc-issued-date">Issued Date</Label>
              <Input id="doc-issued-date" type="date" />
            </div>
            <div>
              <Label htmlFor="doc-attachment">Attachment</Label>
              <Input id="doc-attachment" type="file" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDocModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              toast.success("Document added successfully");
              setAddDocModalOpen(false);
            }}>
              Save Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


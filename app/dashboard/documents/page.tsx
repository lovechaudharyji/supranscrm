"use client";

import { useState, useEffect } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Plus, 
  Upload, 
  FileText, 
  Image, 
  Download, 
  Eye, 
  Edit, 
  Trash2, 
  Users,
  Calendar,
  Search,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Grid3X3,
  List,
  GripVertical,
  Settings,
  ChevronDown
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";

interface Document {
  id: string;
  title: string;
  description?: string;
  file_name: string;
  file_type: string;
  file_size?: number;
  file_url: string;
  category: string;
  created_by?: {
    full_name: string;
    profile_photo?: string;
  };
  created_at: string;
  status: string;
  assignments?: {
    employee: {
      full_name: string;
      profile_photo?: string;
    };
    can_view: boolean;
    can_download: boolean;
  }[];
}

interface Employee {
  whalesync_postgres_id: string;
  full_name: string;
  profile_photo?: string;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [showKanban, setShowKanban] = useState(false);
  const [sortField, setSortField] = useState<string>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [visibleColumns, setVisibleColumns] = useState({
    document: true,
    category: true,
    fileInfo: true,
    assignedTo: true,
    status: true,
    created: true,
    actions: true
  });

  const [newDocument, setNewDocument] = useState({
    title: "",
    description: "",
    category: "General",
    file: null as File | null,
    selectedEmployees: [] as string[]
  });

  const [editDocument, setEditDocument] = useState({
    id: "",
    title: "",
    description: "",
    category: "General",
    status: "Active"
  });

  const categories = ["General", "HR", "Finance", "Marketing", "Sales", "Technical", "Legal", "Other"];

  useEffect(() => {
    loadDocuments();
    loadEmployees();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      console.log("Loading documents...");
      
      // Get documents with simple query first
      const { data: documentsData, error: documentsError } = await supabase
        .from("documents")
        .select("*")
        .order("created_at", { ascending: false });

      console.log("Documents query result:", { documentsData, documentsError });

      if (documentsError) {
        console.error("Documents error:", documentsError);
        throw documentsError;
      }

      if (!documentsData || documentsData.length === 0) {
        console.log("No documents found");
        setDocuments([]);
        return;
      }

      // Get assignments separately
      const documentIds = documentsData.map(doc => doc.id);
      console.log("Document IDs:", documentIds);
      
      let assignmentsData = [];
      
      if (documentIds.length > 0) {
        const { data: assignments, error: assignmentsError } = await supabase
          .from("document_assignments")
          .select("document_id, can_view, can_download, employee_id")
          .in("document_id", documentIds);

        console.log("Assignments query result:", { assignments, assignmentsError });

        if (assignmentsError) {
          console.error("Assignments error:", assignmentsError);
          // Don't throw here, just continue without assignments
        } else {
          assignmentsData = assignments || [];
        }
      }

      // Get employee info for assignments
      const employeeIds = [...new Set(assignmentsData.map(a => a.employee_id).filter(Boolean))];
      let employeesData = [];
      
      if (employeeIds.length > 0) {
        const { data: employees, error: employeesError } = await supabase
          .from("Employee Directory")
          .select("whalesync_postgres_id, full_name, profile_photo")
          .in("whalesync_postgres_id", employeeIds);

        console.log("Employees query result:", { employees, employeesError });

        if (employeesError) {
          console.error("Employees error:", employeesError);
        } else {
          employeesData = employees || [];
        }
      }

      // Get creator information
      const creatorIds = [...new Set(documentsData.map(doc => doc.created_by).filter(Boolean))];
      let creatorsData = [];
      
      if (creatorIds.length > 0) {
        const { data: creators, error: creatorsError } = await supabase
          .from("Employee Directory")
          .select("whalesync_postgres_id, full_name, profile_photo")
          .in("whalesync_postgres_id", creatorIds);

        console.log("Creators query result:", { creators, creatorsError });

        if (creatorsError) {
          console.error("Creators error:", creatorsError);
        } else {
          creatorsData = creators || [];
        }
      }

      // Combine the data
      const combinedData = documentsData.map(doc => ({
        ...doc,
        created_by: creatorsData.find(creator => creator.whalesync_postgres_id === doc.created_by),
        assignments: assignmentsData
          .filter(assignment => assignment.document_id === doc.id)
          .map(assignment => ({
            ...assignment,
            employee: employeesData.find(emp => emp.whalesync_postgres_id === assignment.employee_id)
          }))
      }));

      console.log("Combined data:", combinedData);
      setDocuments(combinedData);
    } catch (error) {
      console.error("Error loading documents:", error);
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from("Employee Directory")
        .select("whalesync_postgres_id, full_name, profile_photo")
        .eq("status", "Active");

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error("Error loading employees:", error);
      toast.error("Failed to load employees");
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `documents/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error("Error uploading file:", error);
      throw error;
    }
  };

  const handleCreateDocument = async () => {
    try {
      if (!newDocument.file) {
        toast.error("Please select a file to upload");
        return;
      }

      const fileUrl = await handleFileUpload(newDocument.file);
      
      const { data, error } = await supabase
        .from("documents")
        .insert({
          title: newDocument.title,
          description: newDocument.description,
          file_name: newDocument.file.name,
          file_type: newDocument.file.type,
          file_size: newDocument.file.size,
          file_url: fileUrl,
          category: newDocument.category
        })
        .select()
        .single();

      if (error) throw error;

      // Assign to selected employees
      if (newDocument.selectedEmployees.length > 0) {
        const assignments = newDocument.selectedEmployees.map(employeeId => ({
          document_id: data.id,
          employee_id: employeeId
        }));

        const { error: assignError } = await supabase
          .from("document_assignments")
          .insert(assignments);

        if (assignError) throw assignError;
      }

      toast.success("Document created successfully");
      setIsCreateDialogOpen(false);
      setNewDocument({
        title: "",
        description: "",
        category: "General",
        file: null,
        selectedEmployees: []
      });
      loadDocuments();
    } catch (error) {
      console.error("Error creating document:", error);
      toast.error("Failed to create document");
    }
  };

  const handleUpdateDocument = async () => {
    try {
      const { error } = await supabase
        .from("documents")
        .update({
          title: editDocument.title,
          description: editDocument.description,
          category: editDocument.category,
          status: editDocument.status
        })
        .eq("id", editDocument.id);

      if (error) throw error;

      toast.success("Document updated successfully");
      setIsEditDialogOpen(false);
      loadDocuments();
    } catch (error) {
      console.error("Error updating document:", error);
      toast.error("Failed to update document");
    }
  };

  const handleDeleteDocument = async (id: string) => {
    try {
      const { error } = await supabase
        .from("documents")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Document deleted successfully");
      loadDocuments();
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Failed to delete document");
    }
  };

  const handleAssignDocument = async (documentId: string, employeeIds: string[]) => {
    try {
      // Remove existing assignments
      await supabase
        .from("document_assignments")
        .delete()
        .eq("document_id", documentId);

      // Add new assignments
      if (employeeIds.length > 0) {
        const assignments = employeeIds.map(employeeId => ({
          document_id: documentId,
          employee_id: employeeId
        }));

        const { error } = await supabase
          .from("document_assignments")
          .insert(assignments);

        if (error) throw error;
      }

      toast.success("Document assignments updated successfully");
      setIsAssignDialogOpen(false);
      loadDocuments();
    } catch (error) {
      console.error("Error assigning document:", error);
      toast.error("Failed to assign document");
    }
  };

  const filteredDocuments = documents
    .filter(doc => {
      const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           doc.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter.length === 0 || categoryFilter.includes(doc.category);
      const matchesStatus = statusFilter.length === 0 || statusFilter.includes(doc.status);
      return matchesSearch && matchesCategory && matchesStatus;
    })
    .sort((a, b) => {
      let aValue: any = a[sortField as keyof typeof a];
      let bValue: any = b[sortField as keyof typeof b];

      // Handle different data types
      if (sortField === "created_at") {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) {
        return sortDirection === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortDirection === "asc" ? 1 : -1;
      }
      return 0;
    });

  // Pagination logic
  const totalCount = filteredDocuments.length;
  const totalPages = Math.ceil(totalCount / pageSize);
  const paginatedDocuments = filteredDocuments.slice(
    pageIndex * pageSize,
    (pageIndex + 1) * pageSize
  );

  // Reset to first page when filters change
  useEffect(() => {
    setPageIndex(0);
  }, [searchTerm, categoryFilter, statusFilter]);

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Unknown";
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + " " + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return <Image className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active": return "bg-green-500";
      case "Archived": return "bg-yellow-500";
      case "Deleted": return "bg-red-500";
      default: return "bg-gray-500";
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
      return <ArrowUpDown className="ml-1.5 h-3.5 w-3.5 opacity-50" />;
    }
    return sortDirection === "asc" ? 
      <ArrowUp className="ml-1.5 h-3.5 w-3.5" /> : 
      <ArrowDown className="ml-1.5 h-3.5 w-3.5" />;
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="h-screen overflow-hidden">
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header - Fixed */}
          <SiteHeader title="Documents" />

          {/* Main Content */}
          <div className="flex flex-col overflow-hidden flex-1">
            {/* Action Bar - Fixed */}
            <div className="flex flex-col gap-3 px-4 pt-4 pb-3 flex-shrink-0">
              {/* Search + Primary Actions */}
              <div className="flex items-center gap-3 flex-wrap">
                <Input
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 min-w-[300px] h-10"
                />

                <div className="flex gap-2 items-center">
                  {/* Add Document */}
                  <Button onClick={() => setIsCreateDialogOpen(true)} className="h-10">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Document
                  </Button>

                  {/* Category Filter */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-40 h-10 justify-between">
                        {categoryFilter.length === 0 ? "All Categories" : 
                         categoryFilter.length === 1 ? categoryFilter[0] : 
                         `${categoryFilter.length} Categories`}
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                      <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
                        Select Categories
                      </div>
                      <div className="space-y-1">
                        {categories.map(category => (
                          <div key={category} className="flex items-center space-x-2 px-2 py-1.5">
                            <Checkbox
                              id={`category-${category}`}
                              checked={categoryFilter.includes(category)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setCategoryFilter(prev => [...prev, category]);
                                } else {
                                  setCategoryFilter(prev => prev.filter(c => c !== category));
                                }
                              }}
                            />
                            <Label htmlFor={`category-${category}`} className="text-sm cursor-pointer">
                              {category}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>

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
                        {["Active", "Archived", "Deleted"].map(status => (
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

                  {/* View Toggle Buttons */}
                  <div className="flex items-center gap-1 border rounded-md p-1">
                    <Button
                      variant={!showKanban ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setShowKanban(false)}
                      className="h-8 w-8 p-0"
                      title="Table View"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={showKanban ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setShowKanban(true)}
                      className="h-8 w-8 p-0"
                      title="Kanban View"
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Customize Columns Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-10">
                        <Settings className="h-4 w-4 mr-2" />
                        Customize Columns
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
                        Show/Hide Columns
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2 px-2 py-1.5">
                          <Checkbox
                            id="dropdown-document"
                            checked={visibleColumns.document}
                            onCheckedChange={(checked) => 
                              setVisibleColumns(prev => ({ ...prev, document: !!checked }))
                            }
                          />
                          <Label htmlFor="dropdown-document" className="text-sm cursor-pointer">Document</Label>
                        </div>
                        <div className="flex items-center space-x-2 px-2 py-1.5">
                          <Checkbox
                            id="dropdown-category"
                            checked={visibleColumns.category}
                            onCheckedChange={(checked) => 
                              setVisibleColumns(prev => ({ ...prev, category: !!checked }))
                            }
                          />
                          <Label htmlFor="dropdown-category" className="text-sm cursor-pointer">Category</Label>
                        </div>
                        <div className="flex items-center space-x-2 px-2 py-1.5">
                          <Checkbox
                            id="dropdown-file-info"
                            checked={visibleColumns.fileInfo}
                            onCheckedChange={(checked) => 
                              setVisibleColumns(prev => ({ ...prev, fileInfo: !!checked }))
                            }
                          />
                          <Label htmlFor="dropdown-file-info" className="text-sm cursor-pointer">File Info</Label>
                        </div>
                        <div className="flex items-center space-x-2 px-2 py-1.5">
                          <Checkbox
                            id="dropdown-assigned-to"
                            checked={visibleColumns.assignedTo}
                            onCheckedChange={(checked) => 
                              setVisibleColumns(prev => ({ ...prev, assignedTo: !!checked }))
                            }
                          />
                          <Label htmlFor="dropdown-assigned-to" className="text-sm cursor-pointer">Assigned To</Label>
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
                            id="dropdown-created"
                            checked={visibleColumns.created}
                            onCheckedChange={(checked) => 
                              setVisibleColumns(prev => ({ ...prev, created: !!checked }))
                            }
                          />
                          <Label htmlFor="dropdown-created" className="text-sm cursor-pointer">Created</Label>
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
            </div>

            {/* Table or Kanban Container - Scrollable */}
            <div className="flex-1 overflow-y-auto px-4 min-h-0">
              {showKanban ? (
                <div className="h-full overflow-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {paginatedDocuments.map(doc => (
                      <Card key={doc.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              {getFileIcon(doc.file_type)}
                              <div className="flex-1 min-w-0">
                                <CardTitle className="text-sm font-semibold truncate">
                                  {doc.title}
                                </CardTitle>
                                <CardDescription className="text-xs text-muted-foreground">
                                  {doc.file_name}
                                </CardDescription>
                              </div>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {doc.category}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          {doc.description && (
                            <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                              {doc.description}
                            </p>
                          )}
                          <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                            <span>{formatFileSize(doc.file_size)}</span>
                            <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs">{doc.assignments?.length || 0} assigned</span>
                            </div>
                            <Badge className={`${getStatusColor(doc.status)} text-white text-xs`}>
                              {doc.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(doc.file_url, '_blank')}
                              className="flex-1 h-8 text-xs"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditDocument({
                                  id: doc.id,
                                  title: doc.title,
                                  description: doc.description || "",
                                  category: doc.category,
                                  status: doc.status
                                });
                                setIsEditDialogOpen(true);
                              }}
                              className="flex-1 h-8 text-xs"
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedDocument(doc);
                                setIsAssignDialogOpen(true);
                              }}
                              className="h-8 w-8 p-0"
                            >
                              <Users className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteDocument(doc.id)}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                // Table View
                <div className="w-full rounded-md border overflow-hidden">
                  <Table className="table-fixed w-full">
                    <colgroup>
                      <col className="w-[200px]" />
                      <col className="w-[120px]" />
                      <col className="w-[180px]" />
                      <col className="w-[120px]" />
                      <col className="w-[100px]" />
                      <col className="w-[120px]" />
                      <col className="w-[120px]" />
                    </colgroup>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        {visibleColumns.document && (
                          <TableHead className="text-xs font-semibold text-foreground px-3 py-3">
                            <Button
                              variant="ghost"
                              onClick={() => handleSort("title")}
                              className="h-7 px-2 hover:bg-transparent text-xs font-semibold"
                            >
                              Document
                              {getSortIcon("title")}
                            </Button>
                          </TableHead>
                        )}
                        {visibleColumns.category && (
                          <TableHead className="text-xs font-semibold text-foreground px-3 py-3">
                            <Button
                              variant="ghost"
                              onClick={() => handleSort("category")}
                              className="h-7 px-2 hover:bg-transparent text-xs font-semibold"
                            >
                              Category
                              {getSortIcon("category")}
                            </Button>
                          </TableHead>
                        )}
                        {visibleColumns.fileInfo && (
                          <TableHead className="text-xs font-semibold text-foreground px-3 py-3">
                            <Button
                              variant="ghost"
                              onClick={() => handleSort("file_name")}
                              className="h-7 px-2 hover:bg-transparent text-xs font-semibold"
                            >
                              File Info
                              {getSortIcon("file_name")}
                            </Button>
                          </TableHead>
                        )}
                        {visibleColumns.assignedTo && (
                          <TableHead className="text-xs font-semibold text-foreground px-3 py-3">
                            <Button
                              variant="ghost"
                              onClick={() => handleSort("assignments")}
                              className="h-7 px-2 hover:bg-transparent text-xs font-semibold"
                            >
                              Assigned To
                              {getSortIcon("assignments")}
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
                        {visibleColumns.created && (
                          <TableHead className="text-xs font-semibold text-foreground px-3 py-3">
                            <Button
                              variant="ghost"
                              onClick={() => handleSort("created_at")}
                              className="h-7 px-2 hover:bg-transparent text-xs font-semibold"
                            >
                              Created
                              {getSortIcon("created_at")}
                            </Button>
                          </TableHead>
                        )}
                        {visibleColumns.actions && (
                          <TableHead className="text-xs font-semibold text-foreground px-3 py-3">Actions</TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedDocuments.length > 0 ? (
                        paginatedDocuments.map(doc => (
                          <TableRow 
                            key={doc.id} 
                            className="border-b border-border hover:bg-muted/30 transition-colors"
                          >
                            {visibleColumns.document && (
                              <TableCell className="py-3 px-3">
                                <div className="flex items-center gap-3">
                                  {getFileIcon(doc.file_type)}
                                  <div>
                                    <div className="font-semibold text-sm">{doc.title}</div>
                                    <div className="text-xs text-muted-foreground truncate" title={doc.description || "No description"}>
                                      {doc.description || "No description"}
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                            )}
                            {visibleColumns.category && (
                              <TableCell className="py-3 px-3">
                                <Badge variant="outline" className="text-xs">
                                  {doc.category}
                                </Badge>
                              </TableCell>
                            )}
                            {visibleColumns.fileInfo && (
                              <TableCell className="py-3 px-3">
                                <div className="text-sm">
                                  <div className="font-medium truncate" title={doc.file_name}>{doc.file_name}</div>
                                  <div className="text-xs text-muted-foreground">{formatFileSize(doc.file_size)}</div>
                                </div>
                              </TableCell>
                            )}
                            {visibleColumns.assignedTo && (
                              <TableCell className="py-3 px-3">
                                <div className="flex items-center gap-1">
                                  <Users className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-sm">{doc.assignments?.length || 0} employees</span>
                                </div>
                              </TableCell>
                            )}
                            {visibleColumns.status && (
                              <TableCell className="py-3 px-3">
                                <Badge className={`${getStatusColor(doc.status)} text-white text-xs`}>
                                  {doc.status}
                                </Badge>
                              </TableCell>
                            )}
                            {visibleColumns.created && (
                              <TableCell className="py-3 px-3">
                                <div className="text-sm">{new Date(doc.created_at).toLocaleDateString()}</div>
                              </TableCell>
                            )}
                            {visibleColumns.actions && (
                              <TableCell className="py-3 px-3">
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => window.open(doc.file_url, '_blank')}
                                    className="h-8 px-2"
                                    title="View Document"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setEditDocument({
                                        id: doc.id,
                                        title: doc.title,
                                        description: doc.description || "",
                                        category: doc.category,
                                        status: doc.status
                                      });
                                      setIsEditDialogOpen(true);
                                    }}
                                    className="h-8 px-2"
                                    title="Edit Document"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedDocument(doc);
                                      setIsAssignDialogOpen(true);
                                    }}
                                    className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                    title="Delete Document"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            )}
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-16">
                            <div className="text-center">
                              <h3 className="text-lg font-semibold text-foreground">No Documents Found</h3>
                              <p className="text-muted-foreground mt-1">Try adjusting your filters or resetting the view.</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            {/* Pagination - Fixed at Bottom */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-3 border-t border-border bg-muted/20 px-4 flex-shrink-0">
              <div className="text-sm text-muted-foreground">
                {totalCount > 0 ? (
                  <>
                    Showing <span className="font-medium text-foreground">{pageIndex * pageSize + 1}</span> to{" "}
                    <span className="font-medium text-foreground">{Math.min((pageIndex + 1) * pageSize, totalCount)}</span> of{" "}
                    <span className="font-medium text-foreground">{totalCount}</span> documents
                  </>
                ) : (
                  "No documents found"
                )}
              </div>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">Rows per page</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setPageIndex(0);
                    }}
                    className="h-9 w-20 rounded-md border border-input bg-background text-sm font-medium px-3 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    {[10, 20, 50, 100].map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    Page <span className="font-medium text-foreground">{pageIndex + 1}</span> of <span className="font-medium text-foreground">{totalPages || 1}</span>
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pageIndex === 0}
                      onClick={() => setPageIndex(0)}
                      className="hidden sm:inline-flex h-9"
                    >
                      First
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pageIndex === 0}
                      onClick={() => setPageIndex((prev) => Math.max(prev - 1, 0))}
                      className="h-9"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={(pageIndex + 1) * pageSize >= totalCount}
                      onClick={() => setPageIndex((prev) => prev + 1)}
                      className="h-9"
                    >
                      Next
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={(pageIndex + 1) * pageSize >= totalCount}
                      onClick={() => setPageIndex(totalPages - 1)}
                      className="hidden sm:inline-flex h-9"
                    >
                      Last
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Create Document Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Document</DialogTitle>
              <DialogDescription>
                Upload a document and assign it to specific employees.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={newDocument.title}
                  onChange={(e) => setNewDocument({ ...newDocument, title: e.target.value })}
                  placeholder="Enter document title"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newDocument.description}
                  onChange={(e) => setNewDocument({ ...newDocument, description: e.target.value })}
                  placeholder="Enter document description"
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={newDocument.category} onValueChange={(value) => setNewDocument({ ...newDocument, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="file">File *</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx"
                  onChange={(e) => setNewDocument({ ...newDocument, file: e.target.files?.[0] || null })}
                />
              </div>
              <div>
                <Label>Assign to Employees</Label>
                <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-3">
                  {employees.map(employee => (
                    <div key={employee.whalesync_postgres_id} className="flex items-center space-x-2">
                      <Checkbox
                        id={employee.whalesync_postgres_id}
                        checked={newDocument.selectedEmployees.includes(employee.whalesync_postgres_id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setNewDocument({
                              ...newDocument,
                              selectedEmployees: [...newDocument.selectedEmployees, employee.whalesync_postgres_id]
                            });
                          } else {
                            setNewDocument({
                              ...newDocument,
                              selectedEmployees: newDocument.selectedEmployees.filter(id => id !== employee.whalesync_postgres_id)
                            });
                          }
                        }}
                      />
                      <Label htmlFor={employee.whalesync_postgres_id} className="text-sm">
                        {employee.full_name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateDocument}>
                Create Document
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Document Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Document</DialogTitle>
              <DialogDescription>
                Update document information.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Title *</Label>
                <Input
                  id="edit-title"
                  value={editDocument.title}
                  onChange={(e) => setEditDocument({ ...editDocument, title: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editDocument.description}
                  onChange={(e) => setEditDocument({ ...editDocument, description: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-category">Category</Label>
                <Select value={editDocument.category} onValueChange={(value) => setEditDocument({ ...editDocument, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select value={editDocument.status} onValueChange={(value) => setEditDocument({ ...editDocument, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Archived">Archived</SelectItem>
                    <SelectItem value="Deleted">Deleted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateDocument}>
                Update Document
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Assign Document Dialog */}
        <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Document</DialogTitle>
              <DialogDescription>
                Select employees who can access this document.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-3">
                {employees.map(employee => (
                  <div key={employee.whalesync_postgres_id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`assign-${employee.whalesync_postgres_id}`}
                      checked={selectedDocument?.assignments?.some(a => a.employee?.full_name === employee.full_name) || false}
                      onCheckedChange={(checked) => {
                        // This will be handled in the save function
                      }}
                    />
                    <Label htmlFor={`assign-${employee.whalesync_postgres_id}`} className="text-sm">
                      {employee.full_name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                if (selectedDocument) {
                  const selectedEmployeeIds = employees
                    .filter(emp => selectedDocument.assignments?.some(a => a.employee?.full_name === emp.full_name))
                    .map(emp => emp.whalesync_postgres_id);
                  handleAssignDocument(selectedDocument.id, selectedEmployeeIds);
                }
              }}>
                Save Assignments
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </SidebarInset>
    </SidebarProvider>
  );
}

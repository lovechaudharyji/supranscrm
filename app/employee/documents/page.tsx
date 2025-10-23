"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  FileText, 
  Image, 
  Download, 
  Eye, 
  Search,
  Filter,
  Calendar,
  User,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Grid3X3,
  List,
  Settings,
  Check,
  X
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  assignments?: {
    can_view: boolean;
    can_download: boolean;
  };
}

export default function EmployeeDocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [showKanban, setShowKanban] = useState(true);
  const [showColumnPopover, setShowColumnPopover] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    document: true,
    category: true,
    fileInfo: true,
    created: true,
    actions: true
  });
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(null);

  const categories = ["General", "HR", "Finance", "Marketing", "Sales", "Technical", "Legal", "Other"];

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("User not authenticated");
        return;
      }

      // First, get the employee's whalesync_postgres_id from Employee Directory
      const { data: employeeData, error: employeeError } = await supabase
        .from("Employee Directory")
        .select("whalesync_postgres_id")
        .eq("official_email", user.email)
        .single();

      if (employeeError || !employeeData) {
        console.error("Employee lookup error:", employeeError);
        toast.error("Employee profile not found");
        setDocuments([]);
        return;
      }

      // Get document assignments for the employee using their whalesync_postgres_id
      const { data: assignments, error: assignmentsError } = await supabase
        .from("document_assignments")
        .select("document_id, can_view, can_download")
        .eq("employee_id", employeeData.whalesync_postgres_id);

      if (assignmentsError) {
        console.error("Assignments error:", assignmentsError);
        setDocuments([]);
        return;
      }

      if (!assignments || assignments.length === 0) {
        setDocuments([]);
        return;
      }

      // Then get the documents
      const documentIds = assignments.map(a => a.document_id);
      const { data: documentsData, error: documentsError } = await supabase
        .from("documents")
        .select("*")
        .in("id", documentIds)
        .eq("status", "Active")
        .order("created_at", { ascending: false });

      if (documentsError) {
        console.error("Documents error:", documentsError);
        throw documentsError;
      }

      // Combine the data
      const combinedData = documentsData?.map(doc => ({
        ...doc,
        assignments: assignments.find(a => a.document_id === doc.id)
      })) || [];

      setDocuments(combinedData);
    } catch (error) {
      console.error("Error loading documents:", error);
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || doc.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Sort documents
  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    if (!sortColumn || !sortDirection) return 0;

    let aValue: any;
    let bValue: any;

    switch (sortColumn) {
      case "title":
        aValue = a.title?.toLowerCase() || "";
        bValue = b.title?.toLowerCase() || "";
        break;
      case "category":
        aValue = a.category?.toLowerCase() || "";
        bValue = b.category?.toLowerCase() || "";
        break;
      case "file_name":
        aValue = a.file_name?.toLowerCase() || "";
        bValue = b.file_name?.toLowerCase() || "";
        break;
      case "created_at":
        aValue = a.created_at ? new Date(a.created_at).getTime() : 0;
        bValue = b.created_at ? new Date(b.created_at).getTime() : 0;
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  // Pagination logic
  const totalCount = sortedDocuments.length;
  const totalPages = Math.ceil(totalCount / pageSize);
  const paginatedDocuments = sortedDocuments.slice(
    pageIndex * pageSize,
    (pageIndex + 1) * pageSize
  );

  // Reset to first page when filters change
  useEffect(() => {
    setPageIndex(0);
  }, [searchTerm, categoryFilter]);

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

  const handleDownload = async (doc: Document) => {
    try {
      if (!doc.assignments?.can_download) {
        toast.error("You don't have permission to download this document");
        return;
      }

      const response = await fetch(doc.file_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.file_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading document:", error);
      toast.error("Failed to download document");
    }
  };

  const handleView = (doc: Document) => {
    if (!doc.assignments?.can_view) {
      toast.error("You don't have permission to view this document");
      return;
    }
    window.open(doc.file_url, '_blank');
  };

  const toggleColumn = (column: keyof typeof visibleColumns) => {
    setVisibleColumns(prev => ({
      ...prev,
      [column]: !prev[column]
    }));
  };

  const resetColumns = () => {
    setVisibleColumns({
      document: true,
      category: true,
      fileInfo: true,
      created: true,
      actions: true
    });
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortDirection(null);
        setSortColumn(null);
      }
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="ml-1 h-3 w-3 inline opacity-50" />;
    }
    if (sortDirection === "asc") {
      return <ArrowUp className="ml-1 h-3 w-3 inline" />;
    }
    if (sortDirection === "desc") {
      return <ArrowDown className="ml-1 h-3 w-3 inline" />;
    }
    return <ArrowUpDown className="ml-1 h-3 w-3 inline opacity-50" />;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Main Content */}
      <div className="flex flex-col overflow-hidden flex-1">
        {/* Action Bar - Fixed */}
        <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-3 flex-shrink-0">
          {/* Search + Filters */}
          <div className="flex items-center gap-3 flex-1">
            <Input
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 min-w-[300px] h-10"
            />

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-10 w-40">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-2">
            <Button
              variant={!showKanban ? "default" : "outline"}
              size="sm"
              onClick={() => setShowKanban(false)}
              className="h-8"
            >
              <List className="h-4 w-4 mr-2" />
              Table View
            </Button>
            <Button
              variant={showKanban ? "default" : "outline"}
              size="sm"
              onClick={() => setShowKanban(true)}
              className="h-8"
            >
              <Grid3X3 className="h-4 w-4 mr-2" />
              Kanban View
            </Button>

            {/* Custom Columns Popover */}
            <Popover open={showColumnPopover} onOpenChange={setShowColumnPopover}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Columns
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-3">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="document"
                      checked={visibleColumns.document}
                      onCheckedChange={() => toggleColumn('document')}
                    />
                    <label htmlFor="document" className="text-sm font-medium">
                      Document
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="category"
                      checked={visibleColumns.category}
                      onCheckedChange={() => toggleColumn('category')}
                    />
                    <label htmlFor="category" className="text-sm font-medium">
                      Category
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="fileInfo"
                      checked={visibleColumns.fileInfo}
                      onCheckedChange={() => toggleColumn('fileInfo')}
                    />
                    <label htmlFor="fileInfo" className="text-sm font-medium">
                      File Info
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="created"
                      checked={visibleColumns.created}
                      onCheckedChange={() => toggleColumn('created')}
                    />
                    <label htmlFor="created" className="text-sm font-medium">
                      Created
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="actions"
                      checked={visibleColumns.actions}
                      onCheckedChange={() => toggleColumn('actions')}
                    />
                    <label htmlFor="actions" className="text-sm font-medium">
                      Actions
                    </label>
                  </div>
                  <div className="pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetColumns}
                      className="w-full h-8"
                    >
                      Reset All
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Documents Grid/Table - Scrollable */}
        <div className="flex-1 overflow-hidden px-4">
          <div className="h-full overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-muted-foreground">Loading documents...</div>
              </div>
            ) : paginatedDocuments.length > 0 ? (
              showKanban ? (
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
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleView(doc)}
                            className="flex-1 h-8 text-xs"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          {doc.assignments?.can_download && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownload(doc)}
                              className="flex-1 h-8 text-xs"
                            >
                              <Download className="h-3 w-3 mr-1" />
                              Download
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="w-full rounded-md border overflow-hidden flex-1 min-h-0 flex flex-col">
                  <div className="flex-1 overflow-auto">
                    <Table className="w-full">
                      <TableHeader className="sticky top-0 bg-background z-10">
                        <TableRow className="hover:bg-transparent">
                          {visibleColumns.document && (
                            <TableHead 
                              className="h-10 px-3 text-sm font-semibold bg-background cursor-pointer select-none hover:bg-muted/50"
                              onClick={() => handleSort("title")}
                            >
                              Document{getSortIcon("title")}
                            </TableHead>
                          )}
                          {visibleColumns.category && (
                            <TableHead 
                              className="h-10 px-3 text-sm font-semibold bg-background cursor-pointer select-none hover:bg-muted/50"
                              onClick={() => handleSort("category")}
                            >
                              Category{getSortIcon("category")}
                            </TableHead>
                          )}
                          {visibleColumns.fileInfo && (
                            <TableHead 
                              className="h-10 px-3 text-sm font-semibold bg-background cursor-pointer select-none hover:bg-muted/50"
                              onClick={() => handleSort("file_name")}
                            >
                              File Info{getSortIcon("file_name")}
                            </TableHead>
                          )}
                          {visibleColumns.created && (
                            <TableHead 
                              className="h-10 px-3 text-sm font-semibold bg-background cursor-pointer select-none hover:bg-muted/50"
                              onClick={() => handleSort("created_at")}
                            >
                              Created{getSortIcon("created_at")}
                            </TableHead>
                          )}
                          {visibleColumns.actions && (
                            <TableHead className="h-10 px-3 text-sm font-semibold bg-background">
                              Actions
                            </TableHead>
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedDocuments.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={5}
                              className="text-center py-8 text-xs text-muted-foreground"
                            >
                              No documents found.
                            </TableCell>
                          </TableRow>
                        ) : (
                          paginatedDocuments.map(doc => (
                            <TableRow key={doc.id} className="cursor-pointer hover:bg-muted/50">
                              {visibleColumns.document && (
                                <TableCell className="px-3 py-3">
                                  <div className="flex items-center gap-3">
                                    {getFileIcon(doc.file_type)}
                                    <div>
                                      <p className="font-bold text-sm">{doc.title}</p>
                                      <p className="text-xs text-muted-foreground">{doc.description || "No description"}</p>
                                    </div>
                                  </div>
                                </TableCell>
                              )}
                              {visibleColumns.category && (
                                <TableCell className="px-3 py-3">
                                  <Badge variant="outline" className="text-xs">
                                    {doc.category}
                                  </Badge>
                                </TableCell>
                              )}
                              {visibleColumns.fileInfo && (
                                <TableCell className="px-3 py-3">
                                  <div className="text-sm">
                                    <p className="font-medium">{doc.file_name}</p>
                                    <p className="text-xs text-muted-foreground">{formatFileSize(doc.file_size)}</p>
                                  </div>
                                </TableCell>
                              )}
                              {visibleColumns.created && (
                                <TableCell className="px-3 py-3 text-sm">
                                  {new Date(doc.created_at).toLocaleDateString()}
                                </TableCell>
                              )}
                              {visibleColumns.actions && (
                                <TableCell className="px-3 py-3">
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleView(doc)}
                                      className="h-8 text-xs"
                                    >
                                      <Eye className="h-3 w-3 mr-1" />
                                      View
                                    </Button>
                                    {doc.assignments?.can_download && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDownload(doc)}
                                        className="h-8 text-xs"
                                      >
                                        <Download className="h-3 w-3 mr-1" />
                                        Download
                                      </Button>
                                    )}
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
              )
            ) : (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No documents found</p>
                  <p className="text-sm text-muted-foreground">
                    Documents assigned to you will appear here
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Pagination - Fixed at Bottom */}
        {paginatedDocuments.length > 0 && (
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
        )}
      </div>
    </div>
  );
}

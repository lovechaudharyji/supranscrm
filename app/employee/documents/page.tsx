"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  List
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

  return (
    <div className="flex flex-col h-full">
      {/* Main Content */}
      <div className="flex flex-col overflow-hidden flex-1">
        {/* Action Bar - Fixed */}
        <div className="flex flex-col gap-3 px-4 pb-3 flex-shrink-0">
          {/* Search + Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <Input
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 min-w-[300px] h-10"
            />

            <div className="flex gap-2 items-center">
              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-10 w-40 rounded-md border border-input bg-background text-sm font-medium px-3 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2 px-4 pb-3 flex-shrink-0">
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
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="sticky top-0 bg-background border-b">
                      <tr>
                        <th className="p-4 text-left font-semibold text-sm">Document</th>
                        <th className="p-4 text-left font-semibold text-sm">Category</th>
                        <th className="p-4 text-left font-semibold text-sm">File Info</th>
                        <th className="p-4 text-left font-semibold text-sm">Created</th>
                        <th className="p-4 text-left font-semibold text-sm">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedDocuments.map(doc => (
                        <tr key={doc.id} className="border-b hover:bg-muted/50">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              {getFileIcon(doc.file_type)}
                              <div>
                                <p className="font-bold text-sm">{doc.title}</p>
                                <p className="text-xs text-muted-foreground">{doc.description || "No description"}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge variant="outline" className="text-xs">
                              {doc.category}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="text-sm">
                              <p className="font-medium">{doc.file_name}</p>
                              <p className="text-xs text-muted-foreground">{formatFileSize(doc.file_size)}</p>
                            </div>
                          </td>
                          <td className="p-4 text-sm">
                            {new Date(doc.created_at).toLocaleDateString()}
                          </td>
                          <td className="p-4">
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
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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

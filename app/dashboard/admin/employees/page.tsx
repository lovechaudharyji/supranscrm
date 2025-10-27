"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { 
  Search, 
  Edit2, 
  Trash2, 
  Plus, 
  List, 
  Grid, 
  LayoutGrid,
  Eye,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Users,
  UserPlus,
  RefreshCw,
  X
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { toast } from "sonner";

type Employee = {
  whalesync_postgres_id: string;
  full_name: string;
  aadhar_number?: string;
  airtable_created_time?: string;
  airtable_record_id?: string;
  bank_details?: any;
  calls?: any;
  contacts?: any;
  current_address?: string;
  date_of_joining?: string;
  dob?: string;
  emails_access?: any;
  emergency_contact_details?: any;
  employee_id?: string;
  employment_type?: string;
  epf_deduction?: any;
  esic_deduction?: any;
  leads?: any;
  linkedin_profile?: string;
  monthly_payroll?: any;
  official_contact_number?: string;
  official_email: string;
  official_number?: string;
  pan_number?: string;
  permanent_address?: string;
  personal_contact_number?: string;
  personal_email?: string;
  profile_photo?: string;
  status: string;
  total_working_days_this_month?: number;
  uan_number?: string;
  work_mode?: string;
  users?: any;
  Notes?: string;
  Announcement?: any;
};

export default function AdminEmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [view, setView] = useState<'list' | 'grid' | 'kanban'>('list');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  // Sorting state
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Paginated employees
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // Total pages calculation
  const totalPages = Math.ceil(filteredEmployees.length / rowsPerPage);

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('Fetching employee data for admin...');
        
        const { data: employeesData, error: employeesError } = await supabase
          .from('Employee Directory')
          .select('*');
        
        if (employeesError) {
          console.error('Employee Directory fetch error:', employeesError);
          throw new Error(`Failed to fetch employees: ${employeesError.message}`);
        }

        console.log('Raw employees data received:', employeesData?.length || 0, 'records');

        // Process employee data
        const safeEmployeesData = (employeesData || []).map((emp, index) => ({
          ...emp,
          whalesync_postgres_id: emp.whalesync_postgres_id || `emp_${index}`,
          full_name: emp.full_name || `Unnamed Employee ${index}`,
          official_email: emp.official_email || '',
          employment_type: emp.employment_type || 'Full-time',
          status: emp.status || 'Active',
          profile_photo: emp.profile_photo || null,
          date_of_joining: emp.date_of_joining || null,
          work_mode: emp.work_mode || 'Office'
        }));

        console.log('Processed employees data:', safeEmployeesData.length, 'records');
        setEmployees(safeEmployeesData);
        setFilteredEmployees(safeEmployeesData);
        toast.success(`Loaded ${safeEmployeesData.length} employees`);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load employee data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter and sort employees
  useEffect(() => {
    let result = employees;
    
    if (searchTerm) {
      const searchTermLower = searchTerm.toLowerCase();
      result = result.filter(emp => 
        (emp.full_name && emp.full_name.toLowerCase().includes(searchTermLower)) ||
        (emp.official_email && emp.official_email.toLowerCase().includes(searchTermLower)) ||
        (emp.employment_type && emp.employment_type.toLowerCase().includes(searchTermLower)) ||
        (emp.employee_id && emp.employee_id.toLowerCase().includes(searchTermLower))
      );
    }

    // Apply sorting
    if (sortColumn) {
      result = [...result].sort((a, b) => {
        let aValue: string = '';
        let bValue: string = '';

        switch (sortColumn) {
          case 'name':
            aValue = a.full_name || '';
            bValue = b.full_name || '';
            break;
          case 'employment_type':
            aValue = a.employment_type || '';
            bValue = b.employment_type || '';
            break;
          case 'status':
            aValue = a.status || '';
            bValue = b.status || '';
            break;
          case 'work_mode':
            aValue = a.work_mode || '';
            bValue = b.work_mode || '';
            break;
          case 'date_of_joining':
            aValue = a.date_of_joining || '';
            bValue = b.date_of_joining || '';
            break;
          default:
            return 0;
        }

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          const comparison = aValue.localeCompare(bValue);
          return sortDirection === 'asc' ? comparison : -comparison;
        }

        return 0;
      });
    }
    
    setFilteredEmployees(result);
  }, [employees, searchTerm, sortColumn, sortDirection]);

  // Handle column sorting
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortColumn(null);
        setSortDirection('asc');
      }
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Render sort icon
  const renderSortIcon = (column: string) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="ml-1.5 h-3.5 w-3.5 opacity-50" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="ml-1.5 h-3.5 w-3.5" />
    ) : (
      <ArrowDown className="ml-1.5 h-3.5 w-3.5" />
    );
  };

  // Determine badge variant based on status
  const getStatusBadgeVariant = (status: string) => {
    switch(status) {
      case 'Active': return 'default';
      case 'Resigned': return 'destructive';
      case 'Onboarding': return 'secondary';
      default: return 'outline';
    }
  };

  // Handle employee deletion
  const handleDelete = async (whalesync_postgres_id: string) => {
    if (!confirm('Are you sure you want to delete this employee? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('Employee Directory')
        .delete()
        .eq('whalesync_postgres_id', whalesync_postgres_id);
      
      if (error) throw error;
      
      setEmployees(prev => prev.filter(emp => emp.whalesync_postgres_id !== whalesync_postgres_id));
      setFilteredEmployees(prev => prev.filter(emp => emp.whalesync_postgres_id !== whalesync_postgres_id));
      toast.success('Employee deleted successfully');
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast.error('Failed to delete employee');
    }
  };

  // Handle view employee details
  const handleViewDetails = (employee: Employee) => {
    setSelectedEmployee(employee);
    setDetailsModalOpen(true);
  };

  // Pagination handlers
  const handleFirstPage = () => setCurrentPage(1);
  const handlePreviousPage = () => setCurrentPage(Math.max(1, currentPage - 1));
  const handleNextPage = () => setCurrentPage(Math.min(totalPages, currentPage + 1));
  const handleLastPage = () => setCurrentPage(totalPages);

  // View toggle
  const renderViewToggle = () => (
    <div className="flex items-center space-x-2">
      <Button 
        variant="outline" 
        size="icon" 
        onClick={() => setView('list')}
        className={view === 'list' ? 'bg-primary text-primary-foreground' : ''}
      >
        <List className="h-4 w-4" />
      </Button>
      <Button 
        variant="outline" 
        size="icon" 
        onClick={() => setView('grid')}
        className={view === 'grid' ? 'bg-primary text-primary-foreground' : ''}
      >
        <Grid className="h-4 w-4" />
      </Button>
      <Button 
        variant="outline" 
        size="icon" 
        onClick={() => setView('kanban')}
        className={view === 'kanban' ? 'bg-primary text-primary-foreground' : ''}
      >
        <LayoutGrid className="h-4 w-4" />
      </Button>
    </div>
  );

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <SiteHeader title="Admin - Employee Management" />
          <div className="flex flex-1 items-center justify-center py-16">
            <div className="text-center">
              <div className="h-8 w-8 mx-auto animate-spin border-2 border-muted border-t-primary rounded-full"></div>
              <p className="mt-4 text-muted-foreground">Loading employees...</p>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex flex-col h-screen">
          {/* Header */}
          <SiteHeader title="Admin - Employee Management" />

          {/* Main Content */}
          <div className="flex flex-col overflow-hidden flex-1">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{employees.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {employees.filter(emp => emp.status === 'Active').length} active
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active</CardTitle>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {employees.filter(emp => emp.status === 'Active').length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Onboarding</CardTitle>
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">
                    {employees.filter(emp => emp.status === 'Onboarding').length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Resigned</CardTitle>
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {employees.filter(emp => emp.status === 'Resigned').length}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col gap-3 px-4 pb-3 flex-shrink-0">
              <div className="flex items-center gap-3 flex-wrap">
                <Input
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 min-w-[300px] h-10"
                />
                
                {renderViewToggle()}
                
                <Button onClick={() => setSelectedEmployee({} as Employee)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Employee
                </Button>
              </div>
            </div>

            {/* Employees List */}
            <div className="flex-1 overflow-hidden px-4">
              <div className="h-full overflow-auto">
                {filteredEmployees.length > 0 ? (
                  view === 'list' ? (
                    // List View
                    <div className="w-full rounded-md border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50 hover:bg-muted/50">
                            <TableHead>
                              <Button
                                variant="ghost"
                                onClick={() => handleSort('name')}
                                className="h-7 px-2 hover:bg-transparent text-xs font-semibold"
                              >
                                Employee
                                {renderSortIcon('name')}
                              </Button>
                            </TableHead>
                            <TableHead>
                              <Button
                                variant="ghost"
                                onClick={() => handleSort('employment_type')}
                                className="h-7 px-2 hover:bg-transparent text-xs font-semibold"
                              >
                                Employment Type
                                {renderSortIcon('employment_type')}
                              </Button>
                            </TableHead>
                            <TableHead>
                              <Button
                                variant="ghost"
                                onClick={() => handleSort('work_mode')}
                                className="h-7 px-2 hover:bg-transparent text-xs font-semibold"
                              >
                                Work Mode
                                {renderSortIcon('work_mode')}
                              </Button>
                            </TableHead>
                            <TableHead>
                              <Button
                                variant="ghost"
                                onClick={() => handleSort('date_of_joining')}
                                className="h-7 px-2 hover:bg-transparent text-xs font-semibold"
                              >
                                Date of Joining
                                {renderSortIcon('date_of_joining')}
                              </Button>
                            </TableHead>
                            <TableHead>
                              <Button
                                variant="ghost"
                                onClick={() => handleSort('status')}
                                className="h-7 px-2 hover:bg-transparent text-xs font-semibold"
                              >
                                Status
                                {renderSortIcon('status')}
                              </Button>
                            </TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedEmployees.map((emp, index) => (
                            <TableRow 
                              key={`employee-${emp.whalesync_postgres_id}-${index}`}
                              className="hover:bg-muted/30 transition-colors"
                            >
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage 
                                      src={emp.profile_photo || '/avatars/default-avatar.png'} 
                                      alt={emp.full_name || 'Employee'} 
                                    />
                                    <AvatarFallback>{(emp.full_name && emp.full_name.charAt(0)) || 'E'}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-medium">{emp.full_name}</div>
                                    <div className="text-sm text-muted-foreground">{emp.official_email}</div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm">{emp.employment_type || 'Not specified'}</span>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {emp.work_mode || 'Not specified'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <span className="text-xs">{emp.date_of_joining ? new Date(emp.date_of_joining).toLocaleDateString() : 'Not specified'}</span>
                              </TableCell>
                              <TableCell>
                                <Badge variant={getStatusBadgeVariant(emp.status)}>
                                  {emp.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleViewDetails(emp)}
                                    className="h-7 w-7 hover:bg-muted"
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setSelectedEmployee(emp)}
                                    className="h-7 w-7 hover:bg-muted"
                                  >
                                    <Edit2 className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDelete(emp.whalesync_postgres_id)}
                                    className="h-7 w-7 hover:bg-muted hover:text-destructive"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    // Grid View
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
                      {paginatedEmployees.map((emp, index) => (
                        <div 
                          key={`employee-grid-${emp.whalesync_postgres_id}-${index}`}
                          className="bg-card border border-primary/20 rounded-lg p-4 hover:shadow-lg transition-shadow duration-300"
                        >
                          <div className="flex items-start gap-3 mb-4">
                            <Avatar className="h-12 w-12 flex-shrink-0">
                              <AvatarImage 
                                src={emp.profile_photo || '/avatars/default-avatar.png'} 
                                alt={emp.full_name || 'Employee'}
                                className="object-cover"
                              />
                              <AvatarFallback className="text-sm font-semibold bg-muted">
                                {(emp.full_name && emp.full_name.charAt(0)) || 'E'}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1">
                              <h3 className="text-base font-bold text-foreground mb-1">
                                {emp.full_name}
                              </h3>
                              <Badge variant="secondary" className="text-xs">
                                {emp.employment_type || 'Not specified'}
                              </Badge>
                            </div>
                          </div>

                          <div className="space-y-2 mb-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-gray-500 rounded-full"></div>
                                <span className="text-xs text-muted-foreground">Type</span>
                              </div>
                              <span className="text-xs text-foreground">
                                {emp.employment_type || 'Not specified'}
                              </span>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                <span className="text-xs text-muted-foreground">Work Mode</span>
                              </div>
                              <span className="text-xs text-foreground">
                                {emp.work_mode || 'Not specified'}
                              </span>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                                <span className="text-xs text-muted-foreground">Status</span>
                              </div>
                              <Badge variant={getStatusBadgeVariant(emp.status)} className="text-xs">
                                {emp.status}
                              </Badge>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex gap-2">
                              <div className="bg-muted/50 rounded-md p-2 min-w-[60px]">
                                <div className="text-sm font-bold text-foreground">98%</div>
                                <div className="text-[10px] text-muted-foreground">Performance</div>
                              </div>
                              
                              <div className="bg-muted/50 rounded-md p-2 min-w-[60px]">
                                <div className="text-sm font-bold text-foreground">4.8</div>
                                <div className="text-[10px] text-muted-foreground">Rating</div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleViewDetails(emp)}
                                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => setSelectedEmployee(emp)}
                                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleDelete(emp.whalesync_postgres_id)}
                                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No employees found</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Pagination */}
            {filteredEmployees.length > 0 && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-3 border-t border-border bg-muted/20 px-4 flex-shrink-0">
                <div className="text-sm text-muted-foreground">
                  Showing {Math.min(1 + (currentPage - 1) * rowsPerPage, filteredEmployees.length)} to{' '}
                  {Math.min(currentPage * rowsPerPage, filteredEmployees.length)} of {filteredEmployees.length} employees
                </div>
                <div className="flex items-center space-x-2">
                  <Select 
                    value={rowsPerPage.toString()} 
                    onValueChange={(value) => setRowsPerPage(Number(value))}
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue placeholder="Rows per page" />
                    </SelectTrigger>
                    <SelectContent>
                      {[10, 20, 50, 100].map((pageSize) => (
                        <SelectItem key={pageSize} value={pageSize.toString()}>
                          {pageSize} rows
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleFirstPage} 
                      disabled={currentPage === 1}
                    >
                      First
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handlePreviousPage} 
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleNextPage} 
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleLastPage} 
                      disabled={currentPage === totalPages}
                    >
                      Last
                    </Button>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Employee Details Modal */}
        <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Employee Details
              </DialogTitle>
              <DialogDescription>
                Complete information about {selectedEmployee?.full_name}
              </DialogDescription>
            </DialogHeader>
            
            {selectedEmployee && (
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Personal Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-16 w-16">
                          <AvatarImage 
                            src={selectedEmployee.profile_photo || '/avatars/default-avatar.png'} 
                            alt={selectedEmployee.full_name || 'Employee'} 
                          />
                          <AvatarFallback className="text-lg">
                            {(selectedEmployee.full_name && selectedEmployee.full_name.charAt(0)) || 'E'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="text-xl font-bold">{selectedEmployee.full_name}</h3>
                          <p className="text-muted-foreground">{selectedEmployee.official_email}</p>
                          <Badge variant={getStatusBadgeVariant(selectedEmployee.status)} className="mt-1">
                            {selectedEmployee.status}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Employee ID:</span>
                          <p className="text-muted-foreground">{selectedEmployee.employee_id || 'Not assigned'}</p>
                        </div>
                        <div>
                          <span className="font-medium">Employment Type:</span>
                          <p className="text-muted-foreground">{selectedEmployee.employment_type || 'Not specified'}</p>
                        </div>
                        <div>
                          <span className="font-medium">Work Mode:</span>
                          <p className="text-muted-foreground">{selectedEmployee.work_mode || 'Not specified'}</p>
                        </div>
                        <div>
                          <span className="font-medium">Date of Joining:</span>
                          <p className="text-muted-foreground">
                            {selectedEmployee.date_of_joining ? new Date(selectedEmployee.date_of_joining).toLocaleDateString() : 'Not specified'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Contact Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <span className="font-medium">Official Email:</span>
                        <p className="text-muted-foreground">{selectedEmployee.official_email}</p>
                      </div>
                      <div>
                        <span className="font-medium">Personal Email:</span>
                        <p className="text-muted-foreground">{selectedEmployee.personal_email || 'Not provided'}</p>
                      </div>
                      <div>
                        <span className="font-medium">Official Contact:</span>
                        <p className="text-muted-foreground">{selectedEmployee.official_contact_number || 'Not provided'}</p>
                      </div>
                      <div>
                        <span className="font-medium">Personal Contact:</span>
                        <p className="text-muted-foreground">{selectedEmployee.personal_contact_number || 'Not provided'}</p>
                      </div>
                      <div>
                        <span className="font-medium">LinkedIn:</span>
                        <p className="text-muted-foreground">
                          {selectedEmployee.linkedin_profile ? (
                            <a href={selectedEmployee.linkedin_profile} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              View Profile
                            </a>
                          ) : 'Not provided'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Address Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Address Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <span className="font-medium">Current Address:</span>
                      <p className="text-muted-foreground">{selectedEmployee.current_address || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="font-medium">Permanent Address:</span>
                      <p className="text-muted-foreground">{selectedEmployee.permanent_address || 'Not provided'}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Additional Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Additional Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Aadhar Number:</span>
                        <p className="text-muted-foreground">{selectedEmployee.aadhar_number || 'Not provided'}</p>
                      </div>
                      <div>
                        <span className="font-medium">PAN Number:</span>
                        <p className="text-muted-foreground">{selectedEmployee.pan_number || 'Not provided'}</p>
                      </div>
                      <div>
                        <span className="font-medium">UAN Number:</span>
                        <p className="text-muted-foreground">{selectedEmployee.uan_number || 'Not provided'}</p>
                      </div>
                      <div>
                        <span className="font-medium">Date of Birth:</span>
                        <p className="text-muted-foreground">
                          {selectedEmployee.dob ? new Date(selectedEmployee.dob).toLocaleDateString() : 'Not provided'}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium">Total Working Days:</span>
                        <p className="text-muted-foreground">{selectedEmployee.total_working_days_this_month || 'Not tracked'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Notes */}
                {selectedEmployee.Notes && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">{selectedEmployee.Notes}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  );
}

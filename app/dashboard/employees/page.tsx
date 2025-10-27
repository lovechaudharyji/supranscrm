"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmployeeDetailsModal } from "@/components/EmployeeDetailsModal";
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
  DialogTitle 
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  GripVertical,
  ChevronDown
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import React from "react"; // Added for React.useMemo and React.useEffect
import { 
  DragDropContext, 
  Droppable, 
  Draggable, 
  DropResult,
  DroppableProvided,
  DraggableProvided
} from "@hello-pangea/dnd";

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
  job_title?: string;
  reporting_manager?: string;
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
  department?: {
    whalesync_postgres_id: string;
    department_name: string;
    display_name?: string;
    headcount?: number;
  } | null;
};

type Team = {
  id: number;
  team_name: string;
  status: string;
};

type Department = {
  whalesync_postgres_id: string;
  department_name: string;
  display_name?: string;
  employees?: any;
  head_manager?: any;
  headcount?: number;
  status: string;
  teams?: any;
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [view, setView] = useState<'list' | 'grid' | 'kanban'>('list');
  const [jobTypeFilter, setJobTypeFilter] = useState<string[]>([]);
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  // Modify the type to allow more flexibility
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form state for controlled components
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    jobTitle: '',
    employmentType: 'Full-time',
    workMode: 'Office',
    status: 'Active',
    dateOfJoining: '',
    phone: '',
    address: ''
  });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Sorting state
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Kanban board state
  const [employeeColumns, setEmployeeColumns] = useState<{
    [key: string]: Employee[]
  }>({
    'Active': [],
    'Onboarding': [],
    'Resigned': []
  });

  // Paginated employees
  const paginatedEmployees = React.useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredEmployees.slice(startIndex, endIndex);
  }, [filteredEmployees, currentPage, rowsPerPage]);

  // Total pages calculation
  const totalPages = React.useMemo(() => {
    return Math.ceil(filteredEmployees.length / rowsPerPage);
  }, [filteredEmployees, rowsPerPage]);

  // Reset current page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filteredEmployees]);

  // Prepare Kanban columns when employees change
  useEffect(() => {
    const columns: { [key: string]: Employee[] } = {
      'Active': [],
      'Onboarding': [],
      'Resigned': []
    };

    // Deduplicate employees by ID to prevent duplicate keys
    const uniqueEmployees = filteredEmployees.filter((emp, index, self) => 
      index === self.findIndex(e => e.whalesync_postgres_id === emp.whalesync_postgres_id)
    );

    // Debug: Log all unique status values
    const statusCounts: { [key: string]: number } = {};
    uniqueEmployees.forEach(emp => {
      const status = emp.status || 'undefined';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    console.log('Employee status distribution:', statusCounts);
    console.log('Total unique employees:', uniqueEmployees.length);

    uniqueEmployees.forEach(emp => {
      const status = emp.status || 'undefined';
      console.log(`Employee: ${emp.full_name}, Status: "${status}"`);
      
      switch(emp.status) {
        case 'Active':
          columns['Active'].push(emp);
          break;
        case 'Onboarding':
          columns['Onboarding'].push(emp);
          break;
        case 'Resigned':
          columns['Resigned'].push(emp);
          break;
        default:
          columns['Active'].push(emp);
          console.log(`Defaulting to Active: ${emp.full_name} with status "${emp.status}"`);
      }
    });

    console.log('Final column distribution:', {
      Active: columns['Active'].length,
      Onboarding: columns['Onboarding'].length,
      Resigned: columns['Resigned'].length
    });

    setEmployeeColumns(columns);
  }, [filteredEmployees]);

  // Kanban view drag and drop handler
  const handleEmployeeDragEnd = (result: DropResult) => {
    console.log('Drag and drop triggered:', result);
    const { source, destination } = result;
    
    // If dropped outside a droppable area
    if (!destination) {
      console.log('No destination, drag cancelled');
      return;
    }

    // If dropped in the same column and position
    if (
      source.droppableId === destination.droppableId && 
      source.index === destination.index
    ) {
      console.log('Same position, no change needed');
      return;
    }

    console.log('Moving employee from', source.droppableId, 'to', destination.droppableId);

    // Create a copy of the current columns
    const newColumns = { ...employeeColumns };
    
    // Remove from source column
    const [reorderedEmployee] = newColumns[source.droppableId].splice(source.index, 1);
    
    // Insert into destination column
    newColumns[destination.droppableId].splice(destination.index, 0, reorderedEmployee);

    // Update state
    setEmployeeColumns(newColumns);

    // Optional: Update employee status in database
    const updateEmployeeStatus = async () => {
      try {
        // Check if reorderedEmployee has the required field
        if (!reorderedEmployee || !reorderedEmployee.whalesync_postgres_id) {
          console.error('Invalid employee data for status update:', reorderedEmployee);
          return;
        }

        console.log('Updating employee status:', {
          employeeId: reorderedEmployee.whalesync_postgres_id,
          newStatus: destination.droppableId,
          employeeName: reorderedEmployee.full_name
        });

        const { error } = await supabase
          .from('Employee Directory')
          .update({ status: destination.droppableId })
          .eq('whalesync_postgres_id', reorderedEmployee.whalesync_postgres_id);
        
        if (error) {
          console.error('Supabase error:', error);
          throw error;
        }
        
        console.log('Employee status updated successfully');
      } catch (error) {
        console.error('Error updating employee status:', error);
        console.error('Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          error: error
        });
        // Optionally revert the local state change
      }
    };

    updateEmployeeStatus();
  };

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Starting to fetch Employee Directory data...');
        
        // First, test basic connection to Employee Directory table
        const { data: testData, error: testError } = await supabase
          .from('Employee Directory')
          .select('count')
          .limit(1);
        
        if (testError) {
          console.error('Employee Directory connection test failed:', testError);
          throw new Error(`Employee Directory table error: ${testError.message}`);
        }
        
        console.log('Employee Directory connection successful, fetching full data...');

        // First, let's test basic queries without foreign key relationships
        console.log('Testing basic queries...');
        
        // Test departments query
        const { data: departmentsData, error: departmentsError } = await supabase
          .from('Departments')
          .select('*');
        
        if (departmentsError) {
          console.error('Departments fetch error:', departmentsError);
        } else {
          console.log('Departments fetched successfully:', departmentsData?.length || 0, 'records');
        }
        
        // Fetch employees with reporting manager data
        const { data: employeesData, error: employeesError } = await supabase
          .from('Employee Directory')
          .select(`
            *,
            reporting_manager:reporting_manager(
              whalesync_postgres_id,
              full_name,
              profile_photo,
              job_title
            )
          `);
        
        if (employeesError) {
          console.error('Employee Directory fetch error:', employeesError);
          console.error('Error details:', employeesError);
          console.error('Error message:', employeesError.message);
          console.error('Error code:', employeesError.code);
          console.error('Error hint:', employeesError.hint);
          console.error('Error details:', employeesError.details);
          
          // Set empty data and continue
          setEmployees([]);
          setDepartments([]);
          setFilteredEmployees([]);
          setLoading(false);
          return;
        } else {
          console.log('Employees fetched successfully:', employeesData?.length || 0, 'records');
        }
        
        if (departmentsError) {
          console.error('Departments fetch error:', departmentsError);
          console.error('Department error details:', departmentsError);
        }

        console.log('Raw employees data received:', employeesData?.length || 0, 'records');
        console.log('Raw departments data received:', departmentsData?.length || 0, 'records');
        
        // Debug: Log first employee's data to understand the structure
        if (employeesData && employeesData.length > 0) {
          console.log('First employee full data:', employeesData[0]);
          console.log('All employee fields:', Object.keys(employeesData[0]));
          console.log('Employee department field value:', employeesData[0].department);
          console.log('Employee department field type:', typeof employeesData[0].department);
        }
        
        // Debug: Log departments data structure
        if (departmentsData && departmentsData.length > 0) {
          console.log('First department data:', departmentsData[0]);
          console.log('All department fields:', Object.keys(departmentsData[0]));
        }

        // Process departments data
        const safeDepartmentsData = (departmentsData || []).map((dept, index) => ({
          ...dept,
          whalesync_postgres_id: dept.whalesync_postgres_id || `dept_${index}`,
          department_name: dept.department_name || `Unnamed Department ${index}`,
          display_name: dept.display_name || dept.department_name || `Unnamed Department ${index}`,
          status: dept.status || 'Active',
          headcount: dept.headcount || 0
        }));

        // Process employee data with manual department linking
        const safeEmployeesData = (employeesData || []).map((emp, index) => {
          // Try to find matching department manually
          let matchedDepartment = null;
          
          if (departmentsData && departmentsData.length > 0) {
            // Check if employee has a department field that matches department ID
            if (emp.department) {
              matchedDepartment = departmentsData.find(dept => 
                dept.whalesync_postgres_id === emp.department
              );
            }
            
            // If no match found, try other potential field names
            if (!matchedDepartment) {
              // Check for department_name field in employee
              if (emp.department_name) {
                matchedDepartment = departmentsData.find(dept => 
                  dept.department_name === emp.department_name
                );
              }
            }
            
            // Check for department_id field in employee
            if (!matchedDepartment && emp.department_id) {
              matchedDepartment = departmentsData.find(dept => 
                dept.whalesync_postgres_id === emp.department_id
              );
            }
          }
          
          console.log(`Employee ${emp.full_name}:`, {
            jobTitle: emp.job_title,
            reportingManager: emp.reporting_manager,
            reportingManagerName: emp.reporting_manager?.full_name,
            reportingManagerPhoto: emp.reporting_manager?.profile_photo,
            departmentField: emp.department,
            departmentNameField: emp.department_name,
            departmentIdField: emp.department_id,
            matchedDepartment: matchedDepartment
          });
          
          return {
            ...emp,
            whalesync_postgres_id: emp.whalesync_postgres_id || `emp_${index}`,
            full_name: emp.full_name || `Unnamed Employee ${index}`,
            official_email: emp.official_email || '',
            employment_type: emp.employment_type || 'Full-time',
            status: emp.status || 'Active',
            profile_photo: emp.profile_photo || null,
            date_of_joining: emp.date_of_joining || null,
            work_mode: emp.work_mode || 'Office',
            job_title: emp.job_title || null,
            // Use the joined reporting manager data
            reporting_manager: emp.reporting_manager || null,
            // Use matched department or null
            department: matchedDepartment || null
          };
        });

        console.log('Processed employees data:', safeEmployeesData.length, 'records');
        console.log('Sample employee:', safeEmployeesData[0]);
        
        // Debug: Show first few employees with their job and manager data
        console.log('=== EMPLOYEE DEBUG INFO ===');
        safeEmployeesData.slice(0, 3).forEach((emp, index) => {
          console.log(`Employee ${index + 1}: ${emp.full_name}`);
          console.log('  - Job Title:', emp.job_title);
          console.log('  - Reporting Manager:', emp.reporting_manager);
          console.log('  - Department object:', emp.department);
          console.log('  - Department name:', emp.department?.department_name);
          console.log('  - Display name:', emp.department?.display_name);
          console.log('  - Raw employee data keys:', Object.keys(emp));
        });
        console.log('=== END DEBUG INFO ===');
        
        // Debug: Log department info without alert
        console.log('=== DEPARTMENT SUMMARY ===');
        safeEmployeesData.slice(0, 3).forEach((emp, index) => {
          console.log(`${emp.full_name}: dept=${emp.department?.department_name || 'null'}, display=${emp.department?.display_name || 'null'}`);
        });
        console.log('=== END SUMMARY ===');
        
        // Debug: Check status values in the data
        const statusValues = safeEmployeesData.map(emp => emp.status).filter((status, index, self) => self.indexOf(status) === index);
        console.log('Unique status values in data:', statusValues);
        
        const statusCounts = safeEmployeesData.reduce((acc, emp) => {
          const status = emp.status || 'undefined';
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {} as { [key: string]: number });
        console.log('Status counts in raw data:', statusCounts);

        // Set data
        setTeams([]);
        setDepartments(safeDepartmentsData);
        setEmployees(safeEmployeesData);
        
        console.log('Data successfully loaded into state');
      } catch (error) {
        console.error('Error fetching data:', error);
        console.error('Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        });
        setError(error instanceof Error ? error : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter and sort employees based on search, job type, employment type, and status
  useEffect(() => {
    let result = employees;
    
    if (jobTypeFilter.length > 0) {
      result = result.filter(emp => emp.job_title && jobTypeFilter.includes(emp.job_title.trim()));
    }
    
    if (employmentTypeFilter.length > 0) {
      result = result.filter(emp => emp.employment_type && employmentTypeFilter.includes(emp.employment_type.trim()));
    }
    
    if (statusFilter.length > 0) {
      result = result.filter(emp => emp.status && statusFilter.includes(emp.status.trim()));
    }
    
    if (searchTerm) {
      const searchTermLower = searchTerm.toLowerCase();
      result = result.filter(emp => 
        (emp.full_name && emp.full_name.toLowerCase().includes(searchTermLower)) ||
        (emp.official_email && emp.official_email.toLowerCase().includes(searchTermLower)) ||
        (emp.employment_type && emp.employment_type.toLowerCase().includes(searchTermLower)) ||
        (emp.employee_id && emp.employee_id.toLowerCase().includes(searchTermLower)) ||
        (emp.department?.department_name && emp.department.department_name.toLowerCase().includes(searchTermLower)) ||
        (emp.job_title && emp.job_title.toLowerCase().includes(searchTermLower)) ||
        (emp.reporting_manager?.full_name && emp.reporting_manager.full_name.toLowerCase().includes(searchTermLower))
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
          case 'reporting_manager':
            aValue = a.reporting_manager?.full_name || '';
            bValue = b.reporting_manager?.full_name || '';
            break;
          case 'job_title':
            aValue = a.job_title || '';
            bValue = b.job_title || '';
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
  }, [employees, jobTypeFilter, employmentTypeFilter, statusFilter, searchTerm, sortColumn, sortDirection]);

  // Helper functions for multi-select filters
  const toggleFilter = (filterArray: string[], setFilterArray: (value: string[]) => void, value: string) => {
    if (filterArray.includes(value)) {
      setFilterArray(filterArray.filter(item => item !== value));
    } else {
      setFilterArray([...filterArray, value]);
    }
  };

  const toggleSelectAll = (filterArray: string[], setFilterArray: (value: string[]) => void, allOptions: string[]) => {
    if (filterArray.length === allOptions.length) {
      setFilterArray([]);
    } else {
      setFilterArray([...allOptions]);
    }
  };

  // Handle column sorting
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      // Toggle direction or clear sort
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
      default: return 'outline';
    }
  };

  // Handle employee deletion with cascade delete
  const handleDelete = async (whalesync_postgres_id: string) => {
    if (!confirm('Are you sure you want to delete this employee and ALL their related data? This action cannot be undone and will delete:\n\n• All their leads\n• All their call records\n• All their attendance records\n• All their documents\n• All their tasks\n• All their subscriptions\n\nThis will completely remove the employee from the system!\n\nThis is a permanent action!')) {
      return;
    }

    try {
      console.log('Starting employee deletion process...');

      // STEP 1: Break circular references in Employee Directory first
      console.log('Step 1: Breaking circular references in Employee Directory...');
      
      const { error: updateEmployeeError } = await supabase
        .from('Employee Directory')
        .update({ 
          attendance: null,
          employee_documents: null,
          calls: null,
          leads: null,
          users: null,
          teams: null,
          department: null,
          reporting_manager: null,
          from_field_reporting_manager: null,
          team_head_of: null
        })
        .eq('whalesync_postgres_id', whalesync_postgres_id);
      
      if (updateEmployeeError) {
        console.warn('Warning: Could not update Employee Directory references:', updateEmployeeError);
      } else {
        console.log('Successfully broke circular references in Employee Directory');
      }

      // STEP 2: Delete from all related tables
      console.log('Step 2: Deleting from all related tables...');

      // Delete from Attendance first (most critical)
      console.log('Deleting Attendance records...');
      
      // First, check how many attendance records exist
      const { count: attendanceCount } = await supabase
        .from('Attendance')
        .select('*', { count: 'exact', head: true })
        .eq('employee', whalesync_postgres_id);
      
      console.log(`Found ${attendanceCount} attendance records to delete`);
      
      if (attendanceCount && attendanceCount > 0) {
        // First, update department references in Attendance to null to break constraints
        const { error: updateAttendanceDeptError } = await supabase
          .from('Attendance')
          .update({ department_name_from_employee: null })
          .eq('employee', whalesync_postgres_id);
        
        if (updateAttendanceDeptError) {
          console.warn('Warning: Could not update department references in Attendance:', updateAttendanceDeptError);
        } else {
          console.log('Successfully updated department references in Attendance');
        }
        
        // Now delete the attendance records
        const { error: attendanceError, count: deletedCount } = await supabase
          .from('Attendance')
          .delete({ count: 'exact' })
          .eq('employee', whalesync_postgres_id);
        
        if (attendanceError) {
          console.error('Error deleting attendance:', attendanceError);
          throw new Error(`Failed to delete attendance records: ${attendanceError.message}`);
        }
        
        console.log(`Successfully deleted ${deletedCount} Attendance records`);
        
        // Verify deletion
        const { count: remainingCount } = await supabase
          .from('Attendance')
          .select('*', { count: 'exact', head: true })
          .eq('employee', whalesync_postgres_id);
        
        if (remainingCount && remainingCount > 0) {
          console.error(`WARNING: ${remainingCount} attendance records still exist after deletion attempt!`);
          throw new Error(`Failed to delete all attendance records. ${remainingCount} records still exist.`);
        } else {
          console.log('Verified: All attendance records deleted successfully');
        }
      } else {
        console.log('No attendance records found to delete');
      }

      // Delete from Employee Documents
      console.log('Deleting Employee Documents...');
      const { error: documentsError } = await supabase
        .from('Employee Documents')
        .delete()
        .eq('employee', whalesync_postgres_id);
      if (documentsError) {
        console.error('Error deleting employee documents:', documentsError);
        throw new Error(`Failed to delete employee documents: ${documentsError.message}`);
      }
      console.log('Successfully deleted Employee Documents');

      // Delete from Leads
      console.log('Deleting Leads...');
      const { error: leadsError } = await supabase
        .from('Leads')
        .delete()
        .eq('assigned_to', whalesync_postgres_id);
      if (leadsError) {
        console.error('Error deleting leads:', leadsError);
        throw new Error(`Failed to delete leads: ${leadsError.message}`);
      }
      console.log('Successfully deleted Leads');

      // Delete from Calls
      console.log('Deleting Calls...');
      const { error: callsError } = await supabase
        .from('Calls')
        .delete()
        .eq('employee', whalesync_postgres_id);
      if (callsError) {
        console.error('Error deleting calls:', callsError);
        throw new Error(`Failed to delete calls: ${callsError.message}`);
      }
      console.log('Successfully deleted Calls');

      // Delete from Users
      console.log('Deleting Users...');
      const { error: usersError } = await supabase
        .from('Users')
        .delete()
        .eq('employee', whalesync_postgres_id);
      if (usersError) {
        console.warn('Warning: Could not delete users:', usersError);
      } else {
        console.log('Successfully deleted Users');
      }

      // Delete from Tasks
      console.log('Deleting Tasks...');
      const { error: tasksError } = await supabase
        .from('Tasks')
        .delete()
        .eq('Assignee', whalesync_postgres_id);
      if (tasksError) console.warn('Warning: Could not delete Tasks:', tasksError);

      const { error: tasks2Error } = await supabase
        .from('tasks')
        .delete()
        .eq('assignee', whalesync_postgres_id);
      if (tasks2Error) console.warn('Warning: Could not delete tasks:', tasks2Error);

      // Delete from Subscriptions
      console.log('Deleting Subscriptions...');
      const { error: subsVendorError } = await supabase
        .from('subscriptions')
        .delete()
        .eq('vendor_id', whalesync_postgres_id);
      if (subsVendorError) console.warn('Warning: Could not delete subscription vendor:', subsVendorError);

      const { error: subsOwnerError } = await supabase
        .from('subscriptions')
        .delete()
        .eq('owner_id', whalesync_postgres_id);
      if (subsOwnerError) console.warn('Warning: Could not delete subscription owner:', subsOwnerError);

      const { error: subUsersError } = await supabase
        .from('subscription_users')
        .delete()
        .eq('user_id', whalesync_postgres_id);
      if (subUsersError) console.warn('Warning: Could not delete subscription users:', subUsersError);

      // Delete from Documents
      console.log('Deleting Documents...');
      const { error: docsError } = await supabase
        .from('documents')
        .delete()
        .eq('created_by', whalesync_postgres_id);
      if (docsError) console.warn('Warning: Could not delete documents:', docsError);

      const { error: docAssignError1 } = await supabase
        .from('document_assignments')
        .delete()
        .eq('employee_id', whalesync_postgres_id);
      if (docAssignError1) console.warn('Warning: Could not delete document assignments 1:', docAssignError1);

      const { error: docAssignError2 } = await supabase
        .from('document_assignments')
        .delete()
        .eq('assigned_by', whalesync_postgres_id);
      if (docAssignError2) console.warn('Warning: Could not delete document assignments 2:', docAssignError2);

      // STEP 3: Remove employee from Departments and Teams (AGGRESSIVE APPROACH)
      console.log('Step 3: Aggressively removing employee from Departments and Teams...');
      
      // Get all departments that might reference this employee
      const { data: departmentsData } = await supabase
        .from('Departments')
        .select('whalesync_postgres_id, employees, head_manager')
        .or(`employees.cs.{${whalesync_postgres_id}},head_manager.eq.${whalesync_postgres_id}`);
      
      if (departmentsData) {
        for (const dept of departmentsData) {
          // Update employees array to remove this employee
          if (dept.employees && Array.isArray(dept.employees)) {
            const updatedEmployees = dept.employees.filter(id => id !== whalesync_postgres_id);
            const { error: updateDeptError } = await supabase
              .from('Departments')
              .update({ employees: updatedEmployees })
              .eq('whalesync_postgres_id', dept.whalesync_postgres_id);
            
            if (updateDeptError) {
              console.warn(`Warning: Could not update department ${dept.whalesync_postgres_id}:`, updateDeptError);
            } else {
              console.log(`Successfully removed from department ${dept.whalesync_postgres_id}`);
            }
          }
          
          // Update head_manager if it's this employee
          if (dept.head_manager === whalesync_postgres_id) {
            const { error: updateHeadError } = await supabase
              .from('Departments')
              .update({ head_manager: null })
              .eq('whalesync_postgres_id', dept.whalesync_postgres_id);
            
            if (updateHeadError) {
              console.warn(`Warning: Could not update department head ${dept.whalesync_postgres_id}:`, updateHeadError);
            } else {
              console.log(`Successfully removed as head of department ${dept.whalesync_postgres_id}`);
            }
          }
        }
      }

      // Get all teams that might reference this employee
      const { data: teamsData } = await supabase
        .from('Teams')
        .select('whalesync_postgres_id, team_members, team_lead')
        .or(`team_members.cs.{${whalesync_postgres_id}},team_lead.eq.${whalesync_postgres_id}`);
      
      if (teamsData) {
        for (const team of teamsData) {
          // Update team_members array to remove this employee
          if (team.team_members && Array.isArray(team.team_members)) {
            const updatedMembers = team.team_members.filter(id => id !== whalesync_postgres_id);
            const { error: updateTeamError } = await supabase
              .from('Teams')
              .update({ team_members: updatedMembers })
              .eq('whalesync_postgres_id', team.whalesync_postgres_id);
            
            if (updateTeamError) {
              console.warn(`Warning: Could not update team ${team.whalesync_postgres_id}:`, updateTeamError);
            } else {
              console.log(`Successfully removed from team ${team.whalesync_postgres_id}`);
            }
          }
          
          // Update team_lead if it's this employee
          if (team.team_lead === whalesync_postgres_id) {
            const { error: updateLeadError } = await supabase
              .from('Teams')
              .update({ team_lead: null })
              .eq('whalesync_postgres_id', team.whalesync_postgres_id);
            
            if (updateLeadError) {
              console.warn(`Warning: Could not update team lead ${team.whalesync_postgres_id}:`, updateLeadError);
            } else {
              console.log(`Successfully removed as lead of team ${team.whalesync_postgres_id}`);
            }
          }
        }
      }

      // STEP 4: Finally, delete the employee record
      console.log('Step 4: Deleting the employee record...');
      const { error: deleteEmployeeError } = await supabase
        .from('Employee Directory')
        .delete()
        .eq('whalesync_postgres_id', whalesync_postgres_id);
      
      if (deleteEmployeeError) {
        console.error('Error deleting employee record:', deleteEmployeeError);
        throw new Error(`Failed to delete employee record: ${deleteEmployeeError.message}`);
      }
      
      console.log('Successfully deleted employee record');
      
      // Remove deleted employee from state
      setEmployees(prev => prev.filter(emp => emp.whalesync_postgres_id !== whalesync_postgres_id));
      
      // Show success message
      alert('Employee and ALL related data deleted successfully! The employee has been completely removed from the system.');
    } catch (error) {
      console.error('Error deleting employee:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      alert(`Failed to delete employee: ${error.message || 'Unknown error'}`);
    }
  };

  // Handle view employee details
  const handleViewDetails = (employee: Employee) => {
    setSelectedEmployee(employee);
    setDetailsModalOpen(true);
  };

  // Update form data when employee is selected for editing
  const handleEditEmployee = (employee: Employee) => {
    console.log('Editing employee:', employee);
    setSelectedEmployee(employee);
    setIsEditing(true);
    const newFormData = {
      firstName: employee.full_name?.split(' ')[0] || '',
      lastName: employee.full_name?.split(' ').slice(1).join(' ') || '',
      email: employee.official_email || '',
      jobTitle: employee.job_title || '',
      employmentType: employee.employment_type || 'Full-time',
      workMode: employee.work_mode || 'Office',
      status: employee.status || 'Active',
      dateOfJoining: employee.date_of_joining ? new Date(employee.date_of_joining).toISOString().split('T')[0] : '',
      phone: employee.personal_contact_number || '',
      address: employee.current_address || ''
    };
    console.log('Setting form data:', newFormData);
    setFormData(newFormData);
  };

  // Handle form field changes
  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Debug isEditing state changes
  useEffect(() => {
    console.log('isEditing state changed to:', isEditing);
  }, [isEditing]);

  // Update form data when selectedEmployee changes
  useEffect(() => {
    if (selectedEmployee && isEditing) {
      console.log('useEffect: Updating form data for selected employee:', selectedEmployee);
      const newFormData = {
        firstName: selectedEmployee.full_name?.split(' ')[0] || '',
        lastName: selectedEmployee.full_name?.split(' ').slice(1).join(' ') || '',
        email: selectedEmployee.official_email || '',
        jobTitle: selectedEmployee.job_title || '',
        employmentType: selectedEmployee.employment_type || 'Full-time',
        workMode: selectedEmployee.work_mode || 'Office',
        status: selectedEmployee.status || 'Active',
        dateOfJoining: selectedEmployee.date_of_joining ? new Date(selectedEmployee.date_of_joining).toISOString().split('T')[0] : '',
        phone: selectedEmployee.personal_contact_number || '',
        address: selectedEmployee.current_address || ''
      };
      console.log('useEffect: Setting form data:', newFormData);
      setFormData(newFormData);
    }
  }, [selectedEmployee, isEditing]);

  // Handle form submission for edit/add employee
  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      console.log('Form submission started');
      console.log('Form data:', formData);
      const employeeData = {
        full_name: `${formData.firstName} ${formData.lastName}`.trim(),
        official_email: formData.email,
        employment_type: formData.employmentType,
        job_title: formData.jobTitle,
        work_mode: formData.workMode,
        status: formData.status,
        date_of_joining: formData.dateOfJoining || null,
        personal_contact_number: formData.phone || null,
        current_address: formData.address || null,
      };

      // Remove empty strings and convert to null for database
      Object.keys(employeeData).forEach(key => {
        if (employeeData[key as keyof typeof employeeData] === '') {
          employeeData[key as keyof typeof employeeData] = null as any;
        }
      });

      if (selectedEmployee) {
        // Update existing employee
        console.log('Updating employee with data:', employeeData);
        console.log('Employee ID:', selectedEmployee.whalesync_postgres_id);
        
        const { error } = await supabase
          .from('Employee Directory')
          .update(employeeData)
          .eq('whalesync_postgres_id', selectedEmployee.whalesync_postgres_id);

        if (error) {
          console.error('Error updating employee:', error);
          console.error('Error details:', {
            message: error.message,
            code: error.code,
            hint: error.hint,
            details: error.details
          });
          alert(`Failed to update employee: ${error.message || 'Unknown error'}`);
          return;
        }

        alert('Employee updated successfully!');
      } else {
        // Add new employee
        const { error } = await supabase
          .from('Employee Directory')
          .insert([employeeData]);

        if (error) {
          console.error('Error adding employee:', error);
          alert('Failed to add employee. Please try again.');
          return;
        }

        alert('Employee added successfully!');
      }

      // Refresh the data
      window.location.reload();
      setSelectedEmployee(null);
    } catch (error) {
      console.error('Error saving employee:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        error: error
      });
      alert(`An error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Render employee list view (without pagination)
  const renderEmployeeList = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>
            <Button
              variant="ghost"
              onClick={() => handleSort('name')}
              className="h-7 px-2 hover:bg-transparent text-xs font-semibold"
            >
              Name
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
                onClick={() => handleSort('reporting_manager')}
                className="h-7 px-2 hover:bg-transparent text-xs font-semibold"
              >
                Reporting Manager
                {renderSortIcon('reporting_manager')}
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort('job_title')}
                className="h-7 px-2 hover:bg-transparent text-xs font-semibold"
              >
                Job Type
                {renderSortIcon('job_title')}
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
              key={`employee-list-${emp.id ?? emp.whalesync_postgres_id ?? 'unknown'}-${emp.official_email}-${index}`}
              className="cursor-pointer hover:bg-muted/30 transition-colors"
              onClick={() => {
                setSelectedEmployeeId(emp.id);
                setDetailsModalOpen(true);
              }}
            >
              <TableCell onClick={(e) => {
                if ((e.target as HTMLElement).closest('button[data-action]')) {
                  e.stopPropagation();
                }
              }}>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewDetails(emp);
                    }}
                    data-action="view"
                    className="h-6 w-6 hover:bg-muted flex-shrink-0"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                  <Avatar className="h-8 w-8">
                    <AvatarImage 
                      src={emp.profile_photo || '/placeholder-avatar.png'} 
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
                <div className="flex items-center gap-2">
                  {emp.reporting_manager?.profile_photo ? (
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={emp.reporting_manager.profile_photo} alt={emp.reporting_manager.full_name || 'Manager'} />
                      <AvatarFallback className="text-xs">
                        {emp.reporting_manager.full_name?.charAt(0) || 'M'}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-xs text-gray-600">
                        {emp.reporting_manager?.full_name?.charAt(0) || 'M'}
                      </span>
                    </div>
                  )}
                  <span className="text-sm">
                    {emp.reporting_manager?.full_name || 'Not Assigned'}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-sm">
                  {emp.job_title || 'Not Specified'}
                </span>
              </TableCell>
              <TableCell>
                <span className="text-xs">{emp.date_of_joining ? new Date(emp.date_of_joining).toLocaleDateString() : 'Not specified'}</span>
              </TableCell>
              <TableCell>
                <Badge variant={getStatusBadgeVariant(emp.status)}>
                  {emp.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditEmployee(emp);
                    }}
                    data-action="edit"
                    className="h-7 w-7 hover:bg-muted"
                    title="Edit Employee"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(emp.whalesync_postgres_id);
                    }}
                    data-action="delete"
                    className="h-7 w-7 hover:bg-muted hover:text-destructive"
                    title="Delete Employee"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
    </Table>
  );

  // Render employee grid view (without pagination)
  const renderEmployeeGrid = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
      {paginatedEmployees.map((emp, index) => (
        <div 
          key={`employee-grid-${emp.id ?? emp.whalesync_postgres_id ?? 'unknown'}-${emp.official_email}-${index}`}
          className="bg-card border border-primary/20 rounded-lg p-4 hover:shadow-lg transition-shadow duration-300"
        >
          {/* Top Section - Profile Picture, Name, and Badge */}
          <div className="flex items-start gap-3 mb-4">
            {/* Profile Picture */}
            <Avatar className="h-12 w-12 flex-shrink-0">
              <AvatarImage 
                src={emp.profile_photo || '/placeholder-avatar.png'} 
                alt={emp.full_name || 'Employee'}
                className="object-cover"
              />
              <AvatarFallback className="text-sm font-semibold bg-muted">
                {(emp.full_name && emp.full_name.charAt(0)) || 'E'}
              </AvatarFallback>
            </Avatar>
            
            {/* Name and Badge */}
            <div className="flex-1">
              <h3 className="text-base font-bold text-foreground mb-1">
                {emp.full_name}
              </h3>
              <Badge variant="secondary" className="text-xs">
                {emp.job_title || 'Unassigned'}
              </Badge>
            </div>
          </div>

          {/* Middle Section - Details with colored dots */}
          <div className="space-y-2 mb-4">
            {/* Employment Type */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-gray-500 rounded-full"></div>
                <span className="text-xs text-muted-foreground">Type</span>
              </div>
              <span className="text-xs text-foreground">
                {emp.employment_type || 'Not specified'}
              </span>
            </div>

            {/* Work Mode */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                <span className="text-xs text-muted-foreground">Work Mode</span>
              </div>
              <span className="text-xs text-foreground">
                {emp.work_mode || 'Not specified'}
              </span>
            </div>

            {/* Reporting Manager */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                <span className="text-xs text-muted-foreground">Manager</span>
              </div>
              <div className="flex items-center gap-2">
                {emp.reporting_manager?.profile_photo ? (
                  <Avatar className="h-4 w-4">
                    <AvatarImage src={emp.reporting_manager.profile_photo} alt={emp.reporting_manager.full_name || 'Manager'} />
                    <AvatarFallback className="text-xs">
                      {emp.reporting_manager.full_name?.charAt(0) || 'M'}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="h-4 w-4 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-xs text-gray-600">
                      {emp.reporting_manager?.full_name?.charAt(0) || 'M'}
                    </span>
                  </div>
                )}
                <span className="text-xs text-foreground">
                  {emp.reporting_manager?.full_name || 'Not Assigned'}
                </span>
              </div>
            </div>

            {/* Job Type */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                <span className="text-xs text-muted-foreground">Job Type</span>
              </div>
              <span className="text-xs text-foreground">
                {emp.job_title || 'Not Specified'}
              </span>
            </div>

            {/* Employee ID */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                <span className="text-xs text-muted-foreground">ID</span>
              </div>
              <span className="text-xs text-foreground font-mono">
                {emp.employee_id || emp.whalesync_postgres_id?.slice(0, 8) || 'N/A'}
              </span>
            </div>
          </div>

          {/* Bottom Section - Metrics and Actions */}
          <div className="flex items-center justify-between">
            {/* Metrics Cards */}
            <div className="flex gap-2">
              {/* Performance Card */}
              <div className="bg-muted/50 rounded-md p-2 min-w-[60px]">
                <div className="text-sm font-bold text-foreground">98%</div>
                <div className="text-[10px] text-muted-foreground">Performance</div>
              </div>
              
              {/* Rating Card */}
              <div className="bg-muted/50 rounded-md p-2 min-w-[60px]">
                <div className="text-sm font-bold text-foreground">4.8</div>
                <div className="text-[10px] text-muted-foreground">Rating</div>
              </div>
            </div>

            {/* Action Icons */}
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
                onClick={() => handleEditEmployee(emp)}
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                title="Edit Employee"
              >
                <Edit2 className="h-3 w-3" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => handleDelete(emp.whalesync_postgres_id)}
                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                title="Delete Employee"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // Render Kanban view (without pagination)
  const renderEmployeeKanban = () => (
    <DragDropContext onDragEnd={handleEmployeeDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 w-full p-4">
        {Object.entries(employeeColumns).map(([columnName, columnEmployees]) => (
          <Droppable key={columnName} droppableId={columnName}>
            {(provided: DroppableProvided) => (
              <div 
                ref={provided.innerRef} 
                {...provided.droppableProps}
                className="flex flex-col rounded-lg p-2 border border-border bg-muted/30"
              >
                <Card className="shadow-none border-none bg-transparent">
                  <CardHeader className="pb-1 px-2 pt-0 text-center space-y-0">
                    <CardTitle className="text-sm font-semibold mb-0.5">
                      {columnName}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {columnEmployees.length} Employees
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-2 px-2 pb-2">
                    {columnEmployees.map((emp, index) => (
                      <Draggable 
                        key={`${columnName}-${emp.whalesync_postgres_id}-${index}`} 
                        draggableId={`${columnName}-${emp.whalesync_postgres_id}`}
                        index={index}
                      >
                        {(provided: DraggableProvided, snapshot: { isDragging: boolean }) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            onClick={() => {
                              handleViewDetails(emp);
                            }}
                            className={`bg-card border border-border rounded-md p-2 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing ${
                              snapshot.isDragging
                                ? "rotate-1 scale-[1.02] shadow-lg"
                                : ""
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              {emp.profile_photo ? (
                                <img
                                  src={emp.profile_photo}
                                  alt={emp.full_name}
                                  className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-muted flex-shrink-0 flex items-center justify-center text-xs font-semibold text-muted-foreground">
                                  {(emp.full_name && emp.full_name.charAt(0)?.toUpperCase()) || "E"}
                                </div>
                              )}

                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {emp.full_name || "Unnamed Employee"}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {emp.employment_type || "—"}
                                </p>
                              </div>
                            </div>

                            <div className="mt-2 flex justify-between items-center gap-2">
                              <p className="text-xs text-muted-foreground truncate flex-1">
                                {emp.department?.department_name || "No department"}
                              </p>
                              <span className="text-xs text-muted-foreground truncate max-w-[80px]">
                                {emp.status || "Unknown"}
                              </span>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </CardContent>
                </Card>
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );

  // Modify the form rendering to use type guard
  const renderEmployeeForm = () => {

    return (
      <Dialog 
        open={!!selectedEmployee} 
        onOpenChange={() => {
          setSelectedEmployee(null);
          setIsEditing(false);
        }}
      >
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader className="pb-4">
            <DialogTitle>
              {isEditing ? 'Edit Employee' : 'Add New Employee'}
            </DialogTitle>
          </DialogHeader>
          {console.log('Rendering modal with form data:', formData, 'Selected employee:', selectedEmployee, 'isEditing:', isEditing)}
          <form 
            key={selectedEmployee?.whalesync_postgres_id || 'new'} 
            className="space-y-3" 
            onSubmit={handleFormSubmit}
          >
            {/* Basic Details Section */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold border-b pb-1">Basic Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    First Name
                  </label>
                  <Input 
                    name="firstName"
                    placeholder="First Name" 
                    value={formData.firstName}
                    onChange={(e) => handleFormChange('firstName', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Last Name
                  </label>
                  <Input 
                    name="lastName"
                    placeholder="Last Name" 
                    value={formData.lastName}
                    onChange={(e) => handleFormChange('lastName', e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="md:col-span-2 lg:col-span-3">
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Official Email
                </label>
                <Input 
                  name="email"
                  type="email" 
                  placeholder="Email" 
                  value={formData.email}
                  onChange={(e) => handleFormChange('email', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Employment Details Section */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold border-b pb-1">Employment Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Job Title
                  </label>
                  <Input 
                    name="jobTitle"
                    placeholder="Job Title" 
                    value={formData.jobTitle}
                    onChange={(e) => handleFormChange('jobTitle', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Employment Type
                  </label>
                  <Select 
                    name="employmentType"
                    value={formData.employmentType}
                    onValueChange={(value) => handleFormChange('employmentType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Employment Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Full-time">Full-time</SelectItem>
                      <SelectItem value="Part-time">Part-time</SelectItem>
                      <SelectItem value="Contract">Contract</SelectItem>
                      <SelectItem value="Intern">Intern</SelectItem>
                      <SelectItem value="Director">Director</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Work Mode
                  </label>
                  <Select 
                    name="workMode"
                    value={formData.workMode}
                    onValueChange={(value) => handleFormChange('workMode', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Work Mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Office">Office</SelectItem>
                      <SelectItem value="Remote">Remote</SelectItem>
                      <SelectItem value="Hybrid">Hybrid</SelectItem>
                      <SelectItem value="On-Site">On-Site</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Date of Joining
                  </label>
                  <Input 
                    name="dateOfJoining"
                    type="date" 
                    value={formData.dateOfJoining}
                    onChange={(e) => handleFormChange('dateOfJoining', e.target.value)}
                  />
                </div>
              </div>
              <div className="md:col-span-2 lg:col-span-3">
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Phone Number
                </label>
                <Input 
                  name="phone"
                  type="tel" 
                  placeholder="Phone Number" 
                  value={formData.phone}
                  onChange={(e) => handleFormChange('phone', e.target.value)}
                />
              </div>
              <div className="md:col-span-2 lg:col-span-3">
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Address
                </label>
                <Input 
                  name="address"
                  placeholder="Current Address" 
                  value={formData.address}
                  onChange={(e) => handleFormChange('address', e.target.value)}
                />
              </div>
            </div>

            {/* Status Section */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold border-b pb-1">Status</h3>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Employee Status
                </label>
                <Select 
                  name="status"
                  value={formData.status}
                  onValueChange={(value) => handleFormChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Onboarding">Onboarding</SelectItem>
                    <SelectItem value="Terminated">Terminated</SelectItem>
                    <SelectItem value="Resigned">Resigned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-2 pt-2 border-t">
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setSelectedEmployee(null);
                  setIsEditing(false);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm">
                {isEditing ? 'Update' : 'Add'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  // Pagination handlers
  const handleFirstPage = () => setCurrentPage(1);
  const handlePreviousPage = () => setCurrentPage(Math.max(1, currentPage - 1));
  const handleNextPage = () => setCurrentPage(Math.min(totalPages, currentPage + 1));
  const handleLastPage = () => setCurrentPage(totalPages);

  // Update view toggle to include Kanban
  const renderViewToggle = () => (
    <div className="flex items-center space-x-2">
      <Button 
        variant="outline" 
        size="icon" 
        onClick={() => setView('list')}
      >
        <List className={`h-4 w-4 ${view === 'list' ? 'text-primary' : 'text-gray-500'}`} />
      </Button>
      <Button 
        variant="outline" 
        size="icon" 
        onClick={() => setView('grid')}
      >
        <Grid className={`h-4 w-4 ${view === 'grid' ? 'text-primary' : 'text-gray-500'}`} />
      </Button>
      <Button 
        variant="outline" 
        size="icon" 
        onClick={() => setView('kanban')}
      >
        <LayoutGrid className={`h-4 w-4 ${view === 'kanban' ? 'text-primary' : 'text-gray-500'}`} />
      </Button>
    </div>
  );

  // Show loading state
  if (loading) {
    return (
      <div className="flex h-screen bg-background dark:bg-background overflow-hidden">
        <SidebarProvider>
          <AppSidebar />
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-shrink-0">
              <SiteHeader title="Employees" />
            </div>
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="h-8 w-8 mx-auto animate-spin border-2 border-muted border-t-primary rounded-full"></div>
                <p className="mt-4 text-muted-foreground">Loading employees...</p>
              </div>
            </div>
          </div>
        </SidebarProvider>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex h-screen bg-background dark:bg-background overflow-hidden">
        <SidebarProvider>
          <AppSidebar />
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-shrink-0">
              <SiteHeader title="Employees" />
            </div>
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-2xl mx-auto p-6">
                <div className="h-12 w-12 mx-auto text-red-500 mb-4">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Database Connection Error</h3>
                <p className="text-muted-foreground mb-4">{error.message}</p>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 text-left">
                  <h4 className="font-semibold text-yellow-800 mb-2">Possible Solutions:</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• Check Supabase table permissions and RLS policies</li>
                    <li>• Verify table names exist: "Employee Directory" and "Departments"</li>
                    <li>• Ensure API keys are correct in environment variables</li>
                    <li>• Check if tables have data</li>
                  </ul>
                </div>
                
                <div className="flex gap-2 justify-center">
                  <Button onClick={() => window.location.reload()}>
                    Try Again
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => window.open('/test-supabase-connection', '_blank')}
                  >
                    Run Diagnostics
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </SidebarProvider>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background dark:bg-background overflow-hidden">
        <SidebarProvider>
          <AppSidebar />
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Header - Fixed */}
            <div className="flex-shrink-0">
              <SiteHeader title="Employees" />
          </div>
          
          {/* Main Content Area */}
          <div className="flex flex-col flex-1 overflow-hidden px-4 pt-4 pb-4">
            {/* Search and Filters - Fixed */}
            <div className="flex-shrink-0 bg-white dark:bg-card rounded-t-xl border border-border dark:border-border shadow-sm">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center space-x-4 w-full">
                  <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input 
                      placeholder="Search employees..." 
                      className="pl-10 w-full"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-[180px] justify-between">
                        {jobTypeFilter.length === 0 ? "All Job Types" : `${jobTypeFilter.length} selected`}
                        <ChevronDown className="h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0 bg-white dark:bg-black border border-gray-200 dark:border-gray-800">
                      <div className="max-h-60 overflow-auto">
                        <div className="p-2 border-b border-gray-200 dark:border-gray-800">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="select-all-job-types"
                              checked={jobTypeFilter.length === Array.from(new Set(employees
                                .map(emp => emp.job_title)
                                .filter(title => title && title.trim() !== '')
                                .map(title => title!.trim())
                              )).length}
                              onCheckedChange={() => toggleSelectAll(
                                jobTypeFilter, 
                                setJobTypeFilter, 
                                Array.from(new Set(employees
                                  .map(emp => emp.job_title)
                                  .filter(title => title && title.trim() !== '')
                                  .map(title => title!.trim())
                                ))
                              )}
                            />
                            <label htmlFor="select-all-job-types" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              Select All
                            </label>
                          </div>
                        </div>
                        <div className="p-1">
                          {Array.from(new Set(employees
                            .map(emp => emp.job_title)
                            .filter(title => title && title.trim() !== '')
                            .map(title => title!.trim())
                          )).map(jobType => (
                            <div key={jobType} className="flex items-center space-x-2 p-2 hover:bg-black dark:hover:bg-black rounded transition-colors">
                              <Checkbox
                                id={`job-type-${jobType}`}
                                checked={jobTypeFilter.includes(jobType)}
                                onCheckedChange={() => toggleFilter(jobTypeFilter, setJobTypeFilter, jobType)}
                              />
                              <label htmlFor={`job-type-${jobType}`} className="text-sm text-gray-900 dark:text-gray-100">
                                {jobType}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                  
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-[180px] justify-between">
                        {employmentTypeFilter.length === 0 ? "All Employment Types" : `${employmentTypeFilter.length} selected`}
                        <ChevronDown className="h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0 bg-white dark:bg-black border border-gray-200 dark:border-gray-800">
                      <div className="max-h-60 overflow-auto">
                        <div className="p-2 border-b border-gray-200 dark:border-gray-800">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="select-all-employment-types"
                              checked={employmentTypeFilter.length === Array.from(new Set(employees
                                .map(emp => emp.employment_type)
                                .filter(type => type && type.trim() !== '')
                                .map(type => type!.trim())
                              )).length}
                              onCheckedChange={() => toggleSelectAll(
                                employmentTypeFilter, 
                                setEmploymentTypeFilter, 
                                Array.from(new Set(employees
                                  .map(emp => emp.employment_type)
                                  .filter(type => type && type.trim() !== '')
                                  .map(type => type!.trim())
                                ))
                              )}
                            />
                            <label htmlFor="select-all-employment-types" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              Select All
                            </label>
                          </div>
                        </div>
                        <div className="p-1">
                          {Array.from(new Set(employees
                            .map(emp => emp.employment_type)
                            .filter(type => type && type.trim() !== '')
                            .map(type => type!.trim())
                          )).map(empType => (
                            <div key={empType} className="flex items-center space-x-2 p-2 hover:bg-black dark:hover:bg-black rounded transition-colors">
                              <Checkbox
                                id={`employment-type-${empType}`}
                                checked={employmentTypeFilter.includes(empType)}
                                onCheckedChange={() => toggleFilter(employmentTypeFilter, setEmploymentTypeFilter, empType)}
                              />
                              <label htmlFor={`employment-type-${empType}`} className="text-sm text-gray-900 dark:text-gray-100">
                                {empType}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                  
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-[180px] justify-between">
                        {statusFilter.length === 0 ? "All Status" : `${statusFilter.length} selected`}
                        <ChevronDown className="h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0 bg-white dark:bg-black border border-gray-200 dark:border-gray-800">
                      <div className="max-h-60 overflow-auto">
                        <div className="p-2 border-b border-gray-200 dark:border-gray-800">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="select-all-status"
                              checked={statusFilter.length === Array.from(new Set(employees
                                .map(emp => emp.status)
                                .filter(status => status && status.trim() !== '')
                                .map(status => status!.trim())
                              )).length}
                              onCheckedChange={() => toggleSelectAll(
                                statusFilter, 
                                setStatusFilter, 
                                Array.from(new Set(employees
                                  .map(emp => emp.status)
                                  .filter(status => status && status.trim() !== '')
                                  .map(status => status!.trim())
                                ))
                              )}
                            />
                            <label htmlFor="select-all-status" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              Select All
                            </label>
                          </div>
                        </div>
                        <div className="p-1">
                          {Array.from(new Set(employees
                            .map(emp => emp.status)
                            .filter(status => status && status.trim() !== '')
                            .map(status => status!.trim())
                          )).map(status => (
                            <div key={status} className="flex items-center space-x-2 p-2 hover:bg-black dark:hover:bg-black rounded transition-colors">
                              <Checkbox
                                id={`status-${status}`}
                                checked={statusFilter.includes(status)}
                                onCheckedChange={() => toggleFilter(statusFilter, setStatusFilter, status)}
                              />
                              <label htmlFor={`status-${status}`} className="text-sm text-gray-900 dark:text-gray-100">
                                {status}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                  
                  
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setJobTypeFilter([]);
                      setEmploymentTypeFilter([]);
                      setStatusFilter([]);
                      setSearchTerm('');
                    }}
                    className="whitespace-nowrap"
                  >
                    Clear Filters
                  </Button>
                  
                  {renderViewToggle()}
                  
                  <Button onClick={() => {
                    setSelectedEmployee({} as Employee);
                    setIsEditing(false);
                    setFormData({
                      firstName: '',
                      lastName: '',
                      email: '',
                      jobTitle: '',
                      employmentType: 'Full-time',
                      workMode: 'Office',
                      status: 'Active',
                      dateOfJoining: '',
                      phone: '',
                      address: ''
                    });
                  }}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Employee
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto bg-white dark:bg-card border-x border-border dark:border-border shadow-sm">
              {view === 'list' ? renderEmployeeList() : 
               view === 'grid' ? renderEmployeeGrid() : 
               renderEmployeeKanban()}
            </div>

            {/* Pagination - Fixed at Bottom */}
            <div className="flex-shrink-0 bg-white dark:bg-card rounded-b-xl border border-t-0 border-border dark:border-border shadow-sm">
              <div className="flex items-center justify-between p-4">
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
            </div>

            {renderEmployeeForm()}
          </div>
        </div>
      </SidebarProvider>

      {/* Employee Details Modal */}
      <EmployeeDetailsModal
        employeeId={selectedEmployee ? selectedEmployee.whalesync_postgres_id : null}
        open={detailsModalOpen}
        onClose={() => {
          setDetailsModalOpen(false);
          setSelectedEmployee(null);
        }}
      />
    </div>
  );
}

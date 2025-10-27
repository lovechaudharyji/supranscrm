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
  GripVertical
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
  const [teamFilter, setTeamFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  // Modify the type to allow more flexibility
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  
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

        // Fetch departments and employees in parallel
        const [
          { data: departmentsData, error: departmentsError },
          { data: employeesData, error: employeesError }
        ] = await Promise.all([
          supabase.from('Departments').select('*'),
          supabase.from('Employee Directory').select(`
            *,
            department:department(*)
          `)
        ]);
        
        if (departmentsError) {
          console.error('Departments fetch error:', departmentsError);
          // Don't throw, just log and continue
        }
        
        if (employeesError) {
          console.error('Employee Directory fetch error:', employeesError);
          throw new Error(`Failed to fetch employees: ${employeesError.message}`);
        }

        console.log('Raw employees data received:', employeesData?.length || 0, 'records');
        console.log('Raw departments data received:', departmentsData?.length || 0, 'records');

        // Process departments data
        const safeDepartmentsData = (departmentsData || []).map((dept, index) => ({
          ...dept,
          whalesync_postgres_id: dept.whalesync_postgres_id || `dept_${index}`,
          department_name: dept.department_name || `Unnamed Department ${index}`,
          display_name: dept.display_name || dept.department_name || `Unnamed Department ${index}`,
          status: dept.status || 'Active',
          headcount: dept.headcount || 0
        }));

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
          work_mode: emp.work_mode || 'Office',
          department: emp.department || null
        }));

        console.log('Processed employees data:', safeEmployeesData.length, 'records');
        console.log('Sample employee:', safeEmployeesData[0]);
        
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
      }
    };

    fetchData();
  }, []);

  // Filter and sort employees based on search, team, department, and sorting
  useEffect(() => {
    let result = employees;
    
    if (teamFilter !== 'all') {
      result = result.filter(emp => emp.teams?.id == Number(teamFilter));
    }
    
    if (departmentFilter !== 'all') {
      result = result.filter(emp => emp.department?.whalesync_postgres_id === departmentFilter);
    }
    
    if (searchTerm) {
      const searchTermLower = searchTerm.toLowerCase();
      result = result.filter(emp => 
        (emp.full_name && emp.full_name.toLowerCase().includes(searchTermLower)) ||
        (emp.official_email && emp.official_email.toLowerCase().includes(searchTermLower)) ||
        (emp.employment_type && emp.employment_type.toLowerCase().includes(searchTermLower)) ||
        (emp.employee_id && emp.employee_id.toLowerCase().includes(searchTermLower)) ||
        (emp.department?.department_name && emp.department.department_name.toLowerCase().includes(searchTermLower))
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
          case 'department':
            aValue = a.department?.department_name || '';
            bValue = b.department?.department_name || '';
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
  }, [employees, teamFilter, departmentFilter, searchTerm, sortColumn, sortDirection]);

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
                onClick={() => handleSort('department')}
                className="h-7 px-2 hover:bg-transparent text-xs font-semibold"
              >
                Department
                {renderSortIcon('department')}
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
                <Badge variant="secondary">
                  {emp.department?.department_name || 'No Department'}
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
              <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEmployee(emp);
                    }}
                    data-action="edit"
                    className="h-7 w-7 hover:bg-muted"
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

            {/* Department */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                <span className="text-xs text-muted-foreground">Department</span>
              </div>
              <span className="text-xs text-foreground">
                {emp.department?.department_name || 'No Department'}
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
    // Determine if we're editing or adding
    const isEditing = selectedEmployee !== null;

    return (
      <Dialog 
        open={!!selectedEmployee} 
        onOpenChange={() => setSelectedEmployee(null)}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Edit Employee' : 'Add New Employee'}
            </DialogTitle>
          </DialogHeader>
          <form className="space-y-6">
            {/* Basic Details Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Basic Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    First Name
                  </label>
                  <Input 
                    placeholder="First Name" 
                    defaultValue={
                      selectedEmployee?.full_name?.split(' ')[0] || ''
                    } 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Last Name
                  </label>
                  <Input 
                    placeholder="Last Name" 
                    defaultValue={
                      selectedEmployee?.full_name?.split(' ').slice(1).join(' ') || ''
                    } 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Official Email
                </label>
                <Input 
                  type="email" 
                  placeholder="Email" 
                  defaultValue={selectedEmployee?.official_email || ''} 
                />
              </div>
            </div>

            {/* Employment Details Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Employment Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Job Title
                  </label>
                  <Input 
                    placeholder="Job Title" 
                    defaultValue={selectedEmployee?.job_title || ''} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Team
                  </label>
                  <Select 
                    defaultValue={
                      selectedEmployee?.teams?.id 
                        ? selectedEmployee.teams.id.toString() 
                        : 'all'
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Team" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Teams</SelectItem>
                      {teams.filter(team => team && team.id && team.team_name).map(team => (
                        <SelectItem 
                          key={team.id} 
                          value={team.id.toString()}
                        >
                          {team.team_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setSelectedEmployee(null)}
              >
                Cancel
              </Button>
              <Button type="submit">
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
                  
                  <Select value={teamFilter} onValueChange={setTeamFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="All Teams" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Teams</SelectItem>
                      {teams.filter(team => team && team.id && team.team_name).map(team => (
                        <SelectItem key={team.id} value={team.id.toString()}>
                          {team.team_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="All Departments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      {departments.filter(dept => dept && dept.whalesync_postgres_id && dept.department_name).map(dept => (
                        <SelectItem key={dept.whalesync_postgres_id} value={dept.whalesync_postgres_id}>
                          {dept.department_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {renderViewToggle()}
                  
                  <Button onClick={() => setSelectedEmployee({} as Employee)}>
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

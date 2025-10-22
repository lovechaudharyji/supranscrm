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
  ArrowDown
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
  id: number;
  whalesync_postgres_id?: string;
  full_name: string;
  official_email: string;
  job_title: string;
  profile_photo?: string;
  teams?: { 
    id: number; 
    team_name: string; 
  } | null;
  reporting_manager?: {
    id: number;
    full_name: string;
    profile_photo?: string;
  } | null;
  status: string;
  date_of_joining?: string;
  employment_type?: string;
};

type Team = {
  id: number;
  team_name: string;
  status: string;
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [view, setView] = useState<'list' | 'grid' | 'kanban'>('list');
  const [teamFilter, setTeamFilter] = useState<string>('all');
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
      index === self.findIndex(e => e.id === emp.id)
    );

    uniqueEmployees.forEach(emp => {
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
      }
    });

    setEmployeeColumns(columns);
  }, [filteredEmployees]);

  // Kanban view drag and drop handler
  const handleEmployeeDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    
    // If dropped outside a droppable area
    if (!destination) return;

    // If dropped in the same column and position
    if (
      source.droppableId === destination.droppableId && 
      source.index === destination.index
    ) return;

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
        const { error } = await supabase
          .from('Employee Directory')
          .update({ status: destination.droppableId })
          .eq('id', reorderedEmployee.id);
        
        if (error) throw error;
      } catch (error) {
        console.error('Error updating employee status:', error);
        // Optionally revert the local state change
      }
    };

    updateEmployeeStatus();
  };

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch teams with default values
        const { data: teamsData, error: teamsError } = await supabase
          .from('Teams')
          .select('*');
        if (teamsError) throw teamsError;

        // Fetch employees with team and reporting manager details
        const { data: employeesData, error: employeesError } = await supabase
          .from('Employee Directory')
          .select(`
            *,
            teams:teams(*),
            reporting_manager:reporting_manager(*)
          `);
        if (employeesError) throw employeesError;

        // Ensure data is not null and has default values
        const safeTeamsData = (teamsData || []).map((team, index) => ({
          id: team.id ?? index,
          team_name: team.team_name ?? `Unnamed Team ${index}`,
          status: team.status ?? 'Active'
        }));

        const safeEmployeesData = (employeesData || []).map((emp, index) => ({
          ...emp,
          id: emp.id ?? index,
          teams: emp.teams ?? null,
          reporting_manager: emp.reporting_manager ?? null,
          full_name: emp.full_name ?? `Unnamed Employee ${index}`,
          official_email: emp.official_email ?? '',
          job_title: emp.job_title ?? 'Unassigned',
          status: emp.status ?? 'Active'
        }));

        setTeams(safeTeamsData);
        setEmployees(safeEmployeesData);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  // Filter and sort employees based on search, team, and sorting
  useEffect(() => {
    let result = employees;
    
    if (teamFilter !== 'all') {
      result = result.filter(emp => emp.teams?.id == Number(teamFilter));
    }
    
    if (searchTerm) {
      const searchTermLower = searchTerm.toLowerCase();
      result = result.filter(emp => 
        emp.full_name.toLowerCase().includes(searchTermLower) ||
        emp.official_email.toLowerCase().includes(searchTermLower)
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
          case 'job_title':
            aValue = a.job_title || '';
            bValue = b.job_title || '';
            break;
          case 'team':
            aValue = a.teams?.team_name || '';
            bValue = b.teams?.team_name || '';
            break;
          case 'employment_type':
            aValue = a.employment_type || '';
            bValue = b.employment_type || '';
            break;
          case 'status':
            aValue = a.status || '';
            bValue = b.status || '';
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
  }, [employees, teamFilter, searchTerm, sortColumn, sortDirection]);

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

  // Handle employee deletion
  const handleDelete = async (id: number) => {
    try {
      const { error } = await supabase
        .from('Employee Directory')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Remove deleted employee from state
      setEmployees(prev => prev.filter(emp => emp.id !== id));
    } catch (error) {
      console.error('Error deleting employee:', error);
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
              onClick={() => handleSort('job_title')}
              className="h-7 px-2 hover:bg-transparent text-xs font-semibold"
            >
              Job Title
              {renderSortIcon('job_title')}
            </Button>
          </TableHead>
          <TableHead>
            <Button
              variant="ghost"
              onClick={() => handleSort('team')}
              className="h-7 px-2 hover:bg-transparent text-xs font-semibold"
            >
              Team
              {renderSortIcon('team')}
            </Button>
          </TableHead>
          <TableHead>Reporting Manager</TableHead>
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
                      setSelectedEmployeeId(emp.id);
                      setDetailsModalOpen(true);
                    }}
                    data-action="view"
                    className="h-6 w-6 hover:bg-muted flex-shrink-0"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                  <Avatar className="h-8 w-8">
                    <AvatarImage 
                      src={emp.profile_photo || '/placeholder-avatar.png'} 
                      alt={emp.full_name} 
                    />
                    <AvatarFallback>{emp.full_name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{emp.full_name}</div>
                    <div className="text-sm text-muted-foreground">{emp.official_email}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell>{emp.job_title}</TableCell>
              <TableCell>
                <Badge variant="outline">
                  {emp.teams?.team_name || 'Unassigned'}
                </Badge>
              </TableCell>
              <TableCell>
                {emp.reporting_manager ? (
                  <div className="flex items-center gap-1.5">
                    <Avatar className="h-6 w-6 flex-shrink-0">
                      <AvatarImage 
                        src={emp.reporting_manager.profile_photo || '/placeholder-avatar.png'} 
                        alt={emp.reporting_manager.full_name} 
                      />
                      <AvatarFallback className="text-[10px]">
                        {emp.reporting_manager.full_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs">{emp.reporting_manager.full_name}</span>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                <span className="text-xs">{emp.employment_type || '-'}</span>
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
                      handleDelete(emp.id);
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
                alt={emp.full_name}
                className="object-cover"
              />
              <AvatarFallback className="text-sm font-semibold bg-muted">
                {emp.full_name.charAt(0)}
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
            {/* Team */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-gray-500 rounded-full"></div>
                <span className="text-xs text-muted-foreground">Team</span>
              </div>
              <span className="text-xs text-foreground">
                {emp.teams?.team_name || 'Unassigned'}
              </span>
            </div>

            {/* Type */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                <span className="text-xs text-muted-foreground">Type</span>
              </div>
              <span className="text-xs text-foreground">
                {emp.employment_type || 'Intern'}
              </span>
            </div>

            {/* ID */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                <span className="text-xs text-muted-foreground">ID</span>
              </div>
              <span className="text-xs text-foreground font-mono">
                #{emp.id}
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
                onClick={() => {
                  setSelectedEmployeeId(emp.id);
                  setDetailsModalOpen(true);
                }}
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
                onClick={() => handleDelete(emp.id)}
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
                        key={`${columnName}-${emp.id}-${index}`} 
                        draggableId={`${columnName}-${emp.id}`} 
                        index={index}
                      >
                        {(provided: DraggableProvided, snapshot: { isDragging: boolean }) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            onClick={() => {
                              setSelectedEmployeeId(emp.id);
                              setDetailsModalOpen(true);
                            }}
                            className={`bg-card border border-border rounded-md p-2 shadow-sm hover:shadow-md transition-all cursor-pointer ${
                              snapshot.isDragging
                                ? "rotate-1 scale-[1.02] shadow-lg"
                                : ""
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {emp.profile_photo ? (
                                <img
                                  src={emp.profile_photo}
                                  alt={emp.full_name}
                                  className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-muted flex-shrink-0 flex items-center justify-center text-xs font-semibold text-muted-foreground">
                                  {emp.full_name?.charAt(0)?.toUpperCase() || "?"}
                                </div>
                              )}

                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {emp.full_name || "Unnamed Employee"}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {emp.job_title || "—"}
                                </p>
                              </div>
                            </div>

                            <div className="mt-2 flex justify-between items-center gap-2">
                              <p className="text-xs text-muted-foreground truncate flex-1">
                                {emp.teams?.team_name || "No team"}
                              </p>
                              <span className="text-xs text-muted-foreground truncate max-w-[80px]">
                                {emp.reporting_manager?.full_name || "Unassigned"}
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
        employeeId={selectedEmployeeId}
        open={detailsModalOpen}
        onClose={() => {
          setDetailsModalOpen(false);
          setSelectedEmployeeId(null);
        }}
      />
    </div>
  );
}

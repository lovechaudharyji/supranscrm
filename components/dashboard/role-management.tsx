"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Users, 
  Shield, 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  UserCheck, 
  UserX,
  Key,
  Database,
  BarChart3,
  FileText,
  Mail,
  Phone,
  Calendar,
  Target,
  DollarSign
} from "lucide-react";
import { toast } from "sonner";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: 'active' | 'inactive';
  lastLogin?: string;
  permissions: string[];
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ReactNode;
}

const PERMISSIONS: Permission[] = [
  // Dashboard & Analytics
  { id: 'dashboard.view', name: 'View Dashboard', description: 'Access main dashboard', category: 'Dashboard', icon: <BarChart3 className="h-4 w-4" /> },
  { id: 'analytics.view', name: 'View Analytics', description: 'Access advanced analytics', category: 'Dashboard', icon: <BarChart3 className="h-4 w-4" /> },
  { id: 'reports.generate', name: 'Generate Reports', description: 'Create and export reports', category: 'Dashboard', icon: <FileText className="h-4 w-4" /> },
  
  // Lead Management
  { id: 'leads.view', name: 'View Leads', description: 'View lead information', category: 'Leads', icon: <Target className="h-4 w-4" /> },
  { id: 'leads.create', name: 'Create Leads', description: 'Add new leads', category: 'Leads', icon: <Plus className="h-4 w-4" /> },
  { id: 'leads.edit', name: 'Edit Leads', description: 'Modify lead information', category: 'Leads', icon: <Edit className="h-4 w-4" /> },
  { id: 'leads.delete', name: 'Delete Leads', description: 'Remove leads from system', category: 'Leads', icon: <Trash2 className="h-4 w-4" /> },
  { id: 'leads.assign', name: 'Assign Leads', description: 'Assign leads to team members', category: 'Leads', icon: <UserCheck className="h-4 w-4" /> },
  
  // Sales Management
  { id: 'sales.view', name: 'View Sales', description: 'Access sales data', category: 'Sales', icon: <DollarSign className="h-4 w-4" /> },
  { id: 'sales.create', name: 'Create Sales', description: 'Record new sales', category: 'Sales', icon: <Plus className="h-4 w-4" /> },
  { id: 'sales.edit', name: 'Edit Sales', description: 'Modify sales records', category: 'Sales', icon: <Edit className="h-4 w-4" /> },
  
  // User Management
  { id: 'users.view', name: 'View Users', description: 'View user information', category: 'Users', icon: <Users className="h-4 w-4" /> },
  { id: 'users.create', name: 'Create Users', description: 'Add new users', category: 'Users', icon: <Plus className="h-4 w-4" /> },
  { id: 'users.edit', name: 'Edit Users', description: 'Modify user information', category: 'Users', icon: <Edit className="h-4 w-4" /> },
  { id: 'users.delete', name: 'Delete Users', description: 'Remove users from system', category: 'Users', icon: <Trash2 className="h-4 w-4" /> },
  
  // System Administration
  { id: 'admin.settings', name: 'System Settings', description: 'Access system configuration', category: 'Admin', icon: <Settings className="h-4 w-4" /> },
  { id: 'admin.roles', name: 'Manage Roles', description: 'Create and modify user roles', category: 'Admin', icon: <Shield className="h-4 w-4" /> },
  { id: 'admin.database', name: 'Database Access', description: 'Direct database access', category: 'Admin', icon: <Database className="h-4 w-4" /> },
  
  // Communication
  { id: 'communication.email', name: 'Send Emails', description: 'Send email communications', category: 'Communication', icon: <Mail className="h-4 w-4" /> },
  { id: 'communication.sms', name: 'Send SMS', description: 'Send SMS messages', category: 'Communication', icon: <Phone className="h-4 w-4" /> },
  
  // Attendance & Tasks
  { id: 'attendance.view', name: 'View Attendance', description: 'Access attendance records', category: 'Attendance', icon: <Calendar className="h-4 w-4" /> },
  { id: 'attendance.manage', name: 'Manage Attendance', description: 'Manage attendance records', category: 'Attendance', icon: <Edit className="h-4 w-4" /> },
  { id: 'tasks.view', name: 'View Tasks', description: 'Access task information', category: 'Tasks', icon: <FileText className="h-4 w-4" /> },
  { id: 'tasks.create', name: 'Create Tasks', description: 'Create new tasks', category: 'Tasks', icon: <Plus className="h-4 w-4" /> },
  { id: 'tasks.edit', name: 'Edit Tasks', description: 'Modify task information', category: 'Tasks', icon: <Edit className="h-4 w-4" /> },
];

const DEFAULT_ROLES: Role[] = [
  {
    id: 'admin',
    name: 'Administrator',
    description: 'Full system access with all permissions',
    permissions: PERMISSIONS.map(p => p.id),
    userCount: 0
  },
  {
    id: 'manager',
    name: 'Manager',
    description: 'Management access with team oversight',
    permissions: [
      'dashboard.view', 'analytics.view', 'reports.generate',
      'leads.view', 'leads.create', 'leads.edit', 'leads.assign',
      'sales.view', 'sales.create', 'sales.edit',
      'users.view', 'communication.email', 'communication.sms',
      'attendance.view', 'attendance.manage', 'tasks.view', 'tasks.create', 'tasks.edit'
    ],
    userCount: 0
  },
  {
    id: 'employee',
    name: 'Employee',
    description: 'Standard employee access',
    permissions: [
      'dashboard.view', 'leads.view', 'leads.create', 'leads.edit',
      'sales.view', 'sales.create', 'communication.email',
      'attendance.view', 'tasks.view', 'tasks.create', 'tasks.edit'
    ],
    userCount: 0
  },
  {
    id: 'viewer',
    name: 'Viewer',
    description: 'Read-only access to system data',
    permissions: [
      'dashboard.view', 'leads.view', 'sales.view', 'users.view',
      'attendance.view', 'tasks.view'
    ],
    userCount: 0
  }
];

export function RoleManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>(DEFAULT_ROLES);
  const [loading, setLoading] = useState(true);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState<Partial<User>>({});
  const [newRole, setNewRole] = useState<Partial<Role>>({});

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('Employee Directory')
        .select(`
          whalesync_postgres_id,
          full_name,
          official_email,
          status,
          job_title,
          department
        `)
        .order('full_name');

      if (error) throw error;

      const usersData: User[] = (data || []).map(emp => ({
        id: emp.whalesync_postgres_id,
        name: emp.full_name || 'Unknown',
        email: emp.official_email || '',
        role: emp.job_title?.toLowerCase().includes('manager') ? 'manager' : 
              emp.job_title?.toLowerCase().includes('admin') ? 'admin' : 'employee',
        department: emp.department || '',
        status: emp.status === 'Active' ? 'active' : 'inactive',
        lastLogin: undefined, // We don't have this data
        permissions: getRolePermissions(emp.job_title?.toLowerCase().includes('manager') ? 'manager' : 
                    emp.job_title?.toLowerCase().includes('admin') ? 'admin' : 'employee')
      }));

      setUsers(usersData);
      updateRoleUserCounts(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    }
  };

  const getRolePermissions = (roleId: string): string[] => {
    const role = roles.find(r => r.id === roleId);
    return role?.permissions || [];
  };

  const updateRoleUserCounts = (usersData: User[]) => {
    setRoles(prevRoles => 
      prevRoles.map(role => ({
        ...role,
        userCount: usersData.filter(user => user.role === role.id).length
      }))
    );
  };

  const getPermissionIcon = (permissionId: string) => {
    const permission = PERMISSIONS.find(p => p.id === permissionId);
    return permission?.icon || <Key className="h-4 w-4" />;
  };

  const getPermissionName = (permissionId: string) => {
    const permission = PERMISSIONS.find(p => p.id === permissionId);
    return permission?.name || permissionId;
  };


  const groupedPermissions = PERMISSIONS.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  const handleCreateUser = async () => {
    try {
      // In a real implementation, you would create the user in the database
      const newUserData: User = {
        id: Date.now().toString(),
        name: newUser.name || '',
        email: newUser.email || '',
        role: newUser.role || 'employee',
        department: newUser.department || '',
        status: 'active',
        permissions: getRolePermissions(newUser.role || 'employee')
      };

      setUsers(prev => [...prev, newUserData]);
      setNewUser({});
      setIsUserDialogOpen(false);
      toast.success('User created successfully');
    } catch (error) {
      toast.error('Failed to create user');
    }
  };

  const handleCreateRole = async () => {
    try {
      const newRoleData: Role = {
        id: newRole.name?.toLowerCase().replace(/\s+/g, '_') || '',
        name: newRole.name || '',
        description: newRole.description || '',
        permissions: newRole.permissions || [],
        userCount: 0
      };

      setRoles(prev => [...prev, newRoleData]);
      setNewRole({});
      setIsRoleDialogOpen(false);
      toast.success('Role created successfully');
    } catch (error) {
      toast.error('Failed to create role');
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, role: newRole, permissions: getRolePermissions(newRole) }
          : user
      ));
      toast.success('User role updated successfully');
    } catch (error) {
      toast.error('Failed to update user role');
    }
  };

  const handleToggleUserStatus = async (userId: string) => {
    try {
      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, status: user.status === 'active' ? 'inactive' : 'active' }
          : user
      ));
      toast.success('User status updated successfully');
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  useEffect(() => {
    fetchUsers();
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" style={{ fontFamily: 'Geist, sans-serif' }}>
            Role & Permission Management
          </h2>
          <p className="text-muted-foreground" style={{ fontFamily: 'Geist, sans-serif' }}>
            Manage user roles and system permissions
          </p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle style={{ fontFamily: 'Geist, sans-serif' }}>Create New User</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={newUser.name || ''}
                    onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email || ''}
                    onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select value={newUser.role} onValueChange={(value) => setNewUser(prev => ({ ...prev, role: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map(role => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={newUser.department || ''}
                    onChange={(e) => setNewUser(prev => ({ ...prev, department: e.target.value }))}
                    placeholder="Enter department"
                  />
                </div>
                <Button onClick={handleCreateUser} className="w-full">
                  Create User
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Shield className="h-4 w-4" />
                Create Role
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle style={{ fontFamily: 'Geist, sans-serif' }}>Create New Role</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="roleName">Role Name</Label>
                    <Input
                      id="roleName"
                      value={newRole.name || ''}
                      onChange={(e) => setNewRole(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter role name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="roleDescription">Description</Label>
                    <Input
                      id="roleDescription"
                      value={newRole.description || ''}
                      onChange={(e) => setNewRole(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter role description"
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Permissions</Label>
                  <div className="max-h-60 overflow-y-auto border rounded-md p-4 space-y-4">
                    {Object.entries(groupedPermissions).map(([category, permissions]) => (
                      <div key={category}>
                        <h4 className="font-medium mb-2" style={{ fontFamily: 'Geist, sans-serif' }}>
                          {category}
                        </h4>
                        <div className="grid grid-cols-1 gap-2">
                          {permissions.map(permission => (
                            <div key={permission.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={permission.id}
                                checked={newRole.permissions?.includes(permission.id) || false}
                                onCheckedChange={(checked) => {
                                  setNewRole(prev => ({
                                    ...prev,
                                    permissions: checked
                                      ? [...(prev.permissions || []), permission.id]
                                      : (prev.permissions || []).filter(p => p !== permission.id)
                                  }));
                                }}
                              />
                              <Label htmlFor={permission.id} className="flex items-center gap-2 cursor-pointer">
                                {permission.icon}
                                <span>{permission.name}</span>
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <Button onClick={handleCreateRole} className="w-full">
                  Create Role
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Role Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {roles.map(role => (
          <Card key={role.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium" style={{ fontFamily: 'Geist, sans-serif' }}>
                {role.name}
              </CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ fontFamily: 'Geist, sans-serif' }}>
                {role.userCount}
              </div>
              <p className="text-xs text-muted-foreground" style={{ fontFamily: 'Geist, sans-serif' }}>
                {role.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Roles & Permissions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ fontFamily: 'Geist, sans-serif' }}>
                <Users className="h-5 w-5" />
                User Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map(user => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium" style={{ fontFamily: 'Geist, sans-serif' }}>
                            {user.name}
                          </div>
                          <div className="text-sm text-muted-foreground" style={{ fontFamily: 'Geist, sans-serif' }}>
                            {user.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select value={user.role} onValueChange={(value) => handleUpdateUserRole(user.id, value)}>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {roles.map(role => (
                              <SelectItem key={role.id} value={role.id}>
                                {role.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm" style={{ fontFamily: 'Geist, sans-serif' }}>
                          {user.department}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={user.status === 'active'}
                            onCheckedChange={() => handleToggleUserStatus(user.id)}
                          />
                          <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                            {user.status === 'active' ? (
                              <><UserCheck className="h-3 w-3 mr-1" /> Active</>
                            ) : (
                              <><UserX className="h-3 w-3 mr-1" /> Inactive</>
                            )}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground" style={{ fontFamily: 'Geist, sans-serif' }}>
                          {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {roles.map(role => (
              <Card key={role.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between" style={{ fontFamily: 'Geist, sans-serif' }}>
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      {role.name}
                    </div>
                    <Badge variant="outline">{role.userCount} users</Badge>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground" style={{ fontFamily: 'Geist, sans-serif' }}>
                    {role.description}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-sm font-medium" style={{ fontFamily: 'Geist, sans-serif' }}>
                      Permissions ({role.permissions.length})
                    </div>
                    <div className="grid grid-cols-1 gap-1 max-h-40 overflow-y-auto">
                      {role.permissions.map(permissionId => (
                        <div key={permissionId} className="flex items-center gap-2 text-sm">
                          {getPermissionIcon(permissionId)}
                          <span style={{ fontFamily: 'Geist, sans-serif' }}>
                            {getPermissionName(permissionId)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

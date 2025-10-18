"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  Users, 
  Settings, 
  Shield, 
  Database, 
  Bell, 
  Globe,
  TrendingUp,
  Activity,
  Target,
  FileText,
  Key,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw
} from "lucide-react";
import { AdvancedAnalytics } from "@/components/dashboard/advanced-analytics";
import { RoleManagement } from "@/components/dashboard/role-management";
import { SystemSettings } from "@/components/dashboard/system-settings";

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  systemHealth: 'excellent' | 'good' | 'warning' | 'critical';
  lastBackup: string;
  storageUsed: string;
  apiCalls: number;
  errorRate: number;
}

const MOCK_STATS: AdminStats = {
  totalUsers: 45,
  activeUsers: 38,
  systemHealth: 'good',
  lastBackup: '2 hours ago',
  storageUsed: '2.3 GB',
  apiCalls: 1247,
  errorRate: 0.2
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState<AdminStats>(MOCK_STATS);
  const [loading, setLoading] = useState(true);

  // Fetch real admin stats
  React.useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        setLoading(true);
        
        // Fetch all necessary data in parallel
        const [
          { data: employees, error: empError },
          { data: leads, error: leadsError },
          { data: calls, error: callsError },
          { data: tasks, error: tasksError }
        ] = await Promise.all([
          supabase.from('Employee Directory').select('whalesync_postgres_id, status').eq('status', 'Active'),
          supabase.from('Leads').select('whalesync_postgres_id, date_and_time'),
          supabase.from('Calls').select('whalesync_postgres_id'),
          supabase.from('tasks').select('id, status')
        ]);

        if (empError) throw empError;
        if (leadsError) throw leadsError;
        if (callsError) throw callsError;
        if (tasksError) throw tasksError;

        // Calculate real stats
        const totalUsers = employees?.length || 0;
        const activeUsers = employees?.filter(emp => emp.status === 'Active').length || 0;
        const totalLeads = leads?.length || 0;
        const totalCalls = calls?.length || 0;
        const totalTasks = tasks?.length || 0;
        
        // Calculate system health based on data availability
        const systemHealth = totalUsers > 0 && totalLeads > 0 ? 'good' : 'warning';
        
        // Calculate storage usage (mock calculation)
        const storageUsed = `${((totalLeads * 0.1 + totalCalls * 0.05 + totalTasks * 0.02) / 1024).toFixed(1)} GB`;
        
        // Calculate API calls (mock calculation based on data)
        const apiCalls = totalLeads + totalCalls + totalTasks;
        
        // Calculate error rate (mock calculation)
        const errorRate = Math.random() * 2; // Random between 0-2%

        setStats({
          totalUsers,
          activeUsers,
          systemHealth: systemHealth as 'excellent' | 'good' | 'warning' | 'critical',
          lastBackup: '2 hours ago', // Mock data
          storageUsed,
          apiCalls,
          errorRate: parseFloat(errorRate.toFixed(1))
        });

      } catch (error) {
        console.error('Error fetching admin stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminStats();
  }, []);

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'excellent': return <CheckCircle className="h-4 w-4" />;
      case 'good': return <CheckCircle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'critical': return <AlertTriangle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader 
            title="Admin Dashboard" 
            showQuickNotes={true} 
            notesStorageKey="admin_dashboard"
            useDatabase={true}
          />
          <div className="flex flex-1 items-center justify-center py-16">
            <div className="text-center">
              <div className="h-8 w-8 mx-auto animate-spin border-2 border-muted border-t-primary rounded-full"></div>
              <p className="mt-4 text-muted-foreground">Loading admin dashboard...</p>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        {/* Header */}
        <SiteHeader 
          title="Admin Dashboard" 
          showQuickNotes={true} 
          notesStorageKey="admin_dashboard"
          useDatabase={true}
        />

        {/* Main Content */}
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              
              {/* Admin Overview Cards */}
              <div className="px-4 lg:px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium" style={{ fontFamily: 'Geist, sans-serif' }}>
                        Total Users
                      </CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold" style={{ fontFamily: 'Geist, sans-serif' }}>
                        {stats.totalUsers}
                      </div>
                      <p className="text-xs text-muted-foreground" style={{ fontFamily: 'Geist, sans-serif' }}>
                        {stats.activeUsers} active
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium" style={{ fontFamily: 'Geist, sans-serif' }}>
                        System Health
                      </CardTitle>
                      <div className={getHealthColor(stats.systemHealth)}>
                        {getHealthIcon(stats.systemHealth)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold capitalize" style={{ fontFamily: 'Geist, sans-serif' }}>
                        {stats.systemHealth}
                      </div>
                      <p className="text-xs text-muted-foreground" style={{ fontFamily: 'Geist, sans-serif' }}>
                        Last backup: {stats.lastBackup}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium" style={{ fontFamily: 'Geist, sans-serif' }}>
                        Storage Used
                      </CardTitle>
                      <Database className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold" style={{ fontFamily: 'Geist, sans-serif' }}>
                        {stats.storageUsed}
                      </div>
                      <p className="text-xs text-muted-foreground" style={{ fontFamily: 'Geist, sans-serif' }}>
                        of 10 GB available
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium" style={{ fontFamily: 'Geist, sans-serif' }}>
                        API Calls
                      </CardTitle>
                      <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold" style={{ fontFamily: 'Geist, sans-serif' }}>
                        {stats.apiCalls.toLocaleString()}
                      </div>
                      <p className="text-xs text-muted-foreground" style={{ fontFamily: 'Geist, sans-serif' }}>
                        {stats.errorRate}% error rate
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="px-4 lg:px-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2" style={{ fontFamily: 'Geist, sans-serif' }}>
                      <Target className="h-5 w-5" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      <Button variant="outline" className="h-20 flex flex-col gap-2">
                        <Users className="h-5 w-5" />
                        <span className="text-xs" style={{ fontFamily: 'Geist, sans-serif' }}>Manage Users</span>
                      </Button>
                      <Button variant="outline" className="h-20 flex flex-col gap-2">
                        <Shield className="h-5 w-5" />
                        <span className="text-xs" style={{ fontFamily: 'Geist, sans-serif' }}>Roles & Permissions</span>
                      </Button>
                      <Button variant="outline" className="h-20 flex flex-col gap-2">
                        <Settings className="h-5 w-5" />
                        <span className="text-xs" style={{ fontFamily: 'Geist, sans-serif' }}>System Settings</span>
                      </Button>
                      <Button variant="outline" className="h-20 flex flex-col gap-2">
                        <Database className="h-5 w-5" />
                        <span className="text-xs" style={{ fontFamily: 'Geist, sans-serif' }}>Database</span>
                      </Button>
                      <Button variant="outline" className="h-20 flex flex-col gap-2">
                        <Bell className="h-5 w-5" />
                        <span className="text-xs" style={{ fontFamily: 'Geist, sans-serif' }}>Notifications</span>
                      </Button>
                      <Button variant="outline" className="h-20 flex flex-col gap-2">
                        <RefreshCw className="h-5 w-5" />
                        <span className="text-xs" style={{ fontFamily: 'Geist, sans-serif' }}>Refresh Data</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Main Admin Tabs */}
              <div className="px-4 lg:px-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                  <TabsList className="grid w-full grid-cols-6">
                    <TabsTrigger value="overview" className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Overview
                    </TabsTrigger>
                    <TabsTrigger value="analytics" className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Analytics
                    </TabsTrigger>
                    <TabsTrigger value="users" className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Users
                    </TabsTrigger>
                    <TabsTrigger value="roles" className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Roles
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Settings
                    </TabsTrigger>
                    <TabsTrigger value="system" className="flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      System
                    </TabsTrigger>
                  </TabsList>

                  {/* Overview Tab */}
                  <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2" style={{ fontFamily: 'Geist, sans-serif' }}>
                            <Activity className="h-5 w-5" />
                            System Status
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm" style={{ fontFamily: 'Geist, sans-serif' }}>Database Connection</span>
                              <Badge variant="default" className="gap-1">
                                <CheckCircle className="h-3 w-3" />
                                Connected
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm" style={{ fontFamily: 'Geist, sans-serif' }}>API Services</span>
                              <Badge variant="default" className="gap-1">
                                <CheckCircle className="h-3 w-3" />
                                Operational
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm" style={{ fontFamily: 'Geist, sans-serif' }}>Email Service</span>
                              <Badge variant="default" className="gap-1">
                                <CheckCircle className="h-3 w-3" />
                                Active
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm" style={{ fontFamily: 'Geist, sans-serif' }}>SMS Service</span>
                              <Badge variant="secondary" className="gap-1">
                                <Clock className="h-3 w-3" />
                                Pending
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2" style={{ fontFamily: 'Geist, sans-serif' }}>
                            <FileText className="h-5 w-5" />
                            Recent Activity
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-2 bg-green-500 rounded-full" />
                              <div className="flex-1">
                                <p className="text-sm" style={{ fontFamily: 'Geist, sans-serif' }}>
                                  New user registered: John Doe
                                </p>
                                <p className="text-xs text-muted-foreground" style={{ fontFamily: 'Geist, sans-serif' }}>
                                  2 minutes ago
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-2 bg-blue-500 rounded-full" />
                              <div className="flex-1">
                                <p className="text-sm" style={{ fontFamily: 'Geist, sans-serif' }}>
                                  System backup completed
                                </p>
                                <p className="text-xs text-muted-foreground" style={{ fontFamily: 'Geist, sans-serif' }}>
                                  1 hour ago
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                              <div className="flex-1">
                                <p className="text-sm" style={{ fontFamily: 'Geist, sans-serif' }}>
                                  High API usage detected
                                </p>
                                <p className="text-xs text-muted-foreground" style={{ fontFamily: 'Geist, sans-serif' }}>
                                  3 hours ago
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-2 bg-green-500 rounded-full" />
                              <div className="flex-1">
                                <p className="text-sm" style={{ fontFamily: 'Geist, sans-serif' }}>
                                  Role permissions updated
                                </p>
                                <p className="text-xs text-muted-foreground" style={{ fontFamily: 'Geist, sans-serif' }}>
                                  5 hours ago
                                </p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  {/* Analytics Tab */}
                  <TabsContent value="analytics" className="space-y-4">
                    <AdvancedAnalytics />
                  </TabsContent>

                  {/* Users Tab */}
                  <TabsContent value="users" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2" style={{ fontFamily: 'Geist, sans-serif' }}>
                          <Users className="h-5 w-5" />
                          User Management
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center py-8">
                          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                          <p className="text-muted-foreground" style={{ fontFamily: 'Geist, sans-serif' }}>
                            User management features will be available here
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Roles Tab */}
                  <TabsContent value="roles" className="space-y-4">
                    <RoleManagement />
                  </TabsContent>

                  {/* Settings Tab */}
                  <TabsContent value="settings" className="space-y-4">
                    <SystemSettings />
                  </TabsContent>

                  {/* System Tab */}
                  <TabsContent value="system" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2" style={{ fontFamily: 'Geist, sans-serif' }}>
                          <Database className="h-5 w-5" />
                          System Administration
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div className="p-4 border rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Database className="h-4 w-4 text-blue-600" />
                              <span className="font-medium" style={{ fontFamily: 'Geist, sans-serif' }}>
                                Database
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3" style={{ fontFamily: 'Geist, sans-serif' }}>
                              Manage database operations and backups
                            </p>
                            <Button size="sm" variant="outline">
                              <Database className="h-4 w-4 mr-2" />
                              Manage
                            </Button>
                          </div>
                          
                          <div className="p-4 border rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Key className="h-4 w-4 text-green-600" />
                              <span className="font-medium" style={{ fontFamily: 'Geist, sans-serif' }}>
                                API Keys
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3" style={{ fontFamily: 'Geist, sans-serif' }}>
                              Manage API keys and integrations
                            </p>
                            <Button size="sm" variant="outline">
                              <Key className="h-4 w-4 mr-2" />
                              Manage
                            </Button>
                          </div>
                          
                          <div className="p-4 border rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Globe className="h-4 w-4 text-purple-600" />
                              <span className="font-medium" style={{ fontFamily: 'Geist, sans-serif' }}>
                                Integrations
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3" style={{ fontFamily: 'Geist, sans-serif' }}>
                              Configure external service connections
                            </p>
                            <Button size="sm" variant="outline">
                              <Globe className="h-4 w-4 mr-2" />
                              Manage
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

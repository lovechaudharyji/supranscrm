"use client";

import { useState, useEffect } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, 
  Clock, 
  ArrowLeft,
  Share2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  Settings,
  Eye,
  Edit,
  Trash2,
  Grid3X3,
  List
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";

interface Subscription {
  id: string;
  subscription_name: string;
  vendor_id?: string;
  plan_tier?: string;
  cost_per_period?: number;
  cost_per_user?: number;
  billing_cycle?: string;
  auto_renewal_status?: string;
  owner_id?: string;
  start_date?: string;
  expiry_date?: string;
  status?: string;
  notes?: string;
  portal_url?: string;
  category?: string;
  number_of_users?: number;
  created_at?: string;
  updated_at?: string;
  vendor?: {
    full_name: string;
    profile_photo?: string;
  };
  owner?: {
    full_name: string;
    profile_photo?: string;
    official_email?: string;
  };
  users?: Array<{
    full_name: string;
    profile_photo?: string;
  }>;
  credentials?: {
    email?: string;
    password?: string;
  };
}

interface Employee {
  whalesync_postgres_id: string;
  full_name: string;
  profile_photo?: string;
  official_email?: string;
}

function SubscriptionsPageContent() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<"dashboard" | "subscriptions" | "details">("dashboard");
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [sortField, setSortField] = useState<string>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [visibleColumns, setVisibleColumns] = useState({
    subscription: true,
    plan: true,
    cost: true,
    users: true,
    annualCost: true,
    status: true,
    renewal: true,
    actions: true
  });
  const [showKanban, setShowKanban] = useState(false);
  const [shareCredentialsOpen, setShareCredentialsOpen] = useState(false);
  const [selectedSubscriptionForShare, setSelectedSubscriptionForShare] = useState<Subscription | null>(null);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);

  const [newSubscription, setNewSubscription] = useState({
    subscription_name: "",
    vendor_id: "",
    plan_tier: "Team Plan",
    cost_per_period: "",
    cost_per_user: "",
    billing_cycle: "Monthly",
    auto_renewal_status: "Enabled",
    owner_id: "",
    start_date: "",
    expiry_date: "",
    status: "Active",
    notes: "",
    portal_url: "",
    category: "",
    number_of_users: 0,
    selected_users: [] as string[],
    credentials: {
      email: "",
      password: ""
    }
  });

  const ALL_CATEGORIES = ['SaaS', 'Marketing', 'Cloud', 'Productivity', 'Security', 'Finance', 'Communication', 'Other', 'Job Portal'];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load subscriptions with related data
      const { data: subscriptionsData, error: subscriptionsError } = await supabase
        .from("subscriptions")
        .select(`
          *,
          vendor:vendor_id(full_name, profile_photo),
          owner:owner_id(full_name, profile_photo, official_email),
          subscription_users(
            user:user_id(full_name, profile_photo)
          ),
          credentials(*)
        `)
        .order("created_at", { ascending: false });

      if (subscriptionsError) throw subscriptionsError;

      // Transform the data to match our interface
      const transformedSubscriptions = subscriptionsData?.map(sub => ({
        ...sub,
        users: sub.subscription_users?.map((su: { user: { full_name: string; profile_photo?: string } }) => su.user).filter(Boolean) || [],
        credentials: sub.credentials?.[0] || null
      })) || [];

      setSubscriptions(transformedSubscriptions);

      // Load employees for dropdowns
      const { data: employeesData, error: employeesError } = await supabase
        .from("Employee Directory")
        .select("whalesync_postgres_id, full_name, profile_photo, official_email")
        .order("full_name");

      if (employeesError) throw employeesError;
      setEmployees(employeesData || []);

    } catch (error: unknown) {
      console.error("Error loading data:", error);
      toast.error("Failed to load subscription data");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number | undefined) => {
    if (typeof amount !== 'number' || isNaN(amount)) return 'N/A';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysUntilExpiry = (dateString: string | undefined) => {
    if (!dateString) return Infinity;
    const today = new Date();
    const expiry = new Date(dateString);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const calculateTotalAnnualCost = (sub: Subscription) => {
    const costPerUser = sub.cost_per_user || 0;
    const numUsers = sub.number_of_users || 0;
    const costPerPeriod = sub.cost_per_period || 0;
    const cycle = sub.billing_cycle;
    const cycleMap: { [key: string]: number } = { 
      'Monthly': 12, 
      'Quarterly': 4, 
      'Yearly': 1, 
      'Bi-Annual': 2, 
      'One-Time': 0 
    };
    const multiplier = cycleMap[cycle || ''] || 0;

    if (costPerUser > 0 && numUsers > 0) {
      return costPerUser * numUsers * multiplier;
    }
    return costPerPeriod * multiplier;
  };

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'Active': return 'bg-green-500';
      case 'Paused': return 'bg-yellow-500';
      case 'Inactive': return 'bg-gray-500';
      case 'Cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getCategoryColor = (index: number) => {
    const colors = ['bg-indigo-500', 'bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-teal-500', 'bg-green-500', 'bg-yellow-500'];
    return colors[index % colors.length];
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

  const handleShareCredentials = async () => {
    if (!selectedSubscriptionForShare || selectedEmployees.length === 0) {
      toast.error("Please select employees to share credentials with");
      return;
    }

    try {
      const message = `Here are the credentials for ${selectedSubscriptionForShare.subscription_name}:\n\nEmail: ${selectedSubscriptionForShare.credentials?.email}\nPassword: ${selectedSubscriptionForShare.credentials?.password}\n\nPlease keep these secure.`;
      
      // Copy to clipboard
      await navigator.clipboard.writeText(message);
      
      // You could also send via email or other methods here
      toast.success(`Credentials shared with ${selectedEmployees.length} employee(s)`);
      
      setShareCredentialsOpen(false);
      setSelectedSubscriptionForShare(null);
      setSelectedEmployees([]);
    } catch (error) {
      console.error("Error sharing credentials:", error);
      toast.error("Failed to share credentials");
    }
  };

  const handleCreateSubscription = async () => {
    if (!newSubscription.subscription_name.trim()) {
      toast.error("Please enter a subscription name");
      return;
    }

    if (!newSubscription.owner_id) {
      toast.error("Please select an owner");
      return;
    }

    try {
      // Create subscription
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from("subscriptions")
        .insert([{
          subscription_name: newSubscription.subscription_name,
          vendor_id: newSubscription.vendor_id || null,
          plan_tier: newSubscription.plan_tier,
          cost_per_period: newSubscription.cost_per_period ? parseFloat(newSubscription.cost_per_period) : null,
          cost_per_user: newSubscription.cost_per_user ? parseFloat(newSubscription.cost_per_user) : null,
          billing_cycle: newSubscription.billing_cycle,
          auto_renewal_status: newSubscription.auto_renewal_status,
          owner_id: newSubscription.owner_id,
          start_date: newSubscription.start_date || null,
          expiry_date: newSubscription.expiry_date || null,
          status: newSubscription.status,
          notes: newSubscription.notes || null,
          portal_url: newSubscription.portal_url || null,
          category: newSubscription.category || null,
          number_of_users: newSubscription.number_of_users || 0
        }])
        .select()
        .single();

      if (subscriptionError) throw subscriptionError;

      // Create subscription users
      if (newSubscription.selected_users.length > 0) {
        const userInserts = newSubscription.selected_users.map(userId => ({
          subscription_id: subscriptionData.id,
          user_id: userId
        }));

        const { error: usersError } = await supabase
          .from("subscription_users")
          .insert(userInserts);

        if (usersError) throw usersError;
      }

      // Create credentials if provided
      if (newSubscription.credentials.email || newSubscription.credentials.password) {
        const { error: credentialsError } = await supabase
          .from("credentials")
          .insert([{
            subscription_id: subscriptionData.id,
            email: newSubscription.credentials.email || null,
            password: newSubscription.credentials.password || null
          }]);

        if (credentialsError) throw credentialsError;
      }

      toast.success("Subscription created successfully!");
      setIsCreateDialogOpen(false);
      setNewSubscription({
        subscription_name: "",
        vendor_id: "",
        plan_tier: "Team Plan",
        cost_per_period: "",
        cost_per_user: "",
        billing_cycle: "Monthly",
        auto_renewal_status: "Enabled",
        owner_id: "",
        start_date: "",
        expiry_date: "",
        status: "Active",
        notes: "",
        portal_url: "",
        category: "",
        number_of_users: 0,
        selected_users: [],
        credentials: {
          email: "",
          password: ""
        }
      });
      loadData();
    } catch (error: unknown) {
      console.error("Error creating subscription:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to create subscription: ${errorMessage}`);
    }
  };

  const filteredSubscriptions = subscriptions
    .filter(sub => {
    const name = sub.subscription_name || '';
    const vendorName = sub.vendor?.full_name || '';
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         vendorName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter.length === 0 || statusFilter.includes(sub.status || '');
      const matchesCategory = categoryFilter.length === 0 || categoryFilter.includes(sub.category || '');
    return matchesSearch && matchesStatus && matchesCategory;
    })
    .sort((a, b) => {
      let aValue: any = a[sortField as keyof typeof a];
      let bValue: any = b[sortField as keyof typeof b];

      // Handle different data types
      if (sortField === "created_at" || sortField === "expiry_date") {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else if (sortField === "cost_per_user" || sortField === "cost_per_period") {
        aValue = Number(aValue) || 0;
        bValue = Number(bValue) || 0;
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
  const totalCount = filteredSubscriptions.length;
  const totalPages = Math.ceil(totalCount / pageSize);
  const paginatedSubscriptions = filteredSubscriptions.slice(
    pageIndex * pageSize,
    (pageIndex + 1) * pageSize
  );

  // Reset to first page when filters change
  useEffect(() => {
    setPageIndex(0);
  }, [searchTerm, statusFilter, categoryFilter]);

  const activeSubscriptions = subscriptions.filter(s => s.status === 'Active');
  const totalAnnualCost = activeSubscriptions.reduce((sum, sub) => sum + calculateTotalAnnualCost(sub), 0);
  const renewalsSoon = activeSubscriptions.filter(s => {
    const days = getDaysUntilExpiry(s.expiry_date);
    return days <= 30 && days >= 0;
  }).length;
  const autoRenewEnabled = activeSubscriptions.filter(s => s.auto_renewal_status === 'Enabled').length;

  const spendByCategory = activeSubscriptions.reduce((acc, sub) => {
    const category = sub.category || 'Other';
    acc[category] = (acc[category] || 0) + calculateTotalAnnualCost(sub);
    return acc;
  }, {} as { [key: string]: number });

  const upcomingRenewals = activeSubscriptions
    .filter(s => {
      const days = getDaysUntilExpiry(s.expiry_date);
      return days <= 30 && days >= 0;
    })
    .sort((a, b) => getDaysUntilExpiry(a.expiry_date) - getDaysUntilExpiry(b.expiry_date));

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col">
            <div className="flex-1 overflow-auto p-6">
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Clock className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p className="text-lg text-muted-foreground">Loading subscription data...</p>
                </div>
              </div>
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
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="flex-1 overflow-auto p-1">
            {/* Navigation */}
            <div className="flex items-center gap-4 mb-1">
              {currentPage === 'details' && (
                <Button
                  variant="ghost"
                  onClick={() => setCurrentPage('subscriptions')}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to List
                </Button>
              )}
            </div>

            {/* Dashboard Page */}
            {currentPage === 'dashboard' && (
              <div className="space-y-1">
                {/* Dashboard Toggle Buttons */}
                <div className="flex items-center gap-3">
                  <div className="flex gap-1 border rounded-md p-1">
                <Button
                      variant={currentPage === 'dashboard' ? "default" : "ghost"}
                      size="sm"
                  onClick={() => setCurrentPage('dashboard')}
                      className="h-8 px-3"
                >
                  Dashboard
                </Button>
                <Button
                      variant={currentPage === 'subscriptions' ? "default" : "ghost"}
                      size="sm"
                  onClick={() => setCurrentPage('subscriptions')}
                      className="h-8 px-3"
                >
                  All Subscriptions
                </Button>
              </div>
            </div>
                {/* KPIs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="bg-gradient-to-t from-primary/5 to-card shadow-xs">
                    <CardHeader className="pb-2">
                      <CardDescription>Total Annual Cost</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{formatCurrency(totalAnnualCost)}</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-t from-primary/5 to-card shadow-xs">
                    <CardHeader className="pb-2">
                      <CardDescription>Active Subscriptions</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{activeSubscriptions.length}</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-t from-primary/5 to-card shadow-xs">
                    <CardHeader className="pb-2">
                      <CardDescription>Renewals in Next 30 Days</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{renewalsSoon}</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-t from-primary/5 to-card shadow-xs">
                    <CardHeader className="pb-2">
                      <CardDescription>Enabled Auto-Renewals</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{autoRenewEnabled}</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts and Lists */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle>Annual Spend by Category</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {Object.entries(spendByCategory)
                          .sort((a, b) => b[1] - a[1])
                          .map(([category, spend], index) => {
                            const percentage = (spend / totalAnnualCost) * 100;
                            return (
                              <div key={category} className="flex items-center">
                                <span className="w-28 text-sm text-muted-foreground">{category}</span>
                                <div className="flex-1 bg-muted rounded-full h-4 mr-4">
                                  <div 
                                    className={`${getCategoryColor(index)} h-4 rounded-full`}
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                                <span className="font-semibold">{formatCurrency(spend)}</span>
                              </div>
                            );
                          })}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Action Required: Renewing Soon</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4 max-h-96 overflow-y-auto">
                        {upcomingRenewals.length > 0 ? (
                          upcomingRenewals.map(sub => (
                            <div 
                              key={sub.id}
                              className="flex items-center justify-between p-2 rounded-lg hover:bg-muted cursor-pointer"
                              onClick={() => {
                                setSelectedSubscription(sub);
                                setCurrentPage('details');
                              }}
                            >
                              <div>
                                <p className="font-semibold">{sub.subscription_name}</p>
                                <p className="text-sm text-muted-foreground">{sub.owner?.full_name}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-destructive">
                                  {getDaysUntilExpiry(sub.expiry_date)} days
                                </p>
                                <p className="text-sm text-muted-foreground">{formatDate(sub.expiry_date)}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-muted-foreground text-center p-4">No renewals in the next 30 days.</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Subscriptions List Page */}
            {currentPage === 'subscriptions' && (
              <div className="flex flex-col h-screen">
                {/* Action Bar - Fixed */}
                <div className="flex items-center gap-3 px-4 pb-2 flex-shrink-0 flex-wrap">
                  {/* Dashboard/Subscriptions Toggle */}
                  <div className="flex gap-1 border rounded-md p-1">
                    <Button
                      variant={currentPage === 'dashboard' ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setCurrentPage('dashboard')}
                      className="h-8 px-3"
                    >
                      Dashboard
                    </Button>
                    <Button
                      variant={currentPage === 'subscriptions' ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setCurrentPage('subscriptions')}
                      className="h-8 px-3"
                    >
                      All Subscriptions
                    </Button>
                  </div>

                  <Input
                    placeholder="Search by name or vendor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 min-w-[300px] h-10"
                  />


                  {/* Add Subscription */}
                  <Button onClick={() => setIsCreateDialogOpen(true)} className="h-10">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Subscription
                  </Button>

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
                        {["Active", "Paused", "Inactive", "Cancelled"].map(status => (
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
                        {ALL_CATEGORIES.map(category => (
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

                  {/* View Toggle - Moved to End */}
                  <div className="flex gap-1 border rounded-md p-1">
                    <Button
                      variant={!showKanban ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setShowKanban(false)}
                      className="h-8 px-2"
                      title="Table View"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={showKanban ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setShowKanban(true)}
                      className="h-8 px-2"
                      title="Kanban View"
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Customize Columns Dropdown - Moved to Very End */}
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
                            id="dropdown-subscription"
                            checked={visibleColumns.subscription}
                            onCheckedChange={(checked) => 
                              setVisibleColumns(prev => ({ ...prev, subscription: !!checked }))
                            }
                          />
                          <Label htmlFor="dropdown-subscription" className="text-sm cursor-pointer">Subscription</Label>
                        </div>
                        <div className="flex items-center space-x-2 px-2 py-1.5">
                          <Checkbox
                            id="dropdown-plan"
                            checked={visibleColumns.plan}
                            onCheckedChange={(checked) => 
                              setVisibleColumns(prev => ({ ...prev, plan: !!checked }))
                            }
                          />
                          <Label htmlFor="dropdown-plan" className="text-sm cursor-pointer">Plan/Tier</Label>
                        </div>
                        <div className="flex items-center space-x-2 px-2 py-1.5">
                          <Checkbox
                            id="dropdown-cost"
                            checked={visibleColumns.cost}
                            onCheckedChange={(checked) => 
                              setVisibleColumns(prev => ({ ...prev, cost: !!checked }))
                            }
                          />
                          <Label htmlFor="dropdown-cost" className="text-sm cursor-pointer">Cost per User</Label>
                        </div>
                        <div className="flex items-center space-x-2 px-2 py-1.5">
                          <Checkbox
                            id="dropdown-users"
                            checked={visibleColumns.users}
                            onCheckedChange={(checked) => 
                              setVisibleColumns(prev => ({ ...prev, users: !!checked }))
                            }
                          />
                          <Label htmlFor="dropdown-users" className="text-sm cursor-pointer">No. of Users</Label>
                        </div>
                        <div className="flex items-center space-x-2 px-2 py-1.5">
                          <Checkbox
                            id="dropdown-annual-cost"
                            checked={visibleColumns.annualCost}
                            onCheckedChange={(checked) => 
                              setVisibleColumns(prev => ({ ...prev, annualCost: !!checked }))
                            }
                          />
                          <Label htmlFor="dropdown-annual-cost" className="text-sm cursor-pointer">Annual Cost</Label>
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
                            id="dropdown-renewal"
                            checked={visibleColumns.renewal}
                            onCheckedChange={(checked) => 
                              setVisibleColumns(prev => ({ ...prev, renewal: !!checked }))
                            }
                          />
                          <Label htmlFor="dropdown-renewal" className="text-sm cursor-pointer">Renewal Date</Label>
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

                {/* Table Container - Scrollable */}
                {!showKanban ? (
                  <div className="flex-1 overflow-auto px-4">
                    <div className="w-full rounded-md border">
                      <Table className="w-full">
                      <TableHeader>
                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                          {visibleColumns.subscription && (
                            <TableHead className="text-xs font-semibold text-foreground px-3 py-3">
                              <Button
                                variant="ghost"
                                onClick={() => handleSort("subscription_name")}
                                className="h-7 px-2 hover:bg-transparent text-xs font-semibold"
                              >
                                Subscription
                                {getSortIcon("subscription_name")}
                              </Button>
                            </TableHead>
                          )}
                          {visibleColumns.plan && (
                            <TableHead className="text-xs font-semibold text-foreground px-3 py-3">
                              <Button
                                variant="ghost"
                                onClick={() => handleSort("plan_tier")}
                                className="h-7 px-2 hover:bg-transparent text-xs font-semibold"
                              >
                                Plan/Tier
                                {getSortIcon("plan_tier")}
                              </Button>
                            </TableHead>
                          )}
                          {visibleColumns.cost && (
                            <TableHead className="text-xs font-semibold text-foreground px-3 py-3">
                              <Button
                                variant="ghost"
                                onClick={() => handleSort("cost_per_user")}
                                className="h-7 px-2 hover:bg-transparent text-xs font-semibold"
                              >
                                Cost per User
                                {getSortIcon("cost_per_user")}
                              </Button>
                            </TableHead>
                          )}
                          {visibleColumns.users && (
                            <TableHead className="text-xs font-semibold text-foreground px-3 py-3">
                              <Button
                                variant="ghost"
                                onClick={() => handleSort("number_of_users")}
                                className="h-7 px-2 hover:bg-transparent text-xs font-semibold"
                              >
                                No. of Users
                                {getSortIcon("number_of_users")}
                              </Button>
                            </TableHead>
                          )}
                          {visibleColumns.annualCost && (
                            <TableHead className="text-xs font-semibold text-foreground px-3 py-3">
                              <Button
                                variant="ghost"
                                onClick={() => handleSort("cost_per_period")}
                                className="h-7 px-2 hover:bg-transparent text-xs font-semibold"
                              >
                                Annual Cost
                                {getSortIcon("cost_per_period")}
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
                          {visibleColumns.renewal && (
                            <TableHead className="text-xs font-semibold text-foreground px-3 py-3">
                              <Button
                                variant="ghost"
                                onClick={() => handleSort("expiry_date")}
                                className="h-7 px-2 hover:bg-transparent text-xs font-semibold"
                              >
                                Renewal Date
                                {getSortIcon("expiry_date")}
                              </Button>
                            </TableHead>
                          )}
                          {visibleColumns.actions && (
                            <TableHead className="text-xs font-semibold text-foreground px-3 py-3">Actions</TableHead>
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                          {paginatedSubscriptions.length > 0 ? (
                            paginatedSubscriptions.map(sub => (
                            <TableRow 
                                key={sub.id} 
                              className="border-b border-border hover:bg-muted/30 transition-colors"
                            >
                              {visibleColumns.subscription && (
                                <TableCell className="py-3 px-3">
                                  <div>
                                    <div className="font-semibold text-sm">{sub.subscription_name}</div>
                                    <div className="text-xs text-muted-foreground truncate" title={sub.vendor?.full_name || 'N/A'}>
                                      {sub.vendor?.full_name || 'N/A'}
                                    </div>
                                  </div>
                                </TableCell>
                              )}
                              {visibleColumns.plan && (
                                <TableCell className="py-3 px-3">
                                  <div className="text-sm">{sub.plan_tier || 'N/A'}</div>
                                </TableCell>
                              )}
                              {visibleColumns.cost && (
                                <TableCell className="py-3 px-3">
                                  <div className="text-sm">{formatCurrency(sub.cost_per_user)}</div>
                                </TableCell>
                              )}
                              {visibleColumns.users && (
                                <TableCell className="py-3 px-3">
                                  <div className="text-sm">{sub.number_of_users || 0}</div>
                                </TableCell>
                              )}
                              {visibleColumns.annualCost && (
                                <TableCell className="py-3 px-3">
                                  <div className="text-sm font-semibold">{formatCurrency(calculateTotalAnnualCost(sub))}</div>
                                </TableCell>
                              )}
                              {visibleColumns.status && (
                                <TableCell className="py-3 px-3">
                                  <Badge className={`${getStatusColor(sub.status)} text-white text-xs`}>
                                    {sub.status}
                                  </Badge>
                                </TableCell>
                              )}
                              {visibleColumns.renewal && (
                                <TableCell className="py-3 px-3">
                                  <div className="text-sm">{formatDate(sub.expiry_date)}</div>
                                </TableCell>
                              )}
                              {visibleColumns.actions && (
                                <TableCell className="py-3 px-3">
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedSubscription(sub);
                                        setCurrentPage('details');
                                      }}
                                      className="h-8 px-2"
                                      title="View Details"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        // Edit functionality can be added here
                                      }}
                                      className="h-8 px-2"
                                      title="Edit Subscription"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedSubscriptionForShare(sub);
                                        setShareCredentialsOpen(true);
                                      }}
                                      className="h-8 px-2"
                                      title="Share Credentials"
                                      disabled={!sub.credentials?.email && !sub.credentials?.password}
                                    >
                                      <Share2 className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        // Delete functionality can be added here
                                      }}
                                      className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                      title="Delete Subscription"
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
                            <TableCell colSpan={8} className="text-center py-16">
                              <div className="text-center">
                                <h3 className="text-lg font-semibold text-foreground">No Subscriptions Found</h3>
                                <p className="text-muted-foreground mt-1">Try adjusting your filters or resetting the view.</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
                ) : (
                  /* Kanban View */
                  <div className="flex-1 overflow-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Active Column */}
                      <div className="bg-muted/30 border border-border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold text-foreground">Active</h3>
                          <Badge variant="secondary" className="bg-green-500 text-white">
                            {filteredSubscriptions.filter(sub => sub.status === 'Active').length}
                          </Badge>
                        </div>
                        <div className="space-y-3">
                          {filteredSubscriptions
                            .filter(sub => sub.status === 'Active')
                            .map(sub => (
                              <Card 
                                key={sub.id} 
                                className="p-3 cursor-pointer hover:shadow-md transition-shadow"
                                onClick={() => {
                                  setSelectedSubscription(sub);
                                  setCurrentPage('details');
                                }}
                              >
                                <div className="space-y-2">
                                  <h4 className="font-medium text-sm">{sub.subscription_name}</h4>
                                  <p className="text-xs text-muted-foreground">{sub.vendor?.full_name || 'N/A'}</p>
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs font-semibold">{formatCurrency(calculateTotalAnnualCost(sub))}</span>
                                  <Badge className={`${getStatusColor(sub.status)} text-white text-xs`}>
                                    {sub.status}
                                  </Badge>
                                  </div>
                    </div>
                  </Card>
                            ))}
                        </div>
                </div>

                      {/* Paused Column */}
                      <div className="bg-muted/30 border border-border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold text-foreground">Paused</h3>
                          <Badge variant="secondary" className="bg-yellow-500 text-white">
                            {filteredSubscriptions.filter(sub => sub.status === 'Paused').length}
                          </Badge>
                        </div>
                        <div className="space-y-3">
                          {filteredSubscriptions
                            .filter(sub => sub.status === 'Paused')
                            .map(sub => (
                              <Card 
                                key={sub.id} 
                                className="p-3 cursor-pointer hover:shadow-md transition-shadow"
                                onClick={() => {
                                  setSelectedSubscription(sub);
                                  setCurrentPage('details');
                                }}
                              >
                                <div className="space-y-2">
                                  <h4 className="font-medium text-sm">{sub.subscription_name}</h4>
                                  <p className="text-xs text-muted-foreground">{sub.vendor?.full_name || 'N/A'}</p>
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs font-semibold">{formatCurrency(calculateTotalAnnualCost(sub))}</span>
                                    <Badge className={`${getStatusColor(sub.status)} text-white text-xs`}>
                                      {sub.status}
                                    </Badge>
                                  </div>
                                </div>
                              </Card>
                            ))}
                        </div>
                      </div>

                      {/* Inactive Column */}
                      <div className="bg-muted/30 border border-border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold text-foreground">Inactive</h3>
                          <Badge variant="secondary" className="bg-gray-500 text-white">
                            {filteredSubscriptions.filter(sub => sub.status === 'Inactive').length}
                          </Badge>
                        </div>
                        <div className="space-y-3">
                          {filteredSubscriptions
                            .filter(sub => sub.status === 'Inactive')
                            .map(sub => (
                              <Card 
                                key={sub.id} 
                                className="p-3 cursor-pointer hover:shadow-md transition-shadow"
                                onClick={() => {
                                  setSelectedSubscription(sub);
                                  setCurrentPage('details');
                                }}
                              >
                                <div className="space-y-2">
                                  <h4 className="font-medium text-sm">{sub.subscription_name}</h4>
                                  <p className="text-xs text-muted-foreground">{sub.vendor?.full_name || 'N/A'}</p>
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs font-semibold">{formatCurrency(calculateTotalAnnualCost(sub))}</span>
                                    <Badge className={`${getStatusColor(sub.status)} text-white text-xs`}>
                                      {sub.status}
                                    </Badge>
                                  </div>
                                </div>
                              </Card>
                            ))}
                        </div>
                      </div>

                      {/* Cancelled Column */}
                      <div className="bg-muted/30 border border-border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold text-foreground">Cancelled</h3>
                          <Badge variant="secondary" className="bg-red-500 text-white">
                            {filteredSubscriptions.filter(sub => sub.status === 'Cancelled').length}
                          </Badge>
                        </div>
                        <div className="space-y-3">
                          {filteredSubscriptions
                            .filter(sub => sub.status === 'Cancelled')
                            .map(sub => (
                              <Card 
                                key={sub.id} 
                                className="p-3 cursor-pointer hover:shadow-md transition-shadow"
                                onClick={() => {
                                  setSelectedSubscription(sub);
                                  setCurrentPage('details');
                                }}
                              >
                                <div className="space-y-2">
                                  <h4 className="font-medium text-sm">{sub.subscription_name}</h4>
                                  <p className="text-xs text-muted-foreground">{sub.vendor?.full_name || 'N/A'}</p>
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs font-semibold">{formatCurrency(calculateTotalAnnualCost(sub))}</span>
                                    <Badge className={`${getStatusColor(sub.status)} text-white text-xs`}>
                                      {sub.status}
                                    </Badge>
                                  </div>
                                </div>
                              </Card>
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Pagination - Fixed at Bottom */}
                {!showKanban && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-3 border-t border-border bg-muted/20 px-4 flex-shrink-0">
                  <div className="text-sm text-muted-foreground">
                    {totalCount > 0 ? (
                      <>
                        Showing <span className="font-medium text-foreground">{pageIndex * pageSize + 1}</span> to{" "}
                        <span className="font-medium text-foreground">{Math.min((pageIndex + 1) * pageSize, totalCount)}</span> of{" "}
                        <span className="font-medium text-foreground">{totalCount}</span> subscriptions
                      </>
                    ) : (
                      "No subscriptions found"
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
            )}

            {/* Details Page */}
            {currentPage === 'details' && selectedSubscription && (
              <div className="space-y-6">
                <Card>
                  <CardContent className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div className="md:col-span-1 flex flex-col items-center md:items-start">
                        <Avatar className="w-32 h-32 mb-4">
                          <AvatarImage src={selectedSubscription.vendor?.profile_photo} />
                          <AvatarFallback className="text-2xl">
                            {selectedSubscription.vendor?.full_name?.charAt(0) || 'S'}
                          </AvatarFallback>
                        </Avatar>
                        <h2 className="text-3xl font-bold text-center md:text-left">{selectedSubscription.subscription_name}</h2>
                        <p className="text-xl text-muted-foreground mb-6 text-center md:text-left">
                          {selectedSubscription.vendor?.full_name || 'N/A'}
                        </p>
                        {selectedSubscription.portal_url && (
                          <Button asChild className="w-full">
                            <a href={selectedSubscription.portal_url} target="_blank" rel="noopener noreferrer">
                              Go to Portal
                            </a>
                          </Button>
                        )}
                      </div>
                      <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-x-4">
                        <div className="mb-4">
                          <p className="text-sm text-muted-foreground mb-1">Status</p>
                          <Badge className={`${getStatusColor(selectedSubscription.status)} text-white`}>
                            {selectedSubscription.status}
                          </Badge>
                        </div>
                        <div className="mb-4">
                          <p className="text-sm text-muted-foreground mb-1">Plan / Tier</p>
                          <div className="text-lg font-semibold">{selectedSubscription.plan_tier || 'N/A'}</div>
                        </div>
                        <div className="mb-4">
                          <p className="text-sm text-muted-foreground mb-1">Category</p>
                          <div className="text-lg font-semibold">{selectedSubscription.category || 'N/A'}</div>
                        </div>
                        <div className="mb-4">
                          <p className="text-sm text-muted-foreground mb-1">Annual Cost</p>
                          <div className="text-lg font-semibold">{formatCurrency(calculateTotalAnnualCost(selectedSubscription))}</div>
                        </div>
                        <div className="mb-4">
                          <p className="text-sm text-muted-foreground mb-1">Billing</p>
                          <div className="text-lg font-semibold">
                            {formatCurrency(selectedSubscription.cost_per_period)} / {selectedSubscription.billing_cycle}
                          </div>
                        </div>
                        <div className="mb-4">
                          <p className="text-sm text-muted-foreground mb-1">Auto Renewal</p>
                          <div className="text-lg font-semibold">{selectedSubscription.auto_renewal_status}</div>
                        </div>
                        <div className="mb-4">
                          <p className="text-sm text-muted-foreground mb-1">Owner</p>
                          <div className="text-lg font-semibold">
                            {selectedSubscription.owner?.full_name || 'N/A'}
                            {selectedSubscription.owner?.official_email && (
                              <>
                                <br />
                                <span className="text-sm text-muted-foreground font-normal">
                                  {selectedSubscription.owner.official_email}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="mb-4">
                          <p className="text-sm text-muted-foreground mb-1">Start Date</p>
                          <div className="text-lg font-semibold">{formatDate(selectedSubscription.start_date)}</div>
                        </div>
                        <div className="mb-4">
                          <p className="text-sm text-muted-foreground mb-1">Expiry Date</p>
                          <div className="text-lg font-semibold">{formatDate(selectedSubscription.expiry_date)}</div>
                        </div>
                      </div>
                      
                      {selectedSubscription.credentials && (
                        <div className="md:col-span-3 pt-6 border-t">
                          <h4 className="text-lg font-semibold mb-2">Credentials</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center bg-muted/50 p-4 rounded-lg">
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">Email</p>
                              <div className="text-lg font-semibold">{selectedSubscription.credentials.email || 'Not set'}</div>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">Password</p>
                              <div className="text-lg font-semibold">{selectedSubscription.credentials.password || 'Not set'}</div>
                            </div>
                            <div>
                              <Button
                                onClick={() => {
                                  const message = `Here are the credentials for ${selectedSubscription.subscription_name}:\n\nEmail: ${selectedSubscription.credentials?.email}\nPassword: ${selectedSubscription.credentials?.password}\n\nPlease keep these secure.`;
                                  navigator.clipboard.writeText(message);
                                  toast.success("Credentials copied to clipboard!");
                                }}
                                className="w-full"
                              >
                                <Share2 className="h-4 w-4 mr-2" />
                                Share Credentials
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="md:col-span-3 pt-6 border-t">
                        <h4 className="text-lg font-semibold mb-2">
                          Assigned Users ({selectedSubscription.users?.length || 0})
                        </h4>
                        {selectedSubscription.users && selectedSubscription.users.length > 0 ? (
                          <p className="text-muted-foreground">
                            {selectedSubscription.users.map(user => user.full_name).join(', ')}
                          </p>
                        ) : (
                          <p className="text-muted-foreground">No users are assigned to this subscription.</p>
                        )}
                      </div>

                      <div className="md:col-span-3 pt-6 border-t">
                        <h4 className="text-lg font-semibold mb-2">Notes</h4>
                        <p className="text-muted-foreground whitespace-pre-wrap">
                          {selectedSubscription.notes || 'No notes available.'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>

        {/* Create Subscription Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Subscription</DialogTitle>
              <DialogDescription>
                Create a new subscription entry for your company.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="subscriptionName">Subscription Name *</Label>
                  <Input
                    id="subscriptionName"
                    value={newSubscription.subscription_name}
                    onChange={(e) => setNewSubscription({ ...newSubscription, subscription_name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="vendor">Vendor</Label>
                  <Select
                    value={newSubscription.vendor_id}
                    onValueChange={(value) => setNewSubscription({ ...newSubscription, vendor_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a vendor..." />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map(employee => (
                        <SelectItem key={employee.whalesync_postgres_id} value={employee.whalesync_postgres_id}>
                          {employee.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="planTier">Plan/Tier</Label>
                  <Select
                    value={newSubscription.plan_tier}
                    onValueChange={(value) => setNewSubscription({ ...newSubscription, plan_tier: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Team Plan">Team Plan</SelectItem>
                      <SelectItem value="Business Plus">Business Plus</SelectItem>
                      <SelectItem value="Starter">Starter</SelectItem>
                      <SelectItem value="Pro">Pro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={newSubscription.category}
                    onValueChange={(value) => setNewSubscription({ ...newSubscription, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category..." />
                    </SelectTrigger>
                    <SelectContent>
                      {ALL_CATEGORIES.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="costPerPeriod">Cost per Period (₹)</Label>
                  <Input
                    id="costPerPeriod"
                    type="number"
                    step="0.01"
                    value={newSubscription.cost_per_period}
                    onChange={(e) => setNewSubscription({ ...newSubscription, cost_per_period: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="billingCycle">Billing Cycle</Label>
                  <Select
                    value={newSubscription.billing_cycle}
                    onValueChange={(value) => setNewSubscription({ ...newSubscription, billing_cycle: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Monthly">Monthly</SelectItem>
                      <SelectItem value="Quarterly">Quarterly</SelectItem>
                      <SelectItem value="Yearly">Yearly</SelectItem>
                      <SelectItem value="Bi-Annual">Bi-Annual</SelectItem>
                      <SelectItem value="One-Time">One-Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="costPerUser">Cost per User (₹)</Label>
                  <Input
                    id="costPerUser"
                    type="number"
                    step="0.01"
                    value={newSubscription.cost_per_user}
                    onChange={(e) => setNewSubscription({ ...newSubscription, cost_per_user: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="owner">Owner/Responsible Person *</Label>
                  <Select
                    value={newSubscription.owner_id}
                    onValueChange={(value) => setNewSubscription({ ...newSubscription, owner_id: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an owner..." />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map(employee => (
                        <SelectItem key={employee.whalesync_postgres_id} value={employee.whalesync_postgres_id}>
                          {employee.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={newSubscription.start_date}
                    onChange={(e) => setNewSubscription({ ...newSubscription, start_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="expiryDate">Expiry Date</Label>
                  <Input
                    id="expiryDate"
                    type="date"
                    value={newSubscription.expiry_date}
                    onChange={(e) => setNewSubscription({ ...newSubscription, expiry_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="autoRenewalStatus">Auto-Renewal Status</Label>
                  <Select
                    value={newSubscription.auto_renewal_status}
                    onValueChange={(value) => setNewSubscription({ ...newSubscription, auto_renewal_status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Enabled">Enabled</SelectItem>
                      <SelectItem value="Disabled">Disabled</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={newSubscription.status}
                    onValueChange={(value) => setNewSubscription({ ...newSubscription, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Paused">Paused</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="users">Assign Users</Label>
                <Select
                  value=""
                  onValueChange={(value) => {
                    const currentUsers = newSubscription.selected_users;
                    if (!currentUsers.includes(value)) {
                      setNewSubscription({ ...newSubscription, selected_users: [...currentUsers, value] });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select users to add..." />
                  </SelectTrigger>
                  <SelectContent>
                    {employees
                      .filter(emp => !newSubscription.selected_users.includes(emp.whalesync_postgres_id))
                      .map(employee => (
                        <SelectItem key={employee.whalesync_postgres_id} value={employee.whalesync_postgres_id}>
                          {employee.full_name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {newSubscription.selected_users.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {newSubscription.selected_users.map(userId => {
                      const user = employees.find(emp => emp.whalesync_postgres_id === userId);
                      return (
                        <Badge key={userId} variant="secondary">
                          {user?.full_name}
                          <button
                            onClick={() => {
                              const updatedUsers = newSubscription.selected_users.filter(id => id !== userId);
                              setNewSubscription({ ...newSubscription, selected_users: updatedUsers });
                            }}
                            className="ml-2 hover:bg-destructive/20 rounded-full p-1"
                          >
                            ×
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="portalUrl">Portal URL</Label>
                <Input
                  id="portalUrl"
                  type="url"
                  placeholder="https://example.com"
                  value={newSubscription.portal_url}
                  onChange={(e) => setNewSubscription({ ...newSubscription, portal_url: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  rows={3}
                  value={newSubscription.notes}
                  onChange={(e) => setNewSubscription({ ...newSubscription, notes: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="credentialsEmail">Credentials Email</Label>
                  <Input
                    id="credentialsEmail"
                    type="email"
                    value={newSubscription.credentials.email}
                    onChange={(e) => setNewSubscription({ 
                      ...newSubscription, 
                      credentials: { ...newSubscription.credentials, email: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="credentialsPassword">Credentials Password</Label>
                  <Input
                    id="credentialsPassword"
                    type="password"
                    value={newSubscription.credentials.password}
                    onChange={(e) => setNewSubscription({ 
                      ...newSubscription, 
                      credentials: { ...newSubscription.credentials, password: e.target.value }
                    })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateSubscription}>
                Save Subscription
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Share Credentials Dialog */}
        <Dialog open={shareCredentialsOpen} onOpenChange={setShareCredentialsOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Share Credentials</DialogTitle>
              <DialogDescription>
                Select employees to share credentials for {selectedSubscriptionForShare?.subscription_name}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="employees">Select Employees</Label>
                <Select
                  value=""
                  onValueChange={(value) => {
                    if (!selectedEmployees.includes(value)) {
                      setSelectedEmployees(prev => [...prev, value]);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select employees to add..." />
                  </SelectTrigger>
                  <SelectContent>
                    {employees
                      .filter(emp => !selectedEmployees.includes(emp.whalesync_postgres_id))
                      .map(employee => (
                        <SelectItem key={employee.whalesync_postgres_id} value={employee.whalesync_postgres_id}>
                          {employee.full_name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {selectedEmployees.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedEmployees.map(employeeId => {
                      const employee = employees.find(emp => emp.whalesync_postgres_id === employeeId);
                      return (
                        <Badge key={employeeId} variant="secondary">
                          {employee?.full_name}
                          <button
                            onClick={() => {
                              setSelectedEmployees(prev => prev.filter(id => id !== employeeId));
                            }}
                            className="ml-2 hover:bg-destructive/20 rounded-full p-1"
                          >
                            ×
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>
              
              {selectedSubscriptionForShare?.credentials && (
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Credentials to Share:</h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-muted-foreground">Email: </span>
                      <span className="font-mono text-sm">{selectedSubscriptionForShare.credentials.email || 'Not set'}</span>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Password: </span>
                      <span className="font-mono text-sm">{selectedSubscriptionForShare.credentials.password || 'Not set'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShareCredentialsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleShareCredentials} disabled={selectedEmployees.length === 0}>
                Share Credentials
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function SubscriptionsPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col">
            <div className="flex-1 overflow-auto p-6">
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Clock className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p className="text-lg text-muted-foreground">Loading...</p>
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return <SubscriptionsPageContent />;
}

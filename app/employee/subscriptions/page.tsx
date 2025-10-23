"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Key, 
  Eye, 
  EyeOff, 
  Copy, 
  ExternalLink, 
  Search,
  Filter,
  Calendar,
  DollarSign,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Pause,
  Grid3X3,
  List,
  Settings,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
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
  credentials?: {
    email?: string;
    password?: string;
  };
}

export default function EmployeeSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [showCredentials, setShowCredentials] = useState<{ [key: string]: boolean }>({});
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [showColumnPopover, setShowColumnPopover] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    subscription: true,
    vendor: true,
    status: true,
    category: true,
    plan: true,
    billing: true,
    expires: true,
    actions: true
  });
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(null);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadSubscriptions();
    }
  }, [currentUser]);

  const loadCurrentUser = async () => {
    try {
      // Demo mode - allow without authentication
      const isDemoMode = true; // Set to false for production
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        if (!isDemoMode) {
          console.log("No user logged in");
          return;
        }
        // In demo mode, use the first employee with subscriptions
        console.log("Demo mode: No user logged in, using demo data");
      }

      let employeeUUID: string | null = null;

      if (user?.email) {
        // Get employee data by email
        const { data: employeeData, error: empError } = await supabase
          .from("Employee Directory")
          .select("whalesync_postgres_id, full_name, official_email")
          .eq("official_email", user.email)
          .single();

        if (empError || !employeeData) {
          console.error("Employee not found:", empError);
          if (isDemoMode) {
            // In demo mode, get an employee who has subscriptions
            const { data: employeeWithSubs } = await supabase
              .from("subscription_users")
              .select("user_id")
              .limit(1)
              .single();
            
            if (employeeWithSubs) {
              employeeUUID = employeeWithSubs.user_id;
              console.log("Demo mode: Using employee with subscriptions");
            }
          }
        } else {
          employeeUUID = employeeData.whalesync_postgres_id;
        }
      } else if (isDemoMode) {
        // No user in demo mode - get an employee who has subscriptions
        const { data: employeeWithSubs } = await supabase
          .from("subscription_users")
          .select("user_id")
          .limit(1)
          .single();
        
        if (employeeWithSubs) {
          employeeUUID = employeeWithSubs.user_id;
          console.log("Demo mode: Using employee with subscriptions for data");
        }
      }

      if (employeeUUID) {
        // Get full employee data
        const { data: employeeData } = await supabase
          .from("Employee Directory")
          .select("whalesync_postgres_id, full_name, official_email")
          .eq("whalesync_postgres_id", employeeUUID)
          .single();

        if (employeeData) {
          setCurrentUser(employeeData);
        }
      }
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const loadSubscriptions = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      
      // Get subscriptions assigned to this employee
      const { data: subscriptionUsers, error: usersError } = await supabase
        .from("subscription_users")
        .select(`
          subscription_id,
          subscriptions (
            *,
            vendor:vendor_id(full_name, profile_photo),
            owner:owner_id(full_name, profile_photo, official_email),
            credentials(*)
          )
        `)
        .eq("user_id", currentUser.whalesync_postgres_id);

      if (usersError) {
        console.error("Error fetching subscription users:", usersError);
        throw usersError;
      }

      const userSubscriptions = subscriptionUsers?.map(su => ({
        ...su.subscriptions,
        credentials: su.subscriptions.credentials?.[0] || null
      })) || [];
      setSubscriptions(userSubscriptions);
    } catch (error) {
      console.error("Error loading subscriptions:", error);
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

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'Active': return 'bg-green-500';
      case 'Paused': return 'bg-yellow-500';
      case 'Inactive': return 'bg-gray-500';
      case 'Cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string | undefined) => {
    switch (status) {
      case 'Active': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'Paused': return <Pause className="h-4 w-4 text-yellow-500" />;
      case 'Inactive': return <XCircle className="h-4 w-4 text-gray-500" />;
      case 'Cancelled': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard!`);
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const togglePasswordVisibility = (subscriptionId: string) => {
    setShowCredentials(prev => ({
      ...prev,
      [subscriptionId]: !prev[subscriptionId]
    }));
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = sub.subscription_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sub.vendor?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || sub.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || sub.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const activeSubscriptions = subscriptions.filter(s => s.status === 'Active');
  const renewalsSoon = activeSubscriptions.filter(s => {
    const days = getDaysUntilExpiry(s.expiry_date);
    return days <= 30 && days >= 0;
  }).length;

  const toggleColumn = (column: string) => {
    setVisibleColumns(prev => ({
      ...prev,
      [column]: !prev[column]
    }));
  };

  const resetColumns = () => {
    setVisibleColumns({
      subscription: true,
      vendor: true,
      status: true,
      category: true,
      plan: true,
      billing: true,
      expires: true,
      actions: true
    });
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortDirection(null);
        setSortColumn(null);
      } else {
        setSortDirection("asc");
      }
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />;
    }
    if (sortDirection === "asc") {
      return <ArrowUp className="h-4 w-4 text-foreground" />;
    }
    if (sortDirection === "desc") {
      return <ArrowDown className="h-4 w-4 text-foreground" />;
    }
    return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />;
  };

  const sortedSubscriptions = [...filteredSubscriptions].sort((a, b) => {
    if (!sortColumn || !sortDirection) return 0;

    let aValue: any;
    let bValue: any;

    switch (sortColumn) {
      case "subscription":
        aValue = a.subscription_name?.toLowerCase() || "";
        bValue = b.subscription_name?.toLowerCase() || "";
        break;
      case "vendor":
        aValue = a.vendor?.full_name?.toLowerCase() || "";
        bValue = b.vendor?.full_name?.toLowerCase() || "";
        break;
      case "status":
        aValue = a.status?.toLowerCase() || "";
        bValue = b.status?.toLowerCase() || "";
        break;
      case "category":
        aValue = a.category?.toLowerCase() || "";
        bValue = b.category?.toLowerCase() || "";
        break;
      case "plan":
        aValue = a.plan_tier?.toLowerCase() || "";
        bValue = b.plan_tier?.toLowerCase() || "";
        break;
      case "billing":
        aValue = a.cost_per_period || 0;
        bValue = b.cost_per_period || 0;
        break;
      case "expires":
        aValue = new Date(a.expiry_date || "").getTime();
        bValue = new Date(b.expiry_date || "").getTime();
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Loading your subscriptions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-2">
      {/* Stats Cards */}
      <div className="pt-2">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-t from-primary/5 to-card shadow-xs">
            <CardHeader className="pb-2">
              <CardDescription>Total Subscriptions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{subscriptions.length}</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-t from-primary/5 to-card shadow-xs">
            <CardHeader className="pb-2">
              <CardDescription>Active Subscriptions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{activeSubscriptions.length}</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-t from-primary/5 to-card shadow-xs">
            <CardHeader className="pb-2">
              <CardDescription>Renewals in Next 30 Days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{renewalsSoon}</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search subscriptions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Paused">Paused</SelectItem>
            <SelectItem value="Inactive">Inactive</SelectItem>
            <SelectItem value="Cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="SaaS">SaaS</SelectItem>
            <SelectItem value="Marketing">Marketing</SelectItem>
            <SelectItem value="Cloud">Cloud</SelectItem>
            <SelectItem value="Productivity">Productivity</SelectItem>
            <SelectItem value="Security">Security</SelectItem>
            <SelectItem value="Finance">Finance</SelectItem>
            <SelectItem value="Communication">Communication</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('table')}
          >
            <List className="h-4 w-4" />
          </Button>
          {viewMode === 'table' && (
            <Popover open={showColumnPopover} onOpenChange={setShowColumnPopover}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Columns
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56" align="end">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="subscription"
                        checked={visibleColumns.subscription}
                        onCheckedChange={() => toggleColumn("subscription")}
                      />
                      <label htmlFor="subscription" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Subscription
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="vendor"
                        checked={visibleColumns.vendor}
                        onCheckedChange={() => toggleColumn("vendor")}
                      />
                      <label htmlFor="vendor" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Vendor
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="status"
                        checked={visibleColumns.status}
                        onCheckedChange={() => toggleColumn("status")}
                      />
                      <label htmlFor="status" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Status
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="category"
                        checked={visibleColumns.category}
                        onCheckedChange={() => toggleColumn("category")}
                      />
                      <label htmlFor="category" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Category
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="plan"
                        checked={visibleColumns.plan}
                        onCheckedChange={() => toggleColumn("plan")}
                      />
                      <label htmlFor="plan" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Plan
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="billing"
                        checked={visibleColumns.billing}
                        onCheckedChange={() => toggleColumn("billing")}
                      />
                      <label htmlFor="billing" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Billing
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="expires"
                        checked={visibleColumns.expires}
                        onCheckedChange={() => toggleColumn("expires")}
                      />
                      <label htmlFor="expires" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Expires
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="actions"
                        checked={visibleColumns.actions}
                        onCheckedChange={() => toggleColumn("actions")}
                      />
                      <label htmlFor="actions" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Actions
                      </label>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={resetColumns} className="w-full">
                    Reset All
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>

      {/* Subscriptions List */}
      {filteredSubscriptions.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSubscriptions.map((subscription) => (
            <Card key={subscription.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold">{subscription.subscription_name}</CardTitle>
                    <CardDescription className="text-sm">
                      {subscription.vendor?.full_name || 'N/A'}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(subscription.status)}
                    <Badge className={`${getStatusColor(subscription.status)} text-white text-xs`}>
                      {subscription.status}
                    </Badge>
                  </div>
                </div>
                {subscription.category && (
                  <Badge variant="outline" className="w-fit text-xs">
                    {subscription.category}
                  </Badge>
                )}
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Subscription Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Plan:</span>
                    <span className="font-medium">{subscription.plan_tier || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Billing:</span>
                    <span className="font-medium">
                      {formatCurrency(subscription.cost_per_period)} / {subscription.billing_cycle}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expires:</span>
                    <span className="font-medium">{formatDate(subscription.expiry_date)}</span>
                  </div>
                  {getDaysUntilExpiry(subscription.expiry_date) <= 30 && getDaysUntilExpiry(subscription.expiry_date) >= 0 && (
                    <div className="flex justify-between text-orange-600">
                      <span className="text-muted-foreground">Days Left:</span>
                      <span className="font-medium">{getDaysUntilExpiry(subscription.expiry_date)} days</span>
                    </div>
                  )}
                </div>

                {/* Credentials Section */}
                {subscription.credentials && (
                  <div className="border-t pt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Key className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Credentials</span>
                    </div>
                    
                    <div className="space-y-2">
                      {subscription.credentials.email && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground w-12">Email:</span>
                          <span className="text-xs font-mono flex-1 truncate">{subscription.credentials.email}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(subscription.credentials.email, "Email")}
                            className="h-6 w-6 p-0"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                      
                      {subscription.credentials.password && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground w-12">Password:</span>
                          <span className="text-xs font-mono flex-1 truncate">
                            {showCredentials[subscription.id] ? subscription.credentials.password : '••••••••'}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => togglePasswordVisibility(subscription.id)}
                            className="h-6 w-6 p-0"
                          >
                            {showCredentials[subscription.id] ? (
                              <EyeOff className="h-3 w-3" />
                            ) : (
                              <Eye className="h-3 w-3" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(subscription.credentials.password, "Password")}
                            className="h-6 w-6 p-0"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedSubscription(subscription)}
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                  {subscription.portal_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(subscription.portal_url, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          </div>
        ) : (
          // Table View
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  {visibleColumns.subscription && (
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("subscription")}
                    >
                      <div className="flex items-center gap-2">
                        Subscription
                        {getSortIcon("subscription")}
                      </div>
                    </TableHead>
                  )}
                  {visibleColumns.vendor && (
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("vendor")}
                    >
                      <div className="flex items-center gap-2">
                        Vendor
                        {getSortIcon("vendor")}
                      </div>
                    </TableHead>
                  )}
                  {visibleColumns.status && (
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("status")}
                    >
                      <div className="flex items-center gap-2">
                        Status
                        {getSortIcon("status")}
                      </div>
                    </TableHead>
                  )}
                  {visibleColumns.category && (
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("category")}
                    >
                      <div className="flex items-center gap-2">
                        Category
                        {getSortIcon("category")}
                      </div>
                    </TableHead>
                  )}
                  {visibleColumns.plan && (
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("plan")}
                    >
                      <div className="flex items-center gap-2">
                        Plan
                        {getSortIcon("plan")}
                      </div>
                    </TableHead>
                  )}
                  {visibleColumns.billing && (
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("billing")}
                    >
                      <div className="flex items-center gap-2">
                        Billing
                        {getSortIcon("billing")}
                      </div>
                    </TableHead>
                  )}
                  {visibleColumns.expires && (
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("expires")}
                    >
                      <div className="flex items-center gap-2">
                        Expires
                        {getSortIcon("expires")}
                      </div>
                    </TableHead>
                  )}
                  {visibleColumns.actions && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedSubscriptions.map((subscription) => (
                  <TableRow key={subscription.id}>
                    {visibleColumns.subscription && (
                      <TableCell className="font-medium">{subscription.subscription_name}</TableCell>
                    )}
                    {visibleColumns.vendor && (
                      <TableCell>{subscription.vendor?.full_name || 'N/A'}</TableCell>
                    )}
                    {visibleColumns.status && (
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(subscription.status)}
                          <Badge className={`${getStatusColor(subscription.status)} text-white text-xs`}>
                            {subscription.status}
                          </Badge>
                        </div>
                      </TableCell>
                    )}
                    {visibleColumns.category && (
                      <TableCell>
                        {subscription.category && (
                          <Badge variant="outline" className="text-xs">
                            {subscription.category}
                          </Badge>
                        )}
                      </TableCell>
                    )}
                    {visibleColumns.plan && (
                      <TableCell>{subscription.plan_tier || 'N/A'}</TableCell>
                    )}
                    {visibleColumns.billing && (
                      <TableCell>
                        {formatCurrency(subscription.cost_per_period)} / {subscription.billing_cycle}
                      </TableCell>
                    )}
                    {visibleColumns.expires && (
                      <TableCell>{formatDate(subscription.expiry_date)}</TableCell>
                    )}
                    {visibleColumns.actions && (
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedSubscription(subscription)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                          {subscription.portal_url && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(subscription.portal_url, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Key className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Subscriptions Found</h3>
            <p className="text-muted-foreground text-center">
              {searchTerm || statusFilter !== "all" || categoryFilter !== "all"
                ? "Try adjusting your filters to see more results."
                : "You haven't been assigned to any subscriptions yet. Contact your administrator for access."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Subscription Details Dialog */}
      <Dialog open={!!selectedSubscription} onOpenChange={() => setSelectedSubscription(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{selectedSubscription?.subscription_name}</DialogTitle>
            <DialogDescription>
              Detailed information about this subscription
            </DialogDescription>
          </DialogHeader>
          
          {selectedSubscription && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">Status</label>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusIcon(selectedSubscription.status)}
                    <Badge className={`${getStatusColor(selectedSubscription.status)} text-white`}>
                      {selectedSubscription.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Category</label>
                  <div className="mt-1">{selectedSubscription.category || 'N/A'}</div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Plan/Tier</label>
                  <div className="mt-1">{selectedSubscription.plan_tier || 'N/A'}</div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Billing Cycle</label>
                  <div className="mt-1">{selectedSubscription.billing_cycle || 'N/A'}</div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Cost per Period</label>
                  <div className="mt-1">{formatCurrency(selectedSubscription.cost_per_period)}</div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Auto Renewal</label>
                  <div className="mt-1">{selectedSubscription.auto_renewal_status || 'N/A'}</div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Start Date</label>
                  <div className="mt-1">{formatDate(selectedSubscription.start_date)}</div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Expiry Date</label>
                  <div className="mt-1">{formatDate(selectedSubscription.expiry_date)}</div>
                </div>
              </div>

              {/* Owner Info */}
              <div>
                <label className="text-sm text-muted-foreground">Owner/Responsible Person</label>
                <div className="mt-1">
                  {selectedSubscription.owner?.full_name || 'N/A'}
                  {selectedSubscription.owner?.official_email && (
                    <div className="text-sm text-muted-foreground">
                      {selectedSubscription.owner.official_email}
                    </div>
                  )}
                </div>
              </div>

              {/* Credentials */}
              {selectedSubscription.credentials && (
                <div>
                  <label className="text-sm text-muted-foreground">Credentials</label>
                  <div className="mt-2 space-y-2">
                    {selectedSubscription.credentials.email && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm w-16">Email:</span>
                        <span className="text-sm font-mono flex-1">{selectedSubscription.credentials.email}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(selectedSubscription.credentials.email, "Email")}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    {selectedSubscription.credentials.password && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm w-16">Password:</span>
                        <span className="text-sm font-mono flex-1">
                          {showCredentials[selectedSubscription.id] ? selectedSubscription.credentials.password : '••••••••'}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => togglePasswordVisibility(selectedSubscription.id)}
                        >
                          {showCredentials[selectedSubscription.id] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(selectedSubscription.credentials.password, "Password")}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedSubscription.notes && (
                <div>
                  <label className="text-sm text-muted-foreground">Notes</label>
                  <div className="mt-1 p-3 bg-muted rounded-md text-sm">
                    {selectedSubscription.notes}
                  </div>
                </div>
              )}

              {/* Portal Link */}
              {selectedSubscription.portal_url && (
                <div>
                  <Button
                    onClick={() => window.open(selectedSubscription.portal_url, '_blank')}
                    className="w-full"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Go to Portal
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

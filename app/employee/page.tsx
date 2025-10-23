"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Clock, PhoneOff, Phone, Key, Eye, EyeOff, Copy } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface DashboardStats {
  newLeads: number;
  followUpLeads: number;
  notConnectedLeads: number;
  totalCalls: number;
}

interface SubscriptionCredential {
  id: string;
  subscription_name: string;
  vendor_name?: string;
  credentials: {
    email?: string;
    password?: string;
  };
  status?: string;
  category?: string;
}

export default function EmployeeDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    newLeads: 0,
    followUpLeads: 0,
    notConnectedLeads: 0,
    totalCalls: 0,
  });
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<SubscriptionCredential[]>([]);
  const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Demo mode - allow without authentication
      const isDemoMode = true; // Set to false for production
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        if (!isDemoMode) {
          // Redirect to login if not authenticated
          window.location.href = "/login";
          return;
        }
        // In demo mode, continue without user
        console.log("Demo mode: No user logged in, using demo data");
      } else {
        setUserEmail(user.email);
      }

      // First, get the employee's UUID from their email
      let employeeUUID: string | null = null;
      
      if (user?.email) {
        const { data: employeeData, error: empError } = await supabase
          .from("Employee Directory")
          .select("whalesync_postgres_id")
          .eq("official_email", user.email)
          .single();

        if (empError || !employeeData) {
          console.error("Employee not found:", empError);
          // In demo mode, get the first employee
          if (isDemoMode) {
            const { data: firstEmployee } = await supabase
              .from("Employee Directory")
              .select("whalesync_postgres_id")
              .limit(1)
              .single();
            
            if (firstEmployee) {
              employeeUUID = firstEmployee.whalesync_postgres_id;
              console.log("Demo mode: Using first employee");
            }
          }
          
          if (!employeeUUID) {
            setLoading(false);
            return;
          }
        } else {
          employeeUUID = employeeData.whalesync_postgres_id;
        }
      } else if (isDemoMode) {
        // No user in demo mode - get first employee
        const { data: firstEmployee } = await supabase
          .from("Employee Directory")
          .select("whalesync_postgres_id")
          .limit(1)
          .single();
        
        if (firstEmployee) {
          employeeUUID = firstEmployee.whalesync_postgres_id;
          console.log("Demo mode: Using first employee for data");
        } else {
          console.log("Demo mode: No employees found, showing zero stats");
          setLoading(false);
          return;
        }
      }
      
      if (!employeeUUID) {
        setLoading(false);
        return;
      }

      // Fetch all stats in parallel using employee UUID
      const [newLeadsResult, followUpResult, notConnectedResult, callsResult] = await Promise.all([
        // New Leads (Stage = "New" or "Assigned")
        supabase
          .from("Leads")
          .select("*", { count: "exact", head: true })
          .eq("assigned_to", employeeUUID)
          .in("stage", ["New", "Assigned"]),
        
        // Follow Up Leads
        supabase
          .from("Leads")
          .select("*", { count: "exact", head: true })
          .eq("assigned_to", employeeUUID)
          .eq("stage", "Follow Up Required"),
        
        // Not Connected Leads
        supabase
          .from("Leads")
          .select("*", { count: "exact", head: true })
          .eq("assigned_to", employeeUUID)
          .eq("stage", "Not Connected"),
        
        // Total Calls
        supabase
          .from("Calls")
          .select("*", { count: "exact", head: true })
          .eq("employee", employeeUUID),
      ]);

      setStats({
        newLeads: newLeadsResult.count || 0,
        followUpLeads: followUpResult.count || 0,
        notConnectedLeads: notConnectedResult.count || 0,
        totalCalls: callsResult.count || 0,
      });

      // Load subscription credentials for this employee
      await loadCredentials(employeeUUID);
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCredentials = async (employeeUUID: string) => {
    try {
      // Get subscriptions where this employee is a user
      const { data: subscriptionUsers, error: usersError } = await supabase
        .from("subscription_users")
        .select(`
          subscription:subscription_id(
            id,
            subscription_name,
            status,
            category,
            vendor:vendor_id(full_name),
            credentials(*)
          )
        `)
        .eq("user_id", employeeUUID);

      if (usersError) {
        console.error("Error loading subscription users:", usersError);
        return;
      }

      // Transform the data
      const credentialsData = subscriptionUsers
        ?.map((su: any) => ({
          id: su.subscription.id,
          subscription_name: su.subscription.subscription_name,
          vendor_name: su.subscription.vendor?.full_name,
          credentials: su.subscription.credentials?.[0] || null,
          status: su.subscription.status,
          category: su.subscription.category
        }))
        .filter((cred: any) => cred.credentials) || [];

      setCredentials(credentialsData);
    } catch (error) {
      console.error("Error loading credentials:", error);
    }
  };

  const togglePasswordVisibility = (credentialId: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [credentialId]: !prev[credentialId]
    }));
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${type} copied to clipboard`);
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const navigationCards = [
    {
      title: "New Leads",
      icon: Users,
      count: stats.newLeads,
      href: "/employee/new-leads",
    },
    {
      title: "Follow Up Leads",
      icon: Clock,
      count: stats.followUpLeads,
      href: "/employee/follow-up-leads",
    },
    {
      title: "Not Connected Leads",
      icon: PhoneOff,
      count: stats.notConnectedLeads,
      href: "/employee/not-connected-leads",
    },
    {
      title: "My Call Logs",
      icon: Phone,
      count: stats.totalCalls,
      href: "/employee/call-logs/incoming",
    },
  ];

  if (loading) {
    return (
      <div className="h-full overflow-auto">
        <div className="container mx-auto p-6">
          <div className="mb-6">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Welcome back! Here's your overview.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 md:grid-cols-2 lg:grid-cols-4">
          {navigationCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link key={card.href} href={card.href}>
                <Card className="@container/card cursor-pointer transition-all hover:shadow-md bg-gradient-to-t from-primary/5 to-card shadow-xs">
                  <CardHeader>
                    <CardDescription className="flex items-center justify-between">
                      <span>{card.title}</span>
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                      {card.count}
                    </CardTitle>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Subscription Credentials Section */}
        {credentials.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-4">
              <Key className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Your Subscription Credentials</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {credentials.map((cred) => (
                <Card key={cred.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-sm font-medium">{cred.subscription_name}</CardTitle>
                        {cred.vendor_name && (
                          <CardDescription className="text-xs">{cred.vendor_name}</CardDescription>
                        )}
                      </div>
                      <div className="flex gap-1">
                        {cred.status && (
                          <Badge variant={cred.status === 'Active' ? 'default' : 'secondary'} className="text-xs">
                            {cred.status}
                          </Badge>
                        )}
                        {cred.category && (
                          <Badge variant="outline" className="text-xs">
                            {cred.category}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {/* Email */}
                      {cred.credentials.email && (
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-muted-foreground">Email</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={cred.credentials.email}
                              readOnly
                              className="flex-1 text-xs bg-muted px-2 py-1 rounded border"
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(cred.credentials.email!, 'Email')}
                              className="h-6 w-6 p-0"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {/* Password */}
                      {cred.credentials.password && (
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-muted-foreground">Password</label>
                          <div className="flex items-center gap-2">
                            <input
                              type={showPasswords[cred.id] ? "text" : "password"}
                              value={cred.credentials.password}
                              readOnly
                              className="flex-1 text-xs bg-muted px-2 py-1 rounded border"
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => togglePasswordVisibility(cred.id)}
                              className="h-6 w-6 p-0"
                            >
                              {showPasswords[cred.id] ? (
                                <EyeOff className="h-3 w-3" />
                              ) : (
                                <Eye className="h-3 w-3" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(cred.credentials.password!, 'Password')}
                              className="h-6 w-6 p-0"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 p-4 bg-muted/30 rounded-lg border">
          <h2 className="text-sm font-semibold mb-2">Quick Tips</h2>
          <ul className="space-y-1.5 text-xs text-muted-foreground">
            <li>• Check your follow-up leads daily to ensure timely customer engagement</li>
            <li>• Review not connected leads and plan callback strategies</li>
            <li>• Keep your call logs updated for better performance tracking</li>
            {credentials.length > 0 && (
              <li>• Use the subscription credentials above to access shared services</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}


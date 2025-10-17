"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Users, Clock, PhoneOff, Phone, Database } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface DashboardStats {
  newLeads: number;
  followUpLeads: number;
  notConnectedLeads: number;
  totalCalls: number;
}

interface Employee {
  whalesync_postgres_id: string;
  full_name: string;
  official_email: string;
}

export default function EmployeeDemoPage() {
  const [stats, setStats] = useState<DashboardStats>({
    newLeads: 0,
    followUpLeads: 0,
    notConnectedLeads: 0,
    totalCalls: 0,
  });
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    if (selectedEmployee) {
      loadDashboardData(selectedEmployee);
    }
  }, [selectedEmployee]);

  const loadEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from("Employee Directory")
        .select("whalesync_postgres_id, full_name, official_email")
        .not("official_email", "is", null)
        .order("full_name");

      if (error) {
        console.error("Supabase error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        throw error;
      }
      
      setEmployees(data || []);
      
      if (data && data.length > 0) {
        setSelectedEmployee(data[0].official_email);
        toast.success(`Found ${data.length} employees`);
      } else {
        toast.error("No employees found in database");
      }
    } catch (error: any) {
      console.error("Error loading employees:", error);
      toast.error(error.message || "Failed to load employees. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardData = async (email: string) => {
    if (!email) return;
    
    setLoading(true);
    try {
      // Get employee UUID from email first
      const { data: empData, error: empError } = await supabase
        .from("Employee Directory")
        .select("whalesync_postgres_id")
        .eq("official_email", email)
        .single();

      if (empError || !empData) {
        toast.error("Employee not found");
        setLoading(false);
        return;
      }

      const employeeUUID = empData.whalesync_postgres_id;

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
    } catch (error) {
      console.error("Error loading dashboard:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const navigationCards = [
    {
      title: "New Leads",
      icon: Users,
      count: stats.newLeads,
      href: `/employee/demo/new-leads?email=${selectedEmployee}`,
      color: "bg-blue-500",
      hoverColor: "hover:bg-blue-600",
    },
    {
      title: "Follow Up Leads",
      icon: Clock,
      count: stats.followUpLeads,
      href: `/employee/demo/follow-up-leads?email=${selectedEmployee}`,
      color: "bg-orange-500",
      hoverColor: "hover:bg-orange-600",
    },
    {
      title: "Not Connected Leads",
      icon: PhoneOff,
      count: stats.notConnectedLeads,
      href: `/employee/demo/not-connected-leads?email=${selectedEmployee}`,
      color: "bg-red-500",
      hoverColor: "hover:bg-red-600",
    },
    {
      title: "My Call Logs",
      icon: Phone,
      count: stats.totalCalls,
      href: `/employee/demo/call-logs?email=${selectedEmployee}`,
      color: "bg-green-500",
      hoverColor: "hover:bg-green-600",
    },
  ];

  if (loading && employees.length === 0) {
    return (
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
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 p-4">
        <div className="container mx-auto">
          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            🚀 <strong>Demo Mode</strong> - This is a test environment. Select an employee to view their dashboard.
          </p>
        </div>
      </div>

      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Employee Dashboard - Demo Mode</h1>
          
          <Card className="max-w-md mb-6">
            <CardContent className="p-4">
              <Label htmlFor="employee-select" className="mb-2 block">
                Select Employee to View
              </Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger id="employee-select">
                  <SelectValue placeholder="Choose an employee..." />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.whalesync_postgres_id} value={emp.official_email}>
                      {emp.full_name} ({emp.official_email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <p className="text-muted-foreground">
            Viewing dashboard for: <strong>{employees.find(e => e.official_email === selectedEmployee)?.full_name || "..."}</strong>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {navigationCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link key={card.href} href={card.href}>
                <Card className="group cursor-pointer transition-all hover:shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-lg ${card.color} text-white`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold mb-1">{card.count}</p>
                      <p className="text-sm text-muted-foreground">{card.title}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        <div className="mt-8 p-6 bg-muted/50 rounded-lg">
          <h2 className="text-lg font-semibold mb-3">Demo Mode Info</h2>
          <ul className="space-y-2 text-sm text-muted-foreground mb-4">
            <li>• This demo allows you to test the employee portal without authentication</li>
            <li>• Select any employee from the dropdown to view their data</li>
            <li>• To set up real authentication, create a Supabase user and use /employee/login</li>
          </ul>
          <Link href="/employee/demo/db-checker">
            <Button variant="outline" size="sm">
              <Database className="h-4 w-4 mr-2" />
              Check Database Connection
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}


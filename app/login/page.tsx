"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log("Attempting login with:", email);
      
      // Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        console.error("Auth error:", authError);
        setLoading(false);
        if (authError.message.includes("Invalid login credentials")) {
          toast.error("Invalid email or password. Please check your credentials.");
        } else {
          toast.error(authError.message);
        }
        return;
      }

      if (!authData.user) {
        console.error("No user data returned");
        setLoading(false);
        toast.error("Login failed - no user data");
        return;
      }

      console.log("User authenticated:", authData.user.email);

      // Check if user is an employee or HR
      const { data: employeeData, error: employeeError } = await supabase
        .from("Employee Directory")
        .select("whalesync_postgres_id, full_name, job_title, department")
        .eq("official_email", authData.user.email)
        .single();

      console.log("Employee check:", { employeeData, employeeError });

      if (employeeData) {
        // Check if user is HR
        const isHR = employeeData.job_title?.toLowerCase().includes('hr') || 
                    employeeData.department?.toLowerCase().includes('hr');
        
        if (isHR) {
          console.log("Redirecting to HR dashboard");
          toast.success(`Welcome back, ${employeeData.full_name || "HR"}!`);
          setLoading(false);
          window.location.href = "/dashboard/attendance/hr";
        } else {
          // User is a regular employee
          console.log("Redirecting to employee dashboard");
          toast.success(`Welcome back, ${employeeData.full_name || "Employee"}!`);
          setLoading(false);
          window.location.href = "/employee";
        }
      } else {
        // User is admin (not in Employee Directory)
        console.log("Redirecting to admin dashboard");
        toast.success("Welcome back, Admin!");
        setLoading(false);
        window.location.href = "/dashboard";
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.message || "An error occurred during login");
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      // Get first employee from database
      const { data: employees, error } = await supabase
        .from("Employee Directory")
        .select("official_email, full_name")
        .limit(5);

      if (error || !employees || employees.length === 0) {
        toast.error("No employees found in database. Please add employees first.");
        setLoading(false);
        return;
      }

      // Show employee selection or use first employee
      if (!selectedEmployee && employees.length > 0) {
        toast.info("Demo mode: Select an employee to continue");
        setLoading(false);
        return;
      }

      // For demo, we'll just redirect to employee view
      // In production, you would need actual auth
      toast.success("Demo mode activated!");
      router.push("/employee/demo");
    } catch (error: any) {
      console.error("Demo login error:", error);
      toast.error("Failed to start demo mode");
    } finally {
      setLoading(false);
    }
  };

  const loadDemoEmployees = async () => {
    try {
      const { data: employees } = await supabase
        .from("Employee Directory")
        .select("official_email, full_name")
        .limit(10);

      return employees || [];
    } catch (error) {
      console.error("Error loading employees:", error);
      return [];
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Welcome Back</CardTitle>
          <CardDescription className="text-center">
            Sign in to access your CRM dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="demo">Demo Mode</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
                <div className="text-xs text-center text-muted-foreground mt-4">
                  <p>Don't have credentials? Try Demo Mode →</p>
                </div>
              </form>
            </TabsContent>
            
            <TabsContent value="demo">
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground space-y-2">
                  <p><strong>Demo Mode</strong> - Test the application without authentication</p>
                  <p className="text-xs">• Admin Demo: View admin dashboard</p>
                  <p className="text-xs">• Employee Demo: View employee dashboard</p>
                  <p className="text-xs">• HR Demo: View HR attendance management</p>
                </div>
                
                <div className="space-y-2">
                  <Button 
                    onClick={() => {
                      console.log("Redirecting to admin dashboard");
                      document.cookie = 'demo_user_role=admin; path=/; max-age=3600';
                      window.location.href = "/dashboard";
                    }} 
                    className="w-full"
                    variant="outline"
                  >
                    Enter as Admin
                  </Button>
                  <Button 
                    onClick={() => {
                      console.log("Redirecting to employee demo");
                      document.cookie = 'demo_user_role=employee; path=/; max-age=3600';
                      window.location.href = "/employee";
                    }} 
                    className="w-full"
                    variant="outline"
                  >
                    Enter as Employee
                  </Button>
                  <Button 
                    onClick={() => {
                      console.log("Redirecting to HR dashboard");
                      // Set a demo flag in cookie to bypass auth for demo
                      document.cookie = 'demo_user_role=hr; path=/; max-age=3600';
                      window.location.href = "/dashboard/attendance/hr";
                    }} 
                    className="w-full"
                    variant="default"
                  >
                    Enter as HR
                  </Button>
                </div>

                <div className="text-xs text-center text-muted-foreground mt-4 p-3 bg-muted/50 rounded-md">
                  <p className="font-semibold mb-1">Setup Instructions:</p>
                  <p>To use real login, create users in Supabase Authentication.</p>
                  <p className="mt-1">Employees must also exist in "Employee Directory" table.</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}


"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Allow demo mode (no authentication required)
      const isDemoMode = true; // Set to false for production
      
      if (!user?.email) {
        if (!isDemoMode) {
          router.push("/login");
          return;
        }
        // Demo mode - allow access
        setAuthenticated(true);
        setLoading(false);
        return;
      }

      // Verify user is an employee
      const { data: employeeData } = await supabase
        .from("Employee Directory")
        .select("whalesync_postgres_id")
        .eq("official_email", user.email)
        .single();

      if (!employeeData && !isDemoMode) {
        // Not an employee, redirect to admin dashboard
        router.push("/dashboard");
        return;
      }

      setAuthenticated(true);
    } catch (error) {
      console.error("Auth check error:", error);
      // In demo mode, allow access even on error
      const isDemoMode = true;
      if (!isDemoMode) {
        router.push("/login");
      } else {
        setAuthenticated(true);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return null;
  }

  return <>{children}</>;
}


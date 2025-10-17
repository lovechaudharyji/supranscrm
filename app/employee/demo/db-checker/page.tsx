"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Loader2, Database } from "lucide-react";
import { toast } from "sonner";

interface CheckResult {
  name: string;
  status: "success" | "error" | "pending";
  message: string;
  count?: number;
}

export default function DatabaseChecker() {
  const [checking, setChecking] = useState(false);
  const [results, setResults] = useState<CheckResult[]>([]);

  const runChecks = async () => {
    setChecking(true);
    const checkResults: CheckResult[] = [];

    // Check 1: Employee Directory table
    try {
      const { data, error, count } = await supabase
        .from("Employee Directory")
        .select("*", { count: "exact", head: true });

      if (error) {
        checkResults.push({
          name: "Employee Directory Table",
          status: "error",
          message: `Error: ${error.message}`,
        });
      } else {
        checkResults.push({
          name: "Employee Directory Table",
          status: "success",
          message: "Table accessible",
          count: count || 0,
        });
      }
    } catch (error: any) {
      checkResults.push({
        name: "Employee Directory Table",
        status: "error",
        message: error.message,
      });
    }

    // Check 2: Leads table
    try {
      const { data, error, count } = await supabase
        .from("Leads")
        .select("*", { count: "exact", head: true });

      if (error) {
        checkResults.push({
          name: "Leads Table",
          status: "error",
          message: `Error: ${error.message}`,
        });
      } else {
        checkResults.push({
          name: "Leads Table",
          status: "success",
          message: "Table accessible",
          count: count || 0,
        });
      }
    } catch (error: any) {
      checkResults.push({
        name: "Leads Table",
        status: "error",
        message: error.message,
      });
    }

    // Check 3: Calls table
    try {
      const { data, error, count } = await supabase
        .from("Calls")
        .select("*", { count: "exact", head: true });

      if (error) {
        checkResults.push({
          name: "Calls Table",
          status: "error",
          message: `Error: ${error.message}`,
        });
      } else {
        checkResults.push({
          name: "Calls Table",
          status: "success",
          message: "Table accessible",
          count: count || 0,
        });
      }
    } catch (error: any) {
      checkResults.push({
        name: "Calls Table",
        status: "error",
        message: error.message,
      });
    }

    // Check 4: Leads with assigned_to field
    try {
      const { data, error, count } = await supabase
        .from("Leads")
        .select("assigned_to", { count: "exact" })
        .not("assigned_to", "is", null);

      if (error) {
        checkResults.push({
          name: "Leads with assigned_to",
          status: "error",
          message: `Error: ${error.message}`,
        });
      } else {
        checkResults.push({
          name: "Leads with assigned_to",
          status: "success",
          message: "Column exists and has data",
          count: count || 0,
        });
      }
    } catch (error: any) {
      checkResults.push({
        name: "Leads with assigned_to",
        status: "error",
        message: error.message,
      });
    }

    // Check 5: Employees with official_email
    try {
      const { data, error, count } = await supabase
        .from("Employee Directory")
        .select("official_email", { count: "exact" })
        .not("official_email", "is", null);

      if (error) {
        checkResults.push({
          name: "Employees with email",
          status: "error",
          message: `Error: ${error.message}`,
        });
      } else {
        checkResults.push({
          name: "Employees with email",
          status: "success",
          message: "Email field populated",
          count: count || 0,
        });
      }
    } catch (error: any) {
      checkResults.push({
        name: "Employees with email",
        status: "error",
        message: error.message,
      });
    }

    // Check 6: Test query for leads stages
    try {
      const { data, error } = await supabase
        .from("Leads")
        .select("stage")
        .limit(10);

      if (error) {
        checkResults.push({
          name: "Lead Stages",
          status: "error",
          message: `Error: ${error.message}`,
        });
      } else {
        const stages = [...new Set(data?.map(d => d.stage).filter(Boolean))];
        checkResults.push({
          name: "Lead Stages",
          status: "success",
          message: `Found stages: ${stages.length > 0 ? stages.join(", ") : "None"}`,
        });
      }
    } catch (error: any) {
      checkResults.push({
        name: "Lead Stages",
        status: "error",
        message: error.message,
      });
    }

    setResults(checkResults);
    setChecking(false);

    const errors = checkResults.filter(r => r.status === "error");
    if (errors.length > 0) {
      toast.error(`${errors.length} check(s) failed`);
    } else {
      toast.success("All checks passed!");
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Database className="h-8 w-8" />
            Database Connection Checker
          </h1>
          <p className="text-muted-foreground">
            Run checks to verify your Supabase database setup for the Employee Portal
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Run Diagnostics</CardTitle>
            <CardDescription>
              This will check if all required tables and columns are accessible
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={runChecks} disabled={checking}>
              {checking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running Checks...
                </>
              ) : (
                "Run Database Checks"
              )}
            </Button>
          </CardContent>
        </Card>

        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Check Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className="flex items-start justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-start gap-3">
                      {result.status === "success" ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                      )}
                      <div>
                        <p className="font-medium">{result.name}</p>
                        <p className="text-sm text-muted-foreground">{result.message}</p>
                        {result.count !== undefined && (
                          <Badge variant="secondary" className="mt-1">
                            {result.count} record{result.count !== 1 ? "s" : ""}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Badge variant={result.status === "success" ? "default" : "destructive"}>
                      {result.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h3 className="font-semibold mb-2">Common Issues & Solutions</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <strong>Table not found:</strong> Check that table names match exactly (case-sensitive)
            </li>
            <li>
              <strong>Column not found:</strong> Verify column names in your Supabase table schema
            </li>
            <li>
              <strong>RLS Error:</strong> Disable Row Level Security (RLS) policies temporarily or configure them properly
            </li>
            <li>
              <strong>No data:</strong> Make sure you have sample data in your tables
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}


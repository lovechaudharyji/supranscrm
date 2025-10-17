"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Users, FileSpreadsheet, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function AttendancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Attendance Management</h1>
        <p className="text-slate-500 mt-1">Choose your attendance portal based on your role.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* HR Portal */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 text-blue-600 p-3 rounded-full">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <CardTitle>HR Portal</CardTitle>
                <CardDescription>Manage and edit attendance records</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 mb-4">
              Mark attendance, edit time records, and manage employee attendance with full editing capabilities.
            </p>
            <Link href="/dashboard/attendance/hr">
              <Button className="w-full">
                Access HR Portal
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Admin Portal */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="bg-green-100 text-green-600 p-3 rounded-full">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <CardTitle>Admin Portal</CardTitle>
                <CardDescription>View attendance summaries and analytics</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 mb-4">
              View attendance statistics, filter records, and monitor employee attendance patterns.
            </p>
            <Link href="/dashboard/attendance/admin">
              <Button className="w-full">
                Access Admin Portal
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Accounts Portal */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 text-purple-600 p-3 rounded-full">
                <FileSpreadsheet className="h-6 w-6" />
              </div>
              <div>
                <CardTitle>Accounts Portal</CardTitle>
                <CardDescription>Monthly summaries for salary processing</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 mb-4">
              Generate monthly attendance summaries, export reports, and prepare data for payroll processing.
            </p>
            <Link href="/dashboard/attendance/accounts">
              <Button className="w-full">
                Access Accounts Portal
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Overview</CardTitle>
          <CardDescription>Attendance system features and capabilities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">3</div>
              <div className="text-sm text-slate-600">Portal Types</div>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">Real-time</div>
              <div className="text-sm text-slate-600">Data Updates</div>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">CSV</div>
              <div className="text-sm text-slate-600">Export Reports</div>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">Multi-role</div>
              <div className="text-sm text-slate-600">Access Control</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


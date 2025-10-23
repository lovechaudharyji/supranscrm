"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Users, BarChart3, Settings } from "lucide-react";
import HRLayout from "../hr-layout";

export default function HRDashboard() {
  const hrFeatures = [
    {
      title: "Attendance Management",
      description: "View and manage employee attendance records",
      icon: Calendar,
      href: "/dashboard/attendance/hr",
      color: "bg-blue-500/10 text-blue-600 border-blue-200"
    },
    {
      title: "Mark Attendance",
      description: "Mark attendance for employees",
      icon: Clock,
      href: "/dashboard/attendance/hr?tab=mark",
      color: "bg-green-500/10 text-green-600 border-green-200"
    },
    {
      title: "Department Analytics",
      description: "View attendance analytics by department",
      icon: BarChart3,
      href: "/dashboard/attendance/hr?tab=analytics",
      color: "bg-purple-500/10 text-purple-600 border-purple-200"
    },
    {
      title: "Employee Reports",
      description: "Generate attendance reports for employees",
      icon: Users,
      href: "/dashboard/attendance/hr?tab=reports",
      color: "bg-orange-500/10 text-orange-600 border-orange-200"
    },
    {
      title: "Settings",
      description: "Configure attendance settings and policies",
      icon: Settings,
      href: "/dashboard/attendance/hr?tab=settings",
      color: "bg-gray-500/10 text-gray-600 border-gray-200"
    }
  ];

  return (
    <HRLayout title="HR Dashboard">
      <div className="p-6 space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">HR Dashboard</h1>
          <p className="text-muted-foreground">Manage employee attendance and HR operations</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hrFeatures.map((feature, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${feature.color}`}>
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => window.location.href = feature.href}
                >
                  Access {feature.title}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 p-6 bg-muted/50 rounded-lg">
          <h2 className="text-xl font-semibold text-foreground mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              className="h-16 text-left justify-start"
              variant="outline"
              onClick={() => window.location.href = "/dashboard/attendance/hr"}
            >
              <Calendar className="mr-3 h-5 w-5" />
              <div>
                <div className="font-semibold">View Attendance</div>
                <div className="text-sm text-muted-foreground">Check today's attendance</div>
              </div>
            </Button>
            <Button 
              className="h-16 text-left justify-start"
              variant="outline"
              onClick={() => window.location.href = "/dashboard/attendance/hr?tab=mark"}
            >
              <Clock className="mr-3 h-5 w-5" />
              <div>
                <div className="font-semibold">Mark Attendance</div>
                <div className="text-sm text-muted-foreground">Record employee attendance</div>
              </div>
            </Button>
          </div>
        </div>
      </div>
    </HRLayout>
  );
}

"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Users, 
  UserCheck, 
  UserX, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  Activity,
  Target
} from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  className?: string;
}

export function KPICard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend, 
  className = "" 
}: KPICardProps) {
  return (
    <Card className={`hover:shadow-lg transition-shadow ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
            {trend && (
              <div className={`flex items-center mt-2 text-xs ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                {trend.isPositive ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1" />
                )}
                {trend.value}
              </div>
            )}
          </div>
          <div className="text-muted-foreground">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface EmployeeKPIsProps {
  totalEmployees: number;
  activeEmployees: number;
  newHires: number;
  turnoverRate: number;
  avgTenure: number;
  attendanceRate: number;
  performanceScore: number;
  engagementScore: number;
}

export function EmployeeKPIs({
  totalEmployees,
  activeEmployees,
  newHires,
  turnoverRate,
  avgTenure,
  attendanceRate,
  performanceScore,
  engagementScore
}: EmployeeKPIsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <KPICard
        title="Total Employees"
        value={totalEmployees}
        subtitle={`${newHires} new this month`}
        icon={<Users className="h-8 w-8 text-blue-500" />}
        trend={{
          value: `+${newHires} new hires`,
          isPositive: true
        }}
      />
      
      <KPICard
        title="Active Employees"
        value={activeEmployees}
        subtitle={`${((activeEmployees / totalEmployees) * 100).toFixed(1)}% active`}
        icon={<UserCheck className="h-8 w-8 text-green-500" />}
        trend={{
          value: "All systems operational",
          isPositive: true
        }}
      />
      
      <KPICard
        title="Turnover Rate"
        value={`${turnoverRate.toFixed(1)}%`}
        subtitle="This quarter"
        icon={<UserX className="h-8 w-8 text-red-500" />}
        trend={{
          value: turnoverRate < 10 ? "Below industry average" : "Above target",
          isPositive: turnoverRate < 10
        }}
      />
      
      <KPICard
        title="Avg Tenure"
        value={`${avgTenure.toFixed(1)}y`}
        subtitle="Years of experience"
        icon={<Clock className="h-8 w-8 text-purple-500" />}
        trend={{
          value: "+0.5y from last year",
          isPositive: true
        }}
      />
      
      <KPICard
        title="Attendance Rate"
        value={`${attendanceRate.toFixed(1)}%`}
        subtitle="This month"
        icon={<Activity className="h-8 w-8 text-orange-500" />}
        trend={{
          value: "+2% from last month",
          isPositive: true
        }}
      />
      
      <KPICard
        title="Performance Score"
        value={`${performanceScore.toFixed(1)}/5`}
        subtitle="Average rating"
        icon={<Target className="h-8 w-8 text-yellow-500" />}
        trend={{
          value: "+0.2 from last quarter",
          isPositive: true
        }}
      />
      
      <KPICard
        title="Engagement Score"
        value={`${engagementScore.toFixed(1)}/5`}
        subtitle="Employee satisfaction"
        icon={<TrendingUp className="h-8 w-8 text-pink-500" />}
        trend={{
          value: "+0.3 from last survey",
          isPositive: true
        }}
      />
    </div>
  );
}


"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from "recharts";
import { 
  BarChart3, 
  PieChart as PieChartIcon, 
  TrendingUp,
  Users,
  Target,
  Activity
} from "lucide-react";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C'];

interface ChartCardProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function ChartCard({ title, icon, children, className = "" }: ChartCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}

interface DepartmentDistributionProps {
  data: Array<{
    department: string;
    count: number;
    percentage: number;
  }>;
}

export function DepartmentDistributionChart({ data }: DepartmentDistributionProps) {
  return (
    <ChartCard
      title="Department Distribution"
      icon={<PieChartIcon className="h-5 w-5" />}
    >
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ department, percentage }) => `${department}: ${percentage.toFixed(1)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="count"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

interface PerformanceDistributionProps {
  data: Array<{
    rating: string;
    count: number;
    percentage: number;
  }>;
}

export function PerformanceDistributionChart({ data }: PerformanceDistributionProps) {
  return (
    <ChartCard
      title="Performance Distribution"
      icon={<BarChart3 className="h-5 w-5" />}
    >
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="rating" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

interface AttendanceTrendProps {
  data: Array<{
    date: string;
    attendance: number;
    lateArrivals: number;
  }>;
}

export function AttendanceTrendChart({ data }: AttendanceTrendProps) {
  return (
    <ChartCard
      title="Attendance Trend"
      icon={<TrendingUp className="h-5 w-5" />}
    >
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="attendance" stroke="#8884d8" strokeWidth={2} />
          <Line type="monotone" dataKey="lateArrivals" stroke="#ff7300" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

interface ProductivityMetricsProps {
  data: Array<{
    employee: string;
    tasksCompleted: number;
    hoursWorked: number;
    efficiency: number;
  }>;
}

export function ProductivityMetricsChart({ data }: ProductivityMetricsProps) {
  return (
    <ChartCard
      title="Productivity Metrics"
      icon={<Activity className="h-5 w-5" />}
    >
      <div className="space-y-4">
        {data.map((metric, index) => (
          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium">{metric.employee}</p>
              <p className="text-sm text-muted-foreground">
                {metric.tasksCompleted} tasks • {metric.hoursWorked}h worked
              </p>
            </div>
            <div className="text-right">
              <p className="font-bold">{metric.efficiency.toFixed(0)}%</p>
              <div className="w-20 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${metric.efficiency}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ChartCard>
  );
}

interface EngagementScoresProps {
  data: Array<{
    department: string;
    score: number;
    trend: number;
  }>;
}

export function EngagementScoresChart({ data }: EngagementScoresProps) {
  return (
    <ChartCard
      title="Engagement Scores by Department"
      icon={<Users className="h-5 w-5" />}
    >
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="department" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="score" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}


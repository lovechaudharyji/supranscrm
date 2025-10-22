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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";
import { 
  BarChart3, 
  PieChart as PieChartIcon, 
  TrendingUp,
  Target,
  Star,
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

interface GoalAchievementProps {
  data: Array<{
    employee: string;
    goalsCompleted: number;
    goalsTotal: number;
    achievementRate: number;
  }>;
}

export function GoalAchievementChart({ data }: GoalAchievementProps) {
  return (
    <ChartCard
      title="Goal Achievement by Employee"
      icon={<Target className="h-5 w-5" />}
    >
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="employee" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="achievementRate" fill="#00C49F" />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

interface CompetencyRadarProps {
  data: Array<{
    competency: string;
    current: number;
    target: number;
  }>;
}

export function CompetencyRadarChart({ data }: CompetencyRadarProps) {
  return (
    <ChartCard
      title="Competency Assessment"
      icon={<Star className="h-5 w-5" />}
    >
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="competency" />
          <PolarRadiusAxis />
          <Radar name="Current" dataKey="current" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
          <Radar name="Target" dataKey="target" stroke="#00C49F" fill="#00C49F" fillOpacity={0.6} />
          <Tooltip />
        </RadarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

interface PerformanceTrendProps {
  data: Array<{
    period: string;
    averageRating: number;
    goalCompletion: number;
    engagement: number;
  }>;
}

export function PerformanceTrendChart({ data }: PerformanceTrendProps) {
  return (
    <ChartCard
      title="Performance Trends"
      icon={<TrendingUp className="h-5 w-5" />}
    >
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="period" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="averageRating" stroke="#8884d8" strokeWidth={2} />
          <Line type="monotone" dataKey="goalCompletion" stroke="#00C49F" strokeWidth={2} />
          <Line type="monotone" dataKey="engagement" stroke="#FFBB28" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

interface DepartmentPerformanceProps {
  data: Array<{
    department: string;
    averageRating: number;
    goalCompletion: number;
    employeeCount: number;
  }>;
}

export function DepartmentPerformanceChart({ data }: DepartmentPerformanceProps) {
  return (
    <ChartCard
      title="Performance by Department"
      icon={<Activity className="h-5 w-5" />}
    >
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="department" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="averageRating" fill="#8884d8" />
          <Bar dataKey="goalCompletion" fill="#00C49F" />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

interface ReviewStatusProps {
  data: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
}

export function ReviewStatusChart({ data }: ReviewStatusProps) {
  return (
    <ChartCard
      title="Review Status Distribution"
      icon={<PieChartIcon className="h-5 w-5" />}
    >
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ status, percentage }) => `${status}: ${percentage.toFixed(1)}%`}
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

interface SkillGapProps {
  data: Array<{
    skill: string;
    currentLevel: number;
    targetLevel: number;
    gap: number;
  }>;
}

export function SkillGapChart({ data }: SkillGapProps) {
  return (
    <ChartCard
      title="Skill Gap Analysis"
      icon={<Target className="h-5 w-5" />}
    >
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="skill" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="currentLevel" fill="#8884d8" />
          <Bar dataKey="targetLevel" fill="#00C49F" />
          <Bar dataKey="gap" fill="#FF8042" />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

interface PerformanceMatrixProps {
  data: Array<{
    employee: string;
    performance: number;
    potential: number;
    category: string;
  }>;
}

export function PerformanceMatrixChart({ data }: PerformanceMatrixProps) {
  return (
    <ChartCard
      title="Performance vs Potential Matrix"
      icon={<Star className="h-5 w-5" />}
    >
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="employee" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="performance" fill="#8884d8" />
          <Bar dataKey="potential" fill="#00C49F" />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}


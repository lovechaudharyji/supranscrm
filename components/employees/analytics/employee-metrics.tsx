"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Target,
  TrendingUp,
  TrendingDown,
  Users,
  Award,
  BookOpen,
  GraduationCap
} from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  status?: 'good' | 'warning' | 'critical';
  icon: React.ReactNode;
}

export function MetricCard({ 
  title, 
  value, 
  description, 
  trend, 
  status = 'good',
  icon 
}: MetricCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              status === 'good' ? 'bg-green-100' : 
              status === 'warning' ? 'bg-yellow-100' : 'bg-red-100'
            }`}>
              {icon}
            </div>
            <div>
              <h3 className="font-semibold">{title}</h3>
              {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className={`text-2xl font-bold ${getStatusColor(status)}`}>
              {value}
            </p>
            {trend && (
              <div className={`flex items-center text-xs mt-1 ${
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
        </div>
      </CardContent>
    </Card>
  );
}

interface SkillGapProps {
  skill: string;
  gap: number;
  priority: 'High' | 'Medium' | 'Low';
  currentLevel: number;
  targetLevel: number;
}

export function SkillGapCard({ skill, gap, priority, currentLevel, targetLevel }: SkillGapProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">{skill}</h3>
          <Badge className={getPriorityColor(priority)}>
            {priority}
          </Badge>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span>Current Level</span>
            <span className="font-medium">{currentLevel}/10</span>
          </div>
          <Progress value={(currentLevel / 10) * 100} className="h-2" />
          
          <div className="flex items-center justify-between text-sm">
            <span>Target Level</span>
            <span className="font-medium">{targetLevel}/10</span>
          </div>
          <Progress value={(targetLevel / 10) * 100} className="h-2" />
          
          <div className="flex items-center justify-between text-sm">
            <span>Gap</span>
            <span className="font-medium text-red-600">{gap}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface RetentionRiskProps {
  employee: string;
  risk: number;
  factors: string[];
  department: string;
  tenure: number;
}

export function RetentionRiskCard({ employee, risk, factors, department, tenure }: RetentionRiskProps) {
  const getRiskColor = (risk: number) => {
    if (risk > 70) return 'text-red-600';
    if (risk > 40) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getRiskStatus = (risk: number) => {
    if (risk > 70) return 'critical';
    if (risk > 40) return 'warning';
    return 'good';
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold">{employee}</h3>
            <p className="text-sm text-muted-foreground">{department} • {tenure} years</p>
          </div>
          <div className="text-right">
            <p className={`text-lg font-bold ${getRiskColor(risk)}`}>
              {risk.toFixed(0)}%
            </p>
            <p className="text-xs text-muted-foreground">Risk Level</p>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${
                risk > 70 ? 'bg-red-500' : 
                risk > 40 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${risk}%` }}
            ></div>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm font-medium">Risk Factors:</p>
            {factors.map((factor, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertTriangle className="h-3 w-3 text-orange-500" />
                {factor}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface TrainingProgressProps {
  course: string;
  completed: number;
  inProgress: number;
  notStarted: number;
  total: number;
}

export function TrainingProgressCard({ course, completed, inProgress, notStarted, total }: TrainingProgressProps) {
  const completionRate = (completed / total) * 100;
  
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">{course}</h3>
          <Badge variant={completionRate > 80 ? "default" : completionRate > 50 ? "secondary" : "destructive"}>
            {completionRate.toFixed(0)}% Complete
          </Badge>
        </div>
        
        <div className="space-y-3">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full" 
              style={{ width: `${completionRate}%` }}
            ></div>
          </div>
          
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="text-center">
              <p className="font-medium text-green-600">{completed}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
            <div className="text-center">
              <p className="font-medium text-blue-600">{inProgress}</p>
              <p className="text-xs text-muted-foreground">In Progress</p>
            </div>
            <div className="text-center">
              <p className="font-medium text-gray-600">{notStarted}</p>
              <p className="text-xs text-muted-foreground">Not Started</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface WellnessMetricsProps {
  metric: string;
  score: number;
  trend: 'up' | 'down' | 'stable';
  target: number;
}

export function WellnessMetricsCard({ metric, score, trend, target }: WellnessMetricsProps) {
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <div className="h-4 w-4 bg-gray-400 rounded-full" />;
    }
  };

  const getScoreColor = (score: number, target: number) => {
    if (score >= target) return 'text-green-600';
    if (score >= target * 0.8) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">{metric}</h3>
          <div className="flex items-center gap-2">
            {getTrendIcon(trend)}
            <span className={`font-bold ${getScoreColor(score, target)}`}>
              {score}%
            </span>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Current Score</span>
            <span className="font-medium">{score}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${
                score >= target ? 'bg-green-500' : 
                score >= target * 0.8 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(100, (score / target) * 100)}%` }}
            ></div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>Target</span>
            <span className="font-medium">{target}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


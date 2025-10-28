"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Star, 
  Target, 
  Award, 
  TrendingUp, 
  TrendingDown,
  Clock,
  CheckCircle,
  AlertTriangle,
  Users,
  Calendar,
  FileText
} from "lucide-react";

interface PerformanceCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  status?: 'excellent' | 'good' | 'average' | 'needs-improvement';
}

export function PerformanceCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend, 
  status = 'good' 
}: PerformanceCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'average': return 'text-yellow-600';
      case 'needs-improvement': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className={`text-2xl font-bold mt-1 ${getStatusColor(status)}`}>
              {value}
            </p>
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

interface GoalCardProps {
  title: string;
  description: string;
  progress: number;
  target: string;
  current: number;
  unit: string;
  status: 'Not Started' | 'In Progress' | 'Completed' | 'Overdue';
  priority: 'High' | 'Medium' | 'Low';
  dueDate: string;
  assignee: string;
}

export function GoalCard({ 
  title, 
  description, 
  progress, 
  target, 
  current, 
  unit, 
  status, 
  priority, 
  dueDate, 
  assignee 
}: GoalCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'Not Started': return 'bg-gray-100 text-gray-800';
      case 'Overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
            <p className="text-sm text-muted-foreground mt-1">Assigned to: {assignee}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(status)}>
              {status}
            </Badge>
            <Badge className={getPriorityColor(priority)}>
              {priority}
            </Badge>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm font-medium">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${
                progress >= 80 ? 'bg-green-500' : 
                progress >= 60 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Current:</span>
              <p className="font-medium">{current.toLocaleString()} {unit}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Target:</span>
              <p className="font-medium">{target}</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Due Date:</span>
            <span className="font-medium">{dueDate}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface ReviewCardProps {
  employeeName: string;
  reviewerName: string;
  period: string;
  overallRating: number;
  status: 'Draft' | 'In Progress' | 'Completed' | 'Overdue';
  goalsCount: number;
  competenciesCount: number;
  nextReviewDate: string;
}

export function ReviewCard({ 
  employeeName, 
  reviewerName, 
  period, 
  overallRating, 
  status, 
  goalsCount, 
  competenciesCount, 
  nextReviewDate 
}: ReviewCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'Draft': return 'bg-yellow-100 text-yellow-800';
      case 'Overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 3.5) return 'text-blue-600';
    if (rating >= 2.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold">{employeeName}</h3>
            <p className="text-sm text-muted-foreground">{period} • Reviewed by {reviewerName}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(status)}>
              {status}
            </Badge>
            <div className={`text-lg font-bold ${getRatingColor(overallRating)}`}>
              {overallRating.toFixed(1)}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Goals:</span>
            <p className="font-medium">{goalsCount}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Competencies:</span>
            <p className="font-medium">{competenciesCount}</p>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Next review: {nextReviewDate}
            </span>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  className={`h-4 w-4 ${
                    i < Math.floor(overallRating) ? 'text-yellow-500 fill-current' : 'text-gray-300'
                  }`} 
                />
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface CompetencyCardProps {
  name: string;
  rating: number;
  comments: string;
  targetRating: number;
  improvement: number;
}

export function CompetencyCard({ name, rating, targetRating, comments, improvement }: CompetencyCardProps) {
  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 3.5) return 'text-blue-600';
    if (rating >= 2.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">{name}</h3>
          <div className="flex items-center gap-2">
            <span className={`font-bold ${getRatingColor(rating)}`}>
              {rating.toFixed(1)}
            </span>
            <span className="text-sm text-muted-foreground">/5</span>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span>Current Rating</span>
            <span className="font-medium">{rating.toFixed(1)}/5</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full" 
              style={{ width: `${(rating / 5) * 100}%` }}
            ></div>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span>Target Rating</span>
            <span className="font-medium">{targetRating.toFixed(1)}/5</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full" 
              style={{ width: `${(targetRating / 5) * 100}%` }}
            ></div>
          </div>
          
          <div className="pt-2 border-t">
            <p className="text-sm text-muted-foreground mb-1">Comments:</p>
            <p className="text-sm">{comments}</p>
          </div>
          
          {improvement > 0 && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <TrendingUp className="h-4 w-4" />
              <span>+{improvement.toFixed(1)} improvement needed</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}








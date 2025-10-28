"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  User, 
  Calendar, 
  FileText, 
  Target,
  Users,
  BookOpen,
  GraduationCap,
  Award,
  Star,
  TrendingUp,
  TrendingDown,
  Activity
} from "lucide-react";

interface OnboardingCardProps {
  title: string;
  description: string;
  progress: number;
  status: 'Not Started' | 'In Progress' | 'Completed' | 'Overdue';
  dueDate: string;
  assignee: string;
  tasks: number;
  completedTasks: number;
}

export function OnboardingCard({ 
  title, 
  description, 
  progress, 
  status, 
  dueDate, 
  assignee, 
  tasks, 
  completedTasks 
}: OnboardingCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'Not Started': return 'bg-gray-100 text-gray-800';
      case 'Overdue': return 'bg-red-100 text-red-800';
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
          <Badge className={getStatusColor(status)}>
            {status}
          </Badge>
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
              <span className="text-muted-foreground">Tasks:</span>
              <p className="font-medium">{completedTasks}/{tasks}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Due Date:</span>
              <p className="font-medium">{dueDate}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface TaskCardProps {
  title: string;
  description: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Overdue';
  priority: 'High' | 'Medium' | 'Low';
  assignee: string;
  dueDate: string;
  estimatedTime: number;
  category: string;
  checklist: Array<{
    id: string;
    item: string;
    completed: boolean;
  }>;
}

export function TaskCard({ 
  title, 
  description, 
  status, 
  priority, 
  assignee, 
  dueDate, 
  estimatedTime, 
  category, 
  checklist 
}: TaskCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
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

  const completedItems = checklist.filter(item => item.completed).length;
  const totalItems = checklist.length;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
            <p className="text-sm text-muted-foreground mt-1">Category: {category}</p>
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Assignee:</span>
              <p className="font-medium">{assignee}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Due Date:</span>
              <p className="font-medium">{dueDate}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Est. Time:</span>
              <p className="font-medium">{estimatedTime}h</p>
            </div>
            <div>
              <span className="text-muted-foreground">Progress:</span>
              <p className="font-medium">{completedItems}/{totalItems}</p>
            </div>
          </div>
          
          {checklist.length > 0 && (
            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-2">Checklist:</h4>
              <div className="space-y-2">
                {checklist.map((item) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <CheckCircle className={`h-4 w-4 ${item.completed ? 'text-green-500' : 'text-gray-300'}`} />
                    <span className={`text-sm ${item.completed ? 'line-through text-muted-foreground' : ''}`}>
                      {item.item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface WorkflowCardProps {
  name: string;
  description: string;
  department: string;
  role: string;
  duration: number;
  tasks: number;
  completionRate: number;
  avgCompletionTime: number;
  isActive: boolean;
  lastUsed: string;
}

export function WorkflowCard({ 
  name, 
  description, 
  department, 
  role, 
  duration, 
  tasks, 
  completionRate, 
  avgCompletionTime, 
  isActive, 
  lastUsed 
}: WorkflowCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold">{name}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
            <p className="text-sm text-muted-foreground mt-1">{department} • {role}</p>
          </div>
          <Badge variant={isActive ? "default" : "secondary"}>
            {isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Duration</span>
            <span className="font-medium">{duration} days</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Tasks</span>
            <span className="font-medium">{tasks}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Completion Rate</span>
            <span className="font-medium">{completionRate}%</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Avg Time</span>
            <span className="font-medium">{avgCompletionTime} days</span>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Last used: {lastUsed}
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <User className="h-4 w-4 mr-2" />
                View
              </Button>
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface NewEmployeeCardProps {
  name: string;
  email: string;
  department: string;
  role: string;
  startDate: string;
  manager: string;
  onboardingStatus: 'Not Started' | 'In Progress' | 'Completed' | 'Delayed';
  progress: number;
  currentTask?: string;
  nextMilestone?: string;
  daysRemaining: number;
}

export function NewEmployeeCard({ 
  name, 
  email, 
  department, 
  role, 
  startDate, 
  manager, 
  onboardingStatus, 
  progress, 
  currentTask, 
  nextMilestone, 
  daysRemaining 
}: NewEmployeeCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'Not Started': return 'bg-gray-100 text-gray-800';
      case 'Delayed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-lg font-medium">{name.split(' ').map(n => n[0]).join('')}</span>
            </div>
            <div>
              <h3 className="font-semibold">{name}</h3>
              <p className="text-sm text-muted-foreground">{email}</p>
              <p className="text-sm text-muted-foreground">{department} • {role}</p>
            </div>
          </div>
          <div className="text-right">
            <Badge className={getStatusColor(onboardingStatus)}>
              {onboardingStatus}
            </Badge>
            <p className="text-sm text-muted-foreground mt-1">
              {daysRemaining} days remaining
            </p>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm font-medium">{progress.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Current Task:</span>
              <p className="font-medium">{currentTask || 'None'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Next Milestone:</span>
              <p className="font-medium">{nextMilestone || 'None'}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Manager:</span>
              <p className="font-medium">{manager}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Start Date:</span>
              <p className="font-medium">{startDate}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface OnboardingStatsProps {
  totalEmployees: number;
  completedOnboardings: number;
  inProgressOnboardings: number;
  overdueOnboardings: number;
  avgCompletionTime: number;
  satisfactionScore: number;
}

export function OnboardingStats({ 
  totalEmployees, 
  completedOnboardings, 
  inProgressOnboardings, 
  overdueOnboardings, 
  avgCompletionTime, 
  satisfactionScore 
}: OnboardingStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Employees</p>
              <p className="text-2xl font-bold">{totalEmployees}</p>
              <p className="text-xs text-blue-600">
                <Users className="h-3 w-3 inline mr-1" />
                This month
              </p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold">{completedOnboardings}</p>
              <p className="text-xs text-green-600">
                <CheckCircle className="h-3 w-3 inline mr-1" />
                This quarter
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">In Progress</p>
              <p className="text-2xl font-bold">{inProgressOnboardings}</p>
              <p className="text-xs text-blue-600">
                <Clock className="h-3 w-3 inline mr-1" />
                Currently
              </p>
            </div>
            <Clock className="h-8 w-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Overdue</p>
              <p className="text-2xl font-bold">{overdueOnboardings}</p>
              <p className="text-xs text-red-600">
                <AlertTriangle className="h-3 w-3 inline mr-1" />
                Needs attention
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Avg Completion</p>
              <p className="text-2xl font-bold">{avgCompletionTime}d</p>
              <p className="text-xs text-green-600">
                <TrendingDown className="h-3 w-3 inline mr-1" />
                -2d from last month
              </p>
            </div>
            <Target className="h-8 w-8 text-purple-500" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Satisfaction</p>
              <p className="text-2xl font-bold">{satisfactionScore}/5</p>
              <p className="text-xs text-green-600">
                <Star className="h-3 w-3 inline mr-1" />
                +0.3 from last survey
              </p>
            </div>
            <Star className="h-8 w-8 text-yellow-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}








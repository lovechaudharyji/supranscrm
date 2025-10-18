"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ScatterChart,
  Scatter
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  Clock,
  DollarSign,
  Activity,
  Zap,
  Brain,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  MapPin,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Star,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { format } from "date-fns";

interface LeadAnalytics {
  totalLeads: number;
  convertedLeads: number;
  conversionRate: number;
  avgResponseTime: number;
  totalRevenue: number;
  revenueGrowth: number;
  leadQualityScore: number;
  topSources: Array<{ source: string; count: number; conversion: number }>;
  stageDistribution: Array<{ stage: string; count: number; percentage: number }>;
  responseTimeTrend: Array<{ date: string; avgTime: number }>;
  leadSourcePerformance: Array<{ source: string; leads: number; revenue: number; conversion: number }>;
  teamPerformance: Array<{ name: string; leads: number; converted: number; revenue: number; score: number }>;
  leadIntentAnalysis: Array<{ intent: string; count: number; probability: number }>;
  geographicDistribution: Array<{ city: string; leads: number; revenue: number }>;
  timeBasedAnalysis: Array<{ hour: number; leads: number; conversion: number }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export function AdvancedAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<LeadAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('conversion');

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // Fetch leads data
      const { data: leads, error: leadsError } = await supabase
        .from('Leads')
        .select('*')
        .order('date_and_time', { ascending: false });

      if (leadsError) throw leadsError;

      // Calculate analytics
      const totalLeads = leads?.length || 0;
      const convertedLeads = leads?.filter(lead => lead.stage === 'Converted').length || 0;
      const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;
      
      // Calculate average response time (mock calculation)
      const avgResponseTime = Math.random() * 24; // Random between 0-24 hours
      
      // Calculate total revenue
      const totalRevenue = leads?.reduce((sum, lead) => {
        return sum + (parseFloat(lead.deal_amount) || 0);
      }, 0) || 0;
      
      const revenueGrowth = Math.random() * 20 - 5; // Random between -5% to 15%
      
      // Calculate lead quality score (mock calculation)
      const leadQualityScore = Math.random() * 40 + 60; // Random between 60-100
      
      // Source analysis
      const sourceCounts: { [key: string]: number } = {};
      const sourceConversions: { [key: string]: number } = {};
      
      leads?.forEach(lead => {
        const source = lead.source || 'Unknown';
        sourceCounts[source] = (sourceCounts[source] || 0) + 1;
        if (lead.stage === 'Converted') {
          sourceConversions[source] = (sourceConversions[source] || 0) + 1;
        }
      });
      
      const topSources = Object.keys(sourceCounts).map(source => ({
        source,
        count: sourceCounts[source],
        conversion: sourceCounts[source] > 0 ? (sourceConversions[source] || 0) / sourceCounts[source] * 100 : 0
      })).sort((a, b) => b.count - a.count).slice(0, 5);
      
      // Stage distribution
      const stageCounts: { [key: string]: number } = {};
      leads?.forEach(lead => {
        const stage = lead.stage || 'Unknown';
        stageCounts[stage] = (stageCounts[stage] || 0) + 1;
      });
      
      const stageDistribution = Object.keys(stageCounts).map(stage => ({
        stage,
        count: stageCounts[stage],
        percentage: totalLeads > 0 ? (stageCounts[stage] / totalLeads) * 100 : 0
      }));
      
      // Response time trend (mock data)
      const responseTimeTrend = Array.from({ length: 30 }, (_, i) => ({
        date: format(new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000), 'MMM dd'),
        avgTime: Math.random() * 24
      }));
      
      // Lead source performance
      const leadSourcePerformance = topSources.map(source => ({
        source: source.source,
        leads: source.count,
        revenue: Math.random() * 100000,
        conversion: source.conversion
      }));
      
      // Team performance (mock data)
      const teamPerformance = [
        { name: 'John Doe', leads: 45, converted: 12, revenue: 150000, score: 85 },
        { name: 'Jane Smith', leads: 38, converted: 15, revenue: 180000, score: 92 },
        { name: 'Mike Johnson', leads: 52, converted: 8, revenue: 120000, score: 78 },
        { name: 'Sarah Wilson', leads: 41, converted: 18, revenue: 200000, score: 95 }
      ];
      
      // Lead intent analysis (mock data)
      const leadIntentAnalysis = [
        { intent: 'High Intent', count: 25, probability: 85 },
        { intent: 'Medium Intent', count: 45, probability: 60 },
        { intent: 'Low Intent', count: 30, probability: 25 },
        { intent: 'No Intent', count: 20, probability: 5 }
      ];
      
      // Geographic distribution
      const cityCounts: { [key: string]: number } = {};
      const cityRevenue: { [key: string]: number } = {};
      
      leads?.forEach(lead => {
        const city = lead.city || 'Unknown';
        cityCounts[city] = (cityCounts[city] || 0) + 1;
        cityRevenue[city] = (cityRevenue[city] || 0) + (parseFloat(lead.deal_amount) || 0);
      });
      
      const geographicDistribution = Object.keys(cityCounts).map(city => ({
        city,
        leads: cityCounts[city],
        revenue: cityRevenue[city]
      })).sort((a, b) => b.leads - a.leads).slice(0, 10);
      
      // Time-based analysis (mock data)
      const timeBasedAnalysis = Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        leads: Math.floor(Math.random() * 20),
        conversion: Math.random() * 30 + 10
      }));
      
      setAnalytics({
        totalLeads,
        convertedLeads,
        conversionRate,
        avgResponseTime,
        totalRevenue,
        revenueGrowth,
        leadQualityScore,
        topSources,
        stageDistribution,
        responseTimeTrend,
        leadSourcePerformance,
        teamPerformance,
        leadIntentAnalysis,
        geographicDistribution,
        timeBasedAnalysis
      });
      
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" style={{ fontFamily: 'Geist, sans-serif' }}>
            Advanced Analytics Dashboard
          </h2>
          <p className="text-muted-foreground">
            Comprehensive insights into your lead management performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button variant="outline" size="sm" onClick={fetchAnalytics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Leads</p>
                <p className="text-2xl font-bold">{analytics.totalLeads}</p>
                <p className="text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3 inline mr-1" />
                  +12% from last month
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
                <p className="text-sm font-medium text-muted-foreground">Conversion Rate</p>
                <p className="text-2xl font-bold">{analytics.conversionRate.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3 inline mr-1" />
                  +2.3% from last month
                </p>
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Response Time</p>
                <p className="text-2xl font-bold">{analytics.avgResponseTime.toFixed(1)}h</p>
                <p className="text-xs text-muted-foreground">
                  <TrendingDown className="h-3 w-3 inline mr-1" />
                  -15% from last month
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Lead Quality Score</p>
                <p className="text-2xl font-bold">{analytics.leadQualityScore.toFixed(0)}</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${analytics.leadQualityScore}%` }}
                  ></div>
                </div>
              </div>
              <Brain className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sources">Lead Sources</TabsTrigger>
          <TabsTrigger value="performance">Team Performance</TabsTrigger>
          <TabsTrigger value="geographic">Geographic</TabsTrigger>
          <TabsTrigger value="temporal">Time Analysis</TabsTrigger>
          <TabsTrigger value="intent">Lead Intent</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Lead Conversion Funnel
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.stageDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="stage" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChartIcon className="h-5 w-5" />
                  Response Time Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.responseTimeTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="avgTime" stroke="#8884d8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Lead Sources Tab */}
        <TabsContent value="sources" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5" />
                  Lead Source Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.topSources}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ source, percentage }) => `${source}: ${percentage.toFixed(1)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {analytics.topSources.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Source Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.leadSourcePerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="source" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="leads" fill="#8884d8" />
                    <Bar dataKey="conversion" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Team Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Performance Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.teamPerformance.map((member, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium">{member.name.split(' ').map(n => n[0]).join('')}</span>
                      </div>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {member.leads} leads • {member.converted} converted • ₹{member.revenue.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">{member.score}/100</p>
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${member.score}%` }}
                          ></div>
                        </div>
                      </div>
                      <Badge variant={member.score >= 90 ? "default" : member.score >= 70 ? "secondary" : "destructive"}>
                        {member.score >= 90 ? "Excellent" : member.score >= 70 ? "Good" : "Needs Improvement"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Geographic Tab */}
        <TabsContent value="geographic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Geographic Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.geographicDistribution.map((location, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <MapPin className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="font-medium">{location.city}</p>
                        <p className="text-sm text-muted-foreground">
                          {location.leads} leads • ₹{location.revenue.toLocaleString()} revenue
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{location.leads} leads</p>
                      <p className="text-xs text-muted-foreground">₹{location.revenue.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Temporal Analysis Tab */}
        <TabsContent value="temporal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Time-Based Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analytics.timeBasedAnalysis}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="leads" stackId="1" stroke="#8884d8" fill="#8884d8" />
                  <Area type="monotone" dataKey="conversion" stackId="2" stroke="#82ca9d" fill="#82ca9d" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Lead Intent Tab */}
        <TabsContent value="intent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Lead Intent Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.leadIntentAnalysis.map((intent, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${
                        intent.intent === 'High Intent' ? 'bg-green-500' :
                        intent.intent === 'Medium Intent' ? 'bg-yellow-500' :
                        intent.intent === 'Low Intent' ? 'bg-orange-500' : 'bg-red-500'
                      }`}></div>
                      <div>
                        <p className="font-medium">{intent.intent}</p>
                        <p className="text-sm text-muted-foreground">
                          {intent.count} leads • {intent.probability}% conversion probability
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{intent.count} leads</p>
                      <p className="text-xs text-muted-foreground">{intent.probability}% probability</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

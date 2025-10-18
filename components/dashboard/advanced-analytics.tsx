"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, TrendingUp, TrendingDown, Users, DollarSign, Target, BarChart3, Activity, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface AnalyticsData {
  revenue: {
    current: number;
    previous: number;
    growth: number;
  };
  leads: {
    current: number;
    previous: number;
    growth: number;
  };
  conversion: {
    current: number;
    previous: number;
    growth: number;
  };
  customers: {
    current: number;
    previous: number;
    growth: number;
  };
}

interface ChartData {
  date: string;
  revenue: number;
  leads: number;
  conversions: number;
}

export function AdvancedAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date()
  });

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Fetch leads data with all necessary fields
      const { data: leadsData, error: leadsError } = await supabase
        .from('Leads')
        .select(`
          whalesync_postgres_id,
          name,
          stage,
          deal_amount,
          date_and_time,
          services,
          source,
          assigned_to,
          follow_up_day
        `)
        .order('date_and_time', { ascending: false });

      if (leadsError) throw leadsError;

      // Calculate analytics
      const currentPeriod = leadsData?.filter(lead => 
        new Date(lead.date_and_time) >= dateRange.from
      ) || [];
      
      const previousPeriod = leadsData?.filter(lead => {
        const leadDate = new Date(lead.date_and_time);
        const prevStart = new Date(dateRange.from);
        prevStart.setDate(prevStart.getDate() - (dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24));
        return leadDate >= prevStart && leadDate < dateRange.from;
      }) || [];

      const currentRevenue = currentPeriod
        .filter(lead => lead.stage?.toLowerCase() === 'converted')
        .reduce((sum, lead) => sum + (parseFloat(lead.deal_amount) || 0), 0);
      
      const previousRevenue = previousPeriod
        .filter(lead => lead.stage?.toLowerCase() === 'converted')
        .reduce((sum, lead) => sum + (parseFloat(lead.deal_amount) || 0), 0);

      const currentLeads = currentPeriod.length;
      const previousLeads = previousPeriod.length;

      const currentConversions = currentPeriod.filter(lead => 
        lead.stage?.toLowerCase() === 'converted'
      ).length;
      const previousConversions = previousPeriod.filter(lead => 
        lead.stage?.toLowerCase() === 'converted'
      ).length;

      const currentConversionRate = currentLeads > 0 ? (currentConversions / currentLeads) * 100 : 0;
      const previousConversionRate = previousLeads > 0 ? (previousConversions / previousLeads) * 100 : 0;

      const currentCustomers = new Set(currentPeriod
        .filter(lead => lead.stage?.toLowerCase() === 'converted')
        .map(lead => lead.name)
      ).size;
      
      const previousCustomers = new Set(previousPeriod
        .filter(lead => lead.stage?.toLowerCase() === 'converted')
        .map(lead => lead.name)
      ).size;

      setData({
        revenue: {
          current: currentRevenue,
          previous: previousRevenue,
          growth: previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0
        },
        leads: {
          current: currentLeads,
          previous: previousLeads,
          growth: previousLeads > 0 ? ((currentLeads - previousLeads) / previousLeads) * 100 : 0
        },
        conversion: {
          current: currentConversionRate,
          previous: previousConversionRate,
          growth: previousConversionRate > 0 ? ((currentConversionRate - previousConversionRate) / previousConversionRate) * 100 : 0
        },
        customers: {
          current: currentCustomers,
          previous: previousCustomers,
          growth: previousCustomers > 0 ? ((currentCustomers - previousCustomers) / previousCustomers) * 100 : 0
        }
      });

      // Generate chart data
      const dailyData: { [key: string]: { revenue: number; leads: number; conversions: number } } = {};
      
      currentPeriod.forEach(lead => {
        const date = new Date(lead.date_and_time).toISOString().split('T')[0];
        if (!dailyData[date]) {
          dailyData[date] = { revenue: 0, leads: 0, conversions: 0 };
        }
        dailyData[date].leads++;
        if (lead.stage?.toLowerCase() === 'converted') {
          dailyData[date].revenue += parseFloat(lead.deal_amount) || 0;
          dailyData[date].conversions++;
        }
      });

      const chartDataArray = Object.entries(dailyData)
        .map(([date, values]) => ({ date, ...values }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      setChartData(chartDataArray);

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case 'revenue': return <DollarSign className="h-4 w-4" />;
      case 'leads': return <Users className="h-4 w-4" />;
      case 'conversion': return <Target className="h-4 w-4" />;
      case 'customers': return <Activity className="h-4 w-4" />;
      default: return <BarChart3 className="h-4 w-4" />;
    }
  };

  const getMetricValue = (metric: string) => {
    if (!data) return 0;
    switch (metric) {
      case 'revenue': return formatCurrency(data.revenue.current);
      case 'leads': return data.leads.current.toString();
      case 'conversion': return `${data.conversion.current.toFixed(1)}%`;
      case 'customers': return data.customers.current.toString();
      default: return '0';
    }
  };

  const getMetricGrowth = (metric: string) => {
    if (!data) return 0;
    switch (metric) {
      case 'revenue': return data.revenue.growth;
      case 'leads': return data.leads.growth;
      case 'conversion': return data.conversion.growth;
      case 'customers': return data.customers.growth;
      default: return 0;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                <div className="h-4 w-4 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted animate-pulse rounded mb-2" />
                <div className="h-4 w-12 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" style={{ fontFamily: 'Geist, sans-serif' }}>
            Advanced Analytics
          </h2>
          <p className="text-muted-foreground" style={{ fontFamily: 'Geist, sans-serif' }}>
            Comprehensive business insights and performance metrics
          </p>
        </div>
        
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <CalendarIcon className="h-4 w-4" />
                {format(dateRange.from, "MMM dd")} - {format(dateRange.to, "MMM dd")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={(range) => {
                  if (range?.from && range?.to) {
                    setDateRange(range);
                  }
                }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
          
          <Button variant="outline" size="icon" onClick={fetchAnalyticsData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { key: 'revenue', label: 'Total Revenue', color: 'text-green-600' },
          { key: 'leads', label: 'Total Leads', color: 'text-blue-600' },
          { key: 'conversion', label: 'Conversion Rate', color: 'text-purple-600' },
          { key: 'customers', label: 'New Customers', color: 'text-orange-600' }
        ].map((metric) => {
          const growth = getMetricGrowth(metric.key);
          const isPositive = growth >= 0;
          
          return (
            <Card key={metric.key}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium" style={{ fontFamily: 'Geist, sans-serif' }}>
                  {metric.label}
                </CardTitle>
                <div className={cn("text-muted-foreground", metric.color)}>
                  {getMetricIcon(metric.key)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" style={{ fontFamily: 'Geist, sans-serif' }}>
                  {getMetricValue(metric.key)}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  {isPositive ? (
                    <TrendingUp className="h-3 w-3 text-green-600" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-600" />
                  )}
                  <span className={cn(isPositive ? "text-green-600" : "text-red-600")}>
                    {formatPercentage(growth)}
                  </span>
                  <span>vs previous period</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="revenue" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Revenue
          </TabsTrigger>
          <TabsTrigger value="leads" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Leads
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Performance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2" style={{ fontFamily: 'Geist, sans-serif' }}>
                  <TrendingUp className="h-5 w-5" />
                  Revenue Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {chartData.slice(-7).map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm" style={{ fontFamily: 'Geist, sans-serif' }}>
                        {format(new Date(item.date), 'MMM dd')}
                      </span>
                      <span className="font-medium" style={{ fontFamily: 'Geist, sans-serif' }}>
                        {formatCurrency(item.revenue)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2" style={{ fontFamily: 'Geist, sans-serif' }}>
                  <Users className="h-5 w-5" />
                  Lead Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {chartData.slice(-7).map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm" style={{ fontFamily: 'Geist, sans-serif' }}>
                        {format(new Date(item.date), 'MMM dd')}
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{item.leads} leads</Badge>
                        <Badge variant="outline">{item.conversions} converted</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ fontFamily: 'Geist, sans-serif' }}>
                <DollarSign className="h-5 w-5" />
                Revenue Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600" style={{ fontFamily: 'Geist, sans-serif' }}>
                    {formatCurrency(data?.revenue.current || 0)}
                  </div>
                  <div className="text-sm text-muted-foreground" style={{ fontFamily: 'Geist, sans-serif' }}>
                    Current Period
                  </div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600" style={{ fontFamily: 'Geist, sans-serif' }}>
                    {formatCurrency(data?.revenue.previous || 0)}
                  </div>
                  <div className="text-sm text-muted-foreground" style={{ fontFamily: 'Geist, sans-serif' }}>
                    Previous Period
                  </div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className={cn(
                    "text-2xl font-bold",
                    (data?.revenue.growth || 0) >= 0 ? "text-green-600" : "text-red-600"
                  )} style={{ fontFamily: 'Geist, sans-serif' }}>
                    {formatPercentage(data?.revenue.growth || 0)}
                  </div>
                  <div className="text-sm text-muted-foreground" style={{ fontFamily: 'Geist, sans-serif' }}>
                    Growth Rate
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leads" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ fontFamily: 'Geist, sans-serif' }}>
                <Users className="h-5 w-5" />
                Lead Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600" style={{ fontFamily: 'Geist, sans-serif' }}>
                    {data?.leads.current || 0}
                  </div>
                  <div className="text-sm text-muted-foreground" style={{ fontFamily: 'Geist, sans-serif' }}>
                    Current Leads
                  </div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600" style={{ fontFamily: 'Geist, sans-serif' }}>
                    {data?.conversion.current.toFixed(1) || 0}%
                  </div>
                  <div className="text-sm text-muted-foreground" style={{ fontFamily: 'Geist, sans-serif' }}>
                    Conversion Rate
                  </div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600" style={{ fontFamily: 'Geist, sans-serif' }}>
                    {data?.customers.current || 0}
                  </div>
                  <div className="text-sm text-muted-foreground" style={{ fontFamily: 'Geist, sans-serif' }}>
                    New Customers
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ fontFamily: 'Geist, sans-serif' }}>
                <Activity className="h-5 w-5" />
                Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <div className="font-medium" style={{ fontFamily: 'Geist, sans-serif' }}>
                      Revenue Growth
                    </div>
                    <div className="text-sm text-muted-foreground" style={{ fontFamily: 'Geist, sans-serif' }}>
                      Compared to previous period
                    </div>
                  </div>
                  <Badge variant={data?.revenue.growth && data.revenue.growth >= 0 ? "default" : "destructive"}>
                    {formatPercentage(data?.revenue.growth || 0)}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <div className="font-medium" style={{ fontFamily: 'Geist, sans-serif' }}>
                      Lead Growth
                    </div>
                    <div className="text-sm text-muted-foreground" style={{ fontFamily: 'Geist, sans-serif' }}>
                      New leads compared to previous period
                    </div>
                  </div>
                  <Badge variant={data?.leads.growth && data.leads.growth >= 0 ? "default" : "destructive"}>
                    {formatPercentage(data?.leads.growth || 0)}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <div className="font-medium" style={{ fontFamily: 'Geist, sans-serif' }}>
                      Conversion Improvement
                    </div>
                    <div className="text-sm text-muted-foreground" style={{ fontFamily: 'Geist, sans-serif' }}>
                      Conversion rate change
                    </div>
                  </div>
                  <Badge variant={data?.conversion.growth && data.conversion.growth >= 0 ? "default" : "destructive"}>
                    {formatPercentage(data?.conversion.growth || 0)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

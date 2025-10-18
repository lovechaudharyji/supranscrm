"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Pie, PieChart, Cell } from "recharts";
import { Download } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

// Color palette for lead sources
const SOURCE_COLORS = [
  "#1f2937", // Black for CALL
  "#4b5563", // Dark grey for SOCIAL  
  "#6b7280", // Medium grey for EMAIL
  "#9ca3af", // Light grey for OTHERS
  "#d1d5db", // Very light grey for additional sources
];

interface LeadSource {
  source: string;
  count: number;
}

interface LeadsBySourceData {
  [key: string]: number;
}

// --- SUPABASE HELPER FUNCTION ---
const fetchLeadsBySource = async (): Promise<LeadsBySourceData> => {
  const { data, error } = await supabase
    .from('Leads')
    .select('source')
    .not('source', 'is', null);

  if (error) {
    throw new Error(`Supabase Error: ${error.message}`);
  }

  // Count leads by source
  const sourceCounts: { [key: string]: number } = {};
  data?.forEach((lead) => {
    const source = lead.source?.toUpperCase() || 'OTHERS';
    sourceCounts[source] = (sourceCounts[source] || 0) + 1;
  });

  return sourceCounts;
};

// --- HELPER COMPONENTS ---
const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const ErrorDisplay: React.FC<{ error: Error }> = ({ error }) => (
  <div className="col-span-full border border-destructive bg-destructive/10 p-4 rounded-lg">
    <h3 className="font-bold text-destructive">Failed to Load Leads by Source</h3>
    <p className="text-destructive/80 text-sm mt-1">{error.message}</p>
  </div>
);

// --- MAIN COMPONENT ---
export function LeadsBySourceChart() {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [sourceData, setSourceData] = useState<LeadsBySourceData>({});

  // --- DATA FETCHING ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchLeadsBySource();
      setSourceData(data);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- DATA PROCESSING ---
  const chartData = useMemo(() => {
    return Object.entries(sourceData)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count); // Sort by count descending
  }, [sourceData]);

  const totalLeads = useMemo(() => 
    chartData.reduce((sum, item) => sum + item.count, 0), 
    [chartData]
  );

  // Chart configuration
  const chartConfig = useMemo(() => {
    const config: ChartConfig = {};
    chartData.forEach((item, index) => {
      config[item.source] = {
        label: item.source,
        color: SOURCE_COLORS[index % SOURCE_COLORS.length],
      };
    });
    return config;
  }, [chartData]);

  // --- EXPORT FUNCTIONALITY ---
  const handleExport = useCallback(() => {
    const csvContent = [
      ['Source', 'Count', 'Percentage'],
      ...chartData.map(item => [
        item.source,
        item.count.toString(),
        `${((item.count / totalLeads) * 100).toFixed(1)}%`
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `leads-by-source-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }, [chartData, totalLeads]);

  // --- RENDER LOGIC ---
  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Leads by Source</span>
            <Button variant="outline" size="sm" disabled>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingSpinner />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Leads by Source</span>
            <Button variant="outline" size="sm" disabled>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ErrorDisplay error={error} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Leads by Source</span>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-6">
        {/* Donut Chart */}
        <div className="relative w-64 h-64">
          <ChartContainer config={chartConfig} className="w-full h-full">
            <PieChart>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => [
                      `${value} leads`,
                      name
                    ]}
                    labelFormatter={(label) => `Source: ${label}`}
                  />
                }
              />
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                dataKey="count"
                nameKey="source"
                strokeWidth={2}
                stroke="#ffffff"
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${entry.source}`}
                    fill={SOURCE_COLORS[index % SOURCE_COLORS.length]}
                    stroke="#ffffff"
                    strokeWidth={2}
                    className="hover:opacity-80 transition-opacity duration-200"
                  />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
          
          {/* Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-3xl font-bold text-foreground">{totalLeads}</div>
            <div className="text-sm text-muted-foreground">Leads</div>
          </div>
        </div>

        {/* Legend/Breakdown */}
        <div className="w-full space-y-2">
          {chartData.map((item, index) => (
            <div
              key={item.source}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors duration-200"
            >
              <div className="flex items-center gap-3">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: SOURCE_COLORS[index % SOURCE_COLORS.length] }}
                />
                <span className="font-medium text-sm">{item.source}</span>
              </div>
              <div className="text-right">
                <div className="font-semibold text-foreground">
                  {item.count}
                </div>
                <div className="text-xs text-muted-foreground">
                  {((item.count / totalLeads) * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import React, { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Pie, PieChart, Cell } from "recharts"

// Enhanced color palette with better contrast and visual appeal
const COLORS = [
  "#3b82f6", // Blue - Primary
  "#10b981", // Green - Success
  "#f59e0b", // Amber - Warning
  "#ef4444", // Red - Destructive
  "#8b5cf6", // Purple - Accent
  "#06b6d4", // Cyan - Info
  "#84cc16", // Lime - Success variant
  "#f97316", // Orange - Warning variant
  "#ec4899", // Pink - Accent variant
  "#6b7280"  // Gray - Muted
]

export function StageDoughnutChart({ data }: { data: Record<string, number> }) {
  // Transform data into recharts format
  const chartData = useMemo(() => {
    return Object.entries(data)
      .filter(([_, value]) => value > 0)
      .filter(([name, _]) => 
        name.toLowerCase() !== 'connected' && 
        name.toLowerCase() !== 'in discussion / nurturing' &&
        name.toLowerCase() !== 'in discussion' &&
        name.toLowerCase() !== 'nurturing'
      )
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [data])

  // Calculate total leads
  const totalLeads = useMemo(() => 
    chartData.reduce((sum, item) => sum + item.value, 0), 
    [chartData]
  )

  // Calculate percentages
  const chartDataWithPercentage = useMemo(() => 
    chartData.map(item => ({
      ...item,
      percentage: ((item.value / totalLeads) * 100).toFixed(1)
    })), 
    [chartData, totalLeads]
  )

  // Chart configuration
  const chartConfig = {
    stages: Object.fromEntries(
      chartDataWithPercentage.map((item, index) => [
        item.name, 
        { 
          label: item.name, 
          color: COLORS[index % COLORS.length] 
        }
      ])
    )
  } satisfies ChartConfig

  return (
    <Card className="border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col bg-gradient-to-br from-background to-muted/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
          Leads by Stage
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Distribution of leads across different stages
        </p>
      </CardHeader>
      <CardContent className="flex flex-col md:flex-row items-center justify-between p-6 pt-2 flex-1">
        <ChartContainer 
          config={chartConfig} 
          className="w-full md:w-1/2 aspect-square"
        >
          <PieChart>
            <ChartTooltip 
              cursor={false} 
              content={
                <ChartTooltipContent 
                  nameKey="name" 
                  valueKey="percentage" 
                  formatter={(value, name) => [
                    `${value}%`,
                    name
                  ]}
                  labelFormatter={(label) => `Stage: ${label}`}
                />
              } 
            />
            <Pie
              data={chartDataWithPercentage}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius="85%"
              innerRadius="35%"
              dataKey="value"
              strokeWidth={2}
              stroke="#ffffff"
              animationBegin={0}
              animationDuration={800}
            >
              {chartDataWithPercentage.map((entry, index) => (
                <Cell 
                  key={`cell-${entry.name}`} 
                  fill={COLORS[index % COLORS.length]}
                  stroke="#ffffff"
                  strokeWidth={2}
                  className="hover:opacity-80 transition-opacity duration-200"
                />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        
        <div className="w-full md:w-1/2 mt-4 md:mt-0 md:pl-6">
          <div className="space-y-3">
            <div className="text-sm font-medium text-muted-foreground mb-3">
              Stage Breakdown
            </div>
            {chartDataWithPercentage.map((entry, index) => (
              <div 
                key={entry.name} 
                className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors duration-200"
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="h-4 w-4 rounded-full shadow-sm border-2 border-white" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="font-medium text-sm">{entry.name}</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-foreground">
                    {entry.value}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {entry.percentage}%
                  </div>
                </div>
              </div>
            ))}
            <div className="mt-4 pt-3 border-t border-border/50">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-muted-foreground">Total Leads</span>
                <span className="font-bold text-foreground">{totalLeads}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


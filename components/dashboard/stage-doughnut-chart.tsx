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
    <Card className="h-full">
        <CardHeader>
          <CardTitle style={{ fontFamily: 'Geist, sans-serif' }}>Leads by Stage</CardTitle>
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
                    labelFormatter={(label) => `Stage: ${label}`}
                  />
                }
              />
              <Pie
                data={chartDataWithPercentage}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                dataKey="value"
                nameKey="name"
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
          
          {/* Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-3xl font-bold text-foreground" style={{ fontFamily: 'Geist, sans-serif' }}>{totalLeads}</div>
            <div className="text-sm text-muted-foreground" style={{ fontFamily: 'Geist, sans-serif' }}>Leads</div>
          </div>
        </div>

        {/* Stage Breakdown */}
        <div className="w-full">
          {/* First row - 3 items */}
          <div className="grid grid-cols-3 gap-2 mb-2">
            {chartDataWithPercentage.slice(0, 3).map((entry, index) => (
              <div
                key={entry.name}
                className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-background to-muted/20 p-3 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="h-8 w-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  >
                    {entry.value}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-base text-foreground group-hover:text-primary transition-colors" style={{ fontFamily: 'Geist, sans-serif' }}>
                      {entry.name}
                    </div>
                    <div className="text-sm text-muted-foreground" style={{ fontFamily: 'Geist, sans-serif' }}>
                      {entry.percentage}% of total
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Second row - 2 items */}
          {chartDataWithPercentage.length > 3 && (
            <div className="grid grid-cols-2 gap-2">
              {chartDataWithPercentage.slice(3, 5).map((entry, index) => (
                <div
                  key={entry.name}
                  className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-background to-muted/20 p-3 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-8 w-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                      style={{ backgroundColor: COLORS[(index + 3) % COLORS.length] }}
                    >
                      {entry.value}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-base text-foreground group-hover:text-primary transition-colors" style={{ fontFamily: 'Geist, sans-serif' }}>
                        {entry.name}
                      </div>
                      <div className="text-sm text-muted-foreground" style={{ fontFamily: 'Geist, sans-serif' }}>
                        {entry.percentage}% of total
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}




"use client"

import * as React from "react"
import { useMemo } from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import { Users, TrendingUp } from "lucide-react"

export const description = "An interactive area chart"

// --- TYPE DEFINITIONS ---
interface DailyLeads {
  date: string;
  leads: number;
}

interface DailySales {
  date: string;
  sales: number;
}

const chartConfig = {
  leads: {
    label: "Leads",
    color: "var(--primary)",
  },
  sales: {
    label: "Sales (₹)",
    color: "#10b981",
  },
} satisfies ChartConfig

export function ChartAreaInteractive({ 
  leadsData, 
  salesData 
}: { 
  leadsData: DailyLeads[];
  salesData: DailySales[];
}) {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("90d")
  const [chartType, setChartType] = React.useState<"leads" | "sales">("leads")

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  const filteredData = useMemo(() => {
    const currentData = chartType === "leads" ? leadsData : salesData;
    
    if (!currentData || currentData.length === 0) {
      return [];
    }

    const latestDateInData = new Date(
      Math.max(...currentData.map((item) => new Date(item.date).getTime()))
    );

    let daysToSubtract = 90;
    if (timeRange === "30d") {
      daysToSubtract = 30;
    } else if (timeRange === "7d") {
      daysToSubtract = 7;
    }

    const startDate = new Date(latestDateInData);
    startDate.setDate(latestDateInData.getDate() - daysToSubtract);

    return currentData.filter((item) => new Date(item.date) >= startDate);
  }, [leadsData, salesData, chartType, timeRange])

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>{chartType === "leads" ? "Total Leads" : "Sales Performance"}</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            {chartType === "leads" 
              ? "Showing total leads from your data" 
              : "Showing sales performance from your data"
            }
          </span>
          <span className="@[540px]/card:hidden">
            {chartType === "leads" ? "Leads overview" : "Sales overview"}
          </span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={chartType}
            onValueChange={(value) => setChartType(value as "leads" | "sales")}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
          >
            <ToggleGroupItem value="leads" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Leads
            </ToggleGroupItem>
            <ToggleGroupItem value="sales" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Sales Performance
            </ToggleGroupItem>
          </ToggleGroup>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">Last 3 months</ToggleGroupItem>
            <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
            <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Last 3 months
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillLeads" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-leads)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-leads)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillSales" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-sales)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-sales)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey={chartType === "leads" ? "leads" : "sales"}
              type="natural"
              fill={chartType === "leads" ? "url(#fillLeads)" : "url(#fillSales)"}
              stroke={chartType === "leads" ? "var(--color-leads)" : "var(--color-sales)"}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

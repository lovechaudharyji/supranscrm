"use client";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface LeadSummaryCardProps {
  title: string;
  count: number;
  icon: LucideIcon;
}

export function LeadSummaryCard({ 
  title, 
  count, 
  icon: Icon,
}: LeadSummaryCardProps) {
  return (
    <Card className="@container/card bg-gradient-to-t from-primary/5 to-card dark:bg-card shadow-xs">
      <CardHeader>
        <CardDescription className="flex items-center justify-between">
          <span>{title}</span>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
          {count}
        </CardTitle>
      </CardHeader>
    </Card>
  );
}


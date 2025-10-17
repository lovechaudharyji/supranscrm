"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface TopPerformersCardProps {
  performers: [string, number][];
  formatter: Intl.NumberFormat;
}

export function TopPerformersCard({
  performers,
  formatter,
}: TopPerformersCardProps) {
  return (
    <Card className="@container/card h-full flex flex-col">
      <CardHeader>
        <CardTitle>Top Performing Staff</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <ul className="space-y-4 flex-1">
          {performers.length > 0 ? (
            performers.map(([name, amount], idx) => (
              <li key={name} className="flex items-center space-x-4">
                <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                  {idx + 1}
                </span>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatter.format(amount)} closed
                  </p>
                </div>
              </li>
            ))
          ) : (
            <li className="text-center text-muted-foreground p-4">
              No performance data found.
            </li>
          )}
        </ul>
      </CardContent>
    </Card>
  );
}


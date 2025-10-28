"use client";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { LucideIcon, CalendarDays, ChevronDown } from "lucide-react";
import { useState } from "react";

interface LeadSummaryCardWithFiltersProps {
  title: string;
  count: number;
  icon: LucideIcon;
  onDateFilter: (date: Date | null) => void;
  selectedDate: Date | null;
}

export function LeadSummaryCardWithFilters({ 
  title, 
  count, 
  icon: Icon,
  onDateFilter,
  selectedDate,
}: LeadSummaryCardWithFiltersProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const handleToday = () => {
    const today = new Date();
    onDateFilter(today);
    setIsCalendarOpen(false);
  };

  const handleYesterday = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    onDateFilter(yesterday);
    setIsCalendarOpen(false);
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    onDateFilter(date || null);
    setIsCalendarOpen(false);
  };

  const getFilterText = () => {
    if (!selectedDate) return "All Time";
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (selectedDate.toDateString() === today.toDateString()) {
      return "Today";
    } else if (selectedDate.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return format(selectedDate, "MMM dd, yyyy");
    }
  };

  return (
    <Card className="@container/card bg-gradient-to-t from-primary/5 to-card dark:bg-card shadow-xs">
      <CardHeader>
        <CardDescription className="flex items-center justify-between">
          <span>{title}</span>
          <div className="flex flex-col items-center gap-1">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-6 w-6 p-0"
                  title={getFilterText()}
                >
                  <CalendarDays className="h-3 w-3" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-3" align="start">
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleToday}
                      className="flex-1 text-xs"
                    >
                      Today
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleYesterday}
                      className="flex-1 text-xs"
                    >
                      Yesterday
                    </Button>
                  </div>
                  <div className="border-t pt-2">
                    <p className="text-xs text-muted-foreground mb-2">Pick a date:</p>
                    <Calendar
                      mode="single"
                      selected={selectedDate || undefined}
                      onSelect={handleCalendarSelect}
                      initialFocus
                    />
                  </div>
                  {selectedDate && (
                    <div className="border-t pt-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => onDateFilter(null)}
                        className="w-full text-xs"
                      >
                        Clear Filter
                      </Button>
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
          {count}
        </CardTitle>
      </CardHeader>
    </Card>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function LeadFilters({
  filters,
  onChange,
  services,
  stages,
}: {
  filters: any;
  onChange: (filters: any) => void;
  services: string[];
  stages: string[];
}) {
  // Convert date string to Date object for the picker
  const selectedDate = filters.date ? new Date(filters.date) : undefined;

  // Parse selected services and stages as arrays
  const selectedServices = filters.service ? filters.service.split(',').filter(Boolean) : [];
  const selectedStages = filters.stage ? filters.stage.split(',').filter(Boolean) : [];

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      // Convert Date to YYYY-MM-DD format for filtering
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      onChange({ ...filters, date: `${year}-${month}-${day}` });
    } else {
      onChange({ ...filters, date: "" });
    }
  };

  // Handle service selection
  const handleServiceToggle = (service: string) => {
    const currentServices = selectedServices;
    const newServices = currentServices.includes(service)
      ? currentServices.filter((s) => s !== service)
      : [...currentServices, service];
    onChange({ ...filters, service: newServices.join(',') });
  };

  // Handle stage selection
  const handleStageToggle = (stage: string) => {
    const currentStages = selectedStages;
    const newStages = currentStages.includes(stage)
      ? currentStages.filter((s) => s !== stage)
      : [...currentStages, stage];
    onChange({ ...filters, stage: newStages.join(',') });
  };

  // Clear all services
  const clearAllServices = () => {
    onChange({ ...filters, service: "" });
  };

  // Clear all stages
  const clearAllStages = () => {
    onChange({ ...filters, stage: "" });
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Service Filter - Multi Select */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="min-w-[140px] justify-between gap-2">
            <span className="truncate">
              {selectedServices.length > 0 
                ? `Services (${selectedServices.length})` 
                : "All Services"}
            </span>
            <ChevronDown className="h-4 w-4 flex-shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[220px]" onCloseAutoFocus={(e) => e.preventDefault()}>
          <DropdownMenuLabel className="flex items-center justify-between">
            Filter by Service
            {selectedServices.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  clearAllServices();
                }}
                className="h-6 px-2 text-xs"
              >
                Clear
              </Button>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {services.map((svc) => (
            <DropdownMenuCheckboxItem
              key={svc}
              checked={selectedServices.includes(svc)}
              onCheckedChange={() => handleServiceToggle(svc)}
              onSelect={(e) => e.preventDefault()}
            >
              {svc}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Stage Filter - Multi Select */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="min-w-[120px] justify-between gap-2">
            <span className="truncate">
              {selectedStages.length > 0 
                ? `Stages (${selectedStages.length})` 
                : "All Stages"}
            </span>
            <ChevronDown className="h-4 w-4 flex-shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[220px]" onCloseAutoFocus={(e) => e.preventDefault()}>
          <DropdownMenuLabel className="flex items-center justify-between">
            Filter by Stage
            {selectedStages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  clearAllStages();
                }}
                className="h-6 px-2 text-xs"
              >
                Clear
              </Button>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {stages.map((st) => (
            <DropdownMenuCheckboxItem
              key={st}
              checked={selectedStages.includes(st)}
              onCheckedChange={() => handleStageToggle(st)}
              onSelect={(e) => e.preventDefault()}
            >
              {st}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Date Filter with Shadcn Calendar */}
      <div className="relative">
        <DatePicker
          date={selectedDate}
          onDateChange={handleDateChange}
          placeholder="Filter by date"
          buttonSize="sm"
        />
        {filters.date && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onChange({ ...filters, date: "" })}
            className="absolute right-0 top-0 h-9 w-9 hover:bg-transparent"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}


"use client";

import { useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

const dockItems = [
  { 
    name: "WhatsApp", 
    iconUrl: "https://svgl.app/library/whatsapp.svg",
    bgColor: "bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30",
    action: () => window.open("https://web.whatsapp.com", "_blank")
  },
  { 
    name: "Gmail", 
    iconUrl: "https://svgl.app/library/gmail.svg",
    bgColor: "bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30",
    action: () => window.open("https://mail.google.com", "_blank")
  },
  { 
    name: "Google Sheets", 
    iconUrl: "https://www.gstatic.com/images/branding/product/2x/sheets_2020q4_48dp.png",
    bgColor: "bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30",
    action: () => window.open("https://docs.google.com/spreadsheets", "_blank")
  },
  { 
    name: "Slack", 
    iconUrl: "https://svgl.app/library/slack.svg",
    bgColor: "bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/30",
    action: () => window.open("https://slack.com", "_blank")
  },
];

export function QuickActionsDock() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex items-center gap-1.5">
        {dockItems.map((item, index) => {
          return (
            <Tooltip key={item.name}>
              <TooltipTrigger asChild>
                <button
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onClick={item.action}
                  className="group relative transition-all duration-300 ease-out"
                  style={{
                    transform:
                      hoveredIndex === index
                        ? "scale(1.15) translateY(-2px)"
                        : "scale(1)",
                  }}
                >
                  <div
                    className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all duration-200 ${item.bgColor}`}
                  >
                    <img 
                      src={item.iconUrl} 
                      alt={item.name} 
                      className="w-5 h-5 object-contain"
                    />
                  </div>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={8}>
                <p className="text-xs font-medium">{item.name}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}


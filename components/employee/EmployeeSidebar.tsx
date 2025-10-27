"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, Users, Phone, ChevronRight, User, Mail, MessageCircle, HardDrive, BookOpen, CheckSquare, FileText, Ticket, Key, Clock } from "lucide-react";
import { useState } from "react";

const homeNavItems = [
  { title: "Mail", href: "#", icon: Mail, action: "popup", url: "https://mail.google.com" },
  { title: "Chat", href: "#", icon: MessageCircle, action: "popup", url: "https://web.whatsapp.com" },
  { title: "Drive", href: "#", icon: HardDrive, action: "popup", url: "https://drive.google.com" },
  { title: "Knowledge", href: "https://notion.so", icon: BookOpen, external: true },
];

const mainNavItems = [
  {
    title: "My Leads",
    icon: Users,
    subItems: [
      { title: "New Leads", href: "/employee/new-leads" },
      { title: "Follow Up Leads", href: "/employee/follow-up-leads" },
      { title: "Not Connected Leads", href: "/employee/not-connected-leads" },
    ],
  },
  {
    title: "Call Logs",
    icon: Phone,
    subItems: [
      { title: "Incoming", href: "/employee/call-logs/incoming" },
      { title: "Outgoing", href: "/employee/call-logs/outgoing" },
      { title: "Missed", href: "/employee/call-logs/missed" },
    ],
  },
  {
    title: "Tasks",
    icon: CheckSquare,
    subItems: [
      { title: "My Tasks", href: "/employee/tasks" },
    ],
  },
  {
    title: "Documents",
    icon: FileText,
    subItems: [
      { title: "My Documents", href: "/employee/documents" },
    ],
  },
  {
    title: "Tickets",
    icon: Ticket,
    subItems: [
      { title: "My Tickets", href: "/employee/tickets" },
    ],
  },
  {
    title: "Subscriptions",
    icon: Key,
    subItems: [
      { title: "My Subscriptions", href: "/employee/subscriptions" },
    ],
  },
  {
    title: "Attendance",
    icon: Clock,
    subItems: [
      { title: "Mark Attendance", href: "/employee/attendance" },
    ],
  },
];

const secondaryNavItems = [
  {
    title: "Profile",
    href: "/employee/profile",
    icon: User,
  },
];

export function EmployeeSidebar() {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>(["My Leads", "Call Logs"]);

  const toggleExpand = (title: string) => {
    setExpandedItems((prev) =>
      prev.includes(title) ? prev.filter((item) => item !== title) : [...prev, title]
    );
  };

  return (
    <div className="w-64 bg-card border-r min-h-screen flex flex-col">
      <div className="p-4 border-b">
        <Link href="/employee">
          <h2 className="text-lg font-semibold hover:text-primary cursor-pointer transition-colors">Employee Portal</h2>
        </Link>
      </div>
      <div className="flex-1 px-4 py-2 employee-sidebar-scroll" style={{ minHeight: '400px' }}>
        {/* Home Navigation - Horizontal Icons Only */}
        <div className="mb-1">
          <div className="flex justify-center space-x-2">
            {homeNavItems.map((item) => {
              const Icon = item.icon;
              
              if (item.external) {
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-muted transition-colors"
                    title={item.title}
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                );
              }

              if (item.action === "popup") {
                return (
                  <button
                    key={item.title}
                    onClick={() => {
                      window.open(
                        item.url,
                        item.title,
                        "noopener,noreferrer"
                      );
                    }}
                    className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-muted transition-colors"
                    title={item.title}
                  >
                    <Icon className="h-5 w-5" />
                  </button>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-muted transition-colors"
                  title={item.title}
                >
                  <Icon className="h-5 w-5" />
                </Link>
              );
            })}
          </div>
        </div>

        <nav className="space-y-1">
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const isExpanded = expandedItems.includes(item.title);
          const hasSubItems = item.subItems && item.subItems.length > 0;
          const hasSingleSubItem = item.subItems && item.subItems.length === 1;

          return (
            <div key={item.title}>
              {item.href ? (
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    pathname === item.href
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.title}
                </Link>
              ) : hasSingleSubItem ? (
                // For items with single sub-item, make it a direct link
                <Link
                  href={item.subItems![0].href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    pathname === item.subItems![0].href
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.title}
                </Link>
              ) : (
                <>
                  <button
                    onClick={() => toggleExpand(item.title)}
                    className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4" />
                      {item.title}
                    </div>
                    <ChevronRight
                      className={cn(
                        "h-4 w-4 transition-transform",
                        isExpanded && "rotate-90"
                      )}
                    />
                  </button>
                  {isExpanded && hasSubItems && (
                    <div className="ml-4 mt-1 space-y-1">
                      {item.subItems!.map((subItem) => {
                        const SubIcon = subItem.icon;
                        
                        if (subItem.external) {
                          return (
                            <a
                              key={subItem.href}
                              href={subItem.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-muted"
                              )}
                            >
                              {SubIcon && <SubIcon className="h-4 w-4" />}
                              {subItem.title}
                            </a>
                          );
                        }

                        if (subItem.action === "popup") {
                          return (
                            <button
                              key={subItem.title}
                              onClick={() => {
                                const width = 1400;
                                const height = 900;
                                const left = (window.screen.width - width) / 2;
                                const top = (window.screen.height - height) / 2;
                                window.open(
                                  subItem.url,
                                  subItem.title,
                                  `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,toolbar=no,menubar=no,location=no`
                                );
                              }}
                              className={cn(
                                "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-muted"
                              )}
                            >
                              {SubIcon && <SubIcon className="h-4 w-4" />}
                              {subItem.title}
                            </button>
                          );
                        }

                        return (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                              pathname === subItem.href
                                ? "bg-primary/10 text-primary font-medium"
                                : "hover:bg-muted"
                            )}
                          >
                            {SubIcon && <SubIcon className="h-4 w-4" />}
                            {subItem.title}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}

        </nav>
      </div>
      
      {/* Secondary Navigation - Fixed at bottom */}
      <div className="p-4 border-t bg-muted/20">
        <nav className="space-y-1">
          {secondaryNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.title}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}


"use client";

import { useState, useEffect } from "react";
import { Menu, Search, Bell, Sun, Moon, Settings, User, RefreshCw, PanelLeftClose, PanelLeft, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "next-themes";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { QuickActionsDock } from "./QuickActionsDock";
import { QuickNotes } from "./QuickNotes";
import { SalesCounter } from "./SalesCounter";

interface EmployeeHeaderProps {
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
  onMenuClick?: () => void;
  onDesktopSidebarToggle?: () => void;
  desktopSidebarOpen?: boolean;
}

export function EmployeeHeader({ title, subtitle, onRefresh, onMenuClick, onDesktopSidebarToggle, desktopSidebarOpen }: EmployeeHeaderProps) {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string>("");
  const [userInitials, setUserInitials] = useState<string>("U");

  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) {
      setUserEmail(user.email);
      // Get initials from email
      const emailName = user.email.split("@")[0];
      const initials = emailName
        .split(".")
        .map((n) => n.charAt(0).toUpperCase())
        .join("")
        .substring(0, 2);
      setUserInitials(initials);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      
      // Clear user and attendance data from local storage
      try {
        // Clear specific attendance and user data
        localStorage.removeItem('offline-attendance');
        localStorage.removeItem('attendance-data');
        localStorage.removeItem('user-data');
        localStorage.removeItem('employee-data');
        localStorage.removeItem('demo-mode');
        
        // Clear any other app-specific data
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.includes('attendance') || key.includes('employee') || key.includes('user'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        console.log('User and attendance data cleared from local storage');
      } catch (clearError) {
        console.error('Error clearing local storage:', clearError);
        // Fallback to clear all
        localStorage.clear();
      }
      
      toast.success("Logged out successfully");
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to log out");
    }
  };

  return (
    <TooltipProvider>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60" suppressHydrationWarning>
        <div className="flex h-14 items-center px-4 gap-4">
        {/* Mobile Menu Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={onMenuClick}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Open Menu</p>
          </TooltipContent>
        </Tooltip>

        {/* Desktop Sidebar Toggle */}
        {onDesktopSidebarToggle && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="hidden md:flex"
                onClick={onDesktopSidebarToggle}
              >
                {desktopSidebarOpen ? (
                  <PanelLeftClose className="h-5 w-5" />
                ) : (
                  <PanelLeft className="h-5 w-5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{desktopSidebarOpen ? "Close Sidebar" : "Open Sidebar"}</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Title */}
        <div className="flex flex-col">
          <h1 className="text-lg font-semibold">{title}</h1>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>

        {/* Search Bar */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex-1 max-w-md mx-auto hidden lg:block">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search..."
                  className="pl-8 w-full bg-muted/50"
                />
                <kbd className="pointer-events-none absolute right-2.5 top-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Search (⌘K)</p>
          </TooltipContent>
        </Tooltip>

        {/* Quick Actions Dock */}
        <div className="hidden xl:block">
          <QuickActionsDock />
        </div>

        {/* Right Side Icons */}
        <div className="flex items-center gap-2">
          {/* Refresh Button */}
          {onRefresh && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRefresh}
                  className="h-9"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Refresh Data</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Sales Counter */}
          <SalesCounter />

          {/* Payment Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('https://payment-frontend-amber.vercel.app/', '_blank')}
                className="h-9"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Payment
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Payment System</p>
            </TooltipContent>
          </Tooltip>

          {/* Quick Notes */}
          <QuickNotes />

          {/* Notifications */}
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                    >
                      3
                    </Badge>
                  </Button>
                </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">New lead assigned</p>
                  <p className="text-xs text-muted-foreground">2 minutes ago</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">Follow-up reminder</p>
                  <p className="text-xs text-muted-foreground">1 hour ago</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">Call log updated</p>
                  <p className="text-xs text-muted-foreground">3 hours ago</p>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
            </TooltipTrigger>
            <TooltipContent>
              <p>Notifications (3)</p>
            </TooltipContent>
          </Tooltip>

          {/* Theme Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}</p>
            </TooltipContent>
          </Tooltip>

          {/* Settings */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => router.push("/employee/settings")}
              >
                <Settings className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Settings</p>
            </TooltipContent>
          </Tooltip>

          {/* User Menu */}
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src="" alt={userEmail} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">My Account</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {userEmail}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/employee/profile")}>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/employee/settings")}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
            </TooltipTrigger>
            <TooltipContent>
              <p>My Account</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

    </header>
    </TooltipProvider>
  );
}


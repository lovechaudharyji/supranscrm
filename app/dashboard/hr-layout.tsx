"use client";

import { useUserRole } from "@/contexts/UserRoleContext";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { HRSidebar } from "@/components/hr-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface HRLayoutProps {
  children: React.ReactNode;
  title: string;
}

export default function HRLayout({ children, title }: HRLayoutProps) {
  const { userRole, isLoading } = useUserRole();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (userRole !== 'hr') {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-4">You don't have permission to access this page.</p>
          <Button onClick={() => window.location.href = '/login'}>
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <HRSidebar />
      <SidebarInset className="h-screen">
        <div className="flex flex-col h-screen bg-background text-foreground" suppressHydrationWarning>
          <SiteHeader title={title} />
          <div className="flex-1 overflow-y-auto bg-background">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

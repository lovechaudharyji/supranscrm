"use client"

import * as React from "react"
import {
  IconDashboard,
  IconListDetails,
  IconUsersGroup, // Employees icon
  IconSettings, // Admin/Settings icon
  IconClipboardList, // Task Manager icon
  IconCreditCard, // Subscriptions icon
  IconFileText, // Documents icon
  IconTicket, // Tickets icon
  IconClock, // Attendance icon
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/default-avatar.svg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Leads",
      url: "/dashboard/leads",
      icon: IconListDetails,
    },
    {
      title: "Employees",
      url: "/dashboard/employees",
      icon: IconUsersGroup,
    },
    {
      title: "Sales",
      url: "/dashboard/sales",
      icon: IconListDetails,
    },
    {
      title: "Auto-Assignment",
      url: "/dashboard/admin/auto-assignment",
      icon: IconSettings,
    },
    {
      title: "Task Manager",
      url: "/dashboard/tasks",
      icon: IconClipboardList,
    },
    {
      title: "Subscriptions",
      url: "/dashboard/subscriptions",
      icon: IconCreditCard,
    },
    {
      title: "Documents",
      url: "/dashboard/documents",
      icon: IconFileText,
    },
    {
      title: "Tickets",
      url: "/dashboard/tickets",
      icon: IconTicket,
    },
    {
      title: "Attendance",
      url: "/dashboard/attendance/admin",
      icon: IconClock,
    },
  ],
  navSecondary: [],
  documents: [],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader className="px-4 py-4 border-b border-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <IconUsersGroup className="!size-5" />
                <span className="text-base font-semibold">Startup Squad</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}

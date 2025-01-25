"use client"
import type * as React from "react"
import {
  Users,
  MessageCircle,
  User,
  Globe
} from "lucide-react"

import { NavMain } from "@/app/dashboard/components/navbar/nav-main"
import { NavUser } from "@/app/dashboard/components/navbar/nav-user"
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail, SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem, SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from "@/components/ui/sidebar"
import Image from "next/image"
import Link from "next/link"
import { ThemeModeToggleDashboard } from "@/components/custom/ThemeSwitcherDashboard"
import { useSidebar } from "@/components/ui/sidebar"

const data = {
  navMain: [
    {
      title: "Profile",
      url: "/dashboard/profile",
      icon: User,
      isActive: true,
      items: [
        {
          title: "User Profile",
          url: "/dashboard/profile/user-profile",
        },
        {
          title: "Employee Profile",
          url: "/dashboard/profile/employee-profile",
        },
        {
          title: "Employee Documents",
          url: "/dashboard/profile/employee-documents",
        },
      ],
    },
    {
      title: "Chat",
      url: "/dashboard/chats",
      icon: MessageCircle,
      items: [
        {
          title: "Chat History",
          url: "/dashboard/chat/chat-history",
        },
        {
          title: "Create Chat room",
          url: "/dashboard/chat/create-chat-room",
        },
        {
          title: "Join Chat room",
          url: "/dashboard/chat/join-chat-room",
        },
      ],
    },
  ],
  items: [
    {
      title: "Collegues",
      url: "/dashboard/collegues",
      icon: Users,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {

  const { isMobile, setOpenMobile } = useSidebar()

  return (
    <Sidebar collapsible='offcanvas' {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/dashboard" onClick={() => isMobile && setOpenMobile(false)}>
                <Globe />
                <span className="text-lg font-semibold">Connect Sphere</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <SidebarGroup>
          <SidebarGroupLabel>Company</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu >
              {data.items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <Link href={item.url} onClick={() => isMobile && setOpenMobile(false)}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <ThemeModeToggleDashboard />
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar >
  )
}


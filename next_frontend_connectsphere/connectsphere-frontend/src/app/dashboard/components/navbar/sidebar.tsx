"use client"
import type * as React from "react"
import {
  Users,
  MessageCircle,
  User,
  Globe,
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
import { ThemeModeToggle } from "@/components/custom/ThemeSwitcher"
import Image from "next/image"

const data = {
  navMain: [
    {
      title: "Profile",
      url: "#",
      icon: User,
      isActive: true,
      items: [
        {
          title: "User Profile",
          url: "/dashboard/profile",
        },
        {
          title: "Employee Profile",
          url: "/dashboard/employee",
        },
        {
          title: "Documents",
          url: "/dashboard/documents",
        },
      ],
    },
    {
      title: "Chat",
      url: "#",
      icon: MessageCircle,
      items: [
        {
          title: "Chat History",
          url: "/dashboard/chats",
        },
        {
          title: "Create Chat room",
          url: "/dashboard/chat-room",
        },
        {
          title: "Join Chat room",
          url: "/dashboard/join-chat-room",
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

export function AppSidebar({ collapsed, ...props }: React.ComponentProps<typeof Sidebar> & { collapsed?: boolean }) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <div className="flex gap-2 ml-1">
                <Image src="/logo.svg" alt="Connect Sphere Logo" width={20} height={40} />
                <span className="font-semibold">Connect Sphere</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <ThemeModeToggle />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <SidebarGroup>
          <SidebarGroupLabel>Company</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {data.items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}


"use client"
import type * as React from "react"
import {
  Users,
  MessageCircle,
  User
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

const data = {
  items: [
    {
      title: "Collegues",
      url: "#",
      icon: Users,
    },
  ],
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Acme Inc",
      logo: '',
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: '',
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: '',
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Profile",
      url: "#",
      icon: User,
      isActive: true,
      items: [
        {
          title: "User Profile",
          url: "#",
        },
        {
          title: "Employee Profile",
          url: "#",
        },
        {
          title: "Documents",
          url: "#",
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
          url: "#",
        },
        {
          title: "Create Chat room",
          url: "#",
        },
        {
          title: "Join Chat room",
          url: "#",
        },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex justify-end p-2">
          <ThemeModeToggle />
        </div>
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
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}


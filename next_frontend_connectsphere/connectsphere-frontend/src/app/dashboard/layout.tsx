import type { Metadata } from 'next'
import { AppSidebar } from "@/app/dashboard/components/navbar/sidebar";
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { DynamicBreadcrumb } from './components/navbar/breadcumb-nav';
import { ReduxProvider } from "@/components/custom/redux/ReduxProvider";
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import { SocketProvider } from "@/lib/socket-context"

export const metadata: Metadata = {
  title: 'Dashboard - Connect Sphere',
  description: 'Employee management and connection dashboard',
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/')
  }
  return (
    <ReduxProvider>
      <SocketProvider>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset className="flex-1">
            <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
              <div className="flex items-center gap-2 px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <DynamicBreadcrumb />
              </div>
            </header>
            {children}
          </SidebarInset>
        </SidebarProvider >
      </SocketProvider>
    </ReduxProvider>
  )
}

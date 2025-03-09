"use client"

import { SidebarProvider } from "@/components/ui/sidebar"
import { SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset>
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
} 
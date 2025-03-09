"use client"

import { SidebarProvider } from "@/components/ui/sidebar"
import { SidebarInset } from "@/components/ui/sidebar"

export default function CollectionsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider defaultOpen={true}>
      <SidebarInset>
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
} 
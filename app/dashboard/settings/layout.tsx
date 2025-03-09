import { SidebarProvider } from "@/components/ui/sidebar"

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider defaultOpen={true}>
      {children}
    </SidebarProvider>
  )
} 
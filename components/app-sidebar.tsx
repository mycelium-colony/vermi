"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  Settings2,
  Radio,
  MessageSquare,
  Megaphone,
  KeyRound,
} from "lucide-react"
import { SimplePool } from 'nostr-tools'

import { NavUser } from "@/components/nav-user"
import { RelayCollectionSwitcher } from "@/components/relay-collection-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarRail,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import { useNostr } from "@/contexts/nostr-context"
import { useCollections } from "@/contexts/collections-context"
import { cn } from "@/lib/utils"

// Navigation menu items
const navigationItems = [
  {
    title: "Home",
    url: "/dashboard/feed",
    icon: Home,
  },
  {
    title: "Announcements",
    url: "/dashboard/announcements",
    icon: Megaphone,
  },
  {
    title: "Messages",
    url: "/dashboard/messages",
    icon: MessageSquare,
  },
  {
    title: "Settings",
    url: "/dashboard/settings",
    icon: Settings2,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { npub, profile, isGuest } = useNostr();
  const { selectedCollection } = useCollections();
  const pathname = usePathname()
  const [connectedRelays, setConnectedRelays] = React.useState<string[]>([])
  const [failedRelays, setFailedRelays] = React.useState<string[]>([])

  React.useEffect(() => {
    if (!selectedCollection) {
      setConnectedRelays([])
      setFailedRelays([])
      return
    }

    const pool = new SimplePool()
    const relays = selectedCollection.relays
    const connectionPromises = relays.map(relay => 
      pool.ensureRelay(relay)
        .then(() => ({ relay, success: true }))
        .catch(() => ({ relay, success: false }))
    )

    Promise.all(connectionPromises).then(results => {
      const connected = results.filter(r => r.success).map(r => r.relay)
      const failed = results.filter(r => !r.success).map(r => r.relay)
      setConnectedRelays(connected)
      setFailedRelays(failed)
    })

    return () => {
      pool.close(relays)
    }
  }, [selectedCollection])

  const userData = {
    name: profile?.name || (isGuest ? "Guest User" : "Nostr User"),
    npub: npub || "",
    avatar: profile?.picture || ""
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <NavUser user={userData} />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {selectedCollection && (
          <SidebarGroup>
            <SidebarGroupLabel>{selectedCollection.name || "Active Collection"}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {selectedCollection.relays.map((relay, index) => (
                  <SidebarMenuItem key={index}>
                    <SidebarMenuButton asChild>
                      <Link href={`/dashboard/feed?relay=${encodeURIComponent(relay)}`}>
                        <Radio 
                          className={cn(
                            "size-4",
                            connectedRelays.includes(relay) && "text-green-500",
                            failedRelays.includes(relay) && "text-red-500"
                          )} 
                        />
                        <span className="truncate">{relay.replace('wss://', '')}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter>
        <RelayCollectionSwitcher />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

"use client"

import * as React from "react"
import { ChevronsUpDown, Radio } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

interface Collection {
  name: string;
  relays: string[];
}

interface CollectionSwitcherProps {
  collections: Collection[];
  onCollectionSelect: (collection: Collection) => void;
  selectedCollection?: Collection;
}

export function CollectionSwitcher({
  collections,
  onCollectionSelect,
  selectedCollection,
}: CollectionSwitcherProps) {
  const { isMobile } = useSidebar()

  if (!collections.length) {
    return null
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <Radio className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {selectedCollection?.name || collections[0].name}
                </span>
                <span className="truncate text-xs">
                  {selectedCollection?.relays.length || collections[0].relays.length} relays
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Collections
            </DropdownMenuLabel>
            {collections.map((collection, index) => (
              <DropdownMenuItem
                key={collection.name}
                onClick={() => onCollectionSelect(collection)}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-xs border">
                  <Radio className="size-4 shrink-0" />
                </div>
                {collection.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
} 
"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useNostr } from "@/contexts/nostr-context"
import { PageHeader } from "@/components/page-header"
import { SimplePool, Filter } from 'nostr-tools'
import { useEffect, useState } from "react"
import { useCollections } from "@/contexts/collections-context"

export default function SettingsPage() {
  const { resolvedTheme, setTheme } = useTheme()
  const { isGuest } = useNostr()
  const { selectedCollection } = useCollections()
  const [pool, setPool] = useState<SimplePool | null>(null)
  const [connectedRelays, setConnectedRelays] = useState<string[]>([])

  useEffect(() => {
    if (!selectedCollection) return;

    // Initialize the relay pool
    const newPool = new SimplePool()
    setPool(newPool)

    // Subscribe to kind 1 events from the selected relays
    const filters: Filter[] = [{ kinds: [1] }]
    const sub = newPool.sub(selectedCollection.relays, filters)

    sub.on('eose', () => {
      console.log('End of stored events')
      setConnectedRelays(selectedCollection.relays)
    })

    return () => {
      sub.unsub()
      if (newPool && selectedCollection) {
        newPool.close(selectedCollection.relays)
      }
    }
  }, [selectedCollection])

  return (
    <div className="flex flex-col h-full w-full">
      <PageHeader
        title="Settings"
        description="Manage your application settings and preferences"
      />
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto max-w-4xl p-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>
                  Customize how the application looks on your device.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={resolvedTheme === "light" ? "default" : "outline"}
                      size="icon"
                      onClick={() => setTheme("light")}
                    >
                      <Sun className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={resolvedTheme === "dark" ? "default" : "outline"}
                      size="icon"
                      onClick={() => setTheme("dark")}
                    >
                      <Moon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account</CardTitle>
                <CardDescription>
                  Manage your account settings and preferences.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Account Type</Label>
                  <div className="text-sm text-muted-foreground">
                    {isGuest ? "Guest Account" : "Nostr Account"}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Relay Connections</CardTitle>
                <CardDescription>
                  View and manage your Nostr relay connections.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Active Collection</Label>
                  <div className="text-sm text-muted-foreground">
                    {selectedCollection ? selectedCollection.name : 'No collection selected'}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Connected Relays</Label>
                  <div className="space-y-1">
                    {connectedRelays.map((relay, index) => (
                      <div key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        {relay}
                      </div>
                    ))}
                    {!connectedRelays.length && (
                      <div className="text-sm text-muted-foreground">
                        No active relay connections
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 
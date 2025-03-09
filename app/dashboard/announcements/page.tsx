"use client"

import { NostrFeed } from "@/components/nostr-feed"

export default function AnnouncementsPage() {
  return (
    <NostrFeed
      title="Announcements"
      description="View important announcements from the Nostr network"
      relayUrl="wss://relay.mycelium.social"
    />
  )
} 
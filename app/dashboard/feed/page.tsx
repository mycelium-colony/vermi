"use client"

import { NostrFeed } from "@/components/nostr-feed"

export default function FeedPage() {
  return (
    <NostrFeed
      title="Home Feed"
      description="View and interact with notes from the Nostr network"
      relayUrl="wss://relay.mycelium.social"
    />
  )
} 
"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import { SimplePool, Event } from "nostr-tools"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { processNostrReferences, NostrProfileRef, NostrNoteRef } from "@/components/nostr-refs"
import { extractMediaUrls, cleanContent, isImageUrl, isVideoUrl } from "@/lib/nostr-utils"
import { parse as parseThread, ThreadInfo } from '@/lib/nip10'

interface NostrNote extends Event {
  content: string;
  created_at: number;
  pubkey: string;
}

interface ThreadNoteProps {
  note: NostrNote;
  threadInfo?: ThreadInfo;
  isReply?: boolean;
  relayUrl?: string;
}

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp * 1000)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return `${seconds}s ago`
}

interface MediaContentProps {
  url: string;
}

function MediaContent({ url }: MediaContentProps) {
  const isImage = isImageUrl(url)
  const isVideo = isVideoUrl(url)

  if (isImage) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="block">
        <img 
          src={url} 
          alt="Media content" 
          className="rounded-lg max-h-96 w-auto mx-auto hover:opacity-90 transition-opacity"
          loading="lazy"
        />
      </a>
    )
  }

  if (isVideo) {
    return (
      <video 
        src={url} 
        controls 
        className="rounded-lg max-h-96 w-auto mx-auto"
      />
    )
  }

  return null
}

export function NostrNoteCard({ note, threadInfo, isReply = false, relayUrl }: ThreadNoteProps) {
  const mediaUrls = extractMediaUrls(note.content)
  const cleanedContent = cleanContent(note.content, mediaUrls)
  const [parentNote, setParentNote] = useState<NostrNote | null>(null)
  const [isLoadingParent, setIsLoadingParent] = useState(false)
  const [parentRelayUrl, setParentRelayUrl] = useState<string>()

  useEffect(() => {
    if (!threadInfo?.reply?.id || isReply) return;

    const fetchParentNote = async () => {
      setIsLoadingParent(true)
      try {
        // Create a temporary pool for fetching the parent note
        const tempPool = new SimplePool()
        
        // Try to fetch from the suggested relays first, then fall back to current relay
        const relaysToTry = [
          ...(threadInfo.reply?.relays || []),
          ...(threadInfo.profiles.flatMap(p => p.relays || [])),
        ]

        if (relaysToTry.length === 0 || !threadInfo.reply?.id) return;

        const sub = tempPool.sub(
          relaysToTry,
          [{ ids: [threadInfo.reply.id], kinds: [1] }]
        )

        let timeoutId = setTimeout(() => {
          sub.unsub()
          tempPool.close(relaysToTry)
          setIsLoadingParent(false)
        }, 5000)

        // @ts-ignore - nostr-tools type definition is incomplete
        sub.on('event', (event: NostrNote, relay: string) => {
          setParentNote(event)
          setParentRelayUrl(relay)
          clearTimeout(timeoutId)
          sub.unsub()
          tempPool.close(relaysToTry)
          setIsLoadingParent(false)
        })
      } catch (error) {
        console.error('Error fetching parent note:', error)
        setIsLoadingParent(false)
      }
    }

    fetchParentNote()
  }, [threadInfo, isReply])

  return (
    <Card className={isReply ? "border border-purple-500/20" : ""}>
      {parentNote && !isReply && (
        <div className="px-4 pt-4">
          <NostrNoteCard 
            note={parentNote}
            threadInfo={parseThread(parentNote)}
            isReply={true}
            relayUrl={parentRelayUrl}
          />
        </div>
      )}
      <CardHeader className="flex flex-row items-center gap-4 p-4">
        <Avatar>
          <AvatarFallback>{note.pubkey.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <NostrProfileRef pubkey={note.pubkey}>
            <CardTitle className="text-base">{note.pubkey.slice(0, 8)}...</CardTitle>
          </NostrProfileRef>
          <CardDescription className="text-xs flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>{formatTimestamp(note.created_at)}</span>
            {relayUrl && (
              <span className="text-muted-foreground">
                • via {relayUrl.replace('wss://', '')}
              </span>
            )}
            {threadInfo?.reply && !parentNote && !isReply && (
              <>
                <span className="text-muted-foreground">
                  • Reply to <NostrNoteRef noteId={threadInfo.reply.id} />
                </span>
                {isLoadingParent && (
                  <span className="text-muted-foreground italic">
                    (loading parent...)
                  </span>
                )}
              </>
            )}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0 space-y-2">
        <p className="text-sm whitespace-pre-wrap break-words">
          {processNostrReferences(cleanedContent)}
        </p>
        {mediaUrls.length > 0 && (
          <div className="grid gap-2 mt-2">
            {mediaUrls.map((url, index) => (
              <MediaContent key={index} url={url} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 
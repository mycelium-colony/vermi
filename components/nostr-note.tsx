"use client"

import * as React from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageSquare, Quote } from "lucide-react"
import { 
  formatPubkey, 
  formatEventId, 
  parseThread, 
  type ThreadInfo,
  extractMediaUrls,
  cleanContent,
  processNostrReferences,
  isImageUrl,
  isVideoUrl
} from "@/lib/nostr-utils"
import { fetchUserMetadata, type UserMetadata } from "@/lib/nostr-metadata"
import Link from "next/link"

interface NostrNote {
  id: string
  pubkey: string
  created_at: number
  content: string
  tags: string[][]
  sig: string
  kind: number
}

interface NostrNoteProps {
  note: NostrNote
  threadInfo?: ThreadInfo
  isReply?: boolean
  relayUrl?: string
  onReplyClick?: (note: NostrNote) => void
  quotedNote?: NostrNote
  replyCount?: number
}

function MediaContent({ url }: { url: string }) {
  if (isImageUrl(url)) {
    return (
      <div className="flex justify-center">
        <img 
          src={url} 
          alt="Note media" 
          className="rounded-md max-h-96 max-w-full object-contain hover:opacity-90 transition-opacity cursor-pointer"
          loading="lazy"
          onClick={() => window.open(url, '_blank')}
        />
      </div>
    )
  }
  
  if (isVideoUrl(url)) {
    return (
      <div className="flex justify-center">
        <video 
          src={url} 
          controls 
          className="rounded-md max-h-96 max-w-full"
          preload="metadata"
        />
      </div>
    )
  }

  return null
}

function QuotedNote({ note, relayUrl }: { note: NostrNote, relayUrl?: string }) {
  const [metadata, setMetadata] = React.useState<UserMetadata | null>(null)
  const mediaUrls = extractMediaUrls(note.content)
  const cleanedContent = cleanContent(note.content, mediaUrls)
  const processedContent = processNostrReferences(cleanedContent)

  React.useEffect(() => {
    if (relayUrl) {
      fetchUserMetadata(note.pubkey, relayUrl).then(setMetadata)
    }
  }, [note.pubkey, relayUrl])

  return (
    <Card className="border border-muted bg-muted/50">
      <CardHeader className="p-3">
        <div className="flex items-center gap-2">
          <Avatar className="h-4 w-4">
            {metadata?.picture ? (
              <AvatarImage src={metadata.picture} />
            ) : null}
            <AvatarFallback className="text-xs">
              {note.pubkey.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs font-medium">
            {metadata?.name || formatPubkey(note.pubkey)}
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground whitespace-pre-wrap break-words">
            {processedContent}
          </p>
          {mediaUrls.length > 0 && (
            <div className="grid gap-2">
              {mediaUrls.map((url, index) => (
                <MediaContent key={index} url={url} />
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function NostrNote({ 
  note, 
  threadInfo, 
  isReply = false, 
  relayUrl, 
  onReplyClick,
  quotedNote,
  replyCount = 0
}: NostrNoteProps) {
  const [metadata, setMetadata] = React.useState<UserMetadata | null>(null)
  const mediaUrls = extractMediaUrls(note.content)
  const cleanedContent = cleanContent(note.content, mediaUrls)
  const processedContent = processNostrReferences(cleanedContent)

  React.useEffect(() => {
    if (relayUrl) {
      fetchUserMetadata(note.pubkey, relayUrl).then(setMetadata)
    }
  }, [note.pubkey, relayUrl])

  return (
    <Link 
      href={`/note/${note.id}?relay=${encodeURIComponent(relayUrl || '')}`}
      className="block transition-opacity hover:opacity-90"
    >
      <Card className={isReply ? "border-l-4 border-l-purple-500/20" : ""}>
        <CardHeader className="flex flex-row items-center gap-4 p-6">
          <Avatar>
            {metadata?.picture ? (
              <AvatarImage src={metadata.picture} />
            ) : null}
            <AvatarFallback>{note.pubkey.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="font-semibold">
              {metadata?.name || formatPubkey(note.pubkey)}
              {metadata?.nip05 && (
                <span className="ml-1 text-xs text-muted-foreground">
                  ✓ {metadata.nip05}
                </span>
              )}
            </div>
            <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1">
              <span>{new Date(note.created_at * 1000).toLocaleString()}</span>
              {relayUrl && (
                <span>• via {relayUrl.replace('wss://', '')}</span>
              )}
              {threadInfo?.reply && (
                <span>
                  • Reply to {formatEventId(threadInfo.reply.id)}
                </span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6 space-y-4">
          <div className="space-y-4">
            <p className="text-sm whitespace-pre-wrap break-words">
              {processedContent}
            </p>
            {mediaUrls.length > 0 && (
              <div className="grid gap-2">
                {mediaUrls.map((url, index) => (
                  <MediaContent key={index} url={url} />
                ))}
              </div>
            )}
          </div>
          {quotedNote && (
            <div className="mt-4">
              <QuotedNote note={quotedNote} relayUrl={relayUrl} />
            </div>
          )}
          <div className="flex items-center gap-4 mt-4">
            {onReplyClick && (
              <button
                onClick={() => onReplyClick(note)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Reply {replyCount > 0 ? `(${replyCount})` : ''}</span>
              </button>
            )}
            {quotedNote && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Quote className="h-4 w-4" />
                <span>Quoted note</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
} 
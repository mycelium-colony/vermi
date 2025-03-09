"use client"

import * as React from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/page-header"
import { NostrNote } from "@/components/nostr-note"
import { parseThread, type ThreadInfo } from "@/lib/nostr-utils"
import { ArrowLeft } from "lucide-react"

type NostrEvent = {
  kind: number
  created_at: number
  content: string
  tags: string[][]
  pubkey: string
  id: string
  sig: string
}

const EVENT_KINDS = {
  TEXT_NOTE: 1,
} as const

export default function NotePage() {
  const params = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()
  const noteId = params?.id
  const relayUrl = searchParams?.get('relay') || "wss://relay.mycelium.social"

  // Return early if no note ID
  if (!noteId) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader
          title="Note"
          description="View note and replies"
        />
        <div className="flex-1 overflow-auto">
          <div className="container mx-auto max-w-4xl p-6">
            <Button
              variant="ghost"
              className="gap-2"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Feed
            </Button>
            <div className="mt-6">Note not found</div>
          </div>
        </div>
      </div>
    )
  }

  const [note, setNote] = React.useState<NostrEvent | null>(null)
  const [replies, setReplies] = React.useState<NostrEvent[]>([])
  const [threadMap, setThreadMap] = React.useState<Record<string, ThreadInfo>>({})
  const [quotedNotes, setQuotedNotes] = React.useState<Record<string, NostrEvent>>({})
  const [replyCounts, setReplyCounts] = React.useState<Record<string, number>>({})
  const [status, setStatus] = React.useState<string>("Connecting")
  const wsRef = React.useRef<WebSocket | null>(null)

  const connect = React.useCallback(async () => {
    try {
      if (wsRef.current) {
        wsRef.current.close()
      }

      const ws = new WebSocket(relayUrl)
      wsRef.current = ws

      ws.onopen = () => {
        setStatus("Connected")
        // Request the main note
        const mainNoteReq = ["REQ", "main", { ids: [noteId] }]
        ws.send(JSON.stringify(mainNoteReq))

        // Request replies to this note
        const repliesReq = ["REQ", "replies", {
          kinds: [EVENT_KINDS.TEXT_NOTE],
          "#e": [noteId]
        }]
        ws.send(JSON.stringify(repliesReq))
      }

      ws.onclose = () => {
        setStatus("Disconnected")
      }

      ws.onerror = () => {
        setStatus("Error")
      }

      ws.onmessage = async (message) => {
        const data = JSON.parse(message.data)
        
        if (data[0] === "EVENT" && data[2]) {
          const event = data[2] as NostrEvent

          // Parse thread information
          const threadInfo = parseThread(event)
          setThreadMap(prev => ({
            ...prev,
            [event.id]: threadInfo
          }))

          // Update reply counts
          if (threadInfo.reply) {
            setReplyCounts(prev => ({
              ...prev,
              [threadInfo.reply!.id]: (prev[threadInfo.reply!.id] || 0) + 1
            }))
          }

          // Check for quotes
          const quoteTags = event.tags.filter(tag => tag[0] === 'q')
          if (quoteTags.length > 0) {
            quoteTags.forEach(tag => {
              const [_, quotedId] = tag
              const quoteReq = ["REQ", `quote-${quotedId}`, { ids: [quotedId] }]
              ws.send(JSON.stringify(quoteReq))
            })
          }

          // Store quoted notes
          if (event.kind === EVENT_KINDS.TEXT_NOTE) {
            const isQuote = data[1].startsWith('quote-')
            if (isQuote) {
              setQuotedNotes(prev => ({
                ...prev,
                [event.id]: event
              }))
              return
            }
          }

          // Handle main note and replies
          if (event.kind === EVENT_KINDS.TEXT_NOTE) {
            if (event.id === noteId) {
              setNote(event)
            } else if (threadInfo.reply?.id === noteId) {
              setReplies(prev => {
                if (prev.some(r => r.id === event.id)) return prev
                return [...prev].sort((a, b) => b.created_at - a.created_at)
              })
            }
          }
        }
      }
    } catch (error) {
      setStatus("Error")
    }
  }, [noteId, relayUrl])

  React.useEffect(() => {
    connect()
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [connect])

  const handleReply = async (note: NostrEvent) => {
    // Implement reply functionality
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Note"
        description="View note and replies"
      />
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto max-w-4xl p-6 space-y-6">
          <Button
            variant="ghost"
            className="gap-2"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Feed
          </Button>

          <div className="space-y-6">
            {note && (
              <NostrNote
                note={note}
                threadInfo={threadMap[note.id]}
                quotedNote={quotedNotes[note.id]}
                replyCount={replyCounts[note.id] || 0}
                onReplyClick={handleReply}
                relayUrl={relayUrl}
              />
            )}

            {replies.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Replies</h2>
                <div className="space-y-4">
                  {replies.map((reply) => (
                    <NostrNote
                      key={reply.id}
                      note={reply}
                      threadInfo={threadMap[reply.id]}
                      quotedNote={quotedNotes[reply.id]}
                      replyCount={replyCounts[reply.id] || 0}
                      onReplyClick={handleReply}
                      relayUrl={relayUrl}
                      isReply
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 
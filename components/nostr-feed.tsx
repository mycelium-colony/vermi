"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/page-header"
import { NostrNote } from "@/components/nostr-note"
import { parseThread, type ThreadInfo } from "@/lib/nostr-utils"

type NostrEvent = {
  kind: number
  created_at: number
  content: string
  tags: string[][]
  pubkey: string
  id: string
  sig: string
}

// Event kinds as per NIPs
const EVENT_KINDS = {
  METADATA: 0,
  TEXT_NOTE: 1,
  RECOMMEND_RELAY: 2,
  CONTACTS: 3,
  ENCRYPTED_DIRECT_MESSAGE: 4,
  DELETE: 5,
  REPOST: 6,
  REACTION: 7,
  BADGE_AWARD: 8,
  CHAT_MESSAGE: 9,
  MUTE_LIST: 10000,
  REPORTING: 1984,
  LONG_FORM: 30023,
} as const

// Sort events by timestamp, most recent first
const sortEventsByTimestamp = (events: NostrEvent[]) => {
  return [...events].sort((a, b) => b.created_at - a.created_at)
}

interface NostrFeedProps {
  title: string
  description?: string
  relayUrl: string
}

export function NostrFeed({ title, description = "View and interact with notes from the Nostr network", relayUrl }: NostrFeedProps) {
  const [status, setStatus] = React.useState<string>("Disconnected")
  const [logs, setLogs] = React.useState<string[]>([])
  const wsRef = React.useRef<WebSocket | null>(null)
  const [pubkey, setPubkey] = React.useState<string | null>(null)
  const [events, setEvents] = React.useState<NostrEvent[]>([])
  const [threadMap, setThreadMap] = React.useState<Record<string, ThreadInfo>>({})
  const [replyTo, setReplyTo] = React.useState<NostrEvent | null>(null)
  const [quotedNotes, setQuotedNotes] = React.useState<Record<string, NostrEvent>>({})
  const [replyCounts, setReplyCounts] = React.useState<Record<string, number>>({})

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toISOString()}: ${message}`])
  }

  const connect = async () => {
    try {
      if (!window.nostr) {
        throw new Error("Nostr extension not found")
      }

      // Get public key first
      const pk = await window.nostr.getPublicKey()
      setPubkey(pk)
      addLog(`Got public key: ${pk}`)

      // Close existing connection if any
      if (wsRef.current) {
        wsRef.current.close()
      }

      setStatus("Connecting...")
      addLog("Connecting to relay...")

      const ws = new WebSocket(relayUrl)
      wsRef.current = ws

      ws.onopen = () => {
        setStatus("Connected")
        addLog("Connected to relay")
      }

      ws.onclose = () => {
        setStatus("Disconnected")
        addLog("Disconnected from relay")
      }

      ws.onerror = (error) => {
        setStatus("Error")
        addLog(`WebSocket error: ${error}`)
      }

      ws.onmessage = async (message) => {
        const data = JSON.parse(message.data)
        addLog(`Received: ${JSON.stringify(data)}`)

        if (data[0] === "AUTH") {
          const challenge = data[1]
          addLog(`Got auth challenge: ${challenge}`)

          try {
            if (!window.nostr) {
              throw new Error("Nostr extension not found")
            }

            // Create auth event
            const event: NostrEvent = {
              kind: 22242,
              created_at: Math.floor(Date.now() / 1000),
              tags: [
                ["relay", relayUrl],
                ["challenge", challenge]
              ],
              content: "",
              pubkey: pk,
              id: "", // Will be set by the extension
              sig: "" // Will be set by the extension
            }

            // Sign the event
            const signedEvent = await window.nostr.signEvent(event)
            addLog(`Event signed: ${JSON.stringify(signedEvent)}`)

            // Send AUTH response
            ws.send(JSON.stringify(["AUTH", signedEvent]))
            addLog("Sent AUTH response")
          } catch (error) {
            addLog(`Error signing event: ${error}`)
          }
        }

        if (data[0] === "OK" && data.length > 2) {
          if (data[2] === true) {
            setStatus("Authenticated")
            addLog("Authentication successful")
            // After successful auth, subscribe to feed
            subscribeToFeed()
          } else {
            setStatus("Auth Failed")
            addLog(`Auth failed: ${data[3]}`)
          }
        }

        // Handle incoming events
        if (data[0] === "EVENT" && data[2]) {
          const event = data[2] as NostrEvent

          // Handle reposts
          if (event.kind === EVENT_KINDS.REPOST) {
            const repostTag = event.tags.find(tag => tag[0] === 'e')
            if (repostTag) {
              requestQuotedNote(repostTag[1])
            }
            return // Don't add reposts to the main feed
          }

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

          // Check for quotes (q tags)
          const quoteTags = event.tags.filter(tag => tag[0] === 'q')
          if (quoteTags.length > 0) {
            // Request quoted notes
            quoteTags.forEach(tag => {
              const [_, quotedId] = tag
              requestQuotedNote(quotedId)
            })
          }

          // Handle text notes
          if (event.kind === EVENT_KINDS.TEXT_NOTE) {
            // Check if this is a response to a quote/repost request
            const isQuoteResponse = Object.values(quotedNotes).some(n => n.id === event.id)
            
            if (!isQuoteResponse) {
              // Add to main feed if it's not a quote response
              setEvents(prev => {
                // Don't add duplicates
                if (prev.some(e => e.id === event.id)) return prev
                // Add new event and sort by timestamp
                const newEvents = [event, ...prev].slice(0, 50) // Keep last 50 events
                return sortEventsByTimestamp(newEvents)
              })
            } else {
              // Update the quoted note if we already have it
              setQuotedNotes(prev => ({
                ...prev,
                [event.id]: event
              }))
            }
          }
        }
      }
    } catch (error) {
      setStatus("Error")
      addLog(`Error: ${error}`)
    }
  }

  const requestQuotedNote = (noteId: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return

    const subId = Math.random().toString(36).substring(7)
    wsRef.current.send(JSON.stringify([
      "REQ",
      subId,
      {
        ids: [noteId],
        kinds: [EVENT_KINDS.TEXT_NOTE]
      }
    ]))
  }

  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close()
    }
  }

  const subscribeToFeed = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const subId = Math.random().toString(36).substring(7)
      // Subscribe to text notes and reposts
      const req = ["REQ", subId, { 
        kinds: [
          EVENT_KINDS.TEXT_NOTE,
          EVENT_KINDS.REPOST,
          EVENT_KINDS.LONG_FORM
        ], 
        limit: 50,
        // Request events in descending order by timestamp
        until: Math.floor(Date.now() / 1000),
      }]
      wsRef.current.send(JSON.stringify(req))
      addLog(`Sent subscription request: ${JSON.stringify(req)}`)
    } else {
      addLog("WebSocket not connected")
    }
  }

  const handleReply = async (note: NostrEvent) => {
    if (!pubkey || !window.nostr) return
    setReplyTo(note)
  }

  // Sort events before rendering
  const sortedEvents = React.useMemo(() => {
    return sortEventsByTimestamp(events)
  }, [events])

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title={title}
        description={description}
      />
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto max-w-4xl p-6 space-y-6">
          <div className="flex gap-4 items-center">
            <Button onClick={connect} disabled={status === "Connecting"}>
              Connect & Authenticate
            </Button>
            <Button onClick={disconnect} variant="outline">
              Disconnect
            </Button>
            <span className="ml-4">Status: {status}</span>
          </div>

          <div className="space-y-4">
            {sortedEvents.map((event) => (
              <NostrNote
                key={event.id}
                note={event}
                threadInfo={threadMap[event.id]}
                quotedNote={quotedNotes[event.id]}
                replyCount={replyCounts[event.id] || 0}
                onReplyClick={handleReply}
                relayUrl={relayUrl}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 
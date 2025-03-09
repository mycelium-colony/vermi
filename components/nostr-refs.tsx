import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { Card } from "@/components/ui/card"
import { shortenRef } from "@/lib/nostr-utils"

interface NostrNoteRefProps {
  noteId: string;
  children?: React.ReactNode;
}

interface NostrProfileRefProps {
  pubkey: string;
  children?: React.ReactNode;
}

export function NostrNoteRef({ noteId, children }: NostrNoteRefProps) {
  const shortened = shortenRef(noteId)
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <span className="text-purple-500 hover:underline cursor-pointer">
          {children || `note:${shortened}`}
        </span>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Note Preview</h4>
          <Card className="p-2">
            <p className="text-xs text-muted-foreground break-all">{noteId}</p>
          </Card>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}

export function NostrProfileRef({ pubkey, children }: NostrProfileRefProps) {
  const shortened = shortenRef(pubkey)
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <span className="text-purple-500 hover:underline cursor-pointer">
          {children || `@${shortened}`}
        </span>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Profile</h4>
          <Card className="p-2">
            <p className="text-xs text-muted-foreground break-all">{pubkey}</p>
          </Card>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}

export function processNostrReferences(content: string): React.ReactNode {
  // Regular expressions for matching Nostr references
  const noteRegex = /nostr:note1[a-zA-Z0-9]{58}/g
  const profileRegex = /nostr:npub1[a-zA-Z0-9]{58}/g
  const atPubkeyRegex = /@npub1[a-zA-Z0-9]{58}/g

  let elements: React.ReactNode[] = []
  let lastIndex = 0

  // Function to process matches
  const processMatches = (regex: RegExp, type: 'note' | 'profile') => {
    const matches = Array.from(content.matchAll(regex))
    
    matches.forEach((match) => {
      const startIndex = match.index!
      
      // Add text before the match
      if (startIndex > lastIndex) {
        elements.push(content.slice(lastIndex, startIndex))
      }

      // Add the reference component
      const value = match[0].replace('nostr:', '').replace('@', '')
      if (type === 'note') {
        elements.push(
          <NostrNoteRef key={`note-${startIndex}`} noteId={value} />
        )
      } else {
        elements.push(
          <NostrProfileRef key={`profile-${startIndex}`} pubkey={value} />
        )
      }

      lastIndex = startIndex + match[0].length
    })
  }

  // Process all types of references
  processMatches(noteRegex, 'note')
  processMatches(profileRegex, 'profile')
  processMatches(atPubkeyRegex, 'profile')

  // Add any remaining text
  if (lastIndex < content.length) {
    elements.push(content.slice(lastIndex))
  }

  return <>{elements}</>
} 
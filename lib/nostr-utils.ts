import { nip19 } from 'nostr-tools'

export interface ThreadInfo {
  root?: EventPointer
  reply?: EventPointer
  mentions: EventPointer[]
  profiles: ProfilePointer[]
}

export interface EventPointer {
  id: string
  relays?: string[]
  author?: string
}

export interface ProfilePointer {
  pubkey: string
  relays?: string[]
}

export function parseThread(event: { tags: string[][] }): ThreadInfo {
  const result: ThreadInfo = {
    reply: undefined,
    root: undefined,
    mentions: [],
    profiles: [],
  }

  let maybeParent: EventPointer | undefined
  let maybeRoot: EventPointer | undefined

  for (let i = event.tags.length - 1; i >= 0; i--) {
    const tag = event.tags[i]

    if (tag[0] === 'e' && tag[1]) {
      const [_, eTagEventId, eTagRelayUrl, eTagMarker, eTagAuthor] = tag

      const eventPointer: EventPointer = {
        id: eTagEventId,
        relays: eTagRelayUrl ? [eTagRelayUrl] : [],
        author: eTagAuthor,
      }

      if (eTagMarker === 'root') {
        result.root = eventPointer
        continue
      }

      if (eTagMarker === 'reply') {
        result.reply = eventPointer
        continue
      }

      if (!maybeParent) {
        maybeParent = eventPointer
      } else {
        maybeRoot = eventPointer
      }

      result.mentions.push(eventPointer)
    }

    if (tag[0] === 'p' && tag[1]) {
      result.profiles.push({
        pubkey: tag[1],
        relays: tag[2] ? [tag[2]] : [],
      })
    }
  }

  // Get legacy (positional) markers, set reply to root and vice-versa if one of them is missing
  if (!result.root) {
    result.root = maybeRoot || maybeParent || result.reply
  }
  if (!result.reply) {
    result.reply = maybeParent || result.root
  }

  return result
}

export function formatPubkey(pubkey: string): string {
  try {
    return nip19.npubEncode(pubkey)
  } catch {
    return pubkey.slice(0, 8) + '...'
  }
}

export function formatEventId(id: string): string {
  try {
    return nip19.noteEncode(id)
  } catch {
    return id.slice(0, 8) + '...'
  }
}

export function extractMediaUrls(content: string): string[] {
  const urlRegex = /(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g
  const urls = content.match(urlRegex) || []
  return urls.filter(url => isMediaUrl(url))
}

export function isMediaUrl(url: string): boolean {
  return isImageUrl(url) || isVideoUrl(url)
}

export function isImageUrl(url: string): boolean {
  return /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(url)
}

export function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm|ogg)(\?.*)?$/i.test(url)
}

export function cleanContent(content: string, mediaUrls: string[]): string {
  let cleaned = content
  mediaUrls.forEach(url => {
    cleaned = cleaned.replace(url, '')
  })
  return cleaned.trim()
}

export function processNostrReferences(content: string): string {
  // Replace nostr: URLs with formatted versions
  return content.replace(/nostr:(npub|note|nevent|nprofile)1[ac-hj-np-z02-9]+/gi, (match) => {
    try {
      const { type, data } = nip19.decode(match.replace('nostr:', ''))
      
      switch (type) {
        case 'npub':
          return `@${formatPubkey(data as string)}`
        case 'note':
          return `#${formatEventId(data as string)}`
        case 'nevent':
          return `#${formatEventId((data as any).id)}`
        case 'nprofile':
          return `@${formatPubkey((data as any).pubkey)}`
        default:
          return match
      }
    } catch {
      return match
    }
  })
}

// Shorten Nostr references (npub, note) to a readable format
export function shortenRef(ref: string): string {
  if (!ref) return ''
  if (ref.length < 12) return ref
  return `${ref.slice(0, 8)}...${ref.slice(-4)}`
}

// Extract non-media URLs from content
export function extractUrls(content: string): string[] {
  const urlRegex = /(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g
  const urls = content.match(urlRegex) || []
  return urls.filter(url => !isImageUrl(url) && !isVideoUrl(url))
} 
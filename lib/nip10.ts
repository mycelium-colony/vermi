import type { Event } from 'nostr-tools'

export interface EventPointer {
  id: string
  relays?: string[]
  author?: string
}

export interface ProfilePointer {
  pubkey: string
  relays?: string[]
}

export interface ThreadInfo {
  root?: EventPointer
  reply?: EventPointer
  mentions: EventPointer[]
  profiles: ProfilePointer[]
}

export function parse(event: Pick<Event, 'tags'>): ThreadInfo {
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
      continue
    }

    if (tag[0] === 'p' && tag[1]) {
      result.profiles.push({
        pubkey: tag[1],
        relays: tag[2] ? [tag[2]] : [],
      })
      continue
    }
  }

  // Get legacy (positional) markers, set reply to root and vice-versa if one of them is missing
  if (!result.root) {
    result.root = maybeRoot || maybeParent || result.reply
  }
  if (!result.reply) {
    result.reply = maybeParent || result.root
  }

  // Remove root and reply from mentions, inherit relay hints from authors if any
  ;[result.reply, result.root].forEach(ref => {
    if (!ref) return

    let idx = result.mentions.findIndex(m => m.id === ref.id)
    if (idx !== -1) {
      result.mentions.splice(idx, 1)
    }
    if (ref.author) {
      let author = result.profiles.find(p => p.pubkey === ref.author)
      if (author && author.relays) {
        if (!ref.relays) {
          ref.relays = []
        }
        author.relays.forEach(url => {
          if (!ref.relays!.includes(url)) ref.relays!.push(url)
        })
        author.relays = ref.relays
      }
    }
  })

  return result
} 
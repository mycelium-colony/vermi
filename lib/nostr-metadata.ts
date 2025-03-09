import { nip19 } from 'nostr-tools'

export interface UserMetadata {
  name?: string
  about?: string
  picture?: string
  nip05?: string
  banner?: string
  lud16?: string
}

const metadataCache = new Map<string, UserMetadata>()
const metadataPromises = new Map<string, Promise<UserMetadata>>()

export async function fetchUserMetadata(pubkey: string, relayUrl: string): Promise<UserMetadata> {
  // Check cache first
  const cached = metadataCache.get(pubkey)
  if (cached) return cached

  // Check if we're already fetching this metadata
  const existingPromise = metadataPromises.get(pubkey)
  if (existingPromise) return existingPromise

  const fetchPromise = (async () => {
    try {
      // Try primary relay first
      let metadata = await fetchMetadataFromRelay(pubkey, relayUrl)
      
      // If no metadata found, try fallback relay
      if (!metadata && relayUrl !== 'wss://gv.rogue.earth') {
        metadata = await fetchMetadataFromRelay(pubkey, 'wss://gv.rogue.earth')
      }

      if (metadata) {
        metadataCache.set(pubkey, metadata)
        return metadata
      }
    } catch (error) {
      console.error('Error fetching user metadata:', error)
    }

    // Return empty metadata if nothing found
    return {}
  })()

  metadataPromises.set(pubkey, fetchPromise)
  const result = await fetchPromise
  metadataPromises.delete(pubkey)
  return result
}

async function fetchMetadataFromRelay(pubkey: string, relayUrl: string): Promise<UserMetadata | null> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(relayUrl)
    const timeout = setTimeout(() => {
      ws.close()
      resolve(null)
    }, 5000)

    ws.onopen = () => {
      const subId = Math.random().toString(36).substring(7)
      ws.send(JSON.stringify([
        "REQ",
        subId,
        {
          kinds: [0],
          authors: [pubkey],
          limit: 1
        }
      ]))
    }

    ws.onmessage = (message) => {
      const data = JSON.parse(message.data)
      if (data[0] === "EVENT" && data[2]?.kind === 0) {
        try {
          const metadata = JSON.parse(data[2].content)
          clearTimeout(timeout)
          ws.close()
          resolve(metadata)
        } catch (error) {
          console.error('Error parsing metadata:', error)
          resolve(null)
        }
      } else if (data[0] === "EOSE") {
        clearTimeout(timeout)
        ws.close()
        resolve(null)
      }
    }

    ws.onerror = () => {
      clearTimeout(timeout)
      ws.close()
      resolve(null)
    }
  })
}

// Helper function to get display name
export function getDisplayName(metadata: UserMetadata | null, pubkey: string): string {
  if (!metadata) return formatPubkey(pubkey)
  return metadata.name || metadata.nip05 || formatPubkey(pubkey)
}

function formatPubkey(pubkey: string): string {
  try {
    return nip19.npubEncode(pubkey)
  } catch {
    return pubkey.slice(0, 8) + '...'
  }
} 
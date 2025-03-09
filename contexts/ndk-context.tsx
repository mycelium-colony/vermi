"use client"

import * as React from "react"
import NDK, { 
  NDKEvent, 
  NDKRelay,
  NDKRelayAuthPolicies,
  NDKNip07Signer,
  NDKRelaySet
} from "@nostr-dev-kit/ndk"
import { useNostr } from "./nostr-context"
import { fetchRelayInformation } from "@/lib/nip11"

interface NDKContextType {
  ndk: NDK | null
  connectedRelays: Set<string>
  authRequiredRelays: Set<string>
  authenticatedRelays: Set<string>
  connectToRelay: (url: string, requireAuth?: boolean) => Promise<boolean>
  disconnectFromRelay: (url: string) => void
  authRelayWithUser: (url: string) => Promise<boolean>
  connectToRelays: (urls: string[]) => Promise<void>
  disconnectFromAllRelays: () => void
}

const NDKContext = React.createContext<NDKContextType | undefined>(undefined)

export function NDKProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useNostr()
  const [ndk, setNDK] = React.useState<NDK | null>(null)
  const [connectedRelays, setConnectedRelays] = React.useState<Set<string>>(new Set())
  const [authRequiredRelays, setAuthRequiredRelays] = React.useState<Set<string>>(new Set())
  const [authenticatedRelays, setAuthenticatedRelays] = React.useState<Set<string>>(new Set())

  // Initialize NDK
  React.useEffect(() => {
    if (!isAuthenticated || typeof window === 'undefined' || !window.nostr) return

    const setupNDK = async () => {
      try {
        // Create and initialize the NIP-07 signer
        const nip07signer = new NDKNip07Signer()
        
        // Create NDK instance
        const ndkInstance = new NDK({
          explicitRelayUrls: [],
          signer: nip07signer,
          enableOutboxModel: false // Important for NIP-42
        })

        // Wait for signer to be ready
        const activeUser = await nip07signer.blockUntilReady()
        console.log('NDK active user:', activeUser)

        // Connect to NDK
        await ndkInstance.connect()

        // Set up default auth policy to reject auth by default
        ndkInstance.relayAuthDefaultPolicy = async (relay: NDKRelay) => {
          return false // Don't auto-authenticate to relays
        }

        // Handle successful connections
        ndkInstance.pool.on('relay:connect', (relay: NDKRelay) => {
          console.log(`Connected to relay: ${relay.url}`)
          setConnectedRelays(prev => new Set([...prev, relay.url]))
        })

        // Handle disconnections
        ndkInstance.pool.on('relay:disconnect', (relay: NDKRelay) => {
          console.log(`Disconnected from relay: ${relay.url}`)
          setConnectedRelays(prev => {
            const newSet = new Set(prev)
            newSet.delete(relay.url)
            return newSet
          })
          // Also remove from authenticated relays if it was authenticated
          setAuthenticatedRelays(prev => {
            const newSet = new Set(prev)
            newSet.delete(relay.url)
            return newSet
          })
        })

        setNDK(ndkInstance)
      } catch (error) {
        console.error('Failed to initialize NDK:', error)
      }
    }

    setupNDK()

    return () => {
      if (ndk) {
        ndk.pool.removeAllListeners()
      }
    }
  }, [isAuthenticated])

  // Ensure relay URL has trailing slash as per NIP-42
  const normalizeRelayUrl = (url: string): string => {
    // Add trailing slash if not present
    return url.endsWith('/') ? url : `${url}/`
  }

  const waitForAuth = async (relay: NDKRelay): Promise<boolean> => {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        cleanup();
        resolve(false);
      }, 10000);

      const cleanup = () => {
        clearTimeout(timeout);
        relay.removeListener('auth', onAuth);
        relay.removeListener('authed', onAuthed);
        relay.removeListener('auth:failed', onAuthFailed);
      };

      const onAuth = async (challenge: string) => {
        console.log('Got auth challenge:', challenge);

        try {
          if (!ndk) {
            throw new Error('NDK not initialized');
          }

          // Create auth event
          const event = new NDKEvent(ndk);
          event.kind = 22242;
          event.created_at = Math.floor(Date.now() / 1000);
          event.tags = [
            ['relay', relay.url],
            ['challenge', challenge]
          ];
          event.content = '';

          // Sign the event
          await event.sign();
          console.log('Auth event signed:', event);

          // Create a relay set for this specific relay
          const relaySet = new NDKRelaySet(
            new Set([relay]),
            ndk
          );

          // Send AUTH message with signed event
          await relay.connect();
          await event.publish(relaySet);
          console.log('Sent AUTH response');
        } catch (error) {
          console.error('Failed to create or send auth event:', error);
          cleanup();
          resolve(false);
        }
      };

      const onAuthed = () => {
        console.log('Authentication successful');
        cleanup();
        resolve(true);
      };

      const onAuthFailed = (error: Error) => {
        console.log('Authentication failed:', error.message);
        cleanup();
        resolve(false);
      };

      // Listen for auth events
      relay.on('auth', onAuth);
      relay.on('authed', onAuthed);
      relay.on('auth:failed', onAuthFailed);
    });
  };

  const connectToRelays = async (urls: string[]) => {
    if (!ndk) return

    for (const rawUrl of urls) {
      const relayUrl = normalizeRelayUrl(rawUrl)
      console.log(`Processing relay: ${relayUrl}`)

      // Fetch NIP-11 information
      const info = await fetchRelayInformation(relayUrl)
      if (info) {
        // Track auth requirement
        if (info.limitation?.auth_required) {
          setAuthRequiredRelays(prev => new Set([...prev, relayUrl]))
        }

        // Connect to relay
        try {
          // Disconnect existing relay if any
          const existingRelay = ndk.pool.relays.get(relayUrl)
          if (existingRelay) {
            console.log(`Disconnecting existing relay: ${relayUrl}`)
            existingRelay.disconnect()
          }

          // Add relay with appropriate auth policy
          console.log(`Adding relay with ${info.limitation?.auth_required ? 'auth required' : 'no auth'}: ${relayUrl}`)
          const relay = info.limitation?.auth_required
            ? await ndk.addExplicitRelay(relayUrl, NDKRelayAuthPolicies.signIn({ ndk }))
            : await ndk.addExplicitRelay(relayUrl)

          if (relay) {
            console.log(`Connecting to relay: ${relayUrl}`)
            await relay.connect()
            
            // If auth is required, wait for authentication
            if (info.limitation?.auth_required) {
              console.log(`Waiting for auth on ${relayUrl}`)
              const authed = await waitForAuth(relay)
              if (authed) {
                console.log(`Successfully authenticated with ${relayUrl}`)
                setAuthenticatedRelays(prev => new Set([...prev, relayUrl]))
              } else {
                console.log(`Auth timed out for ${relayUrl}, retrying...`)
                // Try one more time
                const retryAuthed = await waitForAuth(relay)
                if (retryAuthed) {
                  console.log(`Successfully authenticated with ${relayUrl} on retry`)
                  setAuthenticatedRelays(prev => new Set([...prev, relayUrl]))
                } else {
                  console.log(`Auth failed after retry for ${relayUrl}`)
                }
              }
            }
          }
        } catch (error) {
          console.error(`Failed to connect to ${relayUrl}:`, error)
        }
      }
    }
  }

  const disconnectFromAllRelays = () => {
    if (!ndk) return

    console.log('Disconnecting from all relays')
    ndk.pool.relays.forEach(relay => {
      relay.disconnect()
    })

    // Clear all relay states
    setConnectedRelays(new Set())
    setAuthenticatedRelays(new Set())
  }

  const connectToRelay = async (url: string, requireAuth: boolean = false): Promise<boolean> => {
    if (!ndk) return false

    const relayUrl = normalizeRelayUrl(url)
    try {
      // First disconnect from all relays
      disconnectFromAllRelays()

      console.log(`Adding relay with ${requireAuth ? 'auth required' : 'no auth'}: ${relayUrl}`)
      
      const relay = requireAuth
        ? await ndk.addExplicitRelay(relayUrl, NDKRelayAuthPolicies.signIn({ ndk }))
        : await ndk.addExplicitRelay(relayUrl)

      // Wait for connection
      await relay.connect()
      console.log(`Connected to relay: ${relayUrl}`)

      if (requireAuth) {
        setAuthRequiredRelays(prev => new Set([...prev, relayUrl]))
        console.log(`Waiting for auth on ${relayUrl}`)
        const authed = await waitForAuth(relay)
        if (authed) {
          console.log(`Successfully authenticated with ${relayUrl}`)
          setAuthenticatedRelays(prev => new Set([...prev, relayUrl]))
          setConnectedRelays(prev => new Set([...prev, relayUrl]))
          return true
        } else {
          console.log(`Auth failed for ${relayUrl}`)
          relay.disconnect()
          return false
        }
      } else {
        setConnectedRelays(prev => new Set([...prev, relayUrl]))
        return true
      }
    } catch (error) {
      console.error(`Failed to connect to ${relayUrl}:`, error)
      return false
    }
  }

  const disconnectFromRelay = (url: string) => {
    if (!ndk) return

    const relayUrl = normalizeRelayUrl(url)
    const relay = ndk.pool.relays.get(relayUrl)
    if (relay) {
      relay.disconnect()
    }

    setConnectedRelays(prev => {
      const newSet = new Set(prev)
      newSet.delete(relayUrl)
      return newSet
    })
    setAuthenticatedRelays(prev => {
      const newSet = new Set(prev)
      newSet.delete(relayUrl)
      return newSet
    })
  }

  const authRelayWithUser = async (url: string): Promise<boolean> => {
    return connectToRelay(url, true)
  }

  return (
    <NDKContext.Provider
      value={{
        ndk,
        connectedRelays,
        authRequiredRelays,
        authenticatedRelays,
        connectToRelay,
        disconnectFromRelay,
        authRelayWithUser,
        connectToRelays,
        disconnectFromAllRelays,
      }}
    >
      {children}
    </NDKContext.Provider>
  )
}

export function useNDK() {
  const context = React.useContext(NDKContext)
  if (context === undefined) {
    throw new Error("useNDK must be used within a NDKProvider")
  }
  return context
} 
"use client"

import * as React from "react"
import { useNostr } from "./nostr-context"

interface Collection {
  name: string
  relays: string[]
}

interface CollectionsContextType {
  collections: Collection[]
  selectedCollection: Collection | undefined
  setCollections: (collections: Collection[]) => void
  setSelectedCollection: (collection: Collection | undefined) => void
  updateCollections: (collections: Collection[]) => void
  isGuest: boolean
}

// Default collection for guests
const DEFAULT_GUEST_COLLECTION: Collection = {
  name: "Default Collection",
  relays: ["wss://relay.damus.io", "wss://relay.snort.social"]
}

const CollectionsContext = React.createContext<CollectionsContextType | undefined>(undefined)

export function CollectionsProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { npub, isGuest } = useNostr()
  const [collections, setCollections] = React.useState<Collection[]>([])
  const [selectedCollection, setSelectedCollection] = React.useState<Collection | undefined>()

  // Get the storage key based on the user's npub
  const getStorageKey = React.useCallback(() => {
    if (isGuest) return null
    return `relay-collections-${npub}`
  }, [isGuest, npub])

  React.useEffect(() => {
    // Set default collection for guests
    if (isGuest) {
      setCollections([DEFAULT_GUEST_COLLECTION])
      setSelectedCollection(DEFAULT_GUEST_COLLECTION)
      return
    }

    // Load collections for the current user
    const storageKey = getStorageKey()
    if (storageKey) {
      const savedCollections = localStorage.getItem(storageKey)
      if (savedCollections) {
        const parsedCollections = JSON.parse(savedCollections)
        setCollections(parsedCollections)
        setSelectedCollection(parsedCollections[0])
      } else {
        // Initialize with default collection for new users
        const defaultCollection = { ...DEFAULT_GUEST_COLLECTION, name: "My Collection" }
        setCollections([defaultCollection])
        setSelectedCollection(defaultCollection)
        localStorage.setItem(storageKey, JSON.stringify([defaultCollection]))
      }
    }
  }, [isGuest, getStorageKey])

  const updateCollections = React.useCallback((newCollections: Collection[]) => {
    const storageKey = getStorageKey()
    if (!storageKey) return // Don't save collections for guests

    setCollections(newCollections)
    localStorage.setItem(storageKey, JSON.stringify(newCollections))
    
    // Update selected collection if it was deleted or modified
    if (selectedCollection) {
      const updatedSelected = newCollections.find(c => c.name === selectedCollection.name)
      setSelectedCollection(updatedSelected || newCollections[0])
    } else {
      setSelectedCollection(newCollections[0])
    }
  }, [selectedCollection, getStorageKey])

  return (
    <CollectionsContext.Provider
      value={{
        collections,
        selectedCollection,
        setCollections,
        setSelectedCollection,
        updateCollections,
        isGuest
      }}
    >
      {children}
    </CollectionsContext.Provider>
  )
}

export function useCollections() {
  const context = React.useContext(CollectionsContext)
  if (context === undefined) {
    throw new Error('useCollections must be used within a CollectionsProvider')
  }
  return context
} 
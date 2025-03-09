"use client"

import * as React from "react"
import { Plus, Pencil, Trash2, Radio, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/page-header"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { CreateCollectionForm } from "@/components/create-collection-form"
import { useCollections } from "@/contexts/collections-context"
import { useNDK } from "@/contexts/ndk-context"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { fetchRelayInformation, type RelayInformation } from "@/lib/nip11"

export default function CollectionsPage() {
  const { collections, updateCollections, selectedCollection, setSelectedCollection } = useCollections()
  const { ndk, connectToRelay, disconnectFromRelay, connectedRelays, authRequiredRelays, authRelayWithUser, disconnectFromAllRelays, connectToRelays } = useNDK()
  const [editingCollection, setEditingCollection] = React.useState<{ index: number; collection: { name: string; relays: string[] } } | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)
  const [collectionToDelete, setCollectionToDelete] = React.useState<number | null>(null)
  const [isSheetOpen, setIsSheetOpen] = React.useState(false)
  const [relayInfo, setRelayInfo] = useState<Record<string, RelayInformation>>({})

  // Handle collection changes and relay connections
  useEffect(() => {
    if (!selectedCollection || !ndk) {
      return
    }

    // Disconnect from all relays first
    disconnectFromAllRelays()

    // Connect to the selected collection's relays
    connectToRelays(selectedCollection.relays)
  }, [selectedCollection, ndk])

  const handleSave = (newCollection: { name: string; relays: string[] }) => {
    const updatedCollections = [...collections]
    if (editingCollection !== null) {
      updatedCollections[editingCollection.index] = newCollection
    } else {
      updatedCollections.push(newCollection)
    }
    updateCollections(updatedCollections)
    setEditingCollection(null)
    setIsSheetOpen(false)
  }

  const handleDelete = (index: number) => {
    const updatedCollections = collections.filter((_, i) => i !== index)
    updateCollections(updatedCollections)
    setIsDeleteDialogOpen(false)
    setCollectionToDelete(null)
  }

  const handleSheetOpenChange = (open: boolean) => {
    setIsSheetOpen(open)
    if (!open) {
      setEditingCollection(null)
    }
  }

  const handleCollectionClick = (collection: { name: string; relays: string[] }) => {
    setSelectedCollection(collection)
  }

  const handleAuthClick = async (relay: string) => {
    const success = await authRelayWithUser(relay)
    if (success) {
      console.log(`Successfully authenticated with ${relay}`)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Relay Collections"
        description="Manage your Nostr relay collections"
      />
      <div className="flex-1 overflow-auto">
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <Sheet open={isSheetOpen} onOpenChange={handleSheetOpenChange}>
              <SheetTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Collection
                </Button>
              </SheetTrigger>
              <SheetContent className="sm:max-w-[425px]">
                <SheetHeader className="px-2">
                  <SheetTitle>
                    {editingCollection ? 'Edit Collection' : 'New Collection'}
                  </SheetTitle>
                  <SheetDescription>
                    Create a new collection of relays. All relay URLs should start with "wss://"
                  </SheetDescription>
                </SheetHeader>
                <CreateCollectionForm 
                  onSave={handleSave}
                  initialData={editingCollection?.collection}
                />
              </SheetContent>
            </Sheet>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {collections.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No collections yet. Create your first collection to get started.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {collections.map((collection, index) => (
                  <div
                    key={index}
                    className={cn(
                      "border rounded-lg p-4 cursor-pointer",
                      selectedCollection?.name === collection.name 
                        ? "border-purple-500" 
                        : "hover:border-primary transition-colors"
                    )}
                    onClick={() => handleCollectionClick(collection)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold">{collection.name}</h3>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingCollection({ index, collection })
                            setIsSheetOpen(true)
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        <AlertDialog open={isDeleteDialogOpen && collectionToDelete === index}>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation()
                                setCollectionToDelete(index)
                                setIsDeleteDialogOpen(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the
                                collection "{collection.name}" and remove all its relay data.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={() => {
                                setIsDeleteDialogOpen(false)
                                setCollectionToDelete(null)
                              }}>
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(index)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {collection.relays.map((relay, relayIndex) => (
                        <div key={relayIndex} className="text-sm text-muted-foreground flex items-center gap-2">
                          {selectedCollection?.name === collection.name ? (
                            <div 
                              className={`w-2 h-2 rounded-full ${
                                connectedRelays.has(relay) 
                                  ? "bg-green-500" 
                                  : "bg-gray-300"
                              }`} 
                            />
                          ) : (
                            <Radio className="h-3 w-3 text-muted-foreground" />
                          )}
                          <span className={cn(
                            "flex-1",
                            relayInfo[relay]?.limitation?.auth_required && "text-pink-500"
                          )}>
                            {relay.replace(/^wss:\/\//, '')}
                            {relayInfo[relay]?.limitation?.auth_required && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="ml-2 h-6 px-2 text-pink-500 hover:text-pink-600"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleAuthClick(relay)
                                }}
                              >
                                Authenticate
                              </Button>
                            )}
                          </span>
                          {selectedCollection?.name === collection.name && relayInfo[relay] && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-4 w-4 p-0">
                                    <Info className="h-3 w-3" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="space-y-1">
                                    {relayInfo[relay].name && (
                                      <p><strong>Name:</strong> {relayInfo[relay].name}</p>
                                    )}
                                    {relayInfo[relay].description && (
                                      <p><strong>Description:</strong> {relayInfo[relay].description}</p>
                                    )}
                                    {relayInfo[relay].pubkey && (
                                      <p><strong>Pubkey:</strong> {relayInfo[relay].pubkey}</p>
                                    )}
                                    {relayInfo[relay].supported_nips && (
                                      <p><strong>NIPs:</strong> {relayInfo[relay].supported_nips.join(', ')}</p>
                                    )}
                                    {relayInfo[relay].software && (
                                      <p><strong>Software:</strong> {relayInfo[relay].software} {relayInfo[relay].version}</p>
                                    )}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 
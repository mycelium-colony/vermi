"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { PageHeader } from "@/components/page-header"
import { useNostr } from "@/contexts/nostr-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera } from "lucide-react"

export default function ProfilePage() {
  const { profile, npub } = useNostr()

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      ?.split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';
  };

  return (
    <div className="flex h-screen">
      <AppSidebar />
      <div className="flex-1 flex flex-col">
        <PageHeader
          title="Profile"
          description="View and edit your profile information"
          showSearch={false}
          showFilters={false}
        />
        <div className="flex-1 overflow-auto">
          <div className="mx-auto w-full max-w-[90%] px-4 py-6 lg:px-8">
            {/* Avatar Section */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={profile?.picture} />
                      <AvatarFallback>{getInitials(profile?.name || 'User')}</AvatarFallback>
                    </Avatar>
                    <Button
                      size="icon"
                      variant="outline"
                      className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full"
                    >
                      <Camera className="h-4 w-4" />
                      <span className="sr-only">Change avatar</span>
                    </Button>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold mb-1">{profile?.name || 'Anonymous'}</h2>
                    <p className="text-sm text-muted-foreground break-all">{npub}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Profile Form */}
            <Card>
              <CardContent className="p-6">
                <form className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Display Name</Label>
                    <Input
                      id="name"
                      placeholder="Enter your display name"
                      defaultValue={profile?.name || ''}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="about">About</Label>
                    <Textarea
                      id="about"
                      placeholder="Tell us about yourself"
                      defaultValue={profile?.about || ''}
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nip05">NIP-05 Identifier</Label>
                    <Input
                      id="nip05"
                      placeholder="you@example.com"
                      defaultValue={profile?.nip05 || ''}
                    />
                  </div>

                  <Button className="w-full">
                    Save Changes
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 
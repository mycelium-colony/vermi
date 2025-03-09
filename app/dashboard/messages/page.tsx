"use client"

import { PageHeader } from "@/components/page-header"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"

const messageTabs = [
  { value: "all", label: "All Messages" },
  { value: "unread", label: "Unread" },
  { value: "archived", label: "Archived" },
]

// Dummy data for messages
const messages = [
  {
    id: 1,
    sender: {
      name: "Alice",
      avatar: "",
      npub: "npub1..."
    },
    preview: "Hey, I saw your post about...",
    timestamp: "2 hours ago",
    unread: true,
  },
  {
    id: 2,
    sender: {
      name: "Bob",
      avatar: "",
      npub: "npub2..."
    },
    preview: "Thanks for sharing that article!",
    timestamp: "5 hours ago",
    unread: false,
  },
  // Add more dummy messages as needed
]

export default function MessagesPage() {
  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Messages"
        description="View and manage your conversations"
        tabs={messageTabs}
      />
      <div className="flex-1 overflow-auto">
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            {messages.map((message) => (
              <Card key={message.id} className={message.unread ? "bg-muted/50" : ""}>
                <CardHeader className="flex flex-row items-center gap-4 p-4">
                  <Avatar>
                    <AvatarImage src={message.sender.avatar} />
                    <AvatarFallback>{message.sender.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-base">{message.sender.name}</CardTitle>
                    <CardDescription className="text-xs truncate">
                      {message.sender.npub}
                    </CardDescription>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {message.timestamp}
                  </span>
                </CardHeader>
                <CardContent className="px-4 pb-4 pt-0">
                  <p className="text-sm text-muted-foreground">{message.preview}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 
"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface ChatRoom {
  id: number
  name: string
  type: string
}

export default function JoinChatRoom() {
  const [searchQuery, setSearchQuery] = useState("")
  const [requestSent, setRequestSent] = useState<number[]>([])

  const publicRooms: ChatRoom[] = [
    { id: 1, name: "General Discussion", type: "GROUP" },
    { id: 2, name: "Tech Talk", type: "GROUP" },
    { id: 3, name: "Random Chat", type: "GROUP" },
  ]

  const filteredRooms = publicRooms.filter((room) =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleJoinRequest = (roomId: number) => {
    setRequestSent([...requestSent, roomId])
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Join Chat Room</h1>
          <p className="text-muted-foreground mt-2">
            Find and join public chat rooms to start conversations.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Search Chat Rooms</CardTitle>
            <CardDescription className="text-green-700 font-bold text-lg">This page is under construction.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative mb-4">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredRooms.map((room) => (
                <Card key={room.id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{room.name}</CardTitle>
                        {/* <CardDescription className="mt-1">ID: {room.id}</CardDescription> */}
                      </div>
                      <Badge variant="secondary">{room.type}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex items-end">
                    <Button
                      onClick={() => handleJoinRequest(room.id)}
                      disabled={requestSent.includes(room.id)}
                      className="w-full"
                    >
                      {requestSent.includes(room.id) ? "Request Sent" : "Join Room"}
                    </Button>
                  </CardContent>
                </Card>
              ))}

              {searchQuery && filteredRooms.length === 0 && (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  No chat rooms found matching your search
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

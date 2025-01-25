"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

interface ChatRoom {
  id: number
  name: string
  type: string
}

export default function JoinChatRoom() {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchType, setSearchType] = useState<"name" | "id">("name")
  const [requestSent, setRequestSent] = useState<number[]>([])

  // Mock data for demonstration
  const publicRooms: ChatRoom[] = [
    { id: 1, name: "General Discussion", type: "GROUP" },
    { id: 2, name: "Tech Talk", type: "GROUP" },
    { id: 3, name: "Random Chat", type: "GROUP" },
  ]

  const filteredRooms = publicRooms.filter((room) => {
    if (searchType === "id") {
      return room.id.toString().includes(searchQuery)
    }
    return room.name.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const handleJoinRequest = (roomId: number) => {
    setRequestSent([...requestSent, roomId])
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Join Chat Room</h1>
          <p className="text-muted-foreground mt-2">Find and join public chat rooms to start conversations.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Search Chat Rooms</CardTitle>
            <CardDescription>Search for public chat rooms by name or ID</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="name" className="w-full">
              <TabsList className="grid w-full max-w-[400px] grid-cols-2">
                <TabsTrigger value="name" onClick={() => setSearchType("name")}>
                  Search by Name
                </TabsTrigger>
                <TabsTrigger value="id" onClick={() => setSearchType("id")}>
                  Search by ID
                </TabsTrigger>
              </TabsList>

              <div className="mt-4 space-y-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={`Search by ${searchType}...`}
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
                            <CardDescription className="mt-1">ID: {room.id}</CardDescription>
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
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


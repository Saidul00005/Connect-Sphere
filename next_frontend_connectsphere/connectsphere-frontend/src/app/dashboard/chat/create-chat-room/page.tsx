"use client"

import { useState } from "react"
import { useAppDispatch } from "@/app/redux/store"
import { createChatRoom } from "@/app/redux/slices/chatSlice"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Users, MessageSquarePlus } from "lucide-react"

export default function CreateChatRoom() {
  const dispatch = useAppDispatch()
  const [name, setName] = useState("")
  const [type, setType] = useState("GROUP")
  const [participants, setParticipants] = useState("")
  const [isCreated, setIsCreated] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const participantIds = participants
      .split(",")
      .map((id) => Number.parseInt(id.trim()))
      .filter((id) => !isNaN(id))

    await dispatch(
      createChatRoom({
        name,
        type,
        participants: participantIds,
      }),
    )

    setIsCreated(true)
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background p-4 md:p-8 flex items-center justify-center">
      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8">
        {/* Left side - Information */}
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Create Chat Room</h1>
            <p className="text-muted-foreground mt-2">
              Create a new chat room and invite participants to join your conversation.
            </p>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Group Chat
                </CardTitle>
                <CardDescription>Create a room for multiple participants to join and collaborate.</CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquarePlus className="h-5 w-5" />
                  Direct Message
                </CardTitle>
                <CardDescription>Start a private conversation with another user.</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>

        {/* Right side - Form */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Room Details</CardTitle>
            <CardDescription>Fill in the details below to create your chat room.</CardDescription>
          </CardHeader>
          <CardContent>
            {!isCreated ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Room Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter room name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Room Type</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GROUP">Group</SelectItem>
                      <SelectItem value="DIRECT">Direct Message</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="participants">Participant IDs (comma-separated)</Label>
                  <Input
                    id="participants"
                    value={participants}
                    onChange={(e) => setParticipants(e.target.value)}
                    placeholder="1, 2, 3"
                    required
                  />
                  <p className="text-sm text-muted-foreground">Enter user IDs separated by commas</p>
                </div>

                <Button type="submit" className="w-full">
                  Create Chat Room
                </Button>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="rounded-lg bg-primary/10 p-4 text-center">
                  <p className="text-primary font-medium">Chat room created successfully!</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    You can now start chatting with your participants.
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setIsCreated(false)
                    setName("")
                    setParticipants("")
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Create Another Room
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


"use client"

import { useEffect, useState } from "react"
import { useAppDispatch, useAppSelector } from "@/app/redux/store"
import {
  fetchChatRooms,
  fetchMessages,
  updateMessage,
  deleteMessage,
  createMessage,
} from "@/app/redux/slices/chatSlice"
import { Search, MoreVertical, Edit2, Trash2, Info, Menu, ChevronLeft, ChevronRight, X } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { format } from "date-fns"

export default function ChatHistory() {
  const dispatch = useAppDispatch()
  const { rooms, messages, loading } = useAppSelector((state) => state.chat)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRoom, setSelectedRoom] = useState<number | null>(null)
  const [selectedMessage, setSelectedMessage] = useState<number | null>(null)
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false)
  const [editingMessage, setEditingMessage] = useState<{ id: number; content: string } | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false)

  useEffect(() => {
    dispatch(fetchChatRooms())
  }, [dispatch])

  useEffect(() => {
    if (selectedRoom) {
      dispatch(fetchMessages(selectedRoom))
    }
  }, [dispatch, selectedRoom])

  const currentRoom = rooms.find((r) => r.id === selectedRoom)
  const filteredRooms = rooms.filter((room) => room.name.toLowerCase().includes(searchQuery.toLowerCase()))

  const handleMessageEdit = async (messageId: number, content: string) => {
    if (selectedRoom) {
      await dispatch(updateMessage({ messageId, roomId: selectedRoom, content }))
      setEditingMessage(null)
    }
  }

  const handleMessageDelete = async (messageId: number) => {
    if (selectedRoom) {
      await dispatch(deleteMessage({ messageId, roomId: selectedRoom }))
    }
  }

  const handleRoomSelect = (roomId: number) => {
    setSelectedRoom(roomId)
    setIsMobileSidebarOpen(false)
  }

  const Sidebar = () => (
    <div className="h-full flex flex-col bg-black">
      <div className="p-4">
        <div className="relative flex items-center">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search chat rooms..."
            className="pl-8 pr-8 bg-transparent"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      <ScrollArea className="flex-1">
        {filteredRooms.map((room) => (
          <button
            key={room.id}
            onClick={() => handleRoomSelect(room.id)}
            className={`w-full p-4 text-left hover:bg-accent ${selectedRoom === room.id ? "bg-accent" : ""}`}
          >
            <h3 className="font-medium">{room.name}</h3>
            <p className="text-sm text-muted-foreground">{room.type === "GROUP" ? "Group Chat" : "Direct Message"}</p>
          </button>
        ))}
      </ScrollArea>
    </div>
  )

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <div
        className={`hidden md:block transition-all duration-300 ${isDesktopSidebarCollapsed ? "w-0" : "w-80"
          } border-r overflow-hidden`}
      >
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
        <SheetContent side="left" className="p-0 w-80 bg-black">
          <SheetHeader className="px-4 py-2">
            <SheetTitle>Chat Rooms</SheetTitle>
          </SheetHeader>
          <Sidebar />
        </SheetContent>
      </Sheet>

      {/* Chat Content */}
      <div className="flex-1 flex flex-col bg-black">
        <div className="p-4 border-b border-gray-800">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              {/* Mobile menu button */}
              <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMobileSidebarOpen(true)}>
                <Menu className="h-4 w-4" />
              </Button>

              {/* Desktop sidebar toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="hidden md:flex"
                onClick={() => setIsDesktopSidebarCollapsed(!isDesktopSidebarCollapsed)}
              >
                {isDesktopSidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </Button>

              <h2 className="text-xl font-semibold">{selectedRoom ? currentRoom?.name : "Select a chat"}</h2>
            </div>

            {selectedRoom && (
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                    }}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                >
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setIsParticipantsOpen(true)
                    }}
                  >
                    View Participants
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {selectedRoom && (
            <div className="space-y-1 text-sm text-gray-400">
              <p>Chatroom ID: {currentRoom?.id}</p>
              <p>Created by: User {currentRoom?.created_by}</p>
              <p>Created at: {format(new Date(currentRoom?.created_at || ""), "MMM dd, yyyy, h:mm:ss a")}</p>
              <p>Status: {currentRoom?.is_active ? "Active" : "Inactive"}</p>
            </div>
          )}
        </div>

        {selectedRoom ? (
          <>
            <ScrollArea className="flex-1 p-4">
              {messages.map((message) => (
                <div key={message.id} className="mb-4 group">
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">User {message.sender}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(message.timestamp), "M/d/yyyy, h:mm a")}
                        </span>
                      </div>
                      {editingMessage?.id === message.id ? (
                        <Input
                          value={editingMessage.content}
                          onChange={(e) => setEditingMessage({ ...editingMessage, content: e.target.value })}
                          onBlur={() => handleMessageEdit(message.id, editingMessage.content)}
                          className="mt-1"
                        />
                      ) : (
                        <p className="mt-1">{message.content}</p>
                      )}
                      {message.is_deleted && <span className="text-xs text-muted-foreground">(deleted)</span>}
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingMessage({ id: message.id, content: message.content })}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleMessageDelete(message.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setSelectedMessage(message.id)}>
                        <Info className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </ScrollArea>

            <div className="border-t border-gray-800 p-4">
              <form
                onSubmit={async (e) => {
                  e.preventDefault()
                  if (newMessage.trim() && selectedRoom) {
                    await dispatch(createMessage({ roomId: selectedRoom, content: newMessage }))
                    setNewMessage("")
                  }
                }}
                className="flex gap-2"
              >
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="bg-transparent"
                />
                <Button type="submit" disabled={!newMessage.trim()}>
                  Send
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Select a chat room to start messaging
          </div>
        )}
      </div>

      {selectedRoom && (
        <>
          {/* Participants Dialog */}
          <Dialog
            open={isParticipantsOpen}
            onOpenChange={(open) => {
              setIsParticipantsOpen(open)
            }}
            modal={true}
          >
            <DialogContent onPointerDownOutside={(e) => e.preventDefault()} onClick={(e) => e.stopPropagation()}>
              <DialogHeader>
                <DialogTitle>Chat Participants</DialogTitle>
              </DialogHeader>
              <div className="space-y-2">
                {currentRoom?.participants.map((participant) => (
                  <div
                    key={participant}
                    className={`p-2 rounded-lg ${participant === currentRoom.created_by ? "bg-primary text-primary-foreground" : "bg-accent"
                      }`}
                  >
                    User {participant} {participant === currentRoom.created_by && " (Admin)"}
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>

          {/* Message Details Dialog */}
          <Dialog open={!!selectedMessage} onOpenChange={(open) => !open && setSelectedMessage(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Message Details</DialogTitle>
              </DialogHeader>
              {selectedMessage && messages.find((m) => m.id === selectedMessage) && (
                <div className="space-y-2">
                  <p>
                    <strong>Sender:</strong> User {messages.find((m) => m.id === selectedMessage)?.sender}
                  </p>
                  <p>
                    <strong>Time:</strong>{" "}
                    {format(new Date(messages.find((m) => m.id === selectedMessage)?.timestamp || ""), "PPpp")}
                  </p>
                  <p>
                    <strong>Message ID:</strong> {selectedMessage}
                  </p>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  )
}


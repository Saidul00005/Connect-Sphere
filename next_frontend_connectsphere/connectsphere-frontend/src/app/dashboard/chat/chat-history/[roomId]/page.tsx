"use client"

import { use, useEffect, useCallback, useState } from "react"
import { useAppDispatch, useAppSelector } from "@/app/redux/store"
import { fetchMessages, editMessage, deleteMessage } from "@/app/redux/slices/chatMessagesSlice"
import { fetchSingleChatRoom } from "@/app/redux/slices/chatRoomSlice"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { MoreVertical, ArrowUp, ArrowDown, ArrowLeft, Users, Check, CheckCheck, } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import MessageInput from "../../chat-history/components/messageInput"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface ChatRoomPageProps {
  params: Promise<{ roomId: string }>
}

export default function ChatRoomPage({ params }: ChatRoomPageProps) {
  const { roomId } = use(params)
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { toast } = useToast()
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push("/")
    },
  })

  const { pages, currentPage, loading, error } = useAppSelector((state) => state.chatMessages)
  const singleChatRoom = useAppSelector((state) => state.singleChatRoom.rooms[Number(roomId)])
  const { loading: singleChatRoomLoading, error: singleChatRoomError } = useAppSelector((state) => state.singleChatRoom)

  const [editContent, setEditContent] = useState("")
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null)

  const currentPageNumber = currentPage[roomId] || "1"
  const pageData = pages[roomId]?.[currentPageNumber]
  const messages = pageData ? pageData.results : []
  const nextPageUrl = pageData?.next
  const previousPageUrl = pageData?.previous

  useEffect(() => {
    if (status === "authenticated" && !singleChatRoom) {
      dispatch(fetchSingleChatRoom(Number(roomId)))
    }
  }, [roomId, singleChatRoom, dispatch, status])

  useEffect(() => {
    if (status === "authenticated" && !pageData && !loading && !error) {
      dispatch(fetchMessages({ pageUrl: null, roomId }))
    }
  }, [roomId, pageData, loading, error, dispatch, status])

  const handleLoadMore = useCallback(() => {
    if (nextPageUrl && !loading) {
      dispatch(fetchMessages({ pageUrl: nextPageUrl, roomId }))
    }
  }, [nextPageUrl, loading, dispatch, roomId])

  const handleLoadPrevious = useCallback(() => {
    if (previousPageUrl && !loading) {
      dispatch(fetchMessages({ pageUrl: previousPageUrl, roomId }))
    }
  }, [previousPageUrl, loading, dispatch, roomId])

  const handleEdit = (messageId: number, content: string) => {
    setEditingMessageId(messageId)
    setEditContent(content)
  }

  const handleDelete = (messageId: number) => {
    if (window.confirm("Are you sure you want to delete this message?")) {
      dispatch(deleteMessage({ messageId, roomId }))
    }
  }

  const handleSaveInlineEdit = (messageId: number) => {
    if (editContent.trim()) {
      dispatch(
        editMessage({
          messageId,
          content: editContent,
          roomId,
        }),
      )
        .unwrap()
        .then(() => {
          setEditingMessageId(null)
          setEditContent("")
        })
        .catch((error) => {
          console.error("Failed to edit message:", error)
          toast({
            title: "Error",
            description: "Failed to edit message. Please try again.",
            variant: "destructive",
          })
        })
    }
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="p-4 border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/chat/chat-history")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-semibold">{singleChatRoom?.name || "Chat Room"}</h1>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Users className="h-4 w-4" />
                    View Participants
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-2">
                    {singleChatRoom?.participants.map((participant) => (
                      <div key={participant.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          {participant.first_name[0]}
                          {participant.last_name[0]}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{`${participant.first_name} ${participant.last_name}`}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            {singleChatRoom && (
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="secondary">{singleChatRoom.type}</Badge>
                <Badge variant={singleChatRoom.is_active ? "default" : "secondary"}>
                  {singleChatRoom.is_active ? "Active" : "Inactive"}
                </Badge>
                <span>•</span>
                <span>
                  Created by {singleChatRoom.created_by.first_name} {singleChatRoom.created_by.last_name}
                </span>
                <span>•</span>
                <span>{format(new Date(singleChatRoom.created_at), "MMM dd, yyyy, h:mm a")}</span>
              </div>
            )}
            {singleChatRoomLoading && <p className="text-sm text-gray-500">Loading chat room details...</p>}
            {singleChatRoomError && <p className="text-sm text-red-500">{singleChatRoomError}</p>}
          </div>
        </div>
      </div>

      {/* Messages Container with Fixed Height */}
      <div className="flex-1 flex flex-col min-h-0">
        {" "}
        {/* min-h-0 is crucial for nested flex scroll */}
        {/* Pagination - Previous */}
        {previousPageUrl && (
          <div className="py-2 px-4 border-b">
            <Button onClick={handleLoadPrevious} disabled={loading} className="w-full" variant="ghost" size="sm">
              <ArrowUp className="mr-2 h-4 w-4" /> Load Previous Messages
            </Button>
          </div>
        )}
        {/* Scrollable Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-2">
          <div className="space-y-4">
            {loading && <p className="text-center text-muted-foreground">Loading messages...</p>}
            {error && <p className="text-center text-destructive">{error}</p>}

            {messages.map((message) => {
              const isCurrentUser = message.sender.id === Number(session?.user?.id)
              return (
                <div key={message.id} className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`group relative max-w-[70%] rounded-2xl px-4 py-2 ${isCurrentUser ? "bg-primary text-primary-foreground" : "bg-muted"
                      } ${message.is_deleted ? "opacity-50" : ""}`}
                  >
                    <div className="space-y-1">
                      {message.is_deleted ? (
                        <p className="italic text-sm">This message was deleted</p>
                      ) : (
                        <>
                          <div className="flex items-start justify-between gap-2">
                            {editingMessageId === message.id ? (
                              <form
                                onSubmit={(e) => {
                                  e.preventDefault()
                                  handleSaveInlineEdit(message.id)
                                }}
                                className="flex-1"
                              >
                                <Input
                                  value={editContent}
                                  onChange={(e) => setEditContent(e.target.value)}
                                  className="mb-2 bg-black dark:bg-white"
                                  autoFocus
                                />
                                <div className="flex justify-end gap-2">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setEditingMessageId(null)}
                                  >
                                    Cancel
                                  </Button>
                                  <Button type="submit" size="sm">
                                    Save
                                  </Button>
                                </div>
                              </form>
                            ) : (
                              <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                            )}
                            {isCurrentUser && !message.is_deleted && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 -mr-2"
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEdit(message.id, message.content)}>
                                    Edit Message
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDelete(message.id)}
                                    className="text-destructive"
                                  >
                                    Delete Message
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </>
                      )}
                      <div className="flex items-center gap-2 text-xs opacity-60">
                        <span>{format(new Date(message.timestamp), "h:mm a")}</span>
                        {message.is_modified && message.last_modified_at && (
                          <span className="italic">
                            (Edited at {format(new Date(message.last_modified_at), "h:mm a")})
                          </span>
                        )}
                        {!message.is_deleted && isCurrentUser && (
                          <>
                            {message.read_by?.length ? (
                              <span className="flex items-center gap-1">
                                <CheckCheck className="h-3 w-3" /> Read
                              </span>
                            ) : message.is_delivered ? (
                              <span className="flex items-center gap-1">
                                <CheckCheck className="h-3 w-3" /> Delivered
                              </span>
                            ) : message.is_sent ? (
                              <span className="flex items-center gap-1">
                                <Check className="h-3 w-3" /> Sent
                              </span>
                            ) : (
                              <span>Not sent</span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        {/* Pagination - Next */}
        {nextPageUrl && (
          <div className="py-2 px-4 border-t">
            <Button onClick={handleLoadMore} disabled={loading} className="w-full" variant="ghost" size="sm">
              Load More Messages <ArrowDown className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4">
        <MessageInput roomId={roomId} />
      </div>
    </div>
  )
}


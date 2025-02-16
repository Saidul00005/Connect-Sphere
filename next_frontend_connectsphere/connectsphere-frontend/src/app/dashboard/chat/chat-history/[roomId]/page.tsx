"use client"

import { use, useEffect, useCallback, useState, useRef } from "react"
import { useAppDispatch, useAppSelector } from "@/app/redux/store"
import { fetchMessages, editMessage, deleteMessage, resetMessages, markMessagesAsRead } from "@/app/redux/slices/chatMessagesSlice"
import { fetchSingleChatRoom } from "@/app/redux/slices/chatRoomSlice"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { MoreVertical, ArrowDown, ArrowLeft, Users, Check, CheckCheck, Loader2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import MessageInput from "../../chat-history/components/messageInput"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
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
import EmployeeDetailsForUsers from "../components/EmployeeDetailsForUsers"

interface ChatRoomPageProps {
  params: Promise<{ roomId: string }>
}

export default function ChatRoomPage({ params }: ChatRoomPageProps) {
  const { roomId } = use(params)
  const router = useRouter()
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push("/")
    },
  })
  const dispatch = useAppDispatch()
  const { toast } = useToast()


  const { allMessages, nextCursor, loading, error } = useAppSelector((state) => state.chatMessages)
  const singleChatRoom = useAppSelector((state) => state.singleChatRoom.rooms[Number(roomId)])
  const { loading: singleChatRoomLoading, error: singleChatRoomError } = useAppSelector((state) => state.singleChatRoom)

  const [editContent, setEditContent] = useState("")
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null)
  const [hasScrolledUp, setHasScrolledUp] = useState(false)
  const [messageToDelete, setMessageToDelete] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const initialFetch = useRef(false)
  const initialRoomFetch = useRef(false)
  const initialLoad = useRef(true);

  useEffect(() => {
    return () => {
      if (status === "authenticated") {
        dispatch(resetMessages())
      }
    }
  }, [status, dispatch])

  useEffect(() => {
    if (initialLoad.current && !loading && allMessages.length > 0) {
      scrollToBottom();
      initialLoad.current = false;
    }
  }, [allMessages, loading]);

  useEffect(() => {
    if (status === "authenticated" && roomId && session?.user) {
      dispatch(markMessagesAsRead({
        roomId: Number(roomId),
        user: {
          id: Number(session.user.id),
          first_name: session.user.name || '',
          last_name: '',
        }
      }));
    }
  }, [roomId, dispatch, status, session?.user]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])
  // const scrollToBottom = useCallback(() => {
  //   if (messagesContainerRef.current) {
  //     messagesContainerRef.current.scrollTo({
  //       top: messagesContainerRef.current.scrollHeight,
  //       behavior: "smooth"
  //     });
  //   }
  // }, []);

  useEffect(() => {
    if (status === "authenticated" && !initialFetch.current) {
      initialFetch.current = true
      dispatch(fetchMessages({ pageUrl: null, roomId }))
    }
  }, [roomId, dispatch, status])

  useEffect(() => {
    if (status === "authenticated" && !singleChatRoom && !initialRoomFetch.current) {
      initialRoomFetch.current = true
      dispatch(fetchSingleChatRoom(Number(roomId)))
    }
  }, [roomId, singleChatRoom, dispatch, status])

  const handleLoadMore = useCallback(() => {

    if (status !== "authenticated") {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to view messages",
        variant: "destructive",
      });
      return;
    }

    if (nextCursor && !loading) {
      const container = messagesContainerRef.current;
      const previousScrollHeight = container?.scrollHeight || 0;

      dispatch(fetchMessages({ pageUrl: nextCursor, roomId })).then(() => {
        if (container) {
          const newScrollHeight = container.scrollHeight;
          container.scrollTop = newScrollHeight - previousScrollHeight;
        }
      });
    }
  }, [nextCursor, loading, dispatch, roomId, status]);

  const handleEdit = useCallback((messageId: number, content: string) => {
    setEditingMessageId(messageId)
    setEditContent(content)
  }, []);

  const handleDelete = useCallback(async (messageId: number) => {
    if (status !== "authenticated") {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to delete messages",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsDeleting(true);
      await dispatch(deleteMessage({ messageId, roomId })).unwrap()
      setMessageToDelete(null);
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete message",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  }, [status, dispatch, roomId, toast])

  const handleSaveInlineEdit = useCallback(async (messageId: number) => {
    if (status !== "authenticated") {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to edit messages",
        variant: "destructive",
      });
      return;
    }

    if (!editContent.trim()) return;

    try {
      setIsEditing(true);
      await dispatch(
        editMessage({
          messageId,
          content: editContent,
          roomId,
        })
      ).unwrap();
      setEditingMessageId(null);
      setEditContent("");
    } catch (error) {
      console.error("Failed to edit message:", error);
      toast({
        title: "Error",
        description: "Failed to edit message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsEditing(false);
    }
  }, [status, editContent, dispatch, roomId, toast])

  useEffect(() => {
    const container = messagesContainerRef.current
    if (container) {
      const handleScroll = () => {
        const { scrollTop, scrollHeight, clientHeight } = container
        setHasScrolledUp(scrollTop < scrollHeight - clientHeight - 100)
      }
      container.addEventListener("scroll", handleScroll)
      return () => container.removeEventListener("scroll", handleScroll)
    }
  }, [])

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="p-4 border-b sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {singleChatRoom?.participants.map((participant) => {
                      const isCurrentUser = participant.id === Number(session?.user?.id)
                      const isAdmin = participant.id === singleChatRoom?.created_by.id
                      return (
                        <Button
                          key={participant.id}
                          variant="ghost"
                          className="w-full h-auto justify-start p-2 rounded-lg hover:bg-muted"
                          onClick={() => setSelectedUserId(participant.id)}
                        >
                          <div className="flex items-center gap-2 w-full">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                              {participant.first_name[0]}
                              {participant.last_name[0]}
                            </div>
                            <div className="flex flex-col items-start">
                              <p className="font-medium text-sm">
                                {participant.first_name} {participant.last_name}{" "}
                                {isCurrentUser && <span className="italic">(You)</span>}
                              </p>
                              {isAdmin && (
                                <Badge variant="secondary" className="text-xs w-fit">
                                  Admin
                                </Badge>
                              )}
                            </div>
                          </div>
                        </Button>
                      )
                    })}
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

      {/* Messages Container */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Load More Button */}
        {nextCursor && (
          <div className="p-2 text-center border-b">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLoadMore}
              disabled={loading}
              className="text-muted-foreground hover:text-foreground"
            >
              {loading ? "Loading..." : "See Older Messages"}
            </Button>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-2" ref={messagesContainerRef}>
          {loading && allMessages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="animate-spin h-8 w-8 text-muted-foreground" />
            </div>
          ) : error && allMessages.length === 0 ? (
            <div className="text-center text-red-500 mt-4">{error}</div>
          ) : allMessages.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">No message found.</div>
          ) : (
            <div className="space-y-4">
              {allMessages.map((message) => {
                const isCurrentUser = message.sender.id === Number(session?.user?.id)
                return (
                  <div key={message.id} className={`flex flex-col ${isCurrentUser ? "items-end" : "items-start"}`}>
                    <span className="text-xs text-muted-foreground mb-1 mx-3">
                      {isCurrentUser ? "You" : message.sender.first_name + " " + message.sender.last_name}
                    </span>
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
                                    <Button type="submit" size="sm" disabled={isEditing}>
                                      {isEditing ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        "Save"
                                      )}
                                    </Button>
                                  </div>
                                </form>
                              ) : (
                                <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                              )}
                              {isCurrentUser && !message.is_deleted && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleEdit(message.id, message.content)}>
                                      Edit Message
                                    </DropdownMenuItem>
                                    <AlertDialog
                                      open={messageToDelete === message.id}
                                      onOpenChange={(open) => !open && setMessageToDelete(null)}
                                    >
                                      <AlertDialogTrigger asChild>
                                        <DropdownMenuItem
                                          onClick={(e) => {
                                            e.preventDefault()
                                            setMessageToDelete(message.id)
                                          }}
                                          className="text-destructive"
                                          disabled={isDeleting}
                                        >
                                          {isDeleting ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                          ) : (
                                            "Delete Message"
                                          )}
                                        </DropdownMenuItem>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            This action cannot be undone. This will delete your message. CEO can restore
                                            message.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() => handleDelete(message.id)}
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                            disabled={isDeleting}
                                          >
                                            {isDeleting ? (
                                              <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                              "Delete"
                                            )}
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>
                            <div className="flex flex-col gap-1 text-xs opacity-60">
                              <div className="flex items-center gap-2">
                                <span>{format(new Date(message.timestamp), "MMM d, yyyy, h:mm a")}</span>
                                {!message.is_deleted && isCurrentUser && (
                                  <>
                                    {message.is_delivered ? (
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
                              {message.is_modified && message.last_modified_at && (
                                <span className="text-xs italic text-muted-foreground">
                                  Edited {format(new Date(message.last_modified_at), "MMM d, h:mm a")}
                                </span>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    <span className="flex items-center text-xs text-muted-foreground gap-1 mt-1 mx-3">
                      {message.read_by?.length > 0 && (
                        message.read_by.length === 1
                          ? `Read by ${message.read_by[0]?.first_name || 'someone'}`
                          : `Read by ${message.read_by[0]?.first_name || 'someone'} and ${message.read_by.length - 1} other${message.read_by.length > 2 ? 's' : ''}`
                      )}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        {/* Scroll to Bottom Button */}
        {hasScrolledUp && (
          <Button
            variant="outline"
            size="icon"
            className="fixed bottom-28 left-1/2 transform -translate-x-1/2 rounded-full shadow-md opacity-75 hover:opacity-100 z-10"
            onClick={scrollToBottom}
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Message Input */}
      <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4">
        <MessageInput roomId={roomId} onMessageSent={scrollToBottom} />
      </div>

      {selectedUserId && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
          <div className="fixed inset-x-4 top-[50%] translate-y-[-50%] sm:inset-x-auto sm:left-[50%] sm:translate-x-[-50%] sm:max-w-2xl h-[90vh] bg-background rounded-lg shadow-lg overflow-hidden">
            <div className="h-full overflow-y-auto p-4">
              <EmployeeDetailsForUsers userId={selectedUserId} />
              <div className="sticky bottom-0 pt-4 bg-background">
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => setSelectedUserId(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


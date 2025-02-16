"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useAppDispatch, useAppSelector } from "@/app/redux/store"
import {
  fetchChatRooms,
  resetChatRooms,
  deleteChatRoom
} from "@/app/redux/slices/chatRoomsSlice"
import { Search, X, Trash2, UserPlus, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { format } from "date-fns"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { AddParticipants } from "@/app/dashboard/chat/chat-history/components/AddParticipants"
import { useToast } from "@/hooks/use-toast"

export default function ChatHistory() {
  const router = useRouter()
  const { toast } = useToast()
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push("/")
    },
  })
  const dispatch = useAppDispatch()
  const {
    allRooms,
    nextPage,
    loading: ChatroomListLoading,
    error: ChatroomListError
  } = useAppSelector((state) => state.chatRooms)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [deleteRoomId, setDeleteRoomId] = useState<number | null>(null)
  const [showAddParticipants, setShowAddParticipants] = useState(false)
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [deletingRooms, setDeletingRooms] = useState<number[]>([])

  useEffect(() => {
    if (status === "authenticated") {
      dispatch(resetChatRooms())
      dispatch(fetchChatRooms({ search: searchQuery }))
    }
  }, [status, searchQuery, dispatch])

  const handleLoadMore = useCallback(() => {
    if (nextPage && !ChatroomListLoading) {
      if (status === "authenticated") {
        dispatch(fetchChatRooms({ pageUrl: nextPage }));
      }
    }
  }, [nextPage, ChatroomListLoading, status, dispatch]);

  const handleSearchClick = useCallback(() => {
    if (searchInputRef.current) {
      setSearchQuery(searchInputRef.current.value);
    }
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
    if (searchInputRef.current) {
      searchInputRef.current.value = "";
    }
    if (status === "authenticated") {
      dispatch(resetChatRooms());
      dispatch(fetchChatRooms({ pageUrl: null, search: "" }));
    }
  }, [status, dispatch]);

  const handleDeleteClick = useCallback((e: React.MouseEvent, roomId: number) => {
    e.stopPropagation();
    setDeleteRoomId(roomId);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (status !== "authenticated") {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to delete chat rooms",
        variant: "destructive",
      });
      return;
    }

    if (deleteRoomId) {
      setDeletingRooms((prev) => [...prev, deleteRoomId]);
      try {
        await dispatch(deleteChatRoom(deleteRoomId));
        setDeleteRoomId(null);
      } catch (error: any) {
        toast({
          title: "Error Deleting Chat Room",
          description:
            error?.message || "Something went wrong while deleting the chat room.",
          variant: "destructive",
        });
      } finally {
        setDeletingRooms((prev) => prev.filter((id) => id !== deleteRoomId));
      }
    }
  }, [deleteRoomId, dispatch, status, session?.user?.id, toast])

  const handleRoomSelect = useCallback((roomId: number) => {
    router.push(`/dashboard/chat/chat-history/${roomId}`);
  }, [router]);

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Chat Rooms</h1>

      <div className="relative flex items-center mb-6">
        <Input ref={searchInputRef} type="text" placeholder="Search chat room name" className="pr-20" />
        <div className="absolute right-2 flex gap-2">
          <Button variant="ghost" size="icon" onClick={handleSearchClick}>
            <Search className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleClearSearch}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-lg shadow-sm">
        <ScrollArea className="h-[calc(100vh-250px)]">
          {ChatroomListLoading && allRooms.length === 0 ? (
            <div className="space-y-4 p-4">
              {[...Array(10)].map((_, index) => (
                <div key={index} className="animate-pulse space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : ChatroomListError ? (
            <div className="flex items-center justify-center h-full text-destructive p-4">
              Failed to load chat rooms. Please try again later.
            </div>
          ) : (
            <>
              {searchQuery && (
                <div className="px-4 py-2 text-sm text-muted-foreground border-b">
                  Search results for "{searchQuery}"
                </div>
              )}
              {allRooms.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">No chat rooms found.</div>
              ) : (
                allRooms.map((room) => (
                  <div
                    key={room.id}
                    onClick={() => handleRoomSelect(room.id)}
                    className="w-full p-4 text-left hover:bg-accent transition-colors border-b last:border-b-0 cursor-pointer"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div>
                        <h3 className="font-medium flex items-center gap-2">
                          {room.name}
                          {room.unread_messages_count > 0 && (
                            <span className="inline-flex items-center justify-center w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs">
                              {room.unread_messages_count}
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {room.type === "GROUP" ? "Group Chat" : "Direct Message"}
                        </p>
                        {room.last_message && (
                          <p className="text-sm text-muted-foreground truncate mt-1">
                            {`${room.last_message.sender.first_name}: ${room.last_message.content}`}
                          </p>
                        )}
                      </div>
                      <div className="mt-2 md:mt-0 flex items-center justify-between md:justify-end gap-4">
                        <div className="text-xs text-muted-foreground">
                          {room.created_at && format(new Date(room.created_at), "MMM dd, yyyy")}
                        </div>
                        <div className="flex items-center gap-2">
                          {Number(session?.user?.id) === room.created_by.id && (
                            <>
                              {room.type === "GROUP" && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-muted-foreground hover:text-primary"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setSelectedRoomId(room.id);
                                          setShowAddParticipants(true)
                                        }}
                                      >
                                        <UserPlus className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Add Participants</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-destructive"
                                onClick={(e) => handleDeleteClick(e, room.id)}
                                disabled={deletingRooms.includes(room.id)}
                              >
                                {deletingRooms.includes(room.id) ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </ScrollArea>

        {nextPage && (
          <div className="flex justify-center p-4">
            <Button
              onClick={handleLoadMore}
              disabled={ChatroomListLoading}
              variant="secondary"
              className="w-32"
            >
              {ChatroomListLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Load More"
              )}
            </Button>
          </div>
        )}
      </div>

      <AlertDialog open={deleteRoomId !== null} onOpenChange={() => setDeleteRoomId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chat Room</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this chat room?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {showAddParticipants && selectedRoomId && (
        <AddParticipants
          roomId={selectedRoomId}
          onBack={() => setShowAddParticipants(false)}
          existingParticipants={
            allRooms.find(room => room.id === selectedRoomId)?.participants || []
          }
        />
      )}
    </div>
  )
}
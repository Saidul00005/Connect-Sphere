"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useAppDispatch, useAppSelector } from "@/app/redux/store"
import {
  fetchChatRooms,
  resetChatRooms,
  setCurrentPage,
  deleteChatRoom
} from "@/app/redux/slices/chatRoomsSlice"
import { getFilterKey } from "@/app/dashboard/chat/chat-history/types/chatHistoryTypes"
import { Search, X, Trash2 } from "lucide-react"
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

export default function ChatHistory() {
  const router = useRouter()
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push("/")
    },
  })
  const dispatch = useAppDispatch()
  const {
    pages,
    currentPage,
    loading: ChatroomListLoading,
    error: ChatroomListError
  } = useAppSelector((state) => state.chatRooms)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [deleteRoomId, setDeleteRoomId] = useState<number | null>(null)

  const filterKey = getFilterKey(searchQuery)
  const currentPageNumber = parseInt(currentPage[filterKey] || "1")
  const pageData = pages[filterKey]?.[currentPage[filterKey] || "1"]
  const rooms = pageData ? pageData.results : []
  const nextPageUrl = pageData?.next
  const previousPageUrl = pageData?.previous
  const totalPages = pageData ? Math.ceil(pageData.count / 10) : 1

  useEffect(() => {
    if (status === "authenticated" && rooms.length === 0) {
      dispatch(resetChatRooms())
      dispatch(fetchChatRooms({ pageUrl: null, search: searchQuery }))
    }
  }, [status, searchQuery, dispatch])

  const handleNextPage = useCallback(() => {
    if (nextPageUrl && !ChatroomListLoading) {
      const nextPageNumber =
        new URL(nextPageUrl, window.location.origin).searchParams.get("page") ||
        "1"
      if (!pages[filterKey]?.[nextPageNumber]) {
        dispatch(
          fetchChatRooms({
            pageUrl: nextPageUrl,
            search: searchQuery,
          })
        )
      } else {
        dispatch(setCurrentPage({ [filterKey]: nextPageNumber }))
      }
    }
  }, [nextPageUrl, ChatroomListLoading, dispatch, pages, searchQuery, filterKey])

  const handlePreviousPage = useCallback(() => {
    if (previousPageUrl && !ChatroomListLoading) {
      const prevPageNumber =
        new URL(previousPageUrl, window.location.origin).searchParams.get(
          "page"
        ) || "1"

      if (!pages[filterKey]?.[prevPageNumber]) {
        dispatch(
          fetchChatRooms({
            pageUrl: previousPageUrl,
            search: searchQuery,
          })
        )
      } else {
        dispatch(setCurrentPage({ [filterKey]: prevPageNumber }))
      }
    }
  }, [previousPageUrl, ChatroomListLoading, dispatch, pages, searchQuery, filterKey])

  const handleSearchClick = () => {
    if (searchInputRef.current) {
      setSearchQuery(searchInputRef.current.value)
    }
  }

  const handleClearSearch = () => {
    setSearchQuery("")
    if (searchInputRef.current) {
      searchInputRef.current.value = ""
    }
    dispatch(resetChatRooms())
    dispatch(fetchChatRooms({ pageUrl: null, search: "" }))
  }

  const handleDeleteClick = (e: React.MouseEvent, roomId: number) => {
    e.stopPropagation()
    setDeleteRoomId(roomId)
  }

  const handleConfirmDelete = async () => {
    if (deleteRoomId) {
      await dispatch(deleteChatRoom(deleteRoomId))
      setDeleteRoomId(null)
    }
  }

  const handleRoomSelect = (roomId: number) => {
    router.push(`/dashboard/chat/chat-history/${roomId}`)
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Chat Rooms</h1>

      <div className="relative flex items-center mb-6">
        <Input
          ref={searchInputRef}
          type="text"
          placeholder="Search chat room name"
          className="pr-20"
        />
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
          {ChatroomListLoading ? (
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
              {rooms.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No chat rooms found.
                </div>
              ) : (
                rooms.map((room) => (
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
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={(e) => handleDeleteClick(e, room.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </ScrollArea>

        <div className="flex items-center justify-center gap-4 p-4 border-t">
          <Button
            size="sm"
            onClick={handlePreviousPage}
            disabled={!previousPageUrl || ChatroomListLoading}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPageNumber} of {totalPages}
          </span>
          <Button
            size="sm"
            onClick={handleNextPage}
            disabled={!nextPageUrl || ChatroomListLoading}
          >
            Next
          </Button>
        </div>
      </div>

      <AlertDialog open={deleteRoomId !== null} onOpenChange={() => setDeleteRoomId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chat Room</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this chat room? This action cannot be undone.
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
    </div>
  )
}
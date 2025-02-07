"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useAppDispatch, useAppSelector } from "@/app/redux/store"
import {
  fetchChatRooms,
  resetChatRooms,
  setCurrentPage
} from "@/app/redux/slices/chatRoomSlice"
import { getFilterKey } from "@/app/dashboard/chat/chat-history/types/chatHistoryTypes"
import { Search, MoreVertical, Edit2, Trash2, Info, Menu, ChevronLeft, ChevronRight, X } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { format } from "date-fns"
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import ChatMessagesComponent from "@/app/dashboard/chat/chat-history/components/chatMessagesComponent"

export default function ChatHistory() {
  const router = useRouter();
  const { status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push("/");
    },
  });
  const dispatch = useAppDispatch()
  const {
    pages,
    currentPage,
    loading: ChatroomListLoading,
    error: ChatroomListError
  } = useAppSelector((state) => state.chatRooms)
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRoom, setSelectedRoom] = useState<number | null>(null)
  const [selectedMessage, setSelectedMessage] = useState<number | null>(null)
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false)
  const [editingMessage, setEditingMessage] = useState<{ id: number; content: string } | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false)

  const filterKey = getFilterKey(searchQuery);
  const currentPageNumber = parseInt(currentPage[filterKey] || "1");
  const pageData = pages[filterKey]?.[currentPage[filterKey] || "1"];
  const rooms = pageData ? pageData.results : [];
  const nextPageUrl = pageData?.next;
  const previousPageUrl = pageData?.previous;
  const totalPages = pageData ? Math.ceil(pageData.count / 10) : 1;

  useEffect(() => {
    if (status === "authenticated" && rooms.length === 0) {
      dispatch(resetChatRooms());
      dispatch(fetchChatRooms({ pageUrl: null, search: searchQuery }));
    }
  }, [status, searchQuery, dispatch]);

  const handleNextPage = useCallback(() => {
    if (nextPageUrl && !ChatroomListLoading) {
      const nextPageNumber =
        new URL(nextPageUrl, window.location.origin).searchParams.get("page") ||
        "1";
      if (!pages[filterKey]?.[nextPageNumber]) {
        dispatch(
          fetchChatRooms({
            pageUrl: nextPageUrl,
            search: searchQuery,
          })
        );
      } else {
        dispatch(setCurrentPage({ [filterKey]: nextPageNumber }));
      }
    }
  }, [nextPageUrl, ChatroomListLoading, dispatch, pages, searchQuery, filterKey]);

  const handlePreviousPage = useCallback(() => {
    if (previousPageUrl && !ChatroomListLoading) {
      const prevPageNumber =
        new URL(previousPageUrl, window.location.origin).searchParams.get(
          "page"
        ) || "1";

      if (!pages[filterKey]?.[prevPageNumber]) {
        dispatch(
          fetchChatRooms({
            pageUrl: previousPageUrl,
            search: searchQuery,
          })
        );
      } else {
        dispatch(setCurrentPage({ [filterKey]: prevPageNumber }));
      }
    }
  }, [previousPageUrl, ChatroomListLoading, dispatch, pages, searchQuery, filterKey]);

  const handleSearchClick = () => {
    if (searchInputRef.current) {
      setSearchQuery(searchInputRef.current.value);
    }
  }

  const handleClearSearch = () => {
    setSearchQuery("");
    if (searchInputRef.current) {
      searchInputRef.current.value = "";
    }
    dispatch(resetChatRooms());
    dispatch(fetchChatRooms({ pageUrl: null, search: "" }));
  };

  const currentRoom = rooms.find((r) => r.id === selectedRoom)
  const filteredRooms = rooms.filter((room) => room.name.toLowerCase().includes(searchQuery.toLowerCase()))

  const handleRoomSelect = (roomId: number) => {
    setSelectedRoom(roomId)
    setIsMobileSidebarOpen(false)
  }

  const Sidebar = () => (
    <div className="h-full flex flex-col">
      <div className="p-4">
        <div className="relative flex items-center">
          <Input
            ref={searchInputRef}
            type="text"
            placeholder="Search chat room name"
            className="pr-10 bg-transparent"
          />
          <div className="absolute right-2 top-1/2 flex -translate-y-1/2 gap-2">
            <Button variant="ghost" size="icon" onClick={handleSearchClick}>
              <Search className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleClearSearch}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      <ScrollArea className="flex-1">
        {ChatroomListLoading ? (
          <div className="space-y-4 p-4">
            {[...Array(10)].map((_, index) => (
              <div key={index} className="animate-pulse space-y-2">
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : ChatroomListError ? (
          <div className="flex items-center justify-center h-full text-red-500 text-sm">
            Failed to load chat rooms. Try again later.
          </div>
        ) : (
          <>
            {searchQuery && (
              <div className="px-4 py-2 text-sm text-gray-500">
                Search results for &quot;{searchQuery}&quot;
              </div>
            )}
            {rooms.map((room) => (
              <button
                key={room.id}
                onClick={() => handleRoomSelect(room.id)}
                className={`w-full p-4 text-left hover:bg-accent ${selectedRoom === room.id ? "bg-accent" : ""
                  }`}
              >
                <div className="flex items-center">
                  <h3 className="font-medium">{room.name}</h3>
                  {room.unread_messages_count > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs">
                      {room.unread_messages_count}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {room.type === "GROUP" ? "Group Chat" : "Direct Message"}
                </p>
                {room.last_message && (
                  <p className="text-sm text-muted-foreground truncate">
                    {`${room.last_message.sender.first_name}: ${room.last_message.content}`}
                  </p>
                )}
              </button>
            ))}
          </>
        )}
      </ScrollArea>

      <div className="flex items-center justify-center gap-4 mt-4 mb-4">
        <Button size='sm' onClick={handlePreviousPage} disabled={!previousPageUrl || ChatroomListLoading}>
          Previous
        </Button>
        <span>
          Page {currentPageNumber} of {totalPages}
        </span>
        <Button size='sm' onClick={handleNextPage} disabled={!nextPageUrl || ChatroomListLoading}>
          Next
        </Button>
      </div>
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
        <SheetContent side="left" className="p-0 w-80">
          <SheetHeader className="px-4 py-2">
            <SheetTitle>Chat Rooms</SheetTitle>
          </SheetHeader>
          <Sidebar />
        </SheetContent>
      </Sheet>

      {/* Chat Content */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-gray-800">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              {/* Mobile menu button */}
              <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMobileSidebarOpen(true)}>
                <Menu className="h-4 w-4" />
              </Button>

              {/* Desktop sidebar toggle */}
              <Button
                variant="secondary"
                size="icon"
                className="hidden md:flex"
                onClick={() => setIsDesktopSidebarCollapsed(!isDesktopSidebarCollapsed)}
              >
                {isDesktopSidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </Button>

              <h2 className="text-xl font-semibold">{selectedRoom && currentRoom ? currentRoom?.name : "Select a chat"}</h2>
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

          {selectedRoom && currentRoom ? (
            <div className="space-y-1 text-sm text-gray-400">
              <p>
                Created by:{" "}
                {currentRoom?.created_by?.first_name +
                  " " +
                  currentRoom?.created_by?.last_name}
              </p>
              <p>
                Created at:{" "}
                {currentRoom?.created_at
                  ? format(new Date(currentRoom.created_at), "MMM dd, yyyy, h:mm:ss a")
                  : "Unknown"}
              </p>
              <p>Status: {currentRoom?.is_active ? "Active" : "Inactive"}</p>
            </div>
          ) : (
            <div className="space-y-1 text-sm text-gray-400">
              <p>No chatroom selected.</p>
            </div>
          )}
        </div>

        {selectedRoom && (
          <>
            <ChatMessagesComponent
              roomId={String(currentRoom?.id)}
            />
          </>
        )}

        {selectedRoom && (
          <>
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
                <div className="space-y-2 text-sm">
                  {currentRoom?.participants.map((participant) => (
                    <div
                      key={participant.id}
                      className={`p-2 rounded-lg ${participant.id === currentRoom.created_by.id ? "bg-primary text-primary-foreground" : "bg-accent"
                        }`}
                    >
                      {participant.first_name + " " + participant.last_name} {participant.id === currentRoom.created_by.id && " (Admin)"}
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </div>
  )
}


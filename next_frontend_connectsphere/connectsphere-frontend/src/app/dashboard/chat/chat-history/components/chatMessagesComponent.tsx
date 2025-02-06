"use client"

import { useEffect, useCallback } from "react"
import { useAppDispatch, useAppSelector } from "@/app/redux/store"
import { fetchMessages, editMessage, deleteMessage } from "@/app/redux/slices/chatMessagesSlice"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { MoreVertical, ArrowUp, ArrowDown, Check, CheckCheck } from "lucide-react"

interface MessagePageProps {
  roomId: string
}

export default function ChatMessagesComponent({ roomId }: MessagePageProps) {
  const router = useRouter()
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push("/")
    },
  })
  const dispatch = useAppDispatch()
  const { pages, currentPage, loading, error } = useAppSelector((state) => state.chatMessages)

  const currentPageNumber = currentPage[roomId] || "1"
  const pageData = pages[roomId]?.[currentPageNumber]
  const messages = pageData ? pageData.results : []
  const nextPageUrl = pageData?.next
  const previousPageUrl = pageData?.previous

  useEffect(() => {
    if (status === "authenticated" && !pageData && !loading && !error) {
      dispatch(fetchMessages({ pageUrl: null, roomId }))
    }
  }, [roomId, pageData, loading, error, dispatch])

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  return (
    <div className="flex flex-col h-full">

      {previousPageUrl && (
        <Button onClick={handleLoadPrevious} disabled={loading} className="self-center my-2" variant="ghost" size="sm">
          <ArrowUp className="mr-2 h-4 w-4" /> Load Previous
        </Button>
      )}

      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        {loading && <p className="text-center text-gray-500">Loading messages...</p>}
        {error && <p className="text-center text-red-500">{error}</p>}

        {messages.map((message) => {
          const isCurrentUser = message.sender.id === Number(session?.user?.id)
          return (
            <div key={message.id} className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[70%] rounded-lg p-3 relative ${isCurrentUser ? "bg-gray-700 text-white" : "bg-gray-300 text-gray-900"
                  }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <span className="font-medium text-sm">
                    {isCurrentUser ? "You" : `${message.sender.first_name} ${message.sender.last_name}`}
                  </span>
                  <Button variant="ghost" size="icon" className="h-6 w-6 -mr-1.5 -mt-1.5">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
                <p className="mt-1 mb-2">
                  {message.is_deleted ? "This message was deleted" : message.content}
                </p>
                <div className={`text-xs space-y-0.5 ${isCurrentUser ? "text-gray-300" : "text-gray-500"}`}>
                  <p>{formatDate(message.timestamp)}</p>
                  {message.is_modified && <p>Edited at {formatDate(message.last_modified_at)}</p>}
                  {/* {message.is_deleted && <p>This message was deleted</p>} */}
                  {message.is_restored && <p>Restored at {formatDate(message.last_restore_at)}</p>}
                  <div className="flex items-center gap-1">
                    {message.read_by && message.read_by.length > 0 ? (
                      <span>Read</span>
                    ) : message.is_delivered ? (
                      <span>
                        Delivered <CheckCheck className="inline h-3 w-3" />
                      </span>
                    ) : message.is_sent ? (
                      <span>
                        Sent <Check className="inline h-3 w-3" />
                      </span>
                    ) : "Not sent"}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {nextPageUrl && (
        <Button onClick={handleLoadMore} disabled={loading} className="self-center my-2" variant="ghost" size="sm">
          Load More <ArrowDown className="ml-2 h-4 w-4" />
        </Button>
      )}
    </div>
  )
}


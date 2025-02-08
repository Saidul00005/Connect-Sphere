"use client"

import { useEffect, useCallback, useState } from "react"
import { useAppDispatch, useAppSelector } from "@/app/redux/store"
import { fetchMessages, editMessage, deleteMessage, sendMessage } from "@/app/redux/slices/chatMessagesSlice"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { MoreVertical, ArrowUp, ArrowDown, Check, CheckCheck, SendHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form"
import { useForm } from "react-hook-form"

interface MessagePageProps {
  roomId: string
}

interface MessageFormData {
  message: string;
}

export default function ChatMessagesComponent({ roomId }: MessagePageProps) {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push("/")
    },
  })

  const { pages, currentPage, loading, error } = useAppSelector((state) => state.chatMessages)

  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editMessageId, setEditMessageId] = useState<number | null>(null)
  const [editContent, setEditContent] = useState("")

  const currentPageNumber = currentPage[roomId] || "1"
  const pageData = pages[roomId]?.[currentPageNumber]
  const messages = pageData ? pageData.results : []
  const nextPageUrl = pageData?.next
  const previousPageUrl = pageData?.previous

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
    setEditMessageId(messageId)
    setEditContent(content)
    setEditDialogOpen(true)
  }

  const handleDelete = (messageId: number) => {
    if (window.confirm("Are you sure you want to delete this message?")) {
      dispatch(deleteMessage({ messageId, roomId }))
    }
  }

  const handleSaveEdit = () => {
    if (editMessageId && editContent.trim()) {
      dispatch(editMessage({
        messageId: editMessageId,
        content: editContent,
        roomId: roomId
      }))
      setEditDialogOpen(false)
      setEditContent("")
      setEditMessageId(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const MessageInput = () => {
    const form = useForm<MessageFormData>({
      defaultValues: {
        message: "",
      },
    })

    const onSubmit = async (data: MessageFormData) => {
      if (data.message.trim()) {
        await dispatch(sendMessage({ content: data.message, roomId }))
        form.reset()
      }
    }

    return (
      <div className="border-t p-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-2">
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input
                      placeholder="Type a message..."
                      {...field}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault()
                          form.handleSubmit(onSubmit)()
                        }
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button type="submit" size="icon">
              <SendHorizontal className="h-4 w-4" />
            </Button>
          </form>
        </Form>
      </div>
    )
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
                  {isCurrentUser && !message.is_deleted && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 -mr-1.5 -mt-1.5">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(message.id, message.content)}>
                          Edit Message
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(message.id)}
                          className="text-red-600">
                          Delete Message
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
                <p className="mt-1 mb-2">
                  {message.content}
                </p>
                <div className={`text-xs space-y-0.5 ${isCurrentUser ? "text-gray-300" : "text-gray-500"}`}>
                  <p>{formatDate(message.timestamp)}</p>
                  {message.is_modified && <p>Edited at {formatDate(message.last_modified_at)}</p>}
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

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Message</DialogTitle>
          </DialogHeader>
          <Input
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="my-4"
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MessageInput />
    </div>
  )
}
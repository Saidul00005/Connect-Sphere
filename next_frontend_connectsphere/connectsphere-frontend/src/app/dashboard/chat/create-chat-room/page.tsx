'use client'

import { useState, useRef, useEffect, FormEvent, useCallback } from "react"
import { useAppDispatch, useAppSelector } from "@/app/redux/store"
import { createChatRoom } from "@/app/redux/slices/chatRoomsSlice"
import {
  fetchEmployees,
  resetEmployees,
  setCurrentPage
} from "@/app/redux/slices/employeeListForUserSlice"
import { fetchDepartments } from "@/app/redux/slices/DepartmentListSliceForUser"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, X } from "lucide-react"
import { getFilterKey } from "@/app/dashboard/collegues/types/employeeListTypes"
import type { Employee } from "@/app/dashboard/collegues/types/employeeListTypes"
import { useRouter } from "next/navigation"
import {
  setType,
  setName,
  addParticipant,
  removeParticipant,
  resetForm
} from "@/app/redux/slices/createChatRoomSlice"
import { useSession } from "next-auth/react";
import { useToast } from "@/hooks/use-toast"

type ChatType = "GROUP" | "DIRECT"

export default function CreateChatRoom() {
  const router = useRouter()

  const { data: session, status } = useSession();

  const dispatch = useAppDispatch()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [department, setDepartment] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const { toast } = useToast()

  const {
    type,
    name,
    selectedParticipants,
    createdRoomId
  } = useAppSelector((state) => state.createChatRoomForm)

  const {
    pages,
    currentPage,
    loading: employeeListLoading,
  } = useAppSelector((state) => state.employees)

  const {
    list: departments,
    loading: departmentListLoading,
  } = useAppSelector((state) => state.departments)

  const filterKey = getFilterKey(department, searchTerm, "createChatRoom")
  const currentPageNumber = parseInt(currentPage[filterKey] || "1")
  const pageData = pages[filterKey]?.[currentPage[filterKey] || "1"]
  const employees = pageData ? pageData.results : []
  const nextPageUrl = pageData?.next
  const previousPageUrl = pageData?.previous
  const pageSize = 10
  const totalPages = pageData ? Math.ceil(pageData.count / pageSize) : 1

  useEffect(() => {
    if (createdRoomId) {
      router.push(`/dashboard/chat/chat-history?room=${createdRoomId}`)
      if (status === "authenticated") {
        dispatch(resetForm())
      }
    }
  }, [status, createdRoomId, router, dispatch])

  useEffect(() => {
    if (status === "authenticated" && employees.length === 0) {
      dispatch(resetEmployees("createChatRoom"))
      dispatch(fetchEmployees({ pageUrl: null, department, search: searchTerm, component: "createChatRoom" }))
    }
  }, [status, dispatch, department, searchTerm])

  useEffect(() => {
    if (status === "authenticated" && departments.length === 0) {
      dispatch(fetchDepartments())
    }
  }, [status, dispatch, departments.length])

  const handleSearch = useCallback(() => {
    if (searchInputRef.current) {
      setSearchTerm(searchInputRef.current.value);
    }
  }, []);

  const handleDepartmentChange = useCallback((value: string) => {
    setDepartment(value);
  }, []);

  const handleClearFilters = useCallback(() => {
    setDepartment("")
    setSearchTerm("")
    if (searchInputRef.current) {
      searchInputRef.current.value = ""
    }
    if (status === "authenticated") {
      dispatch(resetEmployees("createChatRoom"))
      dispatch(fetchEmployees({ pageUrl: null, department: "", search: "", component: "" }))
    }
  }, [status, dispatch])

  const handleParticipantSelect = useCallback((employee: Employee) => {
    if (employee.user__id === Number(session?.user?.id)) {
      return;
    }
    dispatch(addParticipant(employee));
  }, [session?.user?.id, dispatch]);


  const handleParticipantRemove = useCallback((employeeId: number) => {
    dispatch(removeParticipant(employeeId));
  }, [dispatch]);

  const handlePreviousPage = useCallback(() => {
    if (previousPageUrl && !employeeListLoading && !departmentListLoading) {
      const prevPageNumber = new URL(previousPageUrl, window.location.origin).searchParams.get("page") || "1"

      if (!pages[filterKey]?.[prevPageNumber]) {
        if (status === "authenticated") {
          dispatch(
            fetchEmployees({
              pageUrl: previousPageUrl,
              department,
              search: searchTerm,
              component: "createChatRoom"
            })
          )
        }
      } else {
        if (status === "authenticated") {
          dispatch(setCurrentPage({ [filterKey]: prevPageNumber }))
        }
      }
    }
  }, [status, previousPageUrl, employeeListLoading, departmentListLoading, dispatch, pages, filterKey, department, searchTerm])

  const handleNextPage = useCallback(() => {
    if (nextPageUrl && !employeeListLoading && !departmentListLoading) {
      const nextPageNumber = new URL(nextPageUrl, window.location.origin).searchParams.get("page") || "1"

      if (!pages[filterKey]?.[nextPageNumber]) {
        if (status === "authenticated") {
          dispatch(
            fetchEmployees({
              pageUrl: nextPageUrl,
              department,
              search: searchTerm,
              component: "createChatRoom"
            })
          )
        }
      } else {
        if (status === "authenticated") {
          dispatch(setCurrentPage({ [filterKey]: nextPageNumber }))
        }
      }
    }
  }, [status, nextPageUrl, employeeListLoading, departmentListLoading, dispatch, pages, filterKey, department, searchTerm])

  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();

    if (status !== "authenticated") {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to create a chat",
        variant: "destructive",
      });
      return;
    }

    const participantIds = selectedParticipants.map((p) => p.user__id);

    if (
      (type === "DIRECT" && participantIds.length !== 1) ||
      (type === "GROUP" && selectedParticipants.length < 2)
    ) {
      return;
    }

    setIsCreating(true);

    try {
      let chatResponse;
      if (type === "DIRECT") {
        const otherParticipant = selectedParticipants[0];
        chatResponse = await dispatch(
          createChatRoom({
            type: "DIRECT",
            participants: participantIds,
            otherParticipantName: `${otherParticipant.user__first_name} ${otherParticipant.user__last_name}`,
          })
        ).unwrap();
      } else {
        chatResponse = await dispatch(
          createChatRoom({
            name,
            type: "GROUP",
            participants: participantIds,
          })
        ).unwrap();
      }

      const chatRoomId = chatResponse.chatroom.id;

      toast({
        title: "Success",
        description: chatResponse.message,
      });

      router.push(`/dashboard/chat/chat-history/${chatRoomId}`);
    } catch (error: any) {
      toast({
        title: "Error Creating Chat Room",
        description:
          error?.message ||
          "Something went wrong while creating the chat room.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  }, [status,
    selectedParticipants,
    type,
    name,
    dispatch,
    toast,
    router,
    session?.user?.id])

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background p-4 md:p-8 grid md:grid-cols-2 gap-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Create Chat Room</h1>
          <p className="text-muted-foreground mt-2">Select participants for your chat</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Room Type</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={type} onValueChange={(value: ChatType) => dispatch(setType(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GROUP">Group Chat</SelectItem>
                <SelectItem value="DIRECT">Direct Message</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {type === "GROUP" && (
          <Card>
            <CardHeader>
              <CardTitle>Room Name</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                value={name}
                onChange={(e) => dispatch(setName(e.target.value))}
                placeholder="Enter room name"
                required
              />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Selected Participants</CardTitle>
            <CardDescription>
              {type === "DIRECT" ? "Select 1 participant" : "Select at least 2 participants"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {selectedParticipants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center gap-2 bg-primary/10 text-primary rounded-full px-3 py-1"
                >
                  <span>
                    {participant.user__first_name} {participant.user__last_name}
                  </span>
                  <button
                    onClick={() => handleParticipantRemove(participant.id)}
                    className="hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Search Participants</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-grow">
                <Input
                  ref={searchInputRef}
                  placeholder="Search by name"
                  className="pr-20"
                />
                <Button
                  onClick={handleSearch}
                  className="absolute right-0 top-0 rounded-l-none"
                >
                  Search
                </Button>
              </div>
              <Select value={department} onValueChange={handleDepartmentChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.name}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={handleClearFilters}>
                Clear
              </Button>
            </div>

            <div className="space-y-2">
              {employeeListLoading ? (
                <div className="animate-pulse space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-muted rounded" />
                  ))}
                </div>
              ) : (
                employees.map((employee) => (
                  <Card
                    key={employee.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleParticipantSelect(employee)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">
                            {employee.user__id === Number(session?.user?.id) ? "You" : `${employee.user__first_name} ${employee.user__last_name}`}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {employee.department__name} - {employee.designation}
                          </p>
                        </div>
                        {selectedParticipants.find(p => p.id === employee.id) && (
                          <div className="text-primary">
                            <Users className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-center gap-4 mt-4">
          <Button onClick={handlePreviousPage} disabled={!previousPageUrl}>
            Previous
          </Button>
          <span>
            Page {currentPageNumber} of {totalPages}
          </span>
          <Button onClick={handleNextPage} disabled={!nextPageUrl}>
            Next
          </Button>
        </div>

        <Button
          className="w-full"
          onClick={handleSubmit}
          disabled={
            (type === "DIRECT" && selectedParticipants.length !== 1) ||
            (type === "GROUP" && selectedParticipants.length < 2) ||
            (type === "GROUP" && !name.trim())
          }
        >
          {isCreating ? "Creating..." : "Create Chat Room"}
        </Button>
      </div>
    </div>
  )
}
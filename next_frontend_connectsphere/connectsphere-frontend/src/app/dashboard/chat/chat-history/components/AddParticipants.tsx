"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useAppDispatch, useAppSelector } from "@/app/redux/store"
import {
  fetchEmployees,
  resetEmployees,
  setCurrentPage
} from "@/app/redux/slices/employeeListForUserSlice"
import { fetchDepartments } from "@/app/redux/slices/DepartmentListSliceForUser"
import { addParticipants } from "@/app/redux/slices/chatRoomSlice"
import { getFilterKey } from "@/app/dashboard/collegues/types/employeeListTypes"
import type { Employee } from "@/app/dashboard/collegues/types/employeeListTypes"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Search, Users, Loader2 } from "lucide-react"
import type { User } from '@/app/dashboard/chat/chat-history/types/chatHistoryTypes';
import { useToast } from "@/hooks/use-toast"
import { useSession } from "next-auth/react"

interface AddParticipantsProps {
  onBack: () => void
  roomId: number
  existingParticipants: User[]
}

export function AddParticipants({ onBack, roomId, existingParticipants }: AddParticipantsProps) {
  const { status } = useSession()
  const dispatch = useAppDispatch()
  const [selectedParticipants, setSelectedParticipants] = useState<User[]>([])
  const { toast } = useToast()

  const searchInputRef = useRef<HTMLInputElement>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [department, setDepartment] = useState("")
  const [loading, setLoading] = useState(false)

  const componentKey = "addParticipants"
  const filterKey = getFilterKey(department, searchTerm, componentKey)

  const {
    pages,
    currentPage,
    loading: employeeListLoading,
  } = useAppSelector((state) => state.employees)

  const {
    list: departments,
    loading: departmentListLoading,
  } = useAppSelector((state) => state.departments)

  const currentPageNumber = parseInt(currentPage[filterKey] || "1")
  const pageData = pages[filterKey]?.[currentPage[filterKey] || "1"]
  const employees = pageData ? pageData.results : []
  const nextPageUrl = pageData?.next
  const previousPageUrl = pageData?.previous
  const pageSize = 10
  const totalPages = pageData ? Math.ceil(pageData.count / pageSize) : 1

  useEffect(() => {
    if (status === "authenticated") {
      dispatch(resetEmployees(componentKey))
      dispatch(fetchEmployees({
        pageUrl: null,
        department,
        search: searchTerm,
        component: componentKey
      }))
    }
  }, [status, dispatch, department, searchTerm])

  useEffect(() => {
    if (status === "authenticated") {
      if (departments.length === 0) {
        dispatch(fetchDepartments())
      }
    }
  }, [status, dispatch, departments.length])

  const handleSearch = useCallback(() => {
    if (searchInputRef.current) {
      setSearchTerm(searchInputRef.current.value)
    }
  }, [])

  const handleDepartmentChange = useCallback((value: string) => {
    setDepartment(value)
  }, [])

  const handleClearFilters = useCallback(() => {
    setDepartment("")
    setSearchTerm("")
    if (searchInputRef.current) {
      searchInputRef.current.value = ""
    }
    if (status === "authenticated") {
      dispatch(resetEmployees(componentKey))
      dispatch(fetchEmployees({ pageUrl: null, department: "", search: "", component: componentKey }))
    }
  }, [status, dispatch])

  const handlePreviousPage = useCallback(() => {
    if (previousPageUrl && !employeeListLoading && !departmentListLoading) {
      const prevPageNumber = new URL(previousPageUrl, window.location.origin).searchParams.get("page") || "1"

      if (!pages[filterKey]?.[prevPageNumber]) {
        if (status === "authenticated") {
          dispatch(fetchEmployees({
            pageUrl: previousPageUrl,
            department,
            search: searchTerm,
            component: componentKey
          }))
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
          dispatch(fetchEmployees({
            pageUrl: nextPageUrl,
            department,
            search: searchTerm,
            component: componentKey
          }))
        }
      } else {
        if (status === "authenticated") {
          dispatch(setCurrentPage({ [filterKey]: nextPageNumber }))
        }
      }
    }
  }, [status, nextPageUrl, employeeListLoading, departmentListLoading, dispatch, pages, filterKey, department, searchTerm])

  const handleSubmit = useCallback(async () => {
    if (selectedParticipants.length === 0) return

    setLoading(true)
    try {
      if (status === "authenticated") {
        await dispatch(
          addParticipants({ roomId, participants: selectedParticipants })
        ).unwrap()
      }

      toast({
        title: "Participants Added",
        description: "Participants were successfully added to the chat room.",
      })
      onBack()
    } catch (error: any) {
      toast({
        title: "Error Adding Participants",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [status, selectedParticipants, roomId, dispatch, toast, onBack])

  const handleEmployeeClick = useCallback((employee: Employee) => {
    if (existingParticipants.some(p => p.id === employee.user__id)) return;

    setSelectedParticipants(prev => {
      const exists = prev.some(p => p.id === employee.user__id);
      if (exists) {
        return prev.filter(p => p.id !== employee.user__id);
      }

      if (!employee.user__first_name || !employee.user__last_name) {
        return prev;
      }
      return [...prev, {
        id: employee.user__id,
        first_name: employee.user__first_name,
        last_name: employee.user__last_name
      }];
    });
  }, [existingParticipants])

  return (
    <div className="fixed inset-0 bg-background z-50 p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-semibold">Add Participants</h2>
        </div>

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
              <Search className="h-4 w-4" />
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

        <ScrollArea className="h-[calc(100vh-220px)]">
          <div className="space-y-2 pr-4">
            {employeeListLoading ? (
              <div className="animate-pulse space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-muted rounded" />
                ))}
              </div>
            ) : employees.length > 0 ? (
              employees.map((employee) => {

                const isExisting = existingParticipants.some(p => p.id === employee.user__id);
                const isSelected = selectedParticipants.some(p => p.id === employee.user__id);

                return (
                  <Card
                    key={employee.id}
                    className={`cursor-pointer hover:bg-muted/50 
                    ${isSelected ? 'bg-primary/10' : ''}
                    ${isExisting ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => !isExisting && handleEmployeeClick(employee)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">
                            {employee.user__first_name} {employee.user__last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {employee.department__name} - {employee.designation}
                          </p>
                        </div>
                        {isExisting ? (
                          <span className="text-sm text-muted-foreground">Already in chat</span>
                        ) : <Users className="h-5 w-5 text-primary" />}
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No employees found
              </p>
            )}
          </div>
          <div className="flex items-center justify-center gap-4 mt-4">
            <Button
              onClick={handlePreviousPage}
              disabled={!previousPageUrl}
              variant="outline"
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPageNumber} of {totalPages}
            </span>
            <Button
              onClick={handleNextPage}
              disabled={!nextPageUrl}
              variant="outline"
            >
              Next
            </Button>
          </div>
        </ScrollArea>
        <div className="flex items-center justify-center gap-4 mt-4">
          <Button variant="outline" onClick={onBack}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={selectedParticipants.length === 0 || loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              `Add Selected (${selectedParticipants.length})`
            )}
          </Button>
        </div>

      </div>
    </div>
  )
}
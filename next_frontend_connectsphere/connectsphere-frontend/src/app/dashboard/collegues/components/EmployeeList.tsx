"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useAppSelector, useAppDispatch } from "@/app/redux/store"
import { fetchEmployees, resetEmployees } from "@/app/redux/slices/employeeListForUserSlice"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { useInView } from "react-intersection-observer"
import { AlertCircle } from "lucide-react"
import EmployeeProfileForUser from "./EmployeeProfileForUser"

export default function EmployeeList() {
  const router = useRouter()
  const { status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push("/")
    },
  })

  const dispatch = useAppDispatch()
  const {
    employees,
    loading: employeeListLoading,
    error,
    hasMore,
    nextPage,
    previousPage
  } = useAppSelector((state) => state.employees)
  const [searchTerm, setSearchTerm] = useState("")
  const [department, setDepartment] = useState("")
  const [selectedEmployeeUserId, setSelectedEmployeeUserId] = useState<number | null>(null)

  const { ref, inView } = useInView({
    threshold: 0,
  })

  const loadMoreEmployees = useCallback(() => {
    if (hasMore && !employeeListLoading && nextPage) {
      dispatch(fetchEmployees(nextPage))
    }
  }, [dispatch, hasMore, employeeListLoading, nextPage])

  useEffect(() => {
    if (status === "authenticated")
      dispatch(resetEmployees())
    dispatch(fetchEmployees(null))
  }, [status, dispatch])

  useEffect(() => {
    if (inView) {
      loadMoreEmployees()
    }
  }, [inView, loadMoreEmployees])

  const handleSearch = () => {
    // TODO: Implement search functionality
    console.log("Searching for:", searchTerm)
  }

  const handleSort = (value: string) => {
    setDepartment(value)
    // TODO: Implement sort functionality
    console.log("Sorting by department:", value)
  }

  // const handlePreviousPage = () => {
  //   if (previousPage && !employeeListLoading) {
  //     dispatch(fetchEmployees(previousPage))
  //   }
  // }

  // const handleNextPage = () => {
  //   if (nextPage && !employeeListLoading) {
  //     dispatch(fetchEmployees(nextPage))
  //   }
  // }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Card className="bg-destructive/10 border-destructive/20">
          <CardContent className="flex items-center space-x-4 p-6">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <div>
              <h3 className="text-lg font-semibold">Error Loading Employees</h3>
              <p className="text-destructive">{error}</p>
              <Button className="mt-4" onClick={() => dispatch(fetchEmployees(null))}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-2 space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-grow">
          <Input
            type="text"
            placeholder="Search employees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-background"
          />
          <Button onClick={handleSearch} className="absolute right-0 top-0 bottom-0 rounded-l-none">
            Search
          </Button>
        </div>
        <Select onValueChange={handleSort} value={department}>
          <SelectTrigger className="w-full sm:w-[180px] bg-background">
            <SelectValue placeholder="Sort by department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="IT">Information Technology</SelectItem>
            <SelectItem value="HR">Human Resources</SelectItem>
            <SelectItem value="Finance">Finance</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        {employees.map((employee) => (
          <Card key={employee.id} className="bg-card hover:bg-muted/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {`${employee.user__first_name} ${employee.user__last_name}`}
                  </h3>
                  <p className="text-sm text-muted-foreground">{employee.user__role__name}</p>
                  <p className="text-sm text-muted-foreground">{employee.department__name}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 sm:flex-none"
                    onClick={() => setSelectedEmployeeUserId(employee.id)}
                  >
                    View Profile
                  </Button>
                  <Button className="flex-1 sm:flex-none" onClick={() => console.log("Chat with:", employee.id)}>
                    Chat
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {status === "loading" ||
          (employeeListLoading && (
            <>
              {[...Array(3)].map((_, index) => (
                <Card key={`skeleton-${index}`} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="h-5 w-40 bg-muted rounded"></div>
                      <div className="h-4 w-32 bg-muted rounded"></div>
                      <div className="h-4 w-24 bg-muted rounded"></div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <div className="h-9 flex-1 bg-muted rounded"></div>
                      <div className="h-9 flex-1 bg-muted rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          ))}
      </div>

      {hasMore && !employeeListLoading && <div ref={ref} className="h-10" />}
      {/* 
      <div className="flex flex-row gap-4 items-center justify-center mt-4">
        <Button onClick={handlePreviousPage} disabled={!previousPage || employeeListLoading}>
          Previous
        </Button>
        <Button onClick={handleNextPage} disabled={!nextPage || employeeListLoading}>
          Next
        </Button>
      </div> */}

      {selectedEmployeeUserId && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
          <div className="fixed inset-x-4 top-[50%] translate-y-[-50%] sm:inset-x-auto sm:left-[50%] sm:translate-x-[-50%] sm:max-w-2xl h-[90vh] bg-background rounded-lg shadow-lg overflow-hidden">
            <div className="h-full overflow-y-auto p-4">
              <EmployeeProfileForUser userId={selectedEmployeeUserId} />
              <div className="sticky bottom-0 pt-4 bg-background">
                <Button className="w-full" variant="outline" onClick={() => setSelectedEmployeeUserId(null)}>
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


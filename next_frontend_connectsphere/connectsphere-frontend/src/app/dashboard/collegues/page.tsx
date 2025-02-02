"use client"

import { useState, useEffect, useCallback } from "react"
import { useAppSelector, useAppDispatch } from "@/app/redux/store"
import { fetchEmployees, resetEmployees } from "@/app/redux/slices/employeeListForUserSlice"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { useInView } from "react-intersection-observer"

export default function EmployeeList() {
  const dispatch = useAppDispatch()
  const { employees, loading, error, hasMore } = useAppSelector((state) => state.employees)
  const [searchTerm, setSearchTerm] = useState("")
  const [department, setDepartment] = useState("")

  const { ref, inView } = useInView({
    threshold: 0,
  })

  const loadMoreEmployees = useCallback(() => {
    if (hasMore && !loading) {
      dispatch(fetchEmployees(null))
    }
  }, [dispatch, hasMore, loading])

  useEffect(() => {
    dispatch(resetEmployees())
    dispatch(fetchEmployees(null))
  }, [dispatch])

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

  if (error) {
    return <div>Error: {error}</div>
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-4 flex space-x-2">
        <Input
          type="text"
          placeholder="Search employees..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-grow"
        />
        <Button onClick={handleSearch}>Search</Button>
      </div>
      <div className="mb-4">
        <Select onValueChange={handleSort}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="IT">Information Technology</SelectItem>
            <SelectItem value="HR">Human Resources</SelectItem>
            <SelectItem value="Finance">Finance</SelectItem>
            {/* Add more departments as needed */}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-4">
        {employees.map((employee) => (
          <Card key={employee.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <h3 className="text-lg font-semibold">{`${employee.first_name} ${employee.last_name}`}</h3>
                <p className="text-sm text-gray-500">{employee.role_name}</p>
                <p className="text-sm text-gray-500">{employee.department_name}</p>
              </div>
              <div className="space-x-2">
                <Button variant="outline" onClick={() => console.log("View profile:", employee.id)}>
                  View Profile
                </Button>
                <Button onClick={() => console.log("Chat with:", employee.id)}>Chat</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {loading && <div className="text-center mt-4">Loading...</div>}
      {!loading && hasMore && <div ref={ref} className="h-10" />}
    </div>
  )
}


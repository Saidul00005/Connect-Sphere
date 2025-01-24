"use client"

import { useEffect } from "react"
import { useAppSelector, useAppDispatch } from "@/app/redux/store"
import { fetchProfile } from "@/app/redux/slices/profileSlice"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"

export default function EmployeeProfile() {
  const dispatch = useAppDispatch()
  const { details, loading, error } = useAppSelector((state) => state.profile)
  const employee = details?.employee_details

  useEffect(() => {
    if (!employee) {
      dispatch(fetchProfile())
    }
  }, [dispatch, employee])

  const fullName =
    employee?.user.first_name || employee?.user.last_name ? `${employee?.user?.first_name} ${employee?.user?.last_name}`.trim() : "N/A"

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="space-y-8">
          <div className="flex items-center gap-6">
            <Skeleton className="h-32 w-32 rounded-full" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-[300px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
          <Separator />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-6 w-[150px]" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-lg">{error}</div>
      </div>
    )
  }

  if (!employee) {
    return <div className="container mx-auto px-4 py-8">Employee not found</div>
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center gap-6 lg:gap-10">
          <Avatar className="h-32 w-32 lg:h-40 lg:w-40">
            <AvatarImage src={employee.profile_picture || undefined} alt={employee.employee_id} />
            <AvatarFallback className="text-4xl">{fullName[0].toUpperCase() || "E"}</AvatarFallback>
          </Avatar>
          <div className="space-y-2">
            <h1 className="text-2xl lg:text-3xl font-bold">{fullName}</h1>
            <p className="text-md text-muted-foreground">{employee.designation}</p>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Details Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {/* Employee Details */}
          <section className="space-y-6">
            <h2 className="text-xl font-semibold">Employee Details</h2>
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <span className="text-sm text-muted-foreground">Employee ID</span>
                <span className="text-md font-medium">{employee.employee_id}</span>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-sm text-muted-foreground">Department</span>
                <span className="text-md font-medium">{employee.department?.name}</span>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-sm text-muted-foreground">Role</span>
                <span className="text-md font-medium">{employee.role_name}</span>
              </div>
            </div>
          </section>

          {/* Contact Information */}
          <section className="space-y-6">
            <h2 className="text-xl font-semibold">Contact Information</h2>
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <span className="text-sm text-muted-foreground">Contact Number</span>
                <span className="text-md font-medium">{employee.contact_number}</span>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-sm text-muted-foreground">Emergency Contact</span>
                <span className="text-md font-medium">{employee.emergency_contact}</span>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-sm text-muted-foreground">Address</span>
                <span className="text-md font-medium">{employee.address}</span>
              </div>
            </div>
          </section>

          {/* Employment Information */}
          <section className="space-y-6">
            <h2 className="text-xl font-semibold">Employment Information</h2>
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <span className="text-sm text-muted-foreground">Joining Date</span>
                <span className="text-md font-medium">{new Date(employee.joining_date).toLocaleDateString()}</span>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-sm text-muted-foreground">Reporting Manager</span>
                <span className="text-md font-medium">{employee.reporting_manager_name}</span>
              </div>
            </div>
          </section>
        </div>

        <Separator className="my-8" />

        {/* Skills Section */}
        <section className="space-y-6">
          <h2 className="text-xl font-semibold">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {employee.skills?.map((skill: string, index: number) => (
              <Badge key={index} variant="secondary">
                {skill}
              </Badge>
            ))}
          </div>
        </section>

        <Separator className="my-8" />

        {/* Performance Section */}
        <section className="space-y-6">
          <h2 className="text-xl font-semibold">Performance</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <span className="text-sm text-muted-foreground">Rating</span>
              <span className="text-md font-medium">{employee.performance_rating} / 5</span>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-sm text-muted-foreground">Last Review Date</span>
              <span className="text-md font-medium">{new Date(employee.last_review_date).toLocaleDateString()}</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}


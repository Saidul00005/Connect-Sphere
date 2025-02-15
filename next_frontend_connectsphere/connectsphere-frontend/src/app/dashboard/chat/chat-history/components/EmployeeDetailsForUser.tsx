"use client"

import { Card } from "@/components/ui/card"
import { CalendarDays, User2, Building2, Phone, MapPin, Trophy } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useSession } from "next-auth/react"
import { Skeleton } from "@/components/ui/skeleton"
import { useEffect, useState } from "react"
import { useAppSelector, useAppDispatch } from "@/app/redux/store"
import { fetchEmployeePublicDetails } from "@/app/redux/slices/employeeDetailsSliceForUser"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DetailsPageProps {
  userId: number
}

export default function DetailsPage({ userId }: DetailsPageProps) {
  const { status } = useSession()
  const dispatch = useAppDispatch()
  const { details, loading: employeeDetailsLoading, error } = useAppSelector((state) => state.employeePublicDetails)
  const [showId, setShowId] = useState(false)

  const detail = details[userId] || null;

  useEffect(() => {
    if (status === "authenticated" && userId) {
      dispatch(fetchEmployeePublicDetails(userId))
    }
  }, [dispatch, status, userId])

  const isLoading = status === "loading" || employeeDetailsLoading

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <Card className="max-w-3xl mx-auto overflow-hidden bg-card dark:bg-card">
          <div className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <Skeleton className="h-24 w-24 rounded-full" />
              <div className="text-center sm:text-left">
                <Skeleton className="h-8 w-48 mb-2" />
                <div className="space-x-2">
                  <Skeleton className="h-6 w-20 inline-block" />
                  <Skeleton className="h-6 w-24 inline-block" />
                </div>
              </div>
            </div>
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5" />
                  <div>
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-5 w-32" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    )
  }

  if (error) {
    return <p className="text-red-500 text-center">Error: {error}</p>
  }

  if (!details) {
    return <p className="text-center">No employee details found.</p>
  }

  // const initials = detail.full_name
  //   ? detail.full_name
  //     .split(" ")
  //     .map((n) => n[0])
  //     .join("")
  //   : ""

  return (
    <div className="container mx-auto p-4">
      <Card className="max-w-3xl mx-auto overflow-hidden bg-card dark:bg-card">
        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* <Avatar className="h-24 w-24">
              <AvatarFallback className="text-xl">{initials}</AvatarFallback>
            </Avatar> */}
            <div className="text-center sm:text-left">
              {/* <h1 className="text-2xl font-bold text-foreground">{detail.full_name || ''}</h1> */}
              <div className="mt-2 space-x-2">
                {/* {detail.role_name && (
                  <Badge variant="secondary" className="text-sm">
                    {detail.role_name}
                  </Badge>
                )} */}
                <Badge variant="outline" className="text-sm">
                  Employee ID:
                  <div className="flex items-center gap-2">
                    <code className="text-md font-mono bg-muted px-2 py-1 rounded">
                      {showId ? detail.employee_id || "N/A" : '••••••••'}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowId(!showId)}
                      aria-label={showId ? "Hide Employee ID" : "Show Employee ID"}
                    >
                      {showId ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </Badge>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                {/* <div>
                  <p className="text-sm text-muted-foreground">Department</p>
                  <p className="font-medium text-foreground">{detail.department || "N/A"}</p>
                </div> */}
              </div>

              <div className="flex items-center gap-2">
                <User2 className="h-5 w-5 text-muted-foreground" />
                {/* <div>
                  <p className="text-sm text-muted-foreground">Designation</p>
                  <p className="font-medium text-foreground">{detail.designation || "N/A"}</p>
                </div> */}
              </div>

              <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-muted-foreground" />
                {/* <div>
                  <p className="text-sm text-muted-foreground">Joining Date</p>
                  <p className="font-medium text-foreground">{detail.joining_date || "N/A"}</p>
                </div> */}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-muted-foreground" />
                {/* <div>
                  <p className="text-sm text-muted-foreground">Performance Rating</p>
                  <p className="font-medium text-foreground">{detail.performance_rating?.toString() || "N/A"}</p>
                </div> */}
              </div>

              <div className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-muted-foreground" />
                {/* <div>
                  <p className="text-sm text-muted-foreground">Contact</p>
                  <p className="font-medium text-foreground">{detail.contact_number || "N/A"}</p>
                  <p className="text-xs text-muted-foreground">Emergency: {detail.emergency_contact || "N/A"}</p>
                </div> */}
              </div>

              {/* <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium text-foreground">{detail.address || "N/A"}</p>
                </div>
              </div> */}
            </div>
          </div>
          {/* 
          {detail.skills && detail.skills.length > 0 && (
            <div className="mt-8">
              <h2 className="text-sm font-medium text-muted-foreground mb-2">Skills</h2>
              <div className="flex flex-wrap gap-2">
                {detail.skills.map((skill) => (
                  <Badge key={skill} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )} */}
        </div>
      </Card>
    </div>
  )
}


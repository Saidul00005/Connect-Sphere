"use client"

import { useEffect, useState } from "react"
import { useAppSelector, useAppDispatch } from "@/app/redux/store"
import { fetchProfile } from "@/app/redux/slices/profileSlice"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function EmployeeProfile() {
  const router = useRouter()
  const { status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push("/")
    },
  })

  const dispatch = useAppDispatch()
  const { details, loading: employeeProfileLoading, error } = useAppSelector(
    (state) => state.profile
  )
  const [showId, setShowId] = useState(false)

  const fullName = details?.user?.first_name || details?.user?.last_name
    ? `${details.user.first_name} ${details.user.last_name}`.trim()
    : "N/A"

  useEffect(() => {
    if (status === "authenticated" && details === null && !employeeProfileLoading && !error) {
      dispatch(fetchProfile())
    }
  }, [status, details, employeeProfileLoading, error, dispatch])

  const isLoading = status === "loading" || employeeProfileLoading

  if (isLoading) {
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
        <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-lg">
          {error}
        </div>
      </div>
    )
  }

  if (!details) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-lg">
          Employee profile not found
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center gap-6 lg:gap-10">
          <Avatar className="h-32 w-32 lg:h-40 lg:w-40">
            <AvatarImage src={details.user?.profile_picture || undefined} alt="Profile" />
            <AvatarFallback className="text-4xl">{fullName[0].toUpperCase() || "E"}</AvatarFallback>
          </Avatar>
          <div className="space-y-2">
            <h1 className="text-2xl lg:text-3xl font-bold">{fullName}</h1>
            <p className="text-md text-muted-foreground">{details.designation}</p>
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
                <div className="flex items-center gap-2">
                  <code className="text-md font-mono bg-muted px-2 py-1 rounded">
                    {showId ? details.employee_id : '••••••••'}
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
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-sm text-muted-foreground">Department</span>
                <span className="text-sm md:text-md font-medium">{details.department?.name}</span>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-sm text-muted-foreground">Role</span>
                <span className="text-sm md:text-md font-medium">{details.user?.role}</span>
              </div>
            </div>
          </section>

          {/* Contact Information */}
          <section className="space-y-6">
            <h2 className="text-xl font-semibold">Contact Information</h2>
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <span className="text-sm text-muted-foreground">Contact Number</span>
                <span className="text-sm md:text-md font-medium">{details.contact_number}</span>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-sm text-muted-foreground">Emergency Contact</span>
                <span className="text-sm md:text-md font-medium">{details.emergency_contact}</span>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-sm text-muted-foreground">Address</span>
                <span className="text-sm md:text-md font-medium">{details.address}</span>
              </div>
            </div>
          </section>

          {/* Employment Information */}
          <section className="space-y-6">
            <h2 className="text-xl font-semibold">Employment Information</h2>
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <span className="text-sm text-muted-foreground">Joining Date</span>
                <span className="text-sm md:text-md font-medium">{new Date(details?.joining_date).toLocaleDateString()}</span>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-sm text-muted-foreground">Reporting Manager</span>
                <span className="text-sm md:text-md font-medium">{details.reporting_manager_name}</span>
              </div>
            </div>
          </section>
        </div>

        <Separator className="my-8" />

        {/* Skills Section */}
        <section className="space-y-6">
          <h2 className="text-xl font-semibold">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {details.skills?.map((skill: string, index: number) => (
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
              <span className="text-sm md:text-md font-medium">{details.performance_rating} / 5</span>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-sm text-muted-foreground">Last Review Date</span>
              <span className="text-sm md:text-md font-medium">{new Date(details?.last_review_date).toLocaleDateString()}</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}


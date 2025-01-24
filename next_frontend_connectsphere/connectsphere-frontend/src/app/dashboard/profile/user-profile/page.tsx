"use client"

import { useEffect, useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { useAppSelector, useAppDispatch } from "@/app/redux/store"
import { fetchProfile } from "@/app/redux/slices/profileSlice"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const roleMap = {
  1: "Chief Executive Officer",
  2: "Manager",
  3: "Employee",
}

export default function UserProfile() {
  const router = useRouter()
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push("/")
    },
  })
  const dispatch = useAppDispatch()
  const { details, loading: profileLoading, error } = useAppSelector(
    (state) => state.profile
  )
  const [showId, setShowId] = useState(false)

  const user = details?.employee_details?.user
  const fullName = user?.first_name || user?.last_name
    ? `${user?.first_name} ${user?.last_name}`.trim()
    : "N/A"

  useEffect(() => {
    if (status === "authenticated" && !user && !profileLoading) {
      dispatch(fetchProfile())
    }
  }, [status, user, profileLoading, dispatch])


  const statusBadge = (condition: boolean, text: string) => (
    <Badge variant={condition ? "default" : "destructive"} className="h-6">
      {text}
    </Badge>
  )
  const isLoading = status === "loading" || profileLoading

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
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <Skeleton className="h-6 w-[150px]" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-6 w-[150px]" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
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

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-lg">
          User profile not found
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
            <AvatarImage src={user?.profile_picture || undefined} />
            <AvatarFallback className="text-4xl">{fullName[0]?.toUpperCase() || "U"}</AvatarFallback>
          </Avatar>
          <div className="space-y-2">
            <h1 className="text-2xl lg:text-3xl font-bold">{fullName}</h1>
            <p className="text-md text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Details Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {/* Account Details */}
          <section className="space-y-6">
            <h2 className="text-xl font-semibold">Account Details</h2>
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <span className="text-sm text-muted-foreground">Role</span>
                <span className="text-sm md:text-md font-medium">{roleMap[user?.role as keyof typeof roleMap] || "Unknown"}</span>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-sm text-muted-foreground">Status</span>
                {statusBadge(user?.is_active!, "Active")}
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-sm text-muted-foreground">Approval Status</span>
                {statusBadge(user?.is_approved!, "Approved")}
              </div>
            </div>
          </section>

          {/* System Information */}
          <section className="space-y-6">
            <h2 className="text-xl font-semibold">System Information</h2>
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <span className="text-sm text-muted-foreground">User ID</span>
                <div className="flex items-center gap-2">
                  <code className="text-md font-mono bg-muted px-2 py-1 rounded">
                    {showId ? user?.id : '••••••••'}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowId(!showId)}
                    aria-label={showId ? "Hide user ID" : "Show user ID"}
                  >
                    {showId ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}


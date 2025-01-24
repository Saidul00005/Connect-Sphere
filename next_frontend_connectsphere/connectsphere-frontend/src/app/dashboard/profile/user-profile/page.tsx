"use client"

import { useEffect } from "react"
import { useAppSelector, useAppDispatch } from "@/app/redux/store"
import { fetchProfile } from "@/app/redux/slices/profileSlice"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"

const roleMap = {
  1: "Chief Executive Officer",
  2: "Manager",
  3: "Employee",
}

export default function UserProfile() {
  const dispatch = useAppDispatch()
  const { details, loading, error } = useAppSelector((state) => state.profile)
  const user = details?.employee_details?.user

  useEffect(() => {
    if (!user) {
      dispatch(fetchProfile())
    }
  }, [dispatch])

  const fullName = user?.first_name || user?.last_name ? `${user?.first_name} ${user?.last_name}`.trim() : "N/A"

  const statusBadge = (condition: boolean, text: string) => (
    <Badge variant={condition ? "default" : "destructive"} className="h-6">
      {text}
    </Badge>
  )

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
        <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-lg">{error}</div>
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
                <span className="text-md font-medium">{roleMap[user?.role as keyof typeof roleMap] || "Unknown"}</span>
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
                <code className="text-md font-mono bg-muted px-2 py-1 rounded">{user?.id}</code>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}


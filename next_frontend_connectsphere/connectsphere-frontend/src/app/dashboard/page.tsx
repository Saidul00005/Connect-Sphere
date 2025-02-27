'use client'
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardPage() {
  const router = useRouter()
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push("/")
    },
  })

  if (status === "loading") {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="space-y-4 text-center">
          <Skeleton className="mx-auto h-8 w-[200px]" />
          <Skeleton className="mx-auto h-4 w-[300px]" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-4">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">
          Welcome, {session?.user?.name || session?.user?.email?.split('@')[0]}
        </h1>
        <p className="text-muted-foreground">
          You&apos;re logged in to Connect Sphere Dashboard.
        </p>
      </div>
    </div>
  )
}
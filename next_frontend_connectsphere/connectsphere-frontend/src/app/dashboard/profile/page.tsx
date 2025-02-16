"use client"

import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { User, Users, FileText } from "lucide-react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function ProfilePage() {
  const router = useRouter()
  const { status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push("/")
    },
  })
  return (
    <div className="min-h-screen w-full bg-muted/40">
      <div className="mx-auto max-w-4xl px-4 py-12">
        {/* Header Section */}
        <div className="mb-16 text-center">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Profile Management</h1>
          <p className="mt-4 text-muted-foreground">
            Manage your personal and professional information
          </p>
        </div>

        {/* Options Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* User Profile Card */}
          <Card className="group transition-all hover:shadow-lg">
            <div className="flex h-full flex-col items-center p-8 text-center">
              <User className="mb-4 h-12 w-12 text-primary" />
              <h3 className="mb-2 text-xl font-semibold">User Profile</h3>
              <p className="mb-6 text-sm text-muted-foreground">
                Manage your personal information, contact details, and preferences
              </p>
              <Button asChild className="w-full">
                <Link href="/dashboard/profile/user-profile">
                  View Profile
                </Link>
              </Button>
            </div>
          </Card>

          {/* Employee Profile Card */}
          <Card className="group transition-all hover:shadow-lg">
            <div className="flex h-full flex-col items-center p-8 text-center">
              <Users className="mb-4 h-12 w-12 text-primary" />
              <h3 className="mb-2 text-xl font-semibold">Employee Profile</h3>
              <p className="mb-6 text-sm text-muted-foreground">
                Access employment details, job information, and work-related documents
              </p>
              <Button asChild variant="secondary" className="w-full">
                <Link href="/dashboard/profile/employee-profile">
                  View Details
                </Link>
              </Button>
            </div>
          </Card>

          {/* Documents Card */}
          <Card className="group transition-all hover:shadow-lg">
            <div className="flex h-full flex-col items-center p-8 text-center">
              <FileText className="mb-4 h-12 w-12 text-primary" />
              <h3 className="mb-2 text-xl font-semibold">Employee Documents</h3>
              <p className="mb-6 text-sm text-muted-foreground">
                View and manage your employment contracts, certificates, and files
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/dashboard/profile/employee-documents">
                  View Documents
                </Link>
              </Button>
            </div>
          </Card>
        </div>

        {/* Additional Info */}
        <p className="mt-12 text-center text-sm text-muted-foreground">
          Need help? Contact your HR department for assistance with profile management
        </p>
      </div>
    </div>
  )
}
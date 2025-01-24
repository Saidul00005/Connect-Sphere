"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import Footer from "@/components/custom/Footer"
import Header from "@/components/custom/Header"

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard")
    }
  }, [status, router])

  if (status === "loading") {
    return <LoadingSkeleton />
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-grow flex flex-col items-center justify-center px-4 text-center">
        <h1 className="text-2xl md:text-3xl lg:text-5xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
          Welcome to Connect Sphere
        </h1>
        <p className="text-md md:text-lg lg:text-xl text-muted-foreground max-w-2xl mb-8">
          A powerful microservice for employee communication, featuring real-time chat, role-based access, and efficient
          interaction tools.
        </p>
        <Button onClick={() => router.push("/logIn")} size="sm" className="text-lg px-8 py-6">
          Get Started
        </Button>
      </main>

      <Footer />
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <Skeleton className="h-12 w-12 rounded-full" />
      <Skeleton className="h-4 w-[200px]" />
      <Skeleton className="h-10 w-[150px]" />
    </div>
  )
}


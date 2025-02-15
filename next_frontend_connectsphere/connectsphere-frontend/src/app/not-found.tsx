'use client'
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function NotFound() {
  const handleBack = () => {
    if (typeof window !== 'undefined') {
      window.history.back();
    }
  };
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="max-w-md shadow-lg">
        <CardContent className="flex flex-col items-center space-y-4 p-8">
          <h1 className="text-6xl font-extrabold text-foreground">404</h1>
          <h2 className="text-2xl font-bold text-foreground">Page Not Found</h2>
          <p className="text-center text-muted-foreground">
            We&apos;re sorry, but the page you requested could not be found.
          </p>
          <Button
            onClick={handleBack}
            variant="outline"
            className="px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all"
          >
            Go Back
          </Button>
          <Link href="/">
            <Button variant="default">Return Home</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

'use client'

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const handleBack = () => {
    if (typeof window !== 'undefined') {
      window.history.back();
    }
  };

  return (
    <html>
      <body className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-6">
          <Alert variant="destructive" className="border-2">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle className="text-xl font-semibold">
              Oops! Something went wrong
            </AlertTitle>
            <AlertDescription className="mt-2 text-sm text-gray-600">
              {error.message || "An unexpected error occurred. Please try again."}
              {error.digest && (
                <p className="mt-2 text-xs text-gray-500">
                  Error ID: {error.digest}
                </p>
              )}
            </AlertDescription>
          </Alert>

          <div className="flex flex-col items-center gap-4">
            <div className="flex gap-4">
              <Button
                onClick={() => reset()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all"
              >
                Try Again
              </Button>
              <Button
                onClick={handleBack}
                variant="outline"
                className="px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all"
              >
                Go Back
              </Button>
            </div>
            <Link
              href="/"
              className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
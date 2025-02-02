"use client"
import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useAppSelector, useAppDispatch } from "@/app/redux/store"
import { fetchProfile } from "@/app/redux/slices/profileSlice"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { FileText, Download, Eye } from "lucide-react"


export default function EmployeeDocuments() {
  const router = useRouter()
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push("/")
    },
  })

  const dispatch = useAppDispatch()
  const { details, loading: employeeProfileLoading, error } = useAppSelector(
    (state) => state.profile
  )

  const documents = details?.documents

  useEffect(() => {
    if (status === "authenticated" && details === null && !employeeProfileLoading && !error) {
      dispatch(fetchProfile())
    }
  }, [status, details, employeeProfileLoading, dispatch])

  const isLoading = status === "loading" || employeeProfileLoading

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-[200px]" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-lg" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[150px]" />
                      <Skeleton className="h-3 w-[100px]" />
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <Skeleton className="h-10 w-10 rounded-lg" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <FileText className="h-6 w-6" />
              Employee Documents
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!documents || documents.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No documents available
              </div>
            ) : (
              documents.map((doc: any) => (
                <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex flex-col">
                      <h3 className="font-semibold text-lg">{doc.document_type_display}</h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {doc.description ? doc.description : "No description"} •{" "}
                        {new Date(doc.uploaded_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(doc.document, '_blank')}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => window.open(doc.document, '_download')}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
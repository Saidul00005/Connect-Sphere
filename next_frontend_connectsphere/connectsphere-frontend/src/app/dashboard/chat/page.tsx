import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { History, Users, UserPlus } from "lucide-react"
import Link from "next/link"

export default function Chat() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 py-12 mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-3">Chat Navigation</h1>
          <p className="text-muted-foreground text-lg">Choose where you want to go</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
          <Link href="chat/chat-history" className="block">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                  <History className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Chat History</CardTitle>
                <CardDescription>View previous chat conversations and messages.</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <span className="text-sm px-4 py-2 bg-secondary text-secondary-foreground rounded-md">
                  View History
                </span>
              </CardContent>
            </Card>
          </Link>

          <Link href="chat/create-chat-room" className="block">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                  <UserPlus className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Create Chatroom</CardTitle>
                <CardDescription>Start direct chat with single employee and group chat with multiple employees.</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <span className="text-sm px-4 py-2 bg-secondary text-secondary-foreground rounded-md">Create Room</span>
              </CardContent>
            </Card>
          </Link>

          <Link href="chat/join-chat-room" className="block">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Join Chatroom</CardTitle>
                <CardDescription>Join in an existing chatroom.</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <span className="text-sm px-4 py-2 bg-secondary text-secondary-foreground rounded-md">Join Room</span>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="text-center mt-12 text-sm text-muted-foreground">
          Need help? Contact support for assistance with chat navigation
        </div>
      </div>
    </div>
  )
}

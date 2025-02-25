"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { io, Socket } from "socket.io-client"
import { useSession } from "next-auth/react"

const SocketContext = createContext<Socket | null>(null)

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const [socket, setSocket] = useState<Socket | null>(null)

  useEffect(() => {
    if (session?.user?.token) {
      const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
        path: "/socket.io",
        transports: ["websocket", "polling"],
        autoConnect: true,
        withCredentials: true,
        reconnectionAttempts: 5,
        auth: { token: session.user.token },
        reconnectionDelay: 1000,
        forceNew: false,
        timeout: 20000
      })

      setSocket(newSocket)

      return () => {
        newSocket.disconnect()
      }
    }
  }, [session?.user?.token])

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => useContext(SocketContext)
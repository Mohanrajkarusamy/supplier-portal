"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/auth/login")
  }, [router])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center space-y-4">
      <div className="flex items-center space-x-2">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="text-lg font-medium text-muted-foreground">Redirecting to Supplier Portal...</span>
      </div>
      <p className="text-sm text-muted-foreground">
        If you are not redirected, <a href="/auth/login" className="text-primary hover:underline">click here</a>.
      </p>
    </div>
  )
}

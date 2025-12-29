"use client"

import { Bell, User } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Header() {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-6 shadow-sm">
      <div className="font-medium text-slate-500">
        Welcome back, <span className="text-foreground font-semibold">User</span>
      </div>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        </Button>
        <div className="flex items-center gap-2">
           <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center">
             <User className="h-4 w-4 text-slate-600" />
           </div>
        </div>
      </div>
    </header>
  )
}

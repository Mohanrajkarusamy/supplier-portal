"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Bell, User, Menu, X, LogOut, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { 
  LayoutDashboard, Users, FileText, Settings, 
  AlertTriangle, Upload, BarChart3, GitPullRequest, IndianRupee 
} from "lucide-react"

export function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const isAdmin = pathname.startsWith("/dashboard/admin")

  const adminLinks = [
    { href: "/dashboard/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/admin/suppliers", label: "Suppliers", icon: Users },
    { href: "/dashboard/admin/approvals", label: "Approvals", icon: Upload },
    { href: "/dashboard/admin/issues", label: "Quality Issues", icon: AlertTriangle },
    { href: "/dashboard/admin/performance", label: "Performance", icon: BarChart3 },
    { href: "/dashboard/admin/performance-logs", label: "Performance Logs", icon: FileText },
    { href: "/dashboard/admin/supplier-logs", label: "Supplier Logs", icon: FileText },
    { href: "/dashboard/admin/upload", label: "Data Upload", icon: Upload },
    { href: "/dashboard/admin/reports", label: "Reports", icon: FileText },
    { href: "/dashboard/admin/debit-notes", label: "Debit Notes", icon: IndianRupee },
    { href: "/dashboard/admin/sorting", label: "Sorting & Rework", icon: GitPullRequest },
    { href: "/dashboard/admin/settings", label: "Settings", icon: Settings },
  ]

  const supplierLinks = [
    { href: "/dashboard/supplier", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/supplier/daily", label: "Daily Performance", icon: BarChart3 },
    { href: "/dashboard/supplier/performance-logs", label: "Admin Performance Logs", icon: FileText },
    { href: "/dashboard/supplier/uploads", label: "Document Uploads", icon: Upload },
    { href: "/dashboard/supplier/reports", label: "My Reports", icon: FileText },
    { href: "/dashboard/supplier/issues", label: "Quality Issues", icon: AlertTriangle },
    { href: "/dashboard/supplier/sorting", label: "Sorting & Rework", icon: GitPullRequest },
    { href: "/dashboard/supplier/profile", label: "Company Profile", icon: Settings },
  ]

  const links = isAdmin ? adminLinks : supplierLinks

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-4 md:px-6 shadow-sm border-slate-200 relative z-30">
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger toggle button */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden text-slate-600 hover:bg-slate-100" 
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
        <div className="flex flex-col">
          <div className="font-semibold text-slate-800 text-sm md:text-md flex items-center">
            <span className="md:hidden font-bold text-primary mr-1">SAKTHI</span>
            <span className="hidden md:inline text-slate-500 text-xs">SAKTHI Partner Hub</span>
          </div>
          <div className="text-slate-500 text-xs md:text-sm font-medium truncate max-w-[200px] md:max-w-none">
            One Platform for Supplier Collaboration and Excellence.
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 md:gap-4">
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

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div className="absolute top-16 left-0 w-full bg-slate-900 text-slate-100 p-6 flex flex-col gap-4 border-b border-slate-800 md:hidden shadow-lg animate-in slide-in-from-top-4 duration-200">
          <div className="flex items-center mb-2">
              <Package className="mr-2 h-5 w-5 text-primary" />
              <span className="font-bold text-white text-sm tracking-wide uppercase">Navigation</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {links.map((link) => {
              const Icon = link.icon
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-slate-800 hover:text-white",
                    isActive ? "bg-primary text-primary-foreground" : "text-slate-400"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              )
            })}
          </div>
          <div className="border-t border-slate-800 pt-4 mt-2">
             <Link
                href="/auth/login"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-slate-800 hover:text-red-300"
              >
                <LogOut className="h-4 w-4" />
                Logout
             </Link>
          </div>
        </div>
      )}
    </header>
  )
}

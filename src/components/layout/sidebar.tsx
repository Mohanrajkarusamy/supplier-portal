"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Users, FileText, Settings, LogOut, ShieldAlert, CheckSquare, BarChart3, Trophy, Upload, AlertTriangle, Package, GitPullRequest, IndianRupee } from "lucide-react"
import { cn } from "@/lib/utils"

export function Sidebar() {
  const pathname = usePathname()
  const isAdmin = pathname.startsWith("/dashboard/admin")

  const adminLinks = [
    { href: "/dashboard/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/admin/suppliers", label: "Suppliers", icon: Users },
    { href: "/dashboard/admin/approvals", label: "Approvals", icon: Upload }, // Upload icon used as generic for now, ideally specific
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
    <div className="hidden border-r bg-slate-900 text-slate-100 md:block md:w-64 border-slate-800">
      <div className="flex h-16 flex-col justify-center border-b border-slate-700 px-6">
        <div className="flex items-center">
            <Package className="mr-2 h-6 w-6 text-primary" />
            <span className="font-bold text-white uppercase tracking-tight">SAKTHI Partner Hub</span>
        </div>
      </div>
      <div className="flex flex-col gap-2 p-4">
        {links.map((link) => {
          const Icon = link.icon
          const isActive = pathname === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-slate-800 hover:text-white",
                isActive ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground" : "text-slate-400"
              )}
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </Link>
          )
        })}
      </div>
      <div className="absolute bottom-4 left-0 w-64 px-4">
         <Link
            href="/auth/login"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-slate-800 hover:text-red-300"
          >
            <LogOut className="h-4 w-4" />
            Logout
         </Link>
      </div>
    </div>
  )
}

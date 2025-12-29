"use client"

import { Users, Upload, AlertTriangle, FileUp, PlusCircle, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MOCK_USERS } from "@/lib/auth"
import { MOCK_DOCUMENTS } from "@/lib/documents"
import { MOCK_ISSUES } from "@/lib/issues"
import { useEffect, useState } from "react"

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
      total: 0,
      preMachining: 0,
      childPart: 0,
      openIssues: 0,
      pendingDocs: 0
  })

  const [activities, setActivities] = useState<{
      supplierName: string
      action: string
      time: string
      status: string
      timestamp: number
  }[]>([])

  useEffect(() => {
      const suppliers = Object.values(MOCK_USERS).filter(u => u.role === "SUPPLIER")
      const openIssues = MOCK_ISSUES.filter(i => i.status === "Open").length
      const pendingDocs = MOCK_DOCUMENTS.filter(d => d.status === "Pending").length

      setStats({
          total: suppliers.length,
          preMachining: suppliers.filter(u => u.companyDetails?.category === "Pre-Machining").length,
          childPart: suppliers.filter(u => u.companyDetails?.category === "Child-Part").length,
          openIssues,
          pendingDocs
      })

      // Aggregate Activities
      const docs = MOCK_DOCUMENTS.map(d => ({
          supplierName: MOCK_USERS[d.supplierId]?.name || "Unknown Supplier",
          action: `Uploaded ${d.type}`,
          time: new Date(d.date).toLocaleDateString(),
          status: d.status,
          timestamp: new Date(d.date).getTime()
      }))

      const issues = MOCK_ISSUES.map(i => ({
          supplierName: i.supplier,
          action: `New Quality Issue: ${i.defect}`,
          time: new Date(i.raisedDate).toLocaleDateString(),
          status: i.status,
          timestamp: new Date(i.raisedDate).getTime()
      }))

      const allActivities = [...docs, ...issues].sort((a, b) => b.timestamp - a.timestamp).slice(0, 10)
      setActivities(allActivities)

  }, [])

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Admin Overview</h2>
        <div className="flex items-center space-x-2">
          <Button>System Report</Button>
        </div>
      </div>
      
      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/dashboard/admin/suppliers">
            <Card className="hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Suppliers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground pt-1">
                  {stats.preMachining} Pre-Machining, {stats.childPart} Child-Part
                </p>
              </CardContent>
            </Card>
        </Link>
        
        <Link href="/dashboard/admin/issues">
            <Card className="hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Open Quality Issues</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.openIssues}</div>
                <p className="text-xs text-muted-foreground pt-1">
                  Requires immediate attention
                </p>
              </CardContent>
            </Card>
        </Link>

        <Link href="/dashboard/admin/approvals">
            <Card className="hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingDocs}</div>
                <p className="text-xs text-muted-foreground pt-1">
                  Documents awaiting review
                </p>
              </CardContent>
            </Card>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/dashboard/admin/performance">
            <Card className="hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer border-dashed h-full">
                <CardContent className="flex flex-col items-center justify-center py-6">
                    <FileUp className="h-8 w-8 mb-2 text-primary" />
                    <h3 className="font-semibold">Upload Daily Report</h3>
                    <p className="text-sm text-muted-foreground text-center">Quality & Delivery Data</p>
                </CardContent>
            </Card>
        </Link>

        {/* Linking 'Raise NCR' to Performance page for now, as that's where complaints are logged */}
        <Link href="/dashboard/admin/performance"> 
            <Card className="hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer border-dashed h-full">
                <CardContent className="flex flex-col items-center justify-center py-6">
                    <AlertTriangle className="h-8 w-8 mb-2 text-red-500" />
                    <h3 className="font-semibold">Raise NCR</h3>
                    <p className="text-sm text-muted-foreground text-center">Create Quality Issue</p>
                </CardContent>
            </Card>
        </Link>

        <Link href="/dashboard/admin/suppliers">
            <Card className="hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer border-dashed h-full">
                <CardContent className="flex flex-col items-center justify-center py-6">
                    <PlusCircle className="h-8 w-8 mb-2 text-green-500" />
                    <h3 className="font-semibold">Add Supplier</h3>
                    <p className="text-sm text-muted-foreground text-center">Register New Vendor</p>
                </CardContent>
            </Card>
        </Link>
        
        <Link href="/dashboard/admin/approvals">
            <Card className="hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer border-dashed h-full">
                <CardContent className="flex flex-col items-center justify-center py-6">
                    <CheckCircle2 className="h-8 w-8 mb-2 text-blue-500" />
                    <h3 className="font-semibold">Approve Docs</h3>
                    <p className="text-sm text-muted-foreground text-center">Review Submitted Docs</p>
                </CardContent>
            </Card>
        </Link>
      </div>

      {/* Recent Activity / List */}
      <Card>
          <CardHeader>
              <CardTitle>Recent Supplier Activity</CardTitle>
              <CardDescription>Latest submissions and updates from vendors.</CardDescription>
          </CardHeader>
          <CardContent>
              <div className="space-y-4">
                  {activities.length > 0 ? (
                      activities.map((item, i) => (
                          <div key={i} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                              <div>
                                  <p className="font-medium">{item.supplierName}</p>
                                  <p className="text-sm text-muted-foreground">{item.action}</p>
                              </div>
                              <div className="text-right">
                                   <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent ${
                                        item.status === "Pending" ? "bg-amber-100 text-amber-800" :
                                        item.status === "Open" ? "bg-red-100 text-red-800" :
                                        item.status === "Approved" ? "bg-green-100 text-green-800" :
                                        "bg-secondary text-secondary-foreground"
                                   }`}>
                                       {item.status}
                                   </span>
                                   <p className="text-xs text-muted-foreground mt-1">{item.time}</p>
                              </div>
                          </div>
                      ))
                  ) : (
                      <div className="text-center text-muted-foreground py-4">No recent activity found.</div>
                  )}
              </div>
          </CardContent>
      </Card>
    </div>
  )
}

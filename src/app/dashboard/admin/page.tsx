"use client"

import { Users, Upload, AlertTriangle, FileUp, PlusCircle, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { getAllUsers } from "@/lib/auth"

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
      totalSuppliers: 0,
      preMachining: 0,
      childPart: 0,
      openIssues: 0,
      pendingApprovals: 0
  })
  
  const [recentActivities, setRecentActivities] = useState<any[]>([])

  useEffect(() => {
    async function fetchData() {
        try {
            // Get Suppliers locally
            const suppliersMap = getAllUsers()
            const users = Object.values(suppliersMap).filter((u: any) => u.role === "SUPPLIER" || !u.role)

            // Try to fetch other data, but don't fail if API is down (demo mode)
            let issues: any[] = []
            let documents: any[] = []

            try {
                const issuesRes = await fetch('/api/issues')
                if (issuesRes.ok) issues = await issuesRes.json()
            } catch (e) { console.warn("Issues API failed, using defaults") }

            try {
                 const docsRes = await fetch('/api/documents')
                 if (docsRes.ok) documents = await docsRes.json()
            } catch (e) { console.warn("Docs API failed, using defaults") }

            setStats({
                totalSuppliers: users.length,
                preMachining: users.filter((s: any) => s.companyDetails?.category === "Pre-Machining" || s.category === "Pre-Machining").length,
                childPart: users.filter((s: any) => s.companyDetails?.category === "Child-Part" || s.category === "Child-Part").length,
                openIssues: Array.isArray(issues) ? issues.filter((i: any) => i.status === "Open").length : 0,
                pendingApprovals: Array.isArray(documents) ? documents.filter((d: any) => d.status === "Pending").length : 0
            })

            // Construct Activities
            const issueActivities = Array.isArray(issues) ? issues.slice(0, 5).map((i: any) => ({
                id: i.id,
                type: "issue",
                action: `Quality Issue: ${i.type}`,
                desc: i.description,
                status: i.status,
                date: i.raisedDate,
                supplierId: i.supplierId
            })) : []
            
            const docActivities = Array.isArray(documents) ? documents.slice(0, 5).map((d: any) => ({
                id: d.id,
                type: "document",
                action: `Uploaded ${d.type}`,
                desc: d.type,
                status: d.status,
                date: d.date,
                supplierId: d.supplierId
            })) : []

            // Merge and sort
            const combined = [...docActivities, ...issueActivities]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 10)

            // Helper to get name
            const activitiesWithNames = combined.map(act => {
                const supp = users.find((u: any) => u.id === act.supplierId)
                return { 
                    ...act, 
                    supplierName: supp ? supp.name : act.supplierId,
                    time: new Date(act.date).toLocaleDateString()
                }
            })

            setRecentActivities(activitiesWithNames)
            
        } catch (e) { console.error("Dashboard Fetch Error", e) }
        setLoading(false)
    }
    fetchData()
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
                <div className="text-2xl font-bold">{stats.totalSuppliers}</div>
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
                <div className="text-2xl font-bold">{stats.pendingApprovals}</div>
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
                  {recentActivities.length > 0 ? (
                      recentActivities.map((item, i) => (
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
                      <div className="text-center text-muted-foreground py-4">
                          {loading ? "Loading..." : "No recent activity found."}
                      </div>
                  )}
              </div>
          </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useEffect, useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
    AlertTriangle, 
    CheckCircle2, 
    TrendingUp, 
    Info, 
    FileText, 
    IndianRupee, 
    Upload, 
    RotateCw, 
    BarChart4 
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
    ResponsiveContainer, 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    Legend, 
    LineChart, 
    Line, 
    PieChart, 
    Pie, 
    Cell,
    ReferenceLine
} from "recharts"

function cleanDefectRemark(remark: string): string {
  if (!remark) return "";
  let cleaned = remark
    .replace(/inventory\s*adjustment/gi, "")
    .replace(/daily\s*performance\s*log/gi, "")
    .replace(/^\s*,\s*|\s*,\s*$/g, "")
    .replace(/\s*,\s*,+/g, ",")
    .trim();
  if (cleaned.startsWith(",")) cleaned = cleaned.slice(1).trim();
  if (cleaned.endsWith(",")) cleaned = cleaned.slice(0, -1).trim();
  return cleaned;
}

export default function SupplierDashboardPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [supplierId, setSupplierId] = useState("")

  // Chart & Performance States
  const [prodLogs, setProdLogs] = useState<any[]>([])
  const [issuesList, setIssuesList] = useState<any[]>([])
  const [supplierProfile, setSupplierProfile] = useState<any>(null)

  // Chart Filters
  const [chartStartDate, setChartStartDate] = useState("")
  const [chartEndDate, setChartEndDate] = useState("")
  const [chartMonthFilter, setChartMonthFilter] = useState(new Date().toISOString().slice(5, 7))
  const [chartPartFilter, setChartPartFilter] = useState("All")
  const [defectPartFilter, setDefectPartFilter] = useState("All")
  const [partWisePartFilter, setPartWisePartFilter] = useState("All")
  const [planActualPartFilter, setPlanActualPartFilter] = useState("All")
  const [rejRatePartFilter, setRejRatePartFilter] = useState("All")

  // For inputs
  const [chartStartDateInput, setChartStartDateInput] = useState("")
  const [chartEndDateInput, setChartEndDateInput] = useState("")
  const [chartMonthInput, setChartMonthInput] = useState(new Date().toISOString().slice(5, 7))
  const [chartPartInput, setChartPartInput] = useState("All")

  useEffect(() => {
      setMounted(true)
      const id = localStorage.getItem("currentUserId") || "SUP001"
      setSupplierId(id)
      fetchDashboardData(id)
      fetchPerformanceLogs(id)
  }, [])

  const fetchDashboardData = async (id: string) => {
      try {
          const res = await fetch(`/api/supplier/dashboard?supplierId=${id}`)
          if (res.ok) {
              const json = await res.json()
              if (json.success) setData(json)
          }
      } catch (err) {
          console.error(err)
      }
      setLoading(false)
  }

  const fetchPerformanceLogs = async (id: string) => {
      try {
          // Fetch production logs for this supplier entered by Admin
          const prodRes = await fetch(`/api/production?supplierId=${id}&enteredBy=Admin`)
          if (prodRes.ok) {
              const logs = await prodRes.json()
              setProdLogs(logs)
          }

          // Fetch issues/NCRs for this supplier
          const issuesRes = await fetch(`/api/issues?supplierId=${id}`)
          if (issuesRes.ok) {
              const issues = await issuesRes.json()
              setIssuesList(issues)
          }

          // Fetch supplier profile for approved parts list
          const profileRes = await fetch(`/api/suppliers?id=${id}`)
          if (profileRes.ok) {
              const profile = await profileRes.json()
              setSupplierProfile(profile)
          }
      } catch (err) {
          console.error("Failed to load chart logs:", err)
      }
  }

  const refreshData = async () => {
      setLoading(true)
      if (supplierId) {
          await fetchDashboardData(supplierId)
          await fetchPerformanceLogs(supplierId)
      }
      setLoading(false)
  }

  // Active Parts List for chart filter dropdown
  const chartPartsList = useMemo(() => {
      return supplierProfile?.companyDetails?.approvedParts || []
  }, [supplierProfile])

  // Filtered Production Logs for charts
  const filteredLogs = useMemo(() => {
      return prodLogs.filter((log: any) => {
          // 1. Month Filter
          if (chartMonthFilter !== "All") {
              const logMonth = log.date.split("-")[1] // YYYY-MM-DD
              if (logMonth !== chartMonthFilter) return false
          }
          // 2. Start Date
          if (chartStartDate) {
              if (new Date(log.date) < new Date(chartStartDate)) return false
          }
          // 3. End Date
          if (chartEndDate) {
              if (new Date(log.date) > new Date(chartEndDate)) return false
          }
          // 4. Part Filter
          if (chartPartFilter !== "All" && chartPartFilter !== "") {
              if (log.partNumber !== chartPartFilter) return false
          }
          return true
      })
  }, [prodLogs, chartMonthFilter, chartStartDate, chartEndDate, chartPartFilter])

  // Filtered Quality NCR Issues
  const filteredIssues = useMemo(() => {
      return issuesList.filter((issue: any) => {
          if (chartPartFilter !== "All" && chartPartFilter !== "") {
              return issue.partNumber === chartPartFilter
          }
          return true
      })
  }, [issuesList, chartPartFilter])

  // Plan vs Actual Chart Data (respects local planActualPartFilter dropdown)
  const planActualChartData = useMemo(() => {
      const logs = prodLogs.filter((log: any) => {
          if (chartMonthFilter !== "All") {
              const logMonth = log.date.split("-")[1]
              if (logMonth !== chartMonthFilter) return false
          }
          if (chartStartDate && new Date(log.date) < new Date(chartStartDate)) return false
          if (chartEndDate && new Date(log.date) > new Date(chartEndDate)) return false
          if (planActualPartFilter !== "All" && log.partNumber !== planActualPartFilter) return false
          return true
      })

      const dailyMap = new Map<string, { date: string; production: number; rejection: number; dispatch: number }>()
      for (const log of logs) {
          const dateStr = log.date
          const existing = dailyMap.get(dateStr) || { date: dateStr, production: 0, rejection: 0, dispatch: 0 }
          existing.production += log.production || 0
          existing.rejection += log.rejection || 0
          existing.dispatch += log.dispatch || 0
          dailyMap.set(dateStr, existing)
      }

      return Array.from(dailyMap.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [prodLogs, chartMonthFilter, chartStartDate, chartEndDate, planActualPartFilter])

  // Quality Rejection Rate & PPM Chart Data (respects local rejRatePartFilter dropdown)
  const rejRateChartData = useMemo(() => {
      const logs = prodLogs.filter((log: any) => {
          if (chartMonthFilter !== "All") {
              const logMonth = log.date.split("-")[1]
              if (logMonth !== chartMonthFilter) return false
          }
          if (chartStartDate && new Date(log.date) < new Date(chartStartDate)) return false
          if (chartEndDate && new Date(log.date) > new Date(chartEndDate)) return false
          if (rejRatePartFilter !== "All" && log.partNumber !== rejRatePartFilter) return false
          return true
      })

      const dailyMap = new Map<string, { date: string; production: number; rejection: number; dispatch: number }>()
      for (const log of logs) {
          const dateStr = log.date
          const existing = dailyMap.get(dateStr) || { date: dateStr, production: 0, rejection: 0, dispatch: 0 }
          existing.production += log.production || 0
          existing.rejection += log.rejection || 0
          existing.dispatch += log.dispatch || 0
          dailyMap.set(dateStr, existing)
      }

      return Array.from(dailyMap.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(item => {
          const baseQty = item.dispatch > 0 ? item.dispatch : (item.production > 0 ? item.production : 0)
          const rej = item.rejection || 0
          const rate = baseQty > 0 ? (rej / baseQty) * 100 : 0
          const ppmValue = baseQty > 0 ? Math.round((rej / baseQty) * 1000000) : 0

          return {
              ...item,
              rejectionRate: Math.round(rate * 100) / 100,
              ppm: ppmValue
          }
      })
  }, [prodLogs, chartMonthFilter, chartStartDate, chartEndDate, rejRatePartFilter])

  // Dynamic Constant Plan Target Value
  const constantPlanValue = useMemo(() => {
      if (planActualPartFilter !== "All" && planActualPartFilter !== "") {
          const partInfo = chartPartsList.find((x: any) => x.partNumber === planActualPartFilter)
          if (partInfo && partInfo.monthlyRequirement) {
              return partInfo.monthlyRequirement / 25
          }
      } else if (chartPartsList.length > 0) {
          const totalMonthly = chartPartsList.reduce((acc: number, curr: any) => acc + (curr.monthlyRequirement || 0), 0)
          return totalMonthly / 25
      }
      return 0
  }, [chartPartsList, planActualPartFilter])

  // Part Rejection Table / Defect details compiler
  const partRejectionTableData = useMemo(() => {
      const partDataMap = new Map<string, { partNumber: string; partName: string; rejectionQty: number; defects: string[] }>()
      let totalRejections = 0

      // 1. Group rejections from logs
      for (const log of filteredLogs) {
          const rej = log.rejection || 0
          if (rej <= 0) continue

          totalRejections += rej

          const existing = partDataMap.get(log.partNumber) || {
              partNumber: log.partNumber,
              partName: "",
              rejectionQty: 0,
              defects: [] as string[]
          }

          if (!existing.partName) {
              const p = chartPartsList.find((x: any) => x.partNumber === log.partNumber)
              existing.partName = p ? p.name : log.partNumber
          }

          existing.rejectionQty += rej

          if (log.remarks && log.remarks.trim() !== "") {
              const cleaned = cleanDefectRemark(log.remarks);
              if (cleaned !== "") {
                  if (!existing.defects.includes(cleaned)) {
                      existing.defects.push(cleaned)
                  }
              }
          }

          partDataMap.set(log.partNumber, existing)
      }

      // 2. Append defect reasons from NCR Issues
      for (const issue of filteredIssues) {
          const partNo = issue.partNumber
          if (!partNo) continue

          const existing = partDataMap.get(partNo) || {
              partNumber: partNo,
              partName: "",
              rejectionQty: 0,
              defects: [] as string[]
          }

          if (!existing.partName) {
              const p = chartPartsList.find((x: any) => x.partNumber === partNo)
              existing.partName = p ? p.name : partNo
          }

          const defectDesc = issue.description || issue.defect
          if (defectDesc && defectDesc.trim() !== "") {
              const cleaned = cleanDefectRemark(defectDesc);
              if (cleaned !== "") {
                  if (!existing.defects.includes(cleaned)) {
                      existing.defects.push(cleaned)
                  }
              }
          }

          partDataMap.set(partNo, existing)
      }

      return Array.from(partDataMap.values()).map(item => {
          const pct = totalRejections > 0 ? (item.rejectionQty / totalRejections) * 100 : 0

          let finalDefects = [...item.defects]
          if (finalDefects.length === 0) {
              if (item.partName.toLowerCase().includes("drum") || item.partNumber === "51") {
                  finalDefects = ["Blowhole", "Pin Hole"]
              } else if (item.partName.toLowerCase().includes("disc") || item.partNumber === "52") {
                  finalDefects = ["Thickness Variation", "Hardness High"]
              }
          }

          return {
              ...item,
              defects: finalDefects,
              percentage: Math.round(pct * 10) / 10
          }
      })
  }, [filteredLogs, chartPartsList, filteredIssues])

  // Part Rejection Pie Chart data list
  const pieChartData = useMemo(() => {
      const partRejectionMap = new Map<string, number>()
      for (const log of filteredLogs) {
          const rej = log.rejection || 0
          if (rej > 0) {
              const current = partRejectionMap.get(log.partNumber) || 0
              partRejectionMap.set(log.partNumber, current + rej)
          }
      }

      return Array.from(partRejectionMap.entries()).map(([partNo, rejQty]) => {
          const p = chartPartsList.find((x: any) => x.partNumber === partNo)
          const name = p ? p.name : partNo
          return { name, value: rejQty, partNumber: partNo }
      }).filter(item => item.value > 0 && (partWisePartFilter === "All" || item.partNumber === partWisePartFilter))
  }, [filteredLogs, chartPartsList, partWisePartFilter])

  // Defect Rejection Pie Chart data list
  const defectPieChartData = useMemo(() => {
      const defectMap = new Map<string, number>()

      for (const item of partRejectionTableData) {
          if (defectPartFilter !== "All" && item.partNumber !== defectPartFilter) {
              continue
          }

          const qty = item.rejectionQty || 0
          if (qty <= 0) continue

          const defs = item.defects || []
          if (defs.length === 0) {
              const current = defectMap.get("Other/Unspecified") || 0
              defectMap.set("Other/Unspecified", current + qty)
          } else {
              const qtyPerDefect = qty / defs.length
              for (const d of defs) {
                  const current = defectMap.get(d) || 0
                  defectMap.set(d, current + qtyPerDefect)
              }
          }
      }

      return Array.from(defectMap.entries()).map(([defectName, value]) => ({
          name: defectName,
          value: Math.round(value * 10) / 10
      })).filter(item => item.value > 0)
  }, [partRejectionTableData, defectPartFilter])

  // Defect Parts Options for Card 4 Dropdown
  const defectPartsOptions = useMemo(() => {
      return partRejectionTableData.map(item => ({
          partNumber: item.partNumber,
          partName: item.partName
      }))
  }, [partRejectionTableData])

  // Custom tooltip for Part-wise Pie Chart to render defects
  const CustomPieTooltip = ({ active, payload }: any) => {
      if (active && payload && payload.length) {
          const data = payload[0].payload;
          const tableItem = partRejectionTableData.find(x => x.partNumber === data.partNumber || x.partName === data.name)
          const defectList = tableItem ? tableItem.defects : []

          return (
              <div className="bg-white p-3 border rounded shadow-md text-xs">
                  <p className="font-bold text-slate-800">{data.name}</p>
                  <p className="text-red-600 font-semibold mt-1">Rejections: {data.value} Units</p>
                  {defectList.length > 0 ? (
                      <div className="mt-2 pt-2 border-t border-slate-100">
                          <p className="font-bold text-[10px] text-slate-500 uppercase tracking-wider">Defect Reasons:</p>
                          <ul className="list-disc list-inside text-slate-600 mt-1 space-y-0.5">
                              {defectList.map((def: string, i: number) => (
                                  <li key={i}>{def}</li>
                              ))}
                          </ul>
                      </div>
                  ) : (
                      <p className="text-slate-400 italic mt-1">No defect reason logged</p>
                  )}
              </div>
          )
      }
      return null
  }

  if (loading) return <div className="flex items-center justify-center min-h-[400px]">Loading Dashboard...</div>
  if (!data) return <div className="p-8 text-center text-red-500 font-medium">Failed to load dashboard data. Check API connection.</div>

  const inv = data.inventory || { currentStock: 0, safetyStockLevel: 0, pendingRequirement: 0, openingStock: 0, productionToday: 0, dispatchToday: 0, rejectionToday: 0, monthlyProduction: 0, monthlyDispatch: 0, monthlyRejection: 0, parts: [] };

  const currentStockVal = inv.currentStock || 0;
  let stockColor = "text-green-600";
  let stockBadgeVariant = "bg-green-600 hover:bg-green-700 text-white border-0 px-3 py-1";
  let stockLabel = "Green (Normal)";
  if (currentStockVal < 100) {
      stockColor = "text-red-600 font-bold animate-pulse";
      stockBadgeVariant = "bg-red-600 hover:bg-red-700 text-white border-0 px-3 py-1 animate-pulse";
      stockLabel = "Red (Critical Shortage)";
  } else if (currentStockVal < 500) {
      stockColor = "text-amber-600";
      stockBadgeVariant = "bg-amber-600 hover:bg-amber-700 text-white border-0 px-3 py-1";
      stockLabel = "Orange (Low Stock)";
  }

  const kpis = [
      { 
          title: "Current Inventory Stock", 
          value: currentStockVal, 
          icon: FileText, 
          color: stockColor,
          desc: `Safety Target: ≥ ${inv.safetyStockLevel || 0}`
      },
      { 
          title: "Pending Monthly Requirement", 
          value: inv.pendingRequirement || 0, 
          icon: TrendingUp, 
          color: (inv.pendingRequirement > 0) ? "text-amber-600" : "text-green-600",
          desc: "To be produced this month"
      },
      { 
          title: "Current PPM", 
          value: data.currentPPM ?? 0, 
          icon: AlertTriangle, 
          color: (data.currentPPM > 2000) ? "text-red-600" : "text-green-600",
          desc: "Target: ≤ 2000"
      },
      { 
          title: "Open Quality Concerns", 
          value: data.openIssues ?? 0, 
          icon: AlertTriangle, 
          color: (data.openIssues > 0) ? "text-red-600" : "text-slate-600",
          desc: "Requiring RC-CA"
      }
  ]

  return (
    <div className="flex-1 space-y-6 p-1">
      <div className="flex items-center justify-between">
        <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-800">SAKTHI Partner Hub</h2>
            <p className="text-slate-500">Supplier Production & Inventory Monitoring Portal.</p>
        </div>
        <div className="flex flex-col items-end gap-1">
            <Badge className={stockBadgeVariant}>
                Stock Status: {stockLabel}
            </Badge>
            {supplierProfile?.name && (
                <span className="text-xs font-bold text-slate-700">{supplierProfile.name}</span>
            )}
            <span className="text-xs font-mono text-slate-400">ID: {supplierId}</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, idx) => (
            <Card key={idx} className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                    <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{kpi.value.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground mt-1">{kpi.desc}</p>
                </CardContent>
            </Card>
        ))}
      </div>

      {/* Monthly Performance Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
            <CardHeader>
                <CardTitle>Assigned Component Requirements</CardTitle>
                <CardDescription>Master list of approved parts, lines, and targets.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="border rounded-md overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b">
                            <tr>
                                <th className="p-3 text-left font-medium text-slate-500">Part No / Description</th>
                                <th className="p-3 text-left font-medium text-slate-500">Line</th>
                                <th className="p-3 text-right font-medium text-slate-500">Monthly Req.</th>
                                <th className="p-3 text-right font-medium text-slate-500 text-amber-700">Pending Qty</th>
                                <th className="p-3 text-right font-medium text-slate-500">Safety Stock</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {inv.parts && inv.parts.length > 0 ? (
                                inv.parts.map((part: any, i: number) => {
                                    const partNum = (part.partNumber || "").trim()
                                    const currentMonthStr = new Date().toISOString().slice(0, 7) // e.g. "2026-07"
                                    const totalDispatch = prodLogs
                                        .filter((log: any) => (log.partNumber || "").trim() === partNum && log.date.startsWith(currentMonthStr))
                                        .reduce((sum: number, log: any) => sum + (log.dispatch || 0), 0)
                                    const pendingQty = Math.max(0, (part.monthlyRequirement || 0) - totalDispatch)

                                    return (
                                        <tr key={i} className="hover:bg-slate-50/50">
                                            <td className="p-3">
                                                <span className="font-bold">{part.partNumber}</span>
                                                <div className="text-xs text-slate-400">{part.name}</div>
                                            </td>
                                            <td className="p-3 font-mono">{part.productionLine || "Line-1"}</td>
                                            <td className="p-3 text-right">{part.monthlyRequirement?.toLocaleString() || 0}</td>
                                            <td className="p-3 text-right font-semibold font-mono text-amber-700">{pendingQty.toLocaleString()}</td>
                                            <td className="p-3 text-right text-slate-600">{part.safetyStockLevel?.toLocaleString() || 0}</td>
                                        </tr>
                                    )
                                })
                            ) : (
                                <tr>
                                    <td colSpan={5} className="p-6 text-center text-slate-400 italic">No parts assigned. Contact admin.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Monthly Summary (Current Month)</CardTitle>
                <CardDescription>Monthly aggregated inventory transactions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-2 text-sm">
                <div className="flex justify-between border-b pb-2">
                    <span className="text-slate-500">Opening Stock</span>
                    <span className="font-bold font-mono">{inv.openingStock?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between border-b pb-2 text-green-600">
                    <span>(+) Total Production</span>
                    <span className="font-bold font-mono">+{inv.monthlyProduction?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between border-b pb-2 text-red-500">
                    <span>(-) Total Rejection</span>
                    <span className="font-bold font-mono">-{inv.monthlyRejection?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between border-b pb-2 text-amber-600">
                    <span>(-) Total Dispatch</span>
                    <span className="font-bold font-mono">-{inv.monthlyDispatch?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between pt-2 text-slate-900 font-bold text-md">
                    <span>(=) Closing Stock</span>
                    <span className="font-mono">{currentStockVal?.toLocaleString()}</span>
                </div>
            </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
            <CardHeader>
                <CardTitle>Partner Quick Actions</CardTitle>
                <CardDescription>Essential tasks and submissions for Sakthi Auto.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 pt-4">
                <Button variant="outline" className="justify-start border-slate-200 hover:border-primary hover:text-primary transition-colors" asChild>
                    <a href="/dashboard/supplier/daily">
                        <FileText className="mr-3 h-4 w-4" /> View & Add Daily Performance Log
                    </a>
                </Button>
                <Button variant="outline" className="justify-start border-slate-200 hover:border-primary hover:text-primary transition-colors" asChild>
                    <a href="/dashboard/supplier/debit-notes">
                        <IndianRupee className="mr-3 h-4 w-4" /> View Debit Notes Statement
                    </a>
                </Button>
                <Button variant="outline" className="justify-start border-slate-200 hover:border-primary hover:text-primary transition-colors" asChild>
                    <a href="/dashboard/supplier/uploads">
                        <Upload className="mr-3 h-4 w-4" /> Upload APQP / PPAP Documents
                    </a>
                </Button>
                <Button variant="outline" className="justify-start border-slate-200 hover:border-primary hover:text-primary transition-colors" asChild>
                    <a href="/dashboard/supplier/issues">
                        <AlertTriangle className="mr-3 h-4 w-4" /> Root Cause / Corrective Action (RC-CA)
                    </a>
                </Button>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>System & Compliance Alerts</CardTitle>
                <CardDescription>Critical updates regarding your performance.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
                <div className="space-y-4">
                    {currentStockVal < 100 && (
                        <div className="flex items-start gap-4 p-3 bg-red-50 border border-red-100 rounded-lg">
                            <div className="p-2 bg-red-100 rounded-full">
                                <AlertTriangle className="h-4 w-4 text-red-600" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-red-900">Critical Stock alert (Red)</p>
                                <p className="text-xs text-red-700">Your current stock level is <b>{currentStockVal}</b> (below 100). SQA and Management have been alerted. Please log production and dispatch actions immediately.</p>
                            </div>
                        </div>
                    )}
                    {currentStockVal >= 100 && currentStockVal < 500 && (
                        <div className="flex items-start gap-4 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                            <div className="p-2 bg-amber-100 rounded-full">
                                <AlertTriangle className="h-4 w-4 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-amber-900">Low Stock Alert (Orange)</p>
                                <p className="text-xs text-amber-700">Your current stock level is <b>{currentStockVal}</b> (below 500). Please ensure production targets are achieved to meet the monthly requirements.</p>
                            </div>
                        </div>
                    )}
                    {data.openIssues > 0 && (
                        <div className="flex items-start gap-4 p-3 bg-red-50 border border-red-100 rounded-lg">
                            <div className="p-2 bg-red-100 rounded-full">
                                <AlertTriangle className="h-4 w-4 text-red-600" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-red-900">Immediate Action Required</p>
                                <p className="text-xs text-red-700">You have <b>{data.openIssues}</b> open quality concern(s). Please submit RC-CA within 24 hours.</p>
                            </div>
                        </div>
                    )}
                    {data.pendingDebitNotes > 0 && (
                        <div className="flex items-start gap-4 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                             <div className="p-2 bg-amber-100 rounded-full">
                                <IndianRupee className="h-4 w-4 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-amber-900">Rejection Cost Recovery</p>
                                <p className="text-xs text-amber-700"><b>{data.pendingDebitNotes}</b> pending debit note(s) issued. Please review and acknowledge.</p>
                            </div>
                        </div>
                    )}
                    {(!data.openIssues && !data.pendingDebitNotes && currentStockVal >= 500) && (
                        <div className="flex items-start gap-4 p-3 bg-green-50 border border-green-100 rounded-lg">
                             <div className="p-2 bg-green-100 rounded-full">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-green-900">Compliance Status: Clear</p>
                                <p className="text-xs text-green-700">All quality concerns are closed, no pending debit notes found, and stock level is normal.</p>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
      </div>

      {/* Supplier Performance & Analytics Charts */}
      <Card className="shadow-sm border bg-white mt-6">
          <CardHeader className="border-b pb-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                  <CardTitle className="text-lg font-bold text-slate-800">Performance & Analytics</CardTitle>
                  <CardDescription>Visualize production targets, quality rejections, and defect analysis.</CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                  <div className="grid gap-1">
                      <Label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Month</Label>
                      <Select value={chartMonthFilter} onValueChange={(val) => { setChartMonthFilter(val); setChartMonthInput(val); }}>
                          <SelectTrigger className="h-8 text-xs bg-white"><SelectValue /></SelectTrigger>
                          <SelectContent>
                              <SelectItem value="01">January</SelectItem>
                              <SelectItem value="02">February</SelectItem>
                              <SelectItem value="03">March</SelectItem>
                              <SelectItem value="04">April</SelectItem>
                              <SelectItem value="05">May</SelectItem>
                              <SelectItem value="06">June</SelectItem>
                              <SelectItem value="07">July</SelectItem>
                              <SelectItem value="08">August</SelectItem>
                              <SelectItem value="09">September</SelectItem>
                              <SelectItem value="10">October</SelectItem>
                              <SelectItem value="11">November</SelectItem>
                              <SelectItem value="12">December</SelectItem>
                          </SelectContent>
                      </Select>
                  </div>
                  <div className="grid gap-1">
                      <Label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Start Date</Label>
                      <Input type="date" value={chartStartDate} onChange={(e) => { setChartStartDate(e.target.value); setChartStartDateInput(e.target.value); }} className="h-8 text-xs bg-white py-1"/>
                  </div>
                  <div className="grid gap-1">
                      <Label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">End Date</Label>
                      <Input type="date" value={chartEndDate} onChange={(e) => { setChartEndDate(e.target.value); setChartEndDateInput(e.target.value); }} className="h-8 text-xs bg-white py-1"/>
                  </div>
                  <div className="grid gap-1">
                      <Label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Part Number</Label>
                      <Select value={chartPartFilter} onValueChange={(val) => { setChartPartFilter(val); setChartPartInput(val); }}>
                          <SelectTrigger className="h-8 text-xs bg-white"><SelectValue placeholder="All Parts" /></SelectTrigger>
                          <SelectContent>
                              <SelectItem value="All">All Parts</SelectItem>
                              {chartPartsList.map((p: any, idx: number) => (
                                  <SelectItem key={idx} value={p.partNumber}>{p.name} ({p.partNumber})</SelectItem>
                              ))}
                          </SelectContent>
                      </Select>
                  </div>
                  <div className="grid gap-1 mt-auto">
                      <Button onClick={refreshData} size="sm" className="h-8 bg-slate-800 hover:bg-slate-700 text-white font-semibold flex items-center justify-center gap-1.5">
                          <RotateCw className="h-3 w-3" /> Refresh
                      </Button>
                  </div>
              </div>
          </CardHeader>
          <CardContent className="space-y-8 pt-6">
              {mounted && planActualChartData.length > 0 ? (
                  <>
                      <div className="grid gap-6 md:grid-cols-2">
                           {/* Chart 1: Approved Part-wise Rejection Details Pie Chart */}
                           <Card className="p-4 shadow-sm border bg-white flex flex-col justify-between">
                               <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                                   <CardTitle className="text-sm font-bold text-slate-700">Part-wise Rejection Details (%)</CardTitle>
                                   <div className="w-[150px]">
                                       <Select value={partWisePartFilter} onValueChange={setPartWisePartFilter}>
                                           <SelectTrigger className="h-7 text-[11px] bg-white"><SelectValue placeholder="All Parts" /></SelectTrigger>
                                           <SelectContent>
                                               <SelectItem value="All">All Parts</SelectItem>
                                               {chartPartsList.map((p: any, idx: number) => (
                                                   <SelectItem key={idx} value={p.partNumber} className="text-[11px]">{p.name}</SelectItem>
                                               ))}
                                           </SelectContent>
                                       </Select>
                                   </div>
                               </CardHeader>
                               <CardContent className="h-[250px] pt-4 flex items-center justify-center">
                                   {pieChartData.length > 0 ? (
                                       <ResponsiveContainer width="100%" height="100%">
                                           <PieChart>
                                               <Pie
                                                   data={pieChartData}
                                                   cx="50%"
                                                   cy="50%"
                                                   label={({ name, percent }) => `${name}: ${(percent ? percent * 100 : 0).toFixed(0)}%`}
                                                   outerRadius={80}
                                                   fill="#8884d8"
                                                   dataKey="value"
                                               >
                                                   {pieChartData.map((entry: any, index: number) => {
                                                       const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899']
                                                       return <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                   })}
                                               </Pie>
                                               <Tooltip content={<CustomPieTooltip />} />
                                           </PieChart>
                                       </ResponsiveContainer>
                                   ) : (
                                       <p className="text-sm text-slate-400 italic">No quality rejections logged for the selected period.</p>
                                   )}
                               </CardContent>
                           </Card>

                           {/* Chart 2: Plan vs Actual Production */}
                           <Card className="p-4 shadow-sm border bg-white">
                               <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                                   <CardTitle className="text-sm font-bold text-slate-700">Plan vs Actual Production</CardTitle>
                                   <div className="w-[150px]">
                                       <Select value={planActualPartFilter} onValueChange={setPlanActualPartFilter}>
                                           <SelectTrigger className="h-7 text-[11px] bg-white"><SelectValue placeholder="All Parts" /></SelectTrigger>
                                           <SelectContent>
                                               <SelectItem value="All">All Parts</SelectItem>
                                               {chartPartsList.map((p: any, idx: number) => (
                                                   <SelectItem key={idx} value={p.partNumber} className="text-[11px]">{p.name}</SelectItem>
                                               ))}
                                           </SelectContent>
                                       </Select>
                                   </div>
                               </CardHeader>
                               <CardContent className="h-[250px] pt-4">
                                   <ResponsiveContainer width="100%" height="100%">
                                       <BarChart data={planActualChartData}>
                                           <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                           <XAxis dataKey="date" tick={{fontSize: 10}} />
                                           <YAxis tick={{fontSize: 10}} />
                                           <Tooltip />
                                           <Legend wrapperStyle={{fontSize: 10}} />
                                           <Bar dataKey="dispatch" fill="#10b981" name="Actual Production Qty" />
                                           {constantPlanValue > 0 && (
                                               <ReferenceLine 
                                                   y={constantPlanValue} 
                                                   stroke="#6366f1" 
                                                   strokeWidth={2}
                                                   strokeDasharray="4 4" 
                                                   label={{ value: `Plan target: ${Math.round(constantPlanValue)} Qty`, fill: '#6366f1', fontSize: 10, position: 'top', fontWeight: 'bold' }} 
                                               />
                                           )}
                                       </BarChart>
                                   </ResponsiveContainer>
                               </CardContent>
                           </Card>
                       </div>

                       <div className="grid gap-6 md:grid-cols-2">
                           {/* Chart 3: Quality Rejection Rate (%) & PPM */}
                           <Card className="p-4 shadow-sm border bg-white">
                               <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                                   <CardTitle className="text-sm font-bold text-slate-700">Quality Rejection Rate (%) & PPM</CardTitle>
                                   <div className="w-[150px]">
                                       <Select value={rejRatePartFilter} onValueChange={setRejRatePartFilter}>
                                           <SelectTrigger className="h-7 text-[11px] bg-white"><SelectValue placeholder="All Parts" /></SelectTrigger>
                                           <SelectContent>
                                               <SelectItem value="All">All Parts</SelectItem>
                                               {chartPartsList.map((p: any, idx: number) => (
                                                   <SelectItem key={idx} value={p.partNumber} className="text-[11px]">{p.name}</SelectItem>
                                               ))}
                                           </SelectContent>
                                       </Select>
                                   </div>
                               </CardHeader>
                               <CardContent className="h-[250px] pt-4">
                                   <ResponsiveContainer width="100%" height="100%">
                                       <LineChart data={rejRateChartData}>
                                           <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                           <XAxis dataKey="date" tick={{fontSize: 10}} />
                                           <YAxis yAxisId="left" tick={{fontSize: 10}} label={{ value: '%', angle: -90, position: 'insideLeft' }} />
                                           <YAxis yAxisId="right" orientation="right" tick={{fontSize: 10}} label={{ value: 'PPM', angle: 90, position: 'insideRight' }} />
                                           <Tooltip />
                                           <Legend wrapperStyle={{fontSize: 10}} />
                                           <Line yAxisId="left" type="monotone" dataKey="rejectionRate" stroke="#ef4444" strokeWidth={2} name="Rejection Rate %" activeDot={{ r: 6 }} />
                                           <Line yAxisId="right" type="monotone" dataKey="ppm" stroke="#f59e0b" strokeWidth={2} name="PPM Rate" />
                                       </LineChart>
                                   </ResponsiveContainer>
                               </CardContent>
                           </Card>

                          {/* Chart 4: Defect-wise Rejection Details Pie Chart */}
                          <Card className="p-4 shadow-sm border bg-white flex flex-col justify-between">
                              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                                  <div>
                                      <CardTitle className="text-sm font-bold text-slate-700">Defect-wise Rejection Details (%)</CardTitle>
                                  </div>
                                  <div className="w-[150px]">
                                      <Select value={defectPartFilter} onValueChange={setDefectPartFilter}>
                                          <SelectTrigger className="h-7 text-[11px] bg-white"><SelectValue placeholder="All Parts" /></SelectTrigger>
                                          <SelectContent>
                                              <SelectItem value="All">All Parts</SelectItem>
                                              {defectPartsOptions.map((opt: any, idx: number) => (
                                                  <SelectItem key={idx} value={opt.partNumber} className="text-[11px]">
                                                      {opt.partName}
                                                  </SelectItem>
                                              ))}
                                          </SelectContent>
                                      </Select>
                                  </div>
                              </CardHeader>
                              <CardContent className="h-[250px] pt-4 flex items-center justify-center">
                                  {defectPieChartData.length > 0 ? (
                                      <ResponsiveContainer width="100%" height="100%">
                                          <PieChart>
                                              <Pie
                                                  data={defectPieChartData}
                                                  cx="50%"
                                                  cy="50%"
                                                  label={({ name, percent }) => `${name}: ${(percent ? percent * 100 : 0).toFixed(0)}%`}
                                                  outerRadius={75}
                                                  fill="#8884d8"
                                                  dataKey="value"
                                              >
                                                  {defectPieChartData.map((entry: any, index: number) => {
                                                      const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899']
                                                      return <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                  })}
                                              </Pie>
                                              <Tooltip formatter={(value) => [`${value} Units Estimated`, 'Defect Qty']} />
                                          </PieChart>
                                      </ResponsiveContainer>
                                  ) : (
                                      <p className="text-sm text-slate-400 italic">No quality rejections logged for the selected period.</p>
                                  )}
                              </CardContent>
                          </Card>
                      </div>
                  </>
              ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-400 italic">
                      <BarChart4 className="h-10 w-10 text-slate-300 mb-2"/>
                      {loading ? "Loading chart visualization..." : "No production performance records found for the filtered period."}
                  </div>
              )}
          </CardContent>
      </Card>
    </div>
  )
}

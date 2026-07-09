"use client"

import { useState, useEffect, useMemo } from "react"
import { FileText, Search, Calendar, Filter, Download, Activity, AlertTriangle, ArrowDownToLine } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts"

export default function SupplierPerformanceLogsPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [supplierId, setSupplierId] = useState("")
  const [supplierProfile, setSupplierProfile] = useState<any | null>(null)

  // Filters
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)) // YYYY-MM
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const id = localStorage.getItem("currentUserId") || "SUP001"
    setSupplierId(id)
    fetchAdminLogs(id)
    fetchSupplierProfile(id)
  }, [selectedMonth])

  const fetchSupplierProfile = async (id: string) => {
    try {
      const res = await fetch('/api/suppliers')
      if (res.ok) {
        const data = await res.json()
        const profile = data.find((u: any) => u.id === id)
        setSupplierProfile(profile)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const fetchAdminLogs = async (id: string) => {
    setLoading(true)
    try {
      // Query admin logs for this supplier
      const res = await fetch(`/api/production?supplierId=${id}&enteredBy=Admin`)
      if (res.ok) {
        const data = await res.json()
        const filtered = data.filter((log: any) => log.date.startsWith(selectedMonth))
        setLogs(filtered)
      }
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const pNo = (log.partNumber || "").toLowerCase()
      const query = searchQuery.toLowerCase()
      return pNo.includes(query)
    })
  }, [logs, searchQuery])

  const summary = useMemo(() => {
    const totalEntries = filteredLogs.length
    const totalReceived = filteredLogs.reduce((sum, l) => sum + (l.dispatch || 0), 0)
    const totalRejection = filteredLogs.reduce((sum, l) => sum + (l.rejection || 0), 0)
    return { totalEntries, totalReceived, totalRejection }
  }, [filteredLogs])

  const chartData = useMemo(() => {
    const groupedMap = new Map<string, { date: string; plannedQty: number; production: number; rejection: number; dispatch: number }>()
    for (const log of filteredLogs) {
      const dateStr = log.date
      const existing = groupedMap.get(dateStr) || {
        date: dateStr,
        plannedQty: 0,
        production: 0,
        rejection: 0,
        dispatch: 0
      }
      
      const part = supplierProfile?.companyDetails?.approvedParts?.find((p: any) => p.partNumber === log.partNumber)
      const dailyTarget = part ? ((part.monthlyRequirement || 0) / 25) : (log.plannedQty || 0)
      
      existing.plannedQty += dailyTarget
      existing.production += (log.production || 0)
      existing.rejection += (log.rejection || 0)
      existing.dispatch += (log.dispatch || 0)
      groupedMap.set(dateStr, existing)
    }
    return Array.from(groupedMap.values()).sort((a, b) => a.date.localeCompare(b.date))
  }, [filteredLogs, supplierProfile])

  const handleExport = () => {
    alert(`Exporting performance logs for ${selectedMonth}...`)
  }

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between">
        <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-800">Admin Performance Logs</h2>
            <p className="text-slate-500">Track and review daily received loads, rejections, and SQA records entered by Sakthi administrators.</p>
        </div>
        <Button onClick={handleExport} className="bg-primary hover:bg-orange-600 text-white">
            <Download className="mr-2 h-4 w-4" /> Export logs
        </Button>
      </div>

      {/* Filters bar */}
      <Card className="bg-slate-50 border-slate-200">
          <CardContent className="pt-6">
              <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">Analysis Month</label>
                      <input 
                        type="month" 
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                  </div>
                  <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">Search Part No / Name</label>
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                        <Input 
                          placeholder="Search..." 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-8 bg-white border-slate-300"
                        />
                      </div>
                  </div>
                  <div className="flex items-end">
                      <Button variant="outline" className="w-full border-slate-300 h-10" onClick={() => fetchAdminLogs(supplierId)}>
                          <Activity className="mr-2 h-4 w-4" /> Refresh Logs List
                      </Button>
                  </div>
              </div>
          </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
          <Card className="shadow-sm border-l-4 border-l-blue-500">
              <CardContent className="pt-4">
                  <p className="text-xs font-medium text-slate-500 uppercase">Total SQA Entries</p>
                  <div className="text-xl font-bold flex items-center justify-between mt-1">
                      {summary.totalEntries} Entries
                      <FileText className="h-5 w-5 text-blue-500 opacity-50" />
                  </div>
              </CardContent>
          </Card>
          <Card className="shadow-sm border-l-4 border-l-green-500">
              <CardContent className="pt-4">
                  <p className="text-xs font-medium text-slate-500 uppercase">Total Load Received</p>
                  <div className="text-xl font-bold flex items-center justify-between text-green-600 mt-1">
                      {summary.totalReceived.toLocaleString()} Qty
                      <ArrowDownToLine className="h-5 w-5 text-green-500 opacity-50" />
                  </div>
              </CardContent>
          </Card>
          <Card className="shadow-sm border-l-4 border-l-red-500">
              <CardContent className="pt-4">
                  <p className="text-xs font-medium text-slate-500 uppercase">Total SQA Rejections</p>
                  <div className="text-xl font-bold flex items-center justify-between text-red-600 mt-1">
                      {summary.totalRejection.toLocaleString()} Qty
                      <AlertTriangle className="h-5 w-5 text-red-500 opacity-50" />
                  </div>
              </CardContent>
          </Card>
      </div>

      {/* Daily Trend Chart */}
      <Card className="shadow-md">
          <CardHeader className="bg-slate-50/50 pb-2">
              <CardTitle className="text-lg flex items-center">
                  <Activity className="mr-2 h-5 w-5 text-slate-400" /> Daily Trend Chart
              </CardTitle>
              <CardDescription>Visual trend of received loads and registered SQA rejections.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 h-[300px] flex items-center justify-center">
              {filteredLogs.length === 0 ? (
                  <div className="text-slate-400 italic text-sm">No daily performance data logged for the selected criteria.</div>
              ) : (
                  <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                          <YAxis stroke="#94a3b8" fontSize={12} />
                          <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                          <Legend />
                          <Line type="monotone" dataKey="plannedQty" name="Target (Planned Qty)" stroke="#f59e0b" strokeWidth={2.5} strokeDasharray="5 5" />
                          <Bar dataKey="dispatch" name="Load Received (Actual)" fill="#3b82f6" barSize={16} radius={[4, 4, 0, 0]} />
                          <Bar dataKey="rejection" name="SQA Rejections" fill="#ef4444" barSize={12} radius={[4, 4, 0, 0]} />
                      </ComposedChart>
                  </ResponsiveContainer>
              )}
          </CardContent>
      </Card>

      {/* Ledger card */}
      <Card className="shadow-md">
          <CardHeader className="bg-slate-50/50">
              <CardTitle className="text-lg flex items-center">
                  <FileText className="mr-2 h-5 w-5 text-slate-400" /> SQA Daily Entry Ledger
              </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
               <Table>
                  <TableHeader>
                      <TableRow className="bg-slate-100/50">
                          <TableHead>Date</TableHead>
                          <TableHead>Part No</TableHead>
                          <TableHead>Load Received (Dispatch)</TableHead>
                          <TableHead>Rejection Qty</TableHead>
                          <TableHead>Rejection Details / Remarks</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {filteredLogs.length === 0 ? (
                          <TableRow>
                              <TableCell colSpan={5} className="text-center py-20 text-slate-400 italic">
                                  {loading ? "Fetching SQA logs..." : "No logs found for the selected criteria."}
                              </TableCell>
                          </TableRow>
                      ) : (
                          filteredLogs.map((row, i) => (
                              <TableRow key={i} className="hover:bg-slate-50">
                                  <TableCell className="font-mono text-xs py-3">{row.date}</TableCell>
                                  <TableCell className="font-mono text-xs">{row.partNumber}</TableCell>
                                  <TableCell className="font-semibold text-slate-800">{row.dispatch || 0}</TableCell>
                                  <TableCell className={cn(row.rejection > 0 ? "text-red-600 font-semibold" : "text-slate-600")}>
                                      {row.rejection || 0}
                                  </TableCell>
                                  <TableCell className="text-xs text-slate-500 max-w-[300px] truncate" title={row.remarks}>
                                      {row.remarks || "-"}
                                  </TableCell>
                              </TableRow>
                          ))
                      )}
                  </TableBody>
               </Table>
          </CardContent>
      </Card>
    </div>
  )
}

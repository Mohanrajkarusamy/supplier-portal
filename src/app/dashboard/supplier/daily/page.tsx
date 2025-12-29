"use client"

import { useState } from "react"
import { Calendar as CalendarIcon, Filter, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MOCK_DAILY_LOGS } from "@/lib/performance"
import { cn } from "@/lib/utils"

export default function DailyPerformancePage() {
  const [logs] = useState(MOCK_DAILY_LOGS["SUP001"] || [])
  const [showFilters, setShowFilters] = useState(false)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const filteredLogs = logs.filter(log => {
      if (!startDate && !endDate) return true
      const logDate = new Date(log.date)
      const start = startDate ? new Date(startDate) : null
      const end = endDate ? new Date(endDate) : null

      if (start && logDate < start) return false
      if (end && logDate > end) return false
      if (start && logDate < start) return false
      if (end && logDate > end) return false
      return true
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  // Calculate stats based on filtered selection
  const totalSupplied = filteredLogs.reduce((acc, curr) => acc + curr.suppliedQty, 0)
  const totalRejected = filteredLogs.reduce((acc, curr) => acc + curr.rejectedQty, 0)
  const rejectionRate = totalSupplied > 0 ? ((totalRejected / totalSupplied) * 100).toFixed(2) : "0.00"

  const handleExportCSV = () => {
    const headers = ["Date", "Part Name", "Supplied Qty", "Rejected Qty", "Rejection %", "Delivery Status", "Remarks"]
    const rows = filteredLogs.map(log => [
        log.date,
        log.partName,
        log.loadReceived,
        log.rejectedQty,
        log.loadReceived > 0 ? ((log.rejectedQty / log.loadReceived) * 100).toFixed(1) + "%" : "0%",
        log.deliveryStatus,
        log.remarks || ""
    ])

    const csvContent = [
        headers.join(","),
        ...rows.map(r => r.join(","))
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `daily_performance_${startDate || "all"}_to_${endDate || "all"}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Daily Performance</h2>
        <div className="flex items-center space-x-2">
           <Button variant={showFilters ? "secondary" : "outline"} onClick={() => setShowFilters(!showFilters)}>
              <CalendarIcon className="mr-2 h-4 w-4" /> {showFilters ? "Hide Filters" : "Select Date Range"}
           </Button>
           <Button onClick={handleExportCSV}>
              <Download className="mr-2 h-4 w-4" /> Export CSV
           </Button>
        </div>
      </div>

      {showFilters && (
          <Card className="bg-slate-50 border-dashed">
              <CardContent className="pt-6">
                <div className="flex items-end gap-4">
                    <div className="grid gap-2">
                        <label className="text-sm font-medium">Start Date</label>
                        <input 
                            type="date" 
                            className="flex h-10 w-[180px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>
                    <div className="grid gap-2">
                        <label className="text-sm font-medium">End Date</label>
                        <input 
                            type="date" 
                            className="flex h-10 w-[180px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                    <Button variant="ghost" onClick={() => { setStartDate(""); setEndDate("") }}>
                        Clear
                    </Button>
                </div>
              </CardContent>
          </Card>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
            <CardHeader className="py-4">
                <CardTitle className="text-sm font-medium text-muted-foreground">Filtered Supplied Qty</CardTitle>
                <div className="text-2xl font-bold">{totalSupplied}</div>
            </CardHeader>
        </Card>
        <Card>
            <CardHeader className="py-4">
                <CardTitle className="text-sm font-medium text-muted-foreground">Filtered Rejected Qty</CardTitle>
                <div className="text-2xl font-bold text-red-600">{totalRejected}</div>
            </CardHeader>
        </Card>
         <Card>
            <CardHeader className="py-4">
                <CardTitle className="text-sm font-medium text-muted-foreground">Avg Rejection Rate</CardTitle>
                <div className="text-2xl font-bold">{rejectionRate}%</div>
            </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daily Production & Quality Log</CardTitle>
          <CardDescription>
            Detailed breakdown of supplied quantities and rejection status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Part Name</TableHead>
                <TableHead className="text-right">Supplied Qty</TableHead>
                <TableHead className="text-right">Rejected Qty</TableHead>
                <TableHead className="text-right">Rejection %</TableHead>
                <TableHead>Delivery Status</TableHead>
                <TableHead>Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length === 0 ? (
                  <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No logs found for the selected period.
                      </TableCell>
                  </TableRow>
              ) : (
                filteredLogs.map((log) => {
                    const rejectionRate = log.loadReceived > 0 ? ((log.rejectedQty / log.loadReceived) * 100).toFixed(1) : "0.0"
                    return (
                        <TableRow key={log.id}>
                        <TableCell className="font-medium">{log.date}</TableCell>
                        <TableCell>{log.partName}</TableCell>
                        <TableCell className="text-right">{log.loadReceived}</TableCell>
                        <TableCell className="text-right text-red-600 font-medium">{log.rejectedQty}</TableCell>
                        <TableCell className="text-right">{rejectionRate}%</TableCell>
                        <TableCell>
                            <span className={cn(
                                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                                log.deliveryStatus === "On-Time" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                            )}>
                                {log.deliveryStatus}
                            </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">{log.remarks || "-"}</TableCell>
                        </TableRow>
                    )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

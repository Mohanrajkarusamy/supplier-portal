"use client"

import { useState, useEffect, useMemo } from "react"
import { FileText, Search, Calendar, Filter, Download, Activity, AlertTriangle, ArrowDownToLine, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

export default function AdminPerformanceLogsPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Edit Log State
  const [editingLog, setEditingLog] = useState<any | null>(null)
  const [editCastingIssued, setEditCastingIssued] = useState("")
  const [editProduction, setEditProduction] = useState("")
  const [editRejection, setEditRejection] = useState("")
  const [editDispatch, setEditDispatch] = useState("")
  const [editPlannedQty, setEditPlannedQty] = useState("")
  const [editRemarks, setEditRemarks] = useState("")
  const [editIsOpening, setEditIsOpening] = useState(false)
  const [editOpeningStock, setEditOpeningStock] = useState("")
  const [editOpen, setEditOpen] = useState(false)

  // Filters
  const [selectedSupplierId, setSelectedSupplierId] = useState("All")
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)) // YYYY-MM
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchSuppliers()
  }, [])

  useEffect(() => {
    fetchAdminLogs()
  }, [selectedMonth, selectedSupplierId])

  const fetchSuppliers = async () => {
    try {
      const res = await fetch('/api/suppliers')
      if (res.ok) {
        const data = await res.json()
        setSuppliers(data.filter((u: any) => u.role === "SUPPLIER_USER"))
      }
    } catch (e) {
      console.error(e)
    }
  }

  const fetchAdminLogs = async () => {
    setLoading(true)
    try {
      let url = `/api/production?enteredBy=Admin`
      if (selectedSupplierId !== 'All') {
        url += `&supplierId=${selectedSupplierId}`
      }
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        // Filter by month client-side (logs are sorted by date desc)
        const filtered = data.filter((log: any) => log.date.startsWith(selectedMonth))
        setLogs(filtered)
      }
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const handleEditClick = (log: any) => {
    setEditingLog(log)
    setEditCastingIssued(log.castingIssued || "0")
    setEditProduction(log.production || "0")
    setEditRejection(log.rejection || "0")
    setEditDispatch(log.dispatch || "0")
    setEditPlannedQty(log.plannedQty || "0")
    setEditRemarks(log.remarks || "")
    setEditIsOpening(log.isOpeningStockRecord || false)
    setEditOpeningStock(log.openingStock || "0")
    setEditOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingLog) return
    try {
      const res = await fetch('/api/production', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingLog._id || editingLog.id,
          castingIssued: Number(editCastingIssued),
          production: Number(editProduction),
          rejection: Number(editRejection),
          dispatch: Number(editDispatch),
          plannedQty: Number(editPlannedQty),
          remarks: editRemarks,
          isOpeningStockRecord: editIsOpening,
          openingStock: Number(editOpeningStock)
        })
      })
      const result = await res.json()
      if (result.success) {
        alert("Log updated successfully. Downstream balances recalculated.")
        setEditOpen(false)
        setEditingLog(null)
        fetchAdminLogs()
      } else {
        alert(`Failed: ${result.message}`)
      }
    } catch (e) {
      console.error(e)
      alert("Network error")
    }
  }

  const handleDeleteLog = async (logId: string) => {
    if (!window.confirm("Are you sure you want to delete this log record? The daily inventory balances will be automatically recalculated.")) return
    try {
      const res = await fetch(`/api/production?id=${logId}`, {
        method: 'DELETE'
      })
      const result = await res.json()
      if (result.success) {
        alert("Log deleted successfully. Downstream balances recalculated.")
        fetchAdminLogs()
      } else {
        alert(`Failed: ${result.message}`)
      }
    } catch (e) {
      console.error(e)
      alert("Network error")
    }
  }

  const getSupplierName = (id: string) => {
    const s = suppliers.find(x => x.id === id)
    return s ? s.name : id
  }

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const sName = getSupplierName(log.supplierId).toLowerCase()
      const pNo = (log.partNumber || "").toLowerCase()
      const query = searchQuery.toLowerCase()
      return sName.includes(query) || pNo.includes(query)
    })
  }, [logs, searchQuery, suppliers])

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
      
      const supplier = suppliers.find(s => s.id === log.supplierId)
      const part = supplier?.companyDetails?.approvedParts?.find((p: any) => p.partNumber === log.partNumber)
      const dailyTarget = part ? ((part.monthlyRequirement || 0) / 25) : (log.plannedQty || 0)
      
      existing.plannedQty += dailyTarget
      existing.production += (log.production || 0)
      existing.rejection += (log.rejection || 0)
      existing.dispatch += (log.dispatch || 0)
      groupedMap.set(dateStr, existing)
    }
    return Array.from(groupedMap.values()).sort((a, b) => a.date.localeCompare(b.date))
  }, [filteredLogs, suppliers])

  const handleExport = () => {
    alert(`Exporting admin performance logs for ${selectedMonth}...`)
  }

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between">
        <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-800">Admin Performance Logs</h2>
            <p className="text-slate-500">Track and review daily received loads, rejections, and SQA records entered by administrators.</p>
        </div>
        <Button onClick={handleExport} className="bg-primary hover:bg-orange-600 text-white">
            <Download className="mr-2 h-4 w-4" /> Export logs
        </Button>
      </div>

      {/* Filters bar */}
      <Card className="bg-slate-50 border-slate-200">
          <CardContent className="pt-6">
              <div className="grid gap-4 md:grid-cols-4">
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
                      <label className="text-xs font-bold text-slate-500 uppercase">Supplier</label>
                      <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
                          <SelectTrigger className="bg-white border-slate-300">
                            <SelectValue placeholder="All Suppliers" />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="All">All Suppliers</SelectItem>
                              {suppliers.map(s => (
                                <SelectItem key={s.id} value={s.id}>{s.name} ({s.id})</SelectItem>
                              ))}
                          </SelectContent>
                      </Select>
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
                      <Button variant="outline" className="w-full border-slate-300 h-10" onClick={fetchAdminLogs}>
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
                  <FileText className="mr-2 h-5 w-5 text-slate-400" /> Admin Daily Entry Ledger
              </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
               <Table>
                   <TableHeader>
                       <TableRow className="bg-slate-100/50">
                           <TableHead>Date</TableHead>
                           <TableHead>Supplier</TableHead>
                           <TableHead>Part No</TableHead>
                           <TableHead>Planned Target</TableHead>
                           <TableHead>Casting Issued</TableHead>
                           <TableHead>Load Received (Actual)</TableHead>
                           <TableHead>Rejection Qty</TableHead>
                           <TableHead>Rejection Details / Remarks</TableHead>
                           <TableHead className="text-right">Actions</TableHead>
                       </TableRow>
                   </TableHeader>
                   <TableBody>
                       {filteredLogs.length === 0 ? (
                           <TableRow>
                               <TableCell colSpan={9} className="text-center py-20 text-slate-400 italic">
                                   {loading ? "Fetching SQA logs..." : "No logs found for the selected criteria."}
                               </TableCell>
                           </TableRow>
                       ) : (
                           filteredLogs.map((row, i) => (
                               <TableRow key={i} className="hover:bg-slate-50">
                                   <TableCell className="font-mono text-xs py-3">{row.date}</TableCell>
                                   <TableCell className="font-bold text-slate-700">{getSupplierName(row.supplierId)}</TableCell>
                                   <TableCell className="font-mono text-xs">{row.partNumber}</TableCell>
                                   <TableCell className="font-semibold text-blue-600">{row.plannedQty || 0}</TableCell>
                                   <TableCell className="font-semibold text-orange-600">+{row.castingIssued || 0}</TableCell>
                                   <TableCell className="font-semibold text-slate-800">{row.dispatch || 0}</TableCell>
                                   <TableCell className={cn(row.rejection > 0 ? "text-red-600 font-semibold" : "text-slate-600")}>
                                       {row.rejection || 0}
                                   </TableCell>
                                   <TableCell className="text-xs text-slate-500 max-w-[200px] truncate" title={row.remarks}>
                                       {row.remarks || "-"}
                                   </TableCell>
                                   <TableCell className="text-right">
                                       <div className="flex justify-end gap-2">
                                           <Button 
                                               variant="ghost" 
                                               size="icon" 
                                               className="h-7 w-7 text-blue-600 hover:text-blue-700" 
                                               onClick={() => handleEditClick(row)}
                                           >
                                               <Edit className="h-4 w-4" />
                                           </Button>
                                           <Button 
                                               variant="ghost" 
                                               size="icon" 
                                               className="h-7 w-7 text-red-600 hover:text-red-700"
                                               onClick={() => handleDeleteLog(row._id || row.id)}
                                           >
                                               <Trash2 className="h-4 w-4" />
                                           </Button>
                                       </div>
                                   </TableCell>
                               </TableRow>
                           ))
                       )}
                   </TableBody>
                </Table>
           </CardContent>
       </Card>

       <Dialog open={editOpen} onOpenChange={setEditOpen}>
           <DialogContent className="sm:max-w-[450px]">
               <DialogHeader>
                   <DialogTitle>Modify Admin Performance Log</DialogTitle>
                   <DialogDescription>
                       Edit the metrics for Part {editingLog?.partNumber} on {editingLog?.date}.
                   </DialogDescription>
               </DialogHeader>
               <div className="grid gap-4 py-4">
                   <div className="grid grid-cols-4 items-center gap-4">
                       <Label className="text-right">Planned Target</Label>
                       <Input 
                           value={editPlannedQty} 
                           onChange={(e) => setEditPlannedQty(e.target.value)} 
                           type="number" 
                           className="col-span-3"
                       />
                   </div>

                   <div className="grid grid-cols-4 items-center gap-4">
                       <Label className="text-right">Load Received</Label>
                       <Input 
                           value={editDispatch} 
                           onChange={(e) => setEditDispatch(e.target.value)} 
                           type="number" 
                           className="col-span-3"
                       />
                   </div>

                   <div className="grid grid-cols-4 items-center gap-4">
                       <Label className="text-right">Rejection Qty</Label>
                       <Input 
                           value={editRejection} 
                           onChange={(e) => setEditRejection(e.target.value)} 
                           type="number" 
                           className="col-span-3"
                       />
                   </div>

                   <div className="grid grid-cols-4 items-center gap-4">
                       <Label className="text-right">Remarks</Label>
                       <Input 
                           value={editRemarks} 
                           onChange={(e) => setEditRemarks(e.target.value)} 
                           className="col-span-3"
                       />
                   </div>
               </div>
               <DialogFooter>
                   <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                   <Button onClick={handleSaveEdit}>Save Changes</Button>
               </DialogFooter>
           </DialogContent>
       </Dialog>
     </div>
  )
}

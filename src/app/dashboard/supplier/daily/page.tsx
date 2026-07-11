"use client"

import { useState, useEffect } from "react"
import { Calendar as CalendarIcon, Filter, Download, List, TrendingUp, AlertCircle, Plus, ArrowDownToLine, RotateCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function DailyPerformancePage() {
  const [supplierId, setSupplierId] = useState("")
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  // Add Log Dialog State
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [approvedParts, setApprovedParts] = useState<any[]>([])
  const [logDate, setLogDate] = useState("")
  const [selectedPartNumber, setSelectedPartNumber] = useState("")
  const [shiftVal, setShiftVal] = useState("Shift A")
  const [productionVal, setProductionVal] = useState("")
  const [rejectionVal, setRejectionVal] = useState("")
  const [dispatchVal, setDispatchVal] = useState("")
  const [shortageReasonVal, setShortageReasonVal] = useState("None")
  const [remarksVal, setRemarksVal] = useState("")

  // Setting Change Dialog States
  const [changeDialogOpen, setChangeDialogOpen] = useState(false)
  const [selectedLine, setSelectedLine] = useState("Line-1")
  const [fromPart, setFromPart] = useState("")
  const [toPart, setToPart] = useState("")
  const [settingChanges, setSettingChanges] = useState<any[]>([])

  useEffect(() => {
     const id = localStorage.getItem("currentUserId") || "SUP001"
     setSupplierId(id)
     fetchLogs(id)
     fetchSupplierDetails(id)
     fetchSettingChanges(id)
  }, [])

  const fetchSettingChanges = async (id: string) => {
    try {
      const res = await fetch(`/api/suppliers/setting-change?supplierId=${id}`)
      if (res.ok) {
        setSettingChanges(await res.json())
      }
    } catch (e) {
      console.error(e)
    }
  }

  const fetchLogs = async (id: string) => {
      try {
          const res = await fetch(`/api/production?supplierId=${id}&enteredBy=Supplier`)
          if (res.ok) {
              const data = await res.json()
              setLogs(data)
          }
      } catch (e) { console.error(e) }
      setLoading(false)
  }

  const fetchSupplierDetails = async (id: string) => {
      try {
          const res = await fetch(`/api/suppliers?id=${id}`)
          if (res.ok) {
              const u = await res.json()
              setApprovedParts(u.companyDetails?.approvedParts || [])
          }
      } catch (e) { console.error(e) }
  }

  useEffect(() => {
      const part = approvedParts.find(p => p.partNumber === selectedPartNumber)
      if (part && part.shiftScheme === "2-shifts" && shiftVal === "Shift C") {
          setShiftVal("Shift A")
      }
  }, [selectedPartNumber, approvedParts, shiftVal])

  const handleOpenChangeDialog = () => {
    setSelectedLine("Line-1")
    setFromPart("Idle")
    if (approvedParts.length > 0) {
      setToPart(approvedParts[0].name)
    } else {
      setToPart("")
    }
    setChangeDialogOpen(true)
  }

  const handleSaveSettingChange = async () => {
    if (!toPart || !selectedLine || !fromPart) {
      alert("Please select a line, previous component, and next component.")
      return
    }

    try {
      const res = await fetch('/api/suppliers/setting-change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId,
          line: selectedLine,
          fromPart,
          toPart
        })
      })
      const result = await res.json()
      if (result.success) {
        alert(`Line setting change registered! ${selectedLine} is now producing ${toPart}.`)
        setChangeDialogOpen(false)
        fetchSettingChanges(supplierId)
      } else {
        alert(`Failed: ${result.message}`)
      }
    } catch (e) {
      console.error(e)
      alert("Network error: Failed to log line change.")
    }
  }

  const handleOpenAddDialog = () => {
      setLogDate(new Date().toISOString().split('T')[0])
      if (approvedParts.length > 0) {
          setSelectedPartNumber(approvedParts[0].partNumber)
      } else {
          setSelectedPartNumber("")
      }
      setShiftVal("Shift A")
      setProductionVal("")
      setRejectionVal("")
      setDispatchVal("")
      setShortageReasonVal("None")
      setRemarksVal("")
      setAddDialogOpen(true)
  }

  const handleSaveDailyLog = async () => {
      if (!selectedPartNumber || !logDate || !productionVal || !rejectionVal || !dispatchVal) {
          alert("Please fill in all daily log fields.")
          return
      }

      const part = approvedParts.find(p => p.partNumber === selectedPartNumber)
      const line = part?.productionLine || "Line-1"

      // Validate that if this line previously logged a different component, a Setting Change transition was logged
      const lineLogs = logs
          .filter((l: any) => (l.productionLine || "Line-1") === line)
          .sort((a, b) => b.date.localeCompare(a.date))
      
      const lastLoggedLog = lineLogs[0]

      if (lastLoggedLog && lastLoggedLog.partNumber !== selectedPartNumber) {
          // A different part number was active last on this line! Check for a setup setting change
          const transitions = settingChanges
              .filter(chg => chg.line === line && chg.toPart === part?.name)
              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          
          const latestTransition = transitions[0]

          if (!latestTransition || new Date(latestTransition.date) < new Date(lastLoggedLog.date)) {
              alert(`Validation Error: Line ${line} was previously producing a different component (${lastLoggedLog.partNumber}). You must log a "Line Setting Change" (setup changeover) first to transition this line to "${part?.name || selectedPartNumber}" before submitting production logs.`);
              return;
          }
      }

      try {
          const res = await fetch('/api/production', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  supplierId,
                  partNumber: selectedPartNumber,
                  productionLine: part?.productionLine || "Line-1",
                  shift: shiftVal,
                  date: logDate,
                  production: Number(productionVal),
                  rejection: Number(rejectionVal),
                  dispatch: Number(dispatchVal),
                  shortageReason: shortageReasonVal === 'None' ? '' : shortageReasonVal,
                  remarks: remarksVal,
                  enteredBy: "Supplier"
              })
          })

          const result = await res.json()
          if (result.success) {
              alert("Daily Log submitted successfully.")
              await fetchLogs(supplierId)
              setAddDialogOpen(false)
          } else {
              alert(`Failed to save: ${result.message}`)
          }
      } catch (err) {
          console.error(err)
          alert("An error occurred during submission.")
      }
  }

  const filteredLogs = logs.filter(log => {
      if (!startDate && !endDate) return true
      const logDateObj = new Date(log.date)
      const start = startDate ? new Date(startDate) : null
      const end = endDate ? new Date(endDate) : null

      if (start && logDateObj < start) return false
      if (end && logDateObj > end) return false
      return true
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const totalCastingIssued = filteredLogs.reduce((acc, curr) => acc + (curr.castingIssued || 0), 0)
  const totalSupplied = filteredLogs.reduce((acc, curr) => acc + (curr.production || 0), 0)
  const totalRejected = filteredLogs.reduce((acc, curr) => acc + (curr.rejection || 0), 0)
  const rejectionRate = totalSupplied > 0 ? ((totalRejected / totalSupplied) * 100).toFixed(2) : "0.00"

  const handleExportCSV = () => {
    const headers = ["Date", "Part Number", "Line", "Opening Stock", "Casting Issued", "Production", "Rejection", "Dispatch", "Closing Stock", "Remarks", "Shortage Reason"]
    const rows = filteredLogs.map(log => [
        log.date,
        log.partNumber,
        log.productionLine || "Line-1",
        log.openingStock,
        log.castingIssued || 0,
        log.production,
        log.rejection,
        log.dispatch,
        log.closingStock,
        log.remarks || "",
        log.shortageReason || ""
    ])

    const csvContent = [
        headers.join(","),
        ...rows.map(r => r.join(","))
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `SAKTHI_Daily_Performance_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="flex-1 space-y-6 p-1">
      <div className="flex items-center justify-between">
        <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-800">Daily Performance & Inventory Log</h2>
            <p className="text-slate-500">Track daily production, rejection, and dispatch to calculate closing stock balance.</p>
        </div>
        <div className="flex items-center space-x-2">
           <Button variant={showFilters ? "secondary" : "outline"} onClick={() => setShowFilters(!showFilters)} className="border-slate-300">
              <Filter className="mr-2 h-4 w-4" /> Filters
           </Button>
           <Button onClick={handleExportCSV} className="bg-slate-800 text-white hover:bg-slate-700">
              <Download className="mr-2 h-4 w-4" /> Export Report
           </Button>
           
            <Dialog open={changeDialogOpen} onOpenChange={setChangeDialogOpen}>
                <Button onClick={handleOpenChangeDialog} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                   <RotateCw className="mr-2 h-4 w-4" /> Line Setting Change
                </Button>
                <DialogContent className="sm:max-w-[450px]">
                    <DialogHeader>
                        <DialogTitle>Log Line Setting Change</DialogTitle>
                        <DialogDescription>
                            Change the active produced component for any of the 5 production lines at your end.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Select Production Line</Label>
                            <Select value={selectedLine} onValueChange={setSelectedLine}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Line" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Line-1">Line-1</SelectItem>
                                    <SelectItem value="Line-2">Line-2</SelectItem>
                                    <SelectItem value="Line-3">Line-3</SelectItem>
                                    <SelectItem value="Line-4">Line-4</SelectItem>
                                    <SelectItem value="Line-5">Line-5</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label>Changed From Component (Previous)</Label>
                            <Select value={fromPart} onValueChange={setFromPart}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Previous Component" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Idle">Idle / None</SelectItem>
                                    {approvedParts.map((part: any, i: number) => (
                                        <SelectItem key={i} value={part.name}>
                                            {part.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label>Changed To Component (Current Live)</Label>
                            <Select value={toPart} onValueChange={setToPart}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select New Component" />
                                </SelectTrigger>
                                <SelectContent>
                                    {approvedParts.map((part: any, i: number) => (
                                        <SelectItem key={i} value={part.name}>
                                            {part.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setChangeDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveSettingChange} className="bg-blue-600 hover:bg-blue-700 text-white">
                            Log Setting Change
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
               <Button onClick={handleOpenAddDialog} className="bg-primary hover:bg-orange-600 text-white">
                  <Plus className="mr-2 h-4 w-4" /> Add Daily Log
               </Button>
               <DialogContent className="sm:max-w-[450px]">
                   <DialogHeader>
                       <DialogTitle>Enter Daily Performance Log</DialogTitle>
                       <DialogDescription>
                           Input today's production, dispatch, and quality inspection metrics.
                       </DialogDescription>
                   </DialogHeader>
                   <div className="grid gap-4 py-4">
                       <div className="grid gap-2">
                            <Label htmlFor="date">Date</Label>
                            <Input 
                               id="date" 
                               type="date"
                               value={logDate}
                               onChange={(e) => setLogDate(e.target.value)}
                            />
                       </div>
                       <div className="grid gap-2">
                            <Label htmlFor="part">Assigned Component</Label>
                            <Select value={selectedPartNumber} onValueChange={setSelectedPartNumber}>
                                <SelectTrigger id="part">
                                    <SelectValue placeholder="Choose component" />
                                </SelectTrigger>
                                <SelectContent>
                                    {approvedParts.map((part: any, i: number) => (
                                        <SelectItem key={i} value={part.partNumber}>
                                            {part.name} ({part.partNumber}) - {part.productionLine || "Line-1"}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                       </div>
                       <div className="grid gap-2">
                            <Label htmlFor="shift">Shift</Label>
                            <Select value={shiftVal} onValueChange={setShiftVal}>
                                <SelectTrigger id="shift">
                                    <SelectValue placeholder="Select shift" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Shift A">Shift A</SelectItem>
                                    <SelectItem value="Shift B">Shift B</SelectItem>
                                    {!(approvedParts.find(p => p.partNumber === selectedPartNumber)?.shiftScheme === "2-shifts") && (
                                        <SelectItem value="Shift C">Shift C</SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                       </div>
                       <div className="grid grid-cols-3 gap-2">
                           <div className="grid gap-1">
                                <Label htmlFor="production">Production</Label>
                                <Input 
                                   id="production" 
                                   type="number"
                                   placeholder="Qty"
                                   value={productionVal}
                                   onChange={(e) => setProductionVal(e.target.value)}
                                />
                           </div>
                           <div className="grid gap-1">
                                <Label htmlFor="rejection">Rejection</Label>
                                <Input 
                                   id="rejection" 
                                   type="number"
                                   placeholder="Qty"
                                   value={rejectionVal}
                                   onChange={(e) => setRejectionVal(e.target.value)}
                                />
                           </div>
                           <div className="grid gap-1">
                                <Label htmlFor="dispatch">Dispatch</Label>
                                <Input 
                                   id="dispatch" 
                                   type="number"
                                   placeholder="Qty"
                                   value={dispatchVal}
                                   onChange={(e) => setDispatchVal(e.target.value)}
                                />
                           </div>
                       </div>
                       <div className="grid gap-2">
                            <Label htmlFor="shortageReason">Shortage / Loss Reason (If Any)</Label>
                            <Select value={shortageReasonVal} onValueChange={setShortageReasonVal}>
                                <SelectTrigger id="shortageReason">
                                    <SelectValue placeholder="Reason" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="None">None (Normal Production)</SelectItem>
                                    <SelectItem value="Production Loss">Production Loss</SelectItem>
                                    <SelectItem value="Machine Breakdown">Machine Breakdown</SelectItem>
                                    <SelectItem value="Power Failure">Power Failure</SelectItem>
                                    <SelectItem value="Labour Shortage">Labour Shortage</SelectItem>
                                    <SelectItem value="Material Shortage">Material Shortage</SelectItem>
                                    <SelectItem value="Quality Rejection">Quality Rejection</SelectItem>
                                </SelectContent>
                            </Select>
                       </div>
                       <div className="grid gap-2">
                            <Label htmlFor="remarks">Remarks / Explanation</Label>
                            <Textarea 
                               id="remarks" 
                               placeholder="Enter details of shortage, action items, or comments..."
                               value={remarksVal}
                               onChange={(e) => setRemarksVal(e.target.value)}
                               rows={3}
                            />
                       </div>
                   </div>
                   <DialogFooter>
                       <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
                       <Button onClick={handleSaveDailyLog} className="bg-primary hover:bg-orange-600 text-white" disabled={!selectedPartNumber || !logDate || !productionVal || !rejectionVal || !dispatchVal}>
                           Submit Daily Log
                       </Button>
                   </DialogFooter>
               </DialogContent>
           </Dialog>
        </div>
      </div>

      {showFilters && (
          <Card className="bg-slate-50 border-dashed animate-in fade-in duration-300">
              <CardContent className="pt-6">
                <div className="flex items-end gap-4">
                    <div className="grid gap-2">
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Start Date</label>
                        <input 
                            type="date" 
                            className="flex h-10 w-[200px] rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>
                    <div className="grid gap-2">
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">End Date</label>
                        <input 
                            type="date" 
                            className="flex h-10 w-[200px] rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                    <Button variant="ghost" onClick={() => { setStartDate(""); setEndDate("") }} className="text-slate-500">
                        Reset Range
                    </Button>
                </div>
              </CardContent>
          </Card>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500 shadow-sm">
            <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-500">Total Casting Issued</p>
                    <ArrowDownToLine className="h-4 w-4 text-blue-500 opacity-60" />
                </div>
                <div className="text-2xl font-bold text-blue-600 mt-1">{totalCastingIssued.toLocaleString()} Units</div>
                <p className="text-[10px] text-slate-400 mt-1">Issued raw material stock</p>
            </CardContent>
        </Card>
        <Card className="border-l-4 border-l-slate-400">
            <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-500">Total Supplied Qty</p>
                    <List className="h-4 w-4 text-slate-400" />
                </div>
                <div className="text-2xl font-bold mt-1">{totalSupplied.toLocaleString()} Units</div>
                <p className="text-[10px] text-slate-400 mt-1">Based on filtered selection</p>
            </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
            <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-500">Total Rejected Qty</p>
                    <AlertCircle className="h-4 w-4 text-red-400" />
                </div>
                <div className="text-2xl font-bold text-red-600 mt-1">{totalRejected.toLocaleString()} Units</div>
                <p className="text-[10px] text-slate-400 mt-1">Found during inspection</p>
            </CardContent>
        </Card>
         <Card className="border-l-4 border-l-primary">
            <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-500">Avg. Rejection Rate</p>
                    <TrendingUp className="h-4 w-4 text-primary/50" />
                </div>
                <div className="text-2xl font-bold mt-1">{rejectionRate}%</div>
                <p className="text-[10px] text-slate-400 mt-1">Target: Per category limits</p>
            </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Production & Inventory Transactions</CardTitle>
          <CardDescription>Detailed audit of opening stock, production, rejection, dispatch, and closing stock balance.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>Date</TableHead>
                <TableHead>Part No / Line</TableHead>
                <TableHead className="text-right">Opening</TableHead>
                <TableHead className="text-right">Casting Issued</TableHead>
                <TableHead className="text-right">Production</TableHead>
                <TableHead className="text-right">Rejection</TableHead>
                <TableHead className="text-right">Dispatch</TableHead>
                <TableHead className="text-right">Closing Stock</TableHead>
                <TableHead>Alert</TableHead>
                <TableHead>Remarks / Shortage Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length === 0 ? (
                  <TableRow>
                      <TableCell colSpan={10} className="text-center py-20 text-slate-400 italic">
                          {loading ? "Syncing data from server..." : "No transactional records found for this period."}
                      </TableCell>
                  </TableRow>
              ) : (
                filteredLogs.map((log) => {
                    const closing = log.closingStock || 0
                    let alertColor = "bg-green-600 hover:bg-green-700"
                    let statusLabel = "Green (Normal)"
                    if (closing < 100) {
                        alertColor = "bg-red-600 hover:bg-red-700 animate-pulse"
                        statusLabel = "Red (Critical)"
                    } else if (closing < 500) {
                        alertColor = "bg-amber-600 hover:bg-amber-700"
                        statusLabel = "Orange (Warning)"
                    }

                    return (
                        <TableRow key={log._id || log.id} className="hover:bg-slate-50/50">
                        <TableCell className="font-mono text-xs">{log.date}</TableCell>
                         <TableCell>
                             <span className="font-medium text-slate-700">{log.partNumber}</span>
                             <div className="text-[10px] text-slate-400">
                                 {log.productionLine || "Line-1"} {log.shift && log.shift !== 'N/A' ? `| ${log.shift}` : ''}
                             </div>
                         </TableCell>
                        <TableCell className="text-right font-mono text-slate-600">{log.openingStock || 0}</TableCell>
                        <TableCell className="text-right font-mono text-blue-600 font-semibold">{log.castingIssued || 0}</TableCell>
                        <TableCell className="text-right font-bold text-slate-800">{log.production || 0}</TableCell>
                        <TableCell className="text-right text-red-600 font-bold">{log.rejection || 0}</TableCell>
                        <TableCell className="text-right font-bold text-slate-800">{log.dispatch || 0}</TableCell>
                        <TableCell className="text-right font-bold text-slate-900 font-mono">{closing}</TableCell>
                        <TableCell>
                            {log.isOpeningStockRecord ? (
                                <Badge variant="outline" className="text-slate-500 font-medium">Opening</Badge>
                            ) : (
                                <Badge className={cn("text-white font-medium border-0", alertColor)}>
                                    {statusLabel}
                                </Badge>
                            )}
                        </TableCell>
                        <TableCell className="text-slate-500 text-xs">
                            {log.shortageReason && (
                                <span className="font-bold text-red-600 block">{log.shortageReason}</span>
                            )}
                            <span className="truncate max-w-[200px] block">{log.remarks || "No remarks"}</span>
                        </TableCell>
                        </TableRow>
                    )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="bg-slate-50/50">
          <CardTitle className="text-lg flex items-center">
            <RotateCw className="mr-2 h-5 w-5 text-slate-400" /> Line Setting Changes Ledger
          </CardTitle>
          <CardDescription>History of component changeovers logged for your production lines.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-100/50">
                <TableHead>Line</TableHead>
                <TableHead>Changed From (Previous)</TableHead>
                <TableHead>Changed To (Current Running)</TableHead>
                <TableHead>Date Logged</TableHead>
                <TableHead className="text-right">Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {settingChanges.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-slate-400 italic">
                    No line setting changes logged yet.
                  </TableCell>
                </TableRow>
              ) : (
                settingChanges.map((chg) => (
                  <TableRow key={chg._id || chg.id} className="hover:bg-slate-50/50">
                    <TableCell className="font-semibold text-slate-800">{chg.line}</TableCell>
                    <TableCell className="text-slate-500 font-mono text-xs">{chg.fromPart}</TableCell>
                    <TableCell className="text-green-700 font-bold font-mono text-xs">{chg.toPart}</TableCell>
                    <TableCell className="text-xs text-slate-500">{chg.date}</TableCell>
                    <TableCell className="text-right text-xs text-slate-400 font-mono">
                      {new Date(chg.timestamp).toLocaleString()}
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

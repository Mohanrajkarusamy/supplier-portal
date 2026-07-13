"use client"

import { useState, useEffect } from "react"
import { FileText, Download, Search, Plus, FileSpreadsheet, FileCheck2, ShieldCheck, Clock, Send, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Report, MOCK_REPORTS } from "@/lib/reports"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from "recharts"

export default function SupplierReportsPage() {
  const [currentUser] = useLocalStorage("currentUserId", "SUP001")
  const [allReports] = useLocalStorage<Report[]>("portal_reports", MOCK_REPORTS)
  const [activeTab, setActiveTab] = useState<"standard" | "requisitions">("standard")

  // Scorecard state
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const [scorecard, setScorecard] = useState<any | null>(null)
  const [loadingScorecard, setLoadingScorecard] = useState(false)

  // Printable Report States
  const [printOpen, setPrintOpen] = useState(false)
  const [supplierDetails, setSupplierDetails] = useState<any | null>(null)
  const [allYearLogs, setAllYearLogs] = useState<any[]>([])
  const [allYearScorecards, setAllYearScorecards] = useState<any[]>([])
  const [loadingPrintData, setLoadingPrintData] = useState(false)

  // Requisitions state
  const [requisitions, setRequisitions] = useState<any[]>([])
  const [loadingReqs, setLoadingReqs] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)

  // Requisition Form states
  const [reqType, setReqType] = useState("")
  const [partNumber, setPartNumber] = useState("")
  const [remarks, setRemarks] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // Filter reports
  const reports = allReports.filter(r => (!r.supplierId || r.supplierId === currentUser) && !["R001", "R002", "R003"].includes(r.id))

  const fetchScorecard = async () => {
    if (!currentUser) return
    setLoadingScorecard(true)
    try {
      const res = await fetch(`/api/reports?month=${selectedMonth}`)
      if (res.ok) {
        const data = await res.json()
        const myRecord = data.find((row: any) => row.supplierId === currentUser)
        setScorecard(myRecord || null)
      }
    } catch (e) {
      console.error(e)
    }
    setLoadingScorecard(false)
  }

  const getFinancialYearMonths = (monthStr: string) => {
    const [yearPart, monthPart] = monthStr.split('-').map(Number)
    const startYear = monthPart >= 4 ? yearPart : yearPart - 1
    const months = []
    for (let m = 4; m <= 15; m++) {
      const curMonth = m > 12 ? m - 12 : m
      const curYear = m > 12 ? startYear + 1 : startYear
      const formattedMonth = String(curMonth).padStart(2, '0')
      months.push(`${curYear}-${formattedMonth}`)
    }
    return months
  }

  const formatMonthName = (mStr: string) => {
    const [year, month] = mStr.split('-')
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const name = monthNames[Number(month) - 1]
    const shortYear = year.slice(2)
    return `${name}-${shortYear}`
  }

  const handleOpenPrintPreview = async () => {
    setPrintOpen(true)
    setLoadingPrintData(true)
    try {
      const supRes = await fetch(`/api/suppliers?id=${currentUser}`)
      if (supRes.ok) {
        setSupplierDetails(await supRes.json())
      }

      const prodRes = await fetch(`/api/production?supplierId=${currentUser}&enteredBy=Admin`)
      if (prodRes.ok) {
        setAllYearLogs(await prodRes.json())
      }

      const fyMonths = getFinancialYearMonths(selectedMonth)
      const fetchedScorecards = []
      for (const m of fyMonths) {
        const scoreRes = await fetch(`/api/reports?month=${m}`)
        if (scoreRes.ok) {
          const list = await scoreRes.json()
          const rec = list.find((row: any) => row.supplierId === currentUser)
          if (rec) {
            fetchedScorecards.push({ ...rec, month: m })
          } else {
            fetchedScorecards.push({
              month: m,
              supplierId: currentUser,
              ppm: 0,
              otd: 100,
              qualityScore: 60,
              deliveryScore: 20,
              responsivenessScore: 10,
              auditScore: 10,
              totalScore: 100,
              grade: 'A+'
            })
          }
        }
      }
      setAllYearScorecards(fetchedScorecards)
    } catch (e) {
      console.error(e)
    }
    setLoadingPrintData(false)
  }

  const getMonthlyStats = (mStr: string) => {
    const logs = allYearLogs.filter(log => log.date.startsWith(mStr))
    const partsSupplied = logs.reduce((sum, l) => sum + (l.dispatch || 0), 0)
    const rejectionQty = logs.reduce((sum, l) => sum + (l.rejection || 0), 0)
    const partsPlanned = logs.reduce((sum, l) => sum + (l.plannedQty || 0), 0)
    const ppm = partsSupplied > 0 ? Math.round((rejectionQty / partsSupplied) * 1000000) : 0
    const otd = partsPlanned > 0 ? Math.min(100, Math.round((partsSupplied / partsPlanned) * 100)) : 100
    
    const sc = allYearScorecards.find(s => s.month === mStr) || {
      responsivenessScore: 10,
      auditScore: 10,
      totalScore: 100,
      grade: 'A+'
    }

    let premiumFreight = 0
    let lineStoppage = 0
    if (sc.auditScore === 10) {
      premiumFreight = 0
      lineStoppage = 0
    } else if (sc.auditScore === 5) {
      premiumFreight = 0
      lineStoppage = 1
    } else if (sc.auditScore === 0) {
      premiumFreight = 1
      lineStoppage = 1
    }

    return {
      monthLabel: formatMonthName(mStr),
      partsSupplied,
      rejectionQty,
      ppm,
      partsPlanned,
      otd,
      responsiveness: sc.responsivenessScore === 10 ? "Yes" : "No",
      premiumFreight,
      lineStoppage,
      totalScore: sc.totalScore,
      grade: sc.grade
    }
  }

  useEffect(() => {
    if (currentUser) {
      fetchRequisitions()
      fetchScorecard()
    }
  }, [currentUser, selectedMonth])

  const fetchRequisitions = async () => {
    setLoadingReqs(true)
    try {
      const res = await fetch(`/api/reports/requisitions?supplierId=${currentUser}`)
      if (res.ok) {
        setRequisitions(await res.json())
      }
    } catch (e) {
      console.error(e)
    }
    setLoadingReqs(false)
  }

  const handleRequestRequisition = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reqType) {
      alert("Please select a requisition document category.")
      return
    }

    setSubmitting(true)
    const formData = new FormData()
    formData.append("type", reqType)
    formData.append("supplierId", currentUser)
    formData.append("partNumber", partNumber || "N/A")
    formData.append("remarks", remarks)
    formData.append("date", new Date().toISOString().split('T')[0])

    try {
      const res = await fetch('/api/reports/requisitions', {
        method: 'POST',
        body: formData
      })
      const result = await res.json()
      if (result.success) {
        alert("Requisition Request sent to SQA Admin team successfully!")
        setDialogOpen(false)
        setReqType("")
        setPartNumber("")
        setRemarks("")
        fetchRequisitions()
      } else {
        alert(`Failed: ${result.message}`)
      }
    } catch (error) {
      console.error(error)
      alert("Network error: Failed to submit requisition request.")
    }
    setSubmitting(false)
  }

  return (
    <div className="flex-1 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-800">Reports & Audit Submissions</h2>
          <p className="text-slate-500">Reconcile audit results, regulatory checklists, ESG scores, and download templates.</p>
        </div>

        {/* Tab Toggle buttons */}
        <div className="flex bg-slate-100 p-1 rounded-lg border">
          <Button 
            variant={activeTab === "standard" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("standard")}
            className="rounded-md"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" /> General Reports
          </Button>
          <Button 
            variant={activeTab === "requisitions" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("requisitions")}
            className="rounded-md"
          >
            <FileCheck2 className="h-4 w-4 mr-2" /> Requisitions & Audits
          </Button>
        </div>
      </div>

      {activeTab === "standard" ? (
        <div className="space-y-6">
          <Card className="shadow-md border-l-4 border-l-primary">
            <CardHeader className="bg-slate-50/50 pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                <div>
                  <CardTitle className="text-lg flex items-center">
                    <TrendingUp className="mr-2 h-5 w-5 text-primary" /> Monthly Performance Evaluation Scorecard
                  </CardTitle>
                  <CardDescription>View your Quality, Delivery, and Others score breakdown & approvals.</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-500 font-semibold">Select Evaluation Month:</span>
                  <Input 
                    type="month" 
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-40 h-8 text-xs bg-white"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {loadingScorecard ? (
                <div className="text-center py-8 text-slate-400 italic">Recalculating scorecard...</div>
              ) : scorecard ? (
                <div className="space-y-6 text-sm">
                  {/* Summary row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 border p-4 rounded-lg items-center">
                    <div>
                      <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Your Category</span>
                      <span className="font-semibold text-slate-700">{scorecard.category || "Pre-Machining"}</span>
                    </div>
                    <div className="text-center">
                      <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Total Evaluation Score</span>
                      <span className="text-3xl font-extrabold font-mono text-primary">{scorecard.totalScore}/100</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Assigned Grade</span>
                      <Badge className="bg-primary text-white text-md px-3.5 py-1 font-bold">{scorecard.grade}</Badge>
                    </div>
                  </div>

                  {/* Criteria Breakdown */}
                  <div className="grid md:grid-cols-3 gap-4">
                    {/* Quality */}
                    <div className="border rounded-lg p-4 space-y-2">
                      <div className="flex justify-between border-b pb-1.5 font-bold">
                        <span className="text-slate-800">1. Quality (60 Marks)</span>
                        <span className="text-primary font-mono">{scorecard.qualityScore}m</span>
                      </div>
                      <p className="text-xs text-slate-500">Log Period PPM Rate</p>
                      <p className="text-lg font-bold font-mono text-slate-800">{scorecard.ppm.toLocaleString()} PPM</p>
                    </div>

                    {/* Delivery */}
                    <div className="border rounded-lg p-4 space-y-2">
                      <div className="flex justify-between border-b pb-1.5 font-bold">
                        <span className="text-slate-800">2. Delivery (20 Marks)</span>
                        <span className="text-primary font-mono">{scorecard.deliveryScore}m</span>
                      </div>
                      <p className="text-xs text-slate-500">On-Time Delivery Rate (OTD)</p>
                      <p className="text-lg font-bold font-mono text-slate-800">{scorecard.otd}%</p>
                    </div>

                    {/* Others */}
                    <div className="border rounded-lg p-4 space-y-2">
                      <div className="flex justify-between border-b pb-1.5 font-bold">
                        <span className="text-slate-800">3. Others (20 Marks)</span>
                        <span className="text-primary font-mono">
                          {scorecard.responsivenessScore + scorecard.auditScore}m
                        </span>
                      </div>
                      <div className="text-xs space-y-1 text-slate-600 pt-1">
                        <p className="flex justify-between">
                          <span>4M submission:</span>
                          <span className="font-semibold">{scorecard.responsivenessScore === 10 ? "Submitted (10m)" : "Delayed (0m)"}</span>
                        </p>
                        <p className="flex justify-between">
                          <span>Premium freight & line stoppage:</span>
                          <span className="font-semibold">{scorecard.auditScore}m / 10m</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Approvals */}
                  <div className="border rounded-lg p-4 space-y-3">
                    <div className="border-b pb-1.5 font-bold text-slate-800">
                      4. Department E-Sign Status
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                      <div className="border rounded p-2.5 bg-slate-50">
                        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Quality Dept</div>
                        {scorecard.qualitySignedBy ? (
                          <div className="text-xs text-green-700 font-semibold mt-1">
                            ✓ Signed by {scorecard.qualitySignedBy}
                          </div>
                        ) : (
                          <div className="text-xs text-slate-400 italic mt-1">Pending Approval</div>
                        )}
                      </div>
                      <div className="border rounded p-2.5 bg-slate-50">
                        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Delivery/SCM Dept</div>
                        {scorecard.deliverySignedBy ? (
                          <div className="text-xs text-green-700 font-semibold mt-1">
                            ✓ Signed by {scorecard.deliverySignedBy}
                          </div>
                        ) : (
                          <div className="text-xs text-slate-400 italic mt-1">Pending Approval</div>
                        )}
                      </div>
                      <div className="border rounded p-2.5 bg-slate-50">
                        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Management</div>
                        {scorecard.managementSignedBy ? (
                          <div className="text-xs text-green-700 font-semibold mt-1">
                            ✓ Signed by {scorecard.managementSignedBy}
                          </div>
                        ) : (
                          <div className="text-xs text-slate-400 italic mt-1">Pending Approval</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t">
                      <Button 
                          onClick={handleOpenPrintPreview}
                          className="bg-primary hover:bg-orange-600 text-white font-medium shadow-sm"
                      >
                          <Download className="mr-2 h-4 w-4" /> Download / Print Official Performance Report (PDF)
                      </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400 italic">
                  No scorecard compiled yet for {selectedMonth}.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Available Performance Reports</CardTitle>
              <CardDescription>Download compiled quality ratings and delivery summaries.</CardDescription>
            </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>Report Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date Generated</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                  {reports.length > 0 ? (
                      reports.map((report) => (
                        <TableRow key={report.id} className="hover:bg-slate-50/50">
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              <FileText className="mr-2 h-4 w-4 text-blue-500" />
                              {report.title}
                            </div>
                          </TableCell>
                          <TableCell>{report.type}</TableCell>
                          <TableCell>{report.date}</TableCell>
                          <TableCell>{report.size}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm">
                              <Download className="mr-2 h-4 w-4" /> Download
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                  ) : (
                      <TableRow>
                          <TableCell colSpan={5} className="text-center h-24 text-muted-foreground italic">
                              No reports available for you yet.
                          </TableCell>
                      </TableRow>
                  )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-4 rounded-lg border shadow-sm">
            <div>
              <h3 className="font-bold text-slate-800">Checklists & Audits Dashboard</h3>
              <p className="text-sm text-slate-500">Request 4M/CMS templates, or download audit/ESG/Assessment reports.</p>
            </div>
            
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-orange-600 text-white shadow-sm">
                  <Plus className="mr-2 h-4 w-4" /> Request Requisition
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[450px]">
                <form onSubmit={handleRequestRequisition}>
                  <DialogHeader>
                    <DialogTitle>Raise Document Requisition</DialogTitle>
                    <DialogDescription>
                      Request a checklist template or report from the SQA Admin.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label>Requisition Document Category</Label>
                      <Select value={reqType} onValueChange={setReqType} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select report template type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="4M Change report">4M Change Report / Template</SelectItem>
                          <SelectItem value="CMS report">CMS Report / Template</SelectItem>
                          <SelectItem value="supplier audit report">Supplier Audit Report Checklist</SelectItem>
                          <SelectItem value="ESG report">ESG Audit Score Report</SelectItem>
                          <SelectItem value="new assessment report">New Assessment Checklist Report</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Component / Part Number / Reference</Label>
                      <Input 
                        value={partNumber} 
                        onChange={(e) => setPartNumber(e.target.value)} 
                        placeholder="e.g. PART-8874 / CMS-Req-01" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Remarks / Message to SQA Team</Label>
                      <Textarea 
                        value={remarks} 
                        onChange={(e) => setRemarks(e.target.value)} 
                        placeholder="Specify requirements or reason for request..."
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" type="button" onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? "Sending..." : "Submit Request"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="shadow-sm">
            <CardHeader className="bg-slate-50/50">
              <CardTitle>Requisitions & Audit Reports Log</CardTitle>
              <CardDescription>Track status of document requests and download audit findings.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-100/50">
                    <TableHead>Type</TableHead>
                    <TableHead>Part / Ref</TableHead>
                    <TableHead>Date Logged</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Supplier Remarks</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingReqs ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 text-slate-400 italic">
                        Syncing requisitions from server...
                      </TableCell>
                    </TableRow>
                  ) : requisitions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-20 text-slate-400 italic">
                        No requisition requests or audit files found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    requisitions.map((req) => (
                      <TableRow key={req._id || req.id} className="hover:bg-slate-50/50">
                        <TableCell className="font-semibold text-slate-800">{req.type}</TableCell>
                        <TableCell className="font-mono text-xs">{req.partNumber || "N/A"}</TableCell>
                        <TableCell className="text-xs text-slate-500">{req.date}</TableCell>
                        <TableCell>
                          {req.status === "Uploaded" ? (
                            <Badge className="bg-green-100 text-green-800 border-green-300 hover:bg-green-100 font-medium">
                              <ShieldCheck className="h-3 w-3 mr-1" /> Available
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 font-medium">
                              <Clock className="h-3 w-3 mr-1" /> Pending Admin Upload
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-slate-500 text-xs truncate max-w-[200px]" title={req.remarks}>
                          {req.remarks || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {req.status === "Uploaded" && req.fileUrl ? (
                            <Button 
                              variant="default" 
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
                              onClick={() => window.open(req.fileUrl, '_blank')}
                            >
                              <Download className="mr-1.5 h-3.5 w-3.5" /> Download Report
                            </Button>
                          ) : (
                            <Button variant="ghost" size="sm" disabled className="text-slate-400">
                              Not Available
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={printOpen} onOpenChange={setPrintOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto no-print">
          <DialogHeader className="no-print">
            <DialogTitle>Print / Save Official Monthly Report</DialogTitle>
            <DialogDescription>
              Preview and save your official SAKTHI AUTO Monthly Performance Report as a high-fidelity PDF document.
            </DialogDescription>
          </DialogHeader>

          {loadingPrintData ? (
            <div className="text-center py-12 text-slate-400 italic no-print">Loading report data...</div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-end space-x-2 no-print pb-2 border-b">
                <Button 
                  onClick={() => window.print()}
                  className="bg-primary hover:bg-orange-600 text-white font-medium"
                >
                  <Download className="mr-2 h-4 w-4" /> Print / Save as PDF
                </Button>
                <Button variant="outline" onClick={() => setPrintOpen(false)}>
                  Close
                </Button>
              </div>

              {/* Printable container */}
              <div id="print-scorecard-document" className="bg-white text-black p-8 font-sans border shadow-sm mx-auto" style={{ width: '210mm', minHeight: '297mm' }}>
                <style dangerouslySetInnerHTML={{__html: `
                  @media print {
                    body * {
                      visibility: hidden !important;
                    }
                    #print-scorecard-document, #print-scorecard-document * {
                      visibility: visible !important;
                    }
                    #print-scorecard-document {
                      position: absolute !important;
                      left: 0 !important;
                      top: 0 !important;
                      width: 100% !important;
                      padding: 0 !important;
                      margin: 0 !important;
                      border: none !important;
                      box-shadow: none !important;
                    }
                    .no-print {
                      display: none !important;
                    }
                    .page-break {
                      page-break-before: always !important;
                      break-before: page !important;
                    }
                  }
                  .report-table th, .report-table td {
                    border: 1px solid black !important;
                    padding: 4px 6px !important;
                    font-size: 10px !important;
                    text-align: center !important;
                  }
                `}} />

                {/* ================= PAGE 1 ================= */}
                <div className="space-y-4 flex flex-col justify-between" style={{ minHeight: '280mm' }}>
                  <div>
                    {/* Header */}
                    <div className="border border-black flex items-stretch h-16">
                      <div className="w-1/4 border-r border-black p-2 flex flex-col justify-center items-center bg-slate-50">
                        <span className="text-orange-600 font-extrabold text-lg tracking-wider">SAKTHI</span>
                        <span className="text-slate-800 font-bold text-sm -mt-1 tracking-widest">AUTO</span>
                      </div>
                      <div className="w-3/4 flex items-center justify-center font-bold text-md tracking-wider bg-slate-50 text-slate-800">
                        SUPPLIER MONTHLY PERFORMANCE REPORT
                      </div>
                    </div>

                    {/* Address block */}
                    <div className="mt-6 text-[11px] leading-relaxed flex justify-between">
                      <div>
                        <p className="font-bold">To:</p>
                        <p className="font-bold text-slate-800 uppercase mt-1">{supplierDetails?.name || "NSK BEARINGS MANUFACTURING INDIA PVT LTD."}</p>
                        <p className="text-slate-600 max-w-sm whitespace-pre-line mt-0.5">{supplierDetails?.address || "PLOT No - A2,\nSIPCOT ORAGADAM GROWTH CENTRE,\nMATHUR VILLAGE,\nSRIPERUMBUDUR- 602105."}</p>
                        <p className="font-bold text-slate-700 mt-2">KIND ATTN. : Mr.{supplierDetails?.contactPerson || "SUKUMAR PALURU"}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest border border-red-600 px-2 py-0.5 rounded">CONFIDENTIAL</span>
                      </div>
                    </div>

                    {/* Sub Line */}
                    <div className="mt-6 border-b border-slate-300 pb-2">
                      <p className="font-bold text-sm text-slate-800">
                        Sub : Quality & Delivery Performance for {selectedMonth ? formatMonthName(selectedMonth).toUpperCase() : "JANUARY - 2026"}
                      </p>
                    </div>

                    {/* Salutation */}
                    <div className="mt-4 text-[11px]">
                      <p>Dear Sir,</p>
                      <p className="mt-1">Kindly note the Quality & Delivery performance of your company vis-a-vis our targets :</p>
                    </div>

                    {/* Overview Table */}
                    <table className="w-full mt-4 report-table border-collapse">
                      <thead>
                        <tr className="bg-slate-100">
                          <th colSpan={5} className="font-bold text-slate-700">QUALITY</th>
                          <th colSpan={4} className="font-bold text-slate-700">DELIVERY</th>
                          <th colSpan={2} className="font-bold text-slate-700">PERFORMANCE</th>
                        </tr>
                        <tr className="bg-slate-50 text-[9px]">
                          <th>No.of Parts Supplied</th>
                          <th>No.of Problem Reported</th>
                          <th>Rejection Qty</th>
                          <th>PPM</th>
                          <th>4M Summary</th>
                          <th>No.of Parts Planned</th>
                          <th>Delivery Performance</th>
                          <th>Premium Freight</th>
                          <th>Line Stoppage</th>
                          <th>Mark</th>
                          <th>Rank</th>
                        </tr>
                        <tr className="text-[8px] text-slate-500 bg-white">
                          <td>A</td>
                          <td>B</td>
                          <td>C</td>
                          <td>(C/A) x 1000000</td>
                          <td>Ontime submission Yes / No</td>
                          <td>D</td>
                          <td>(A/D) x 100</td>
                          <td>No.of Occurrence</td>
                          <td>No.of Occurrence</td>
                          <td>Target - 100</td>
                          <td>Rank / Out of</td>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const currentStats = scorecard ? getMonthlyStats(selectedMonth) : {
                            partsSupplied: 6144,
                            rejectionQty: 0,
                            ppm: 0,
                            partsPlanned: 6144,
                            otd: 100,
                            responsiveness: "No",
                            premiumFreight: 0,
                            lineStoppage: 0,
                            totalScore: 90,
                            grade: "B"
                          };
                          return (
                            <tr className="font-bold text-slate-800">
                              <td>{currentStats.partsSupplied}</td>
                              <td>0</td>
                              <td>{currentStats.rejectionQty}</td>
                              <td>{currentStats.ppm}</td>
                              <td>{currentStats.responsiveness}</td>
                              <td>{currentStats.partsPlanned}</td>
                              <td>{currentStats.otd}%</td>
                              <td>{currentStats.premiumFreight}</td>
                              <td>{currentStats.lineStoppage}</td>
                              <td className="text-primary font-extrabold">{currentStats.totalScore}</td>
                              <td className="text-blue-600 font-extrabold">1 / 8</td>
                            </tr>
                          );
                        })()}
                      </tbody>
                    </table>

                    {/* Twin Line Charts */}
                    <div className="grid grid-cols-2 gap-4 mt-8">
                      <div className="border p-2 rounded bg-white">
                        <p className="text-[10px] font-bold text-slate-700 text-center mb-1">QUALITY PERFORMANCE</p>
                        <div className="h-44 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={fyMonths.map(m => getMonthlyStats(m))}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="monthLabel" tick={{ fontSize: 7 }} />
                              <YAxis tick={{ fontSize: 7 }} />
                              <Tooltip />
                              <Legend wrapperStyle={{ fontSize: 8 }} />
                              <Line type="monotone" dataKey="ppm" stroke="#22c55e" strokeWidth={1.5} name="Actual PPM" activeDot={{ r: 4 }} />
                              <Line type="monotone" dataKey="targetPpm" stroke="#2563eb" strokeWidth={1.5} name="Target PPM" defaultValue={0} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      <div className="border p-2 rounded bg-white">
                        <p className="text-[10px] font-bold text-slate-700 text-center mb-1">DELIVERY PERFORMANCE</p>
                        <div className="h-44 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={fyMonths.map(m => getMonthlyStats(m))}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="monthLabel" tick={{ fontSize: 7 }} />
                              <YAxis domain={[0, 120]} tick={{ fontSize: 7 }} />
                              <Tooltip />
                              <Legend wrapperStyle={{ fontSize: 8 }} />
                              <Line type="monotone" dataKey="otd" stroke="#22c55e" strokeWidth={1.5} name="Delivery Performance" activeDot={{ r: 4 }} />
                              <Line type="monotone" dataKey="targetDelivery" stroke="#2563eb" strokeWidth={1.5} name="Target %" defaultValue={100} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sign-off footer */}
                  <div className="border-t pt-4 text-[10px] space-y-4">
                    <p className="italic text-slate-500">This is for your information and records.</p>
                    <div className="flex justify-between items-end pt-4">
                      <div>
                        <p className="font-semibold">Yours faithfully,</p>
                        <p className="font-bold text-slate-800 mt-1">For Sakthi Auto Component Limited</p>
                        <div className="h-10 mt-2 flex items-center">
                          {scorecard?.qualitySignedBy && (
                            <span className="font-mono text-[9px] text-green-700 border border-green-300 bg-green-50 px-2 py-0.5 rounded">
                              Digitally signed by: {scorecard.qualitySignedBy}
                            </span>
                          )}
                        </div>
                        <p className="font-bold text-slate-800 mt-1">K.G.MOHANASUNDARAM - GM (QA & CR)</p>
                        <p className="text-slate-500">QUALITY HEAD</p>
                      </div>
                      <div className="text-right text-[8px] text-slate-400">
                        <p>QF/07/MID - 17, Rev.No:01 dt 01.10.2020</p>
                        <p className="font-bold text-slate-800 mt-0.5">Page 01 of 02</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ================= PAGE 2 ================= */}
                <div className="page-break pt-8 space-y-6 flex flex-col justify-between" style={{ minHeight: '280mm' }}>
                  <div>
                    {/* Header */}
                    <div className="border border-black flex items-stretch h-16">
                      <div className="w-1/4 border-r border-black p-2 flex flex-col justify-center items-center bg-slate-50">
                        <span className="text-orange-600 font-extrabold text-lg tracking-wider">SAKTHI</span>
                        <span className="text-slate-800 font-bold text-sm -mt-1 tracking-widest">AUTO</span>
                      </div>
                      <div className="w-3/4 flex items-center justify-center font-bold text-md tracking-wider bg-slate-50 text-slate-800">
                        SUPPLIER MONTHLY PERFORMANCE REPORT
                      </div>
                    </div>

                    <div className="mt-4 text-xs font-bold text-slate-800 uppercase">
                      SUPPLIER NAME : {supplierDetails?.name || "NSK BEARINGS MANUFACTURING INDIA PVT LTD."}
                    </div>

                    {/* 1. Quality Month-by-month table */}
                    <div className="mt-4 space-y-1">
                      <p className="text-[10px] font-bold bg-slate-800 text-white px-2 py-0.5 rounded">QUALITY PERFORMANCE</p>
                      <table className="w-full report-table border-collapse">
                        <thead>
                          <tr className="bg-slate-50 font-bold">
                            <th className="text-left">Month</th>
                            {fyMonths.map(m => <th key={m}>{formatMonthName(m)}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="text-left font-semibold">No.of Parts Supplied</td>
                            {fyMonths.map(m => <td key={m}>{getMonthlyStats(m).partsSupplied}</td>)}
                          </tr>
                          <tr>
                            <td className="text-left font-semibold">Rejection Qty</td>
                            {fyMonths.map(m => <td key={m}>{getMonthlyStats(m).rejectionQty}</td>)}
                          </tr>
                          <tr className="font-bold text-slate-800 bg-slate-50/50">
                            <td className="text-left">Actual PPM</td>
                            {fyMonths.map(m => <td key={m}>{getMonthlyStats(m).ppm}</td>)}
                          </tr>
                          <tr className="text-slate-500">
                            <td className="text-left">Target PPM</td>
                            {fyMonths.map(m => <td key={m}>0</td>)}
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* 2. Delivery Month-by-month table */}
                    <div className="mt-4 space-y-1">
                      <p className="text-[10px] font-bold bg-slate-800 text-white px-2 py-0.5 rounded">DELIVERY PERFORMANCE</p>
                      <table className="w-full report-table border-collapse">
                        <thead>
                          <tr className="bg-slate-50 font-bold">
                            <th className="text-left">Month</th>
                            {fyMonths.map(m => <th key={m}>{formatMonthName(m)}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="text-left font-semibold">No.of Parts Planned</td>
                            {fyMonths.map(m => <td key={m}>{getMonthlyStats(m).partsPlanned}</td>)}
                          </tr>
                          <tr>
                            <td className="text-left font-semibold">No.of Parts Supplied</td>
                            {fyMonths.map(m => <td key={m}>{getMonthlyStats(m).partsSupplied}</td>)}
                          </tr>
                          <tr className="font-bold text-slate-800 bg-slate-50/50">
                            <td className="text-left">Delivery Performance %</td>
                            {fyMonths.map(m => <td key={m}>{getMonthlyStats(m).otd}</td>)}
                          </tr>
                          <tr className="text-slate-500">
                            <td className="text-left">Target %</td>
                            {fyMonths.map(m => <td key={m}>100</td>)}
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* 3. Premium Freight Month-by-month table */}
                    <div className="mt-4 space-y-1">
                      <p className="text-[10px] font-bold bg-slate-800 text-white px-2 py-0.5 rounded">PREMIUM FREIGHT</p>
                      <table className="w-full report-table border-collapse">
                        <thead>
                          <tr className="bg-slate-50 font-bold">
                            <th className="text-left">Month</th>
                            {fyMonths.map(m => <th key={m}>{formatMonthName(m)}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="text-left font-semibold">Actual</td>
                            {fyMonths.map(m => <td key={m}>{getMonthlyStats(m).premiumFreight}</td>)}
                          </tr>
                          <tr className="text-slate-500">
                            <td className="text-left">Target</td>
                            {fyMonths.map(m => <td key={m}>0</td>)}
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* 4. Line Stoppage Month-by-month table */}
                    <div className="mt-4 space-y-1">
                      <p className="text-[10px] font-bold bg-slate-800 text-white px-2 py-0.5 rounded">LINE STOPPAGE</p>
                      <table className="w-full report-table border-collapse">
                        <thead>
                          <tr className="bg-slate-50 font-bold">
                            <th className="text-left">Month</th>
                            {fyMonths.map(m => <th key={m}>{formatMonthName(m)}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="text-left font-semibold">Actual</td>
                            {fyMonths.map(m => <td key={m}>{getMonthlyStats(m).lineStoppage}</td>)}
                          </tr>
                          <tr className="text-slate-500">
                            <td className="text-left">Target</td>
                            {fyMonths.map(m => <td key={m}>0</td>)}
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Score Rating calculation grid */}
                    <div className="mt-6 border border-black p-3 bg-slate-50/50 rounded flex justify-between items-stretch">
                      <div className="w-[120px] flex items-center justify-center border-r border-black font-extrabold text-sm text-center tracking-wider text-slate-800 leading-tight">
                        PERFORMANCE RATING CALCULATION
                      </div>
                      
                      <div className="flex-1 pl-4 grid grid-cols-3 gap-4 text-[10px]">
                        <div>
                          <p className="font-bold border-b pb-1 mb-1.5 text-slate-700">QUALITY (60m)</p>
                          <div className="space-y-1">
                            <p className="flex justify-between"><span>0 PPM</span><span className="font-semibold">60m</span></p>
                            <p className="flex justify-between"><span>1-10 PPM</span><span className="font-semibold">50m</span></p>
                            <p className="flex justify-between"><span>11-20 PPM</span><span className="font-semibold">40m</span></p>
                            <p className="flex justify-between"><span>21-30 PPM</span><span className="font-semibold">30m</span></p>
                            <p className="flex justify-between"><span>31-40 PPM</span><span className="font-semibold">20m</span></p>
                            <p className="flex justify-between"><span>&gt;40 PPM</span><span className="font-semibold">0m</span></p>
                            <p className="flex justify-between border-t pt-1 font-bold text-primary">
                              <span>ACTUAL MARKS</span>
                              <span>{scorecard?.qualityScore || 60}</span>
                            </p>
                          </div>
                        </div>

                        <div>
                          <p className="font-bold border-b pb-1 mb-1.5 text-slate-700">DELIVERY (20m)</p>
                          <div className="space-y-1">
                            <p className="flex justify-between"><span>100% OTD</span><span className="font-semibold">20m</span></p>
                            <p className="flex justify-between"><span>95-99%</span><span className="font-semibold">15m</span></p>
                            <p className="flex justify-between"><span>90-94%</span><span className="font-semibold">10m</span></p>
                            <p className="flex justify-between"><span>85-89%</span><span className="font-semibold">5m</span></p>
                            <p className="flex justify-between"><span>80-84%</span><span className="font-semibold">2m</span></p>
                            <p className="flex justify-between"><span>&lt;80%</span><span className="font-semibold">0m</span></p>
                            <p className="flex justify-between border-t pt-1 font-bold text-primary">
                              <span>ACTUAL MARKS</span>
                              <span>{scorecard?.deliveryScore || 20}</span>
                            </p>
                          </div>
                        </div>

                        <div>
                          <p className="font-bold border-b pb-1 mb-1.5 text-slate-700">OTHERS (20m)</p>
                          <div className="space-y-1">
                            <p className="flex justify-between"><span>4M On-time</span><span className="font-semibold">10m</span></p>
                            <p className="flex justify-between"><span>Delay / None</span><span className="font-semibold">0m</span></p>
                            <p className="flex justify-between mt-1"><span>Premium Freight Nil</span><span className="font-semibold">5m</span></p>
                            <p className="flex justify-between"><span>Used</span><span className="font-semibold">0m</span></p>
                            <p className="flex justify-between mt-1"><span>Line Stoppage Nil</span><span className="font-semibold">5m</span></p>
                            <p className="flex justify-between"><span>Occurred</span><span className="font-semibold">0m</span></p>
                            <p className="flex justify-between border-t pt-1 font-bold text-primary">
                              <span>ACTUAL MARKS</span>
                              <span>{(scorecard?.responsivenessScore || 10) + (scorecard?.auditScore || 10)}</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sign-off footer page 2 */}
                  <div className="border-t pt-4 text-[10px] flex justify-between items-end">
                    <p className="italic text-slate-400">Sakthi Auto Component Limited Official Audit Ledger</p>
                    <div className="text-right text-[8px] text-slate-400">
                      <p>QF/07/MID - 17, Rev.No:01 dt 01.10.2020</p>
                      <p className="font-bold text-slate-800 mt-0.5">Page 02 of 02</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

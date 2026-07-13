"use client"

import { useState, useEffect } from "react"
import { FileText, Download, Search, Plus, FileSpreadsheet, FileCheck2, ShieldCheck, Clock, Send } from "lucide-react"
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

export default function SupplierReportsPage() {
  const [currentUser] = useLocalStorage("currentUserId", "SUP001")
  const [allReports] = useLocalStorage<Report[]>("portal_reports", MOCK_REPORTS)
  const [activeTab, setActiveTab] = useState<"standard" | "requisitions">("standard")

  // Scorecard state
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const [scorecard, setScorecard] = useState<any | null>(null)
  const [loadingScorecard, setLoadingScorecard] = useState(false)

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
    </div>
  )
}

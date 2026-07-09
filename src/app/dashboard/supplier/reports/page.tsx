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

  useEffect(() => {
    if (currentUser) {
      fetchRequisitions()
    }
  }, [currentUser])

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

"use client"

import { useState, useEffect } from "react"
import { FileText, Download, TrendingUp, BarChart3, Users, Filter, PieChart, Activity, Plus, ShieldCheck, Clock, Upload, ArrowUpToLine, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

export default function AdminReportsPage() {
  const [activeTab, setActiveTab] = useState<"analytics" | "requisitions">("analytics")
  
  // Analytics State
  const [reportData, setReportData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({
      month: new Date().toISOString().slice(0, 7), // YYYY-MM
      category: 'All',
      reportType: 'Performance Summary'
  })

  // Requisitions & Audits State
  const [requisitions, setRequisitions] = useState<any[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [loadingReqs, setLoadingReqs] = useState(true)
  
  // Modals state
  const [directUploadOpen, setDirectUploadOpen] = useState(false)
  const [reqUploadOpen, setReqUploadOpen] = useState(false)
  const [selectedReq, setSelectedReq] = useState<any | null>(null)
  
  // Direct Upload form state
  const [targetSupplierId, setTargetSupplierId] = useState("")
  const [directReportType, setDirectReportType] = useState("")
  const [directPartNumber, setDirectPartNumber] = useState("")
  const [directRemarks, setDirectRemarks] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetchReportData()
  }, [filter])

  useEffect(() => {
    fetchSuppliers()
    fetchRequisitions()
  }, [])

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

  const fetchRequisitions = async () => {
    setLoadingReqs(true)
    try {
      const res = await fetch('/api/reports/requisitions')
      if (res.ok) {
        setRequisitions(await res.json())
      }
    } catch (e) {
      console.error(e)
    }
    setLoadingReqs(false)
  }

  const fetchReportData = async () => {
    setLoading(true)
    try {
        const res = await fetch(`/api/reports?month=${filter.month}&category=${filter.category}&type=${filter.reportType}`)
        if (res.ok) {
            setReportData(await res.json())
        }
    } catch (e) {
        console.error(e)
    }
    setLoading(false)
  }

  const handleExport = () => {
      alert(`Exporting ${filter.reportType} for ${filter.month} (${filter.category})...`)
  }

  // Handle direct audit report upload (POST)
  const handleDirectUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!targetSupplierId || !directReportType || !selectedFile) {
      alert("Please select supplier, report category, and file.")
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append("type", directReportType)
    formData.append("supplierId", targetSupplierId)
    formData.append("partNumber", directPartNumber || "N/A")
    formData.append("remarks", directRemarks)
    formData.append("file", selectedFile)
    formData.append("date", new Date().toISOString().split('T')[0])

    try {
      const res = await fetch('/api/reports/requisitions', {
        method: 'POST',
        body: formData
      })
      const result = await res.json()
      if (result.success) {
        alert("Direct Audit/ESG Report uploaded and supplier notified successfully!")
        setDirectUploadOpen(false)
        setTargetSupplierId("")
        setDirectReportType("")
        setDirectPartNumber("")
        setDirectRemarks("")
        setSelectedFile(null)
        fetchRequisitions()
      } else {
        alert(`Upload failed: ${result.message}`)
      }
    } catch (error) {
      console.error(error)
      alert("Network error: Upload failed.")
    }
    setUploading(false)
  }

  // Handle uploading file to existing requisition request (PUT)
  const handleRequisitionUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedReq || !selectedFile) {
      alert("Please select a file.")
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append("id", selectedReq.id)
    formData.append("file", selectedFile)

    try {
      const res = await fetch('/api/reports/requisitions', {
        method: 'PUT',
        body: formData
      })
      const result = await res.json()
      if (result.success) {
        alert("Requested document uploaded successfully!")
        setReqUploadOpen(false)
        setSelectedReq(null)
        setSelectedFile(null)
        fetchRequisitions()
      } else {
        alert(`Upload failed: ${result.message}`)
      }
    } catch (error) {
      console.error(error)
      alert("Network error: Upload failed.")
    }
    setUploading(false)
  }

  return (
    <div className="flex-1 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-800">Advanced Analytics & Reporting</h2>
            <p className="text-slate-500">Monthly PPM analysis, supplier ratings, and audit reports.</p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Tab toggler */}
          <div className="flex bg-slate-100 p-1 rounded-lg border mr-2">
            <Button 
              variant={activeTab === "analytics" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("analytics")}
              className="rounded-md"
            >
              <BarChart3 className="h-4 w-4 mr-2" /> PPM & Ratings
            </Button>
            <Button 
              variant={activeTab === "requisitions" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("requisitions")}
              className="rounded-md"
            >
              <Users className="h-4 w-4 mr-2" /> Requisitions & Audits
            </Button>
          </div>

          {activeTab === "analytics" && (
            <Button onClick={handleExport} className="bg-primary hover:bg-orange-600 text-white">
                <Download className="mr-2 h-4 w-4" /> Export Excel
            </Button>
          )}
        </div>
      </div>

      {activeTab === "analytics" ? (
        <>
          {/* Filters */}
          <Card className="bg-slate-50 border-slate-200">
              <CardContent className="pt-6">
                  <div className="grid gap-4 md:grid-cols-4">
                      <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase">Analysis Month</label>
                          <input 
                            type="month" 
                            value={filter.month}
                            onChange={(e) => setFilter({...filter, month: e.target.value})}
                            className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                          />
                      </div>
                      <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase">Supplier Category</label>
                          <Select value={filter.category} onValueChange={(v) => setFilter({...filter, category: v})}>
                              <SelectTrigger className="bg-white border-slate-300"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                  <SelectItem value="All">All Categories</SelectItem>
                                  <SelectItem value="Pre-Machining">Pre-Machining</SelectItem>
                                  <SelectItem value="Child-Part">Child-Part</SelectItem>
                              </SelectContent>
                          </Select>
                      </div>
                      <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase">Report Logic</label>
                          <Select value={filter.reportType} onValueChange={(v) => setFilter({...filter, reportType: v})}>
                              <SelectTrigger className="bg-white border-slate-300"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                  <SelectItem value="Performance Summary">Supplier Performance Summary</SelectItem>
                                  <SelectItem value="PPM Analysis">Detailed PPM Analysis</SelectItem>
                                  <SelectItem value="Debit Summary">Debit Note Recovery Report</SelectItem>
                                  <SelectItem value="Rating Distribution">Rating Grade Distribution</SelectItem>
                                  <SelectItem value="Comparison">Supplier vs Admin Log Comparison</SelectItem>
                              </SelectContent>
                          </Select>
                      </div>
                      <div className="flex items-end">
                          <Button variant="outline" className="w-full border-slate-300" onClick={fetchReportData}>
                              <Activity className="mr-2 h-4 w-4" /> Refresh Data
                          </Button>
                      </div>
                  </div>
              </CardContent>
          </Card>

          {/* Quick Analytics */}
          <div className="grid gap-4 md:grid-cols-4">
              <Card className="shadow-sm border-l-4 border-l-blue-500">
                  <CardContent className="pt-4">
                      <p className="text-xs font-medium text-slate-500 uppercase">Avg. Group PPM</p>
                      <div className="text-xl font-bold flex items-center justify-between">
                          {reportData.length > 0 ? Math.round(reportData.reduce((acc, c) => acc + (c.ppm || 0), 0) / reportData.length).toLocaleString() : '0'}
                          <TrendingUp className="h-4 w-4 text-blue-500 opacity-50" />
                      </div>
                  </CardContent>
              </Card>
              <Card className="shadow-sm border-l-4 border-l-green-500">
                  <CardContent className="pt-4">
                      <p className="text-xs font-medium text-slate-500 uppercase">Grade A+ Suppliers</p>
                      <div className="text-xl font-bold flex items-center justify-between">
                          {reportData.filter(r => r.grade === 'A+').length}
                          <PieChart className="h-4 w-4 text-green-500 opacity-50" />
                      </div>
                  </CardContent>
              </Card>
              <Card className="shadow-sm border-l-4 border-l-red-500">
                  <CardContent className="pt-4">
                      <p className="text-xs font-medium text-slate-500 uppercase">High PPM Alert (&gt;2000)</p>
                      <div className="text-xl font-bold flex items-center justify-between text-red-600">
                          {reportData.filter(r => r.ppm > 2000).length} Suppliers
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                      </div>
                  </CardContent>
              </Card>
              <Card className="shadow-sm border-l-4 border-l-primary">
                  <CardContent className="pt-4">
                      <p className="text-xs font-medium text-slate-500 uppercase">Total Active Partners</p>
                      <div className="text-xl font-bold flex items-center justify-between">
                          {reportData.length} Suppliers
                          <Users className="h-4 w-4 text-primary opacity-50" />
                      </div>
                  </CardContent>
              </Card>
          </div>

          <Card className="shadow-md">
              <CardHeader className="bg-slate-50/50">
                  <CardTitle className="text-lg flex items-center">
                      <FileText className="mr-2 h-5 w-5 text-slate-400" /> {filter.reportType} Report Ledger
                  </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                   <Table>
                      <TableHeader>
                          <TableRow className="bg-slate-100/50">
                              <TableHead>Supplier ID</TableHead>
                              {filter.reportType === "Comparison" ? (
                                  <>
                                      <TableHead>Date</TableHead>
                                      <TableHead>Component</TableHead>
                                      <TableHead>Supplier Qty</TableHead>
                                      <TableHead>Admin Qty</TableHead>
                                      <TableHead>Status</TableHead>
                                  </>
                              ) : (
                                  <>
                                      <TableHead>PPM Score</TableHead>
                                      <TableHead>OTD Rate</TableHead>
                                      <TableHead>Overall Score</TableHead>
                                      <TableHead>Quality Grade</TableHead>
                                      <TableHead className="text-right">Action</TableHead>
                                  </>
                              )}
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {loading ? (
                              <TableRow>
                                  <TableCell colSpan={6} className="text-center py-10 text-slate-400 italic">
                                      Loading analytics ledger data...
                                  </TableCell>
                              </TableRow>
                          ) : reportData.length === 0 ? (
                              <TableRow>
                                  <TableCell colSpan={6} className="text-center py-20 text-slate-400 italic">
                                      No analytics compiled for selected filters.
                                  </TableCell>
                              </TableRow>
                          ) : filter.reportType === "Comparison" ? (
                              reportData.map((row, i) => {
                                  const isMismatched = row.supplierQty !== row.adminQty;
                                  return (
                                      <TableRow key={i} className="hover:bg-slate-50">
                                          <TableCell className="font-bold">{row.supplierId}</TableCell>
                                          <TableCell className="font-mono text-xs">{row.date}</TableCell>
                                          <TableCell className="font-mono text-xs">{row.partNumber}</TableCell>
                                          <TableCell className="font-bold">{row.supplierQty}</TableCell>
                                          <TableCell className="font-bold">{row.adminQty}</TableCell>
                                          <TableCell>
                                              {isMismatched ? (
                                                  <Badge variant="destructive" className="animate-pulse">
                                                      Mismatched
                                                  </Badge>
                                              ) : (
                                                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                      Matching
                                                  </Badge>
                                              )}
                                          </TableCell>
                                      </TableRow>
                                  );
                              })
                          ) : (
                              reportData.map((row, i) => (
                                  <TableRow key={i} className="hover:bg-slate-50">
                                      <TableCell className="font-bold">{row.supplierId}</TableCell>
                                      <TableCell className={cn(row.ppm > 2000 ? "text-red-600 font-bold" : "text-green-600")}>
                                          {row.ppm.toLocaleString()}
                                      </TableCell>
                                      <TableCell>{row.otd}%</TableCell>
                                      <TableCell className="font-bold">{row.totalScore}</TableCell>
                                      <TableCell>
                                          <Badge variant={row.grade === 'A+' ? 'default' : row.grade === 'D' ? 'destructive' : 'outline'} className={row.grade === 'A+' ? 'bg-green-600' : ''}>
                                              {row.grade}
                                          </Badge>
                                      </TableCell>
                                      <TableCell className="text-right">
                                          <Button variant="ghost" size="sm" className="h-8">
                                              <FileText className="h-4 w-4 mr-1" /> Profile
                                          </Button>
                                      </TableCell>
                                  </TableRow>
                              ))
                          )}
                      </TableBody>
                   </Table>
              </CardContent>
          </Card>
        </>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-4 rounded-lg border shadow-sm">
            <div>
              <h3 className="font-bold text-slate-800">Supplier Document Requisitions & Checklists</h3>
              <p className="text-sm text-slate-500">Provide templates or upload direct ESG/Supplier Audit/Assessment reports.</p>
            </div>
            
            <Dialog open={directUploadOpen} onOpenChange={setDirectUploadOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-orange-600 text-white shadow-sm">
                  <Upload className="mr-2 h-4 w-4" /> Upload Direct Audit Report
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[450px]">
                <form onSubmit={handleDirectUploadSubmit}>
                  <DialogHeader>
                    <DialogTitle>Upload Audit Report to Supplier</DialogTitle>
                    <DialogDescription>
                      Deliver audit, ESG, or assessment findings directly to a supplier.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label>Target Supplier</Label>
                      <Select value={targetSupplierId} onValueChange={setTargetSupplierId} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Supplier" />
                        </SelectTrigger>
                        <SelectContent>
                          {suppliers.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name} ({s.id})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Report Category</Label>
                      <Select value={directReportType} onValueChange={setDirectReportType} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Report Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="supplier audit report">Supplier Audit Report Checklist</SelectItem>
                          <SelectItem value="ESG report">ESG Audit Score Report</SelectItem>
                          <SelectItem value="new assessment report">New Assessment Checklist Report</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Component / Part Number / Ref</Label>
                      <Input 
                        value={directPartNumber} 
                        onChange={(e) => setDirectPartNumber(e.target.value)} 
                        placeholder="e.g. PART-8874 / audit-2026" 
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Audit Summary / Remarks</Label>
                      <Textarea 
                        value={directRemarks} 
                        onChange={(e) => setDirectRemarks(e.target.value)} 
                        placeholder="Brief summary of findings or audit rating..."
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Select Audit Report File (PDF/Excel/Image)</Label>
                      <Input 
                        type="file" 
                        required
                        className="cursor-pointer"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} 
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" type="button" onClick={() => setDirectUploadOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={uploading}>
                      {uploading ? "Uploading..." : "Upload & Send"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="shadow-sm">
            <CardHeader className="bg-slate-50/50">
              <CardTitle>Supplier Requisitions Ledger</CardTitle>
              <CardDescription>Review and fulfill supplier requests, or view direct uploaded reports.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-100/50">
                    <TableHead>Supplier</TableHead>
                    <TableHead>Document Type</TableHead>
                    <TableHead>Part / Ref</TableHead>
                    <TableHead>Date Logged</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Supplier Request Remarks</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingReqs ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10 text-slate-400 italic">
                        Syncing requisitions ledger...
                      </TableCell>
                    </TableRow>
                  ) : requisitions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-20 text-slate-400 italic">
                        No requisition requests or audit files found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    requisitions.map((req) => (
                      <TableRow key={req._id || req.id} className="hover:bg-slate-50/50">
                        <TableCell>
                          <div className="font-bold text-slate-700">{req.supplierName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{req.supplierId}</div>
                        </TableCell>
                        <TableCell className="font-semibold text-slate-800">{req.type}</TableCell>
                        <TableCell className="font-mono text-xs">{req.partNumber || "N/A"}</TableCell>
                        <TableCell className="text-xs text-slate-500">{req.date}</TableCell>
                        <TableCell>
                          {req.status === "Uploaded" ? (
                            <Badge className="bg-green-100 text-green-800 border-green-300 hover:bg-green-100 font-medium">
                              <ShieldCheck className="h-3 w-3 mr-1" /> Fulfllled
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 font-medium">
                              <Clock className="h-3 w-3 mr-1" /> Pending Upload
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-slate-500 text-xs truncate max-w-[200px]" title={req.remarks}>
                          {req.remarks || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {req.status === "Uploaded" && req.fileUrl ? (
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-blue-600 border-blue-200 hover:bg-blue-50 font-medium"
                              onClick={() => window.open(req.fileUrl, '_blank')}
                            >
                              <Download className="mr-1 h-3.5 w-3.5" /> Download Report
                            </Button>
                          ) : (
                            <Button 
                              variant="default" 
                              size="sm" 
                              className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
                              onClick={() => {
                                setSelectedReq(req)
                                setReqUploadOpen(true)
                              }}
                            >
                              <Upload className="mr-1 h-3.5 w-3.5" /> Fulfill (Upload File)
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

      {/* Modal for fulfilling requisition uploads */}
      <Dialog open={reqUploadOpen} onOpenChange={setReqUploadOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <form onSubmit={handleRequisitionUploadSubmit}>
            <DialogHeader>
              <DialogTitle>Upload Requested Document</DialogTitle>
              <DialogDescription>
                Fulfill requisition request for supplier {selectedReq?.supplierName}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-1">
                <div className="text-xs text-slate-500 font-bold uppercase">Requested Item</div>
                <div className="text-sm font-semibold text-slate-800">{selectedReq?.type}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-slate-500 font-bold uppercase">Part Ref</div>
                <div className="text-sm font-mono">{selectedReq?.partNumber || "N/A"}</div>
              </div>
              <div className="space-y-2 border-t pt-3">
                <Label>Select Template / Document File to Fulfill</Label>
                <Input 
                  type="file" 
                  required
                  className="cursor-pointer"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} 
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => {
                setReqUploadOpen(false)
                setSelectedReq(null)
                setSelectedFile(null)
              }}>Cancel</Button>
              <Button type="submit" disabled={uploading}>
                {uploading ? "Fulfilling..." : "Upload & Fulfill"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

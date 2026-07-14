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
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from "recharts"

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
  
  // Add Direct Audits/Upload form state
  const [targetSupplierId, setTargetSupplierId] = useState("")
  const [directReportType, setDirectReportType] = useState("")
  const [directPartNumber, setDirectPartNumber] = useState("")
  const [directRemarks, setDirectRemarks] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  // Scorecard Breakdown & E-Sign states
  const [scorecardDialogOpen, setScorecardDialogOpen] = useState(false)
  const [selectedScorecard, setSelectedScorecard] = useState<any | null>(null)
  const [inputSignerName, setInputSignerName] = useState("")
  const [savingParameters, setSavingParameters] = useState(false)

  const [localResponsiveness, setLocalResponsiveness] = useState(10)
  const [localPremiumFreight, setLocalPremiumFreight] = useState(5)
  const [localLineStoppage, setLocalLineStoppage] = useState(5)

  // Printable Report States
  const [printOpen, setPrintOpen] = useState(false)
  const [supplierDetails, setSupplierDetails] = useState<any | null>(null)
  const [allYearLogs, setAllYearLogs] = useState<any[]>([])
  const [allYearScorecards, setAllYearScorecards] = useState<any[]>([])
  const [loadingPrintData, setLoadingPrintData] = useState(false)

  const fyMonths = getFinancialYearMonths(filter.month)

  const handleOpenPrintPreview = async (supplierId: string) => {
    setPrintOpen(true)
    setLoadingPrintData(true)
    try {
      const supRes = await fetch(`/api/suppliers?id=${supplierId}`)
      if (supRes.ok) {
        setSupplierDetails(await supRes.json())
      }

      const prodRes = await fetch(`/api/production?supplierId=${supplierId}&enteredBy=Admin`)
      if (prodRes.ok) {
        setAllYearLogs(await prodRes.json())
      }

      const fyMonths = getFinancialYearMonths(filter.month)
      const fetchedScorecards = []
      for (const m of fyMonths) {
        const scoreRes = await fetch(`/api/reports?month=${m}`)
        if (scoreRes.ok) {
          const list = await scoreRes.json()
          const rec = list.find((row: any) => row.supplierId === supplierId)
          if (rec) {
            fetchedScorecards.push({ ...rec, month: m })
          } else {
            fetchedScorecards.push({
              month: m,
              supplierId: supplierId,
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
    const isFuture = mStr > filter.month;
    if (isFuture) {
      return {
        monthLabel: formatMonthName(mStr),
        partsSupplied: "",
        rejectionQty: "",
        ppm: "",
        partsPlanned: "",
        otd: "",
        responsiveness: "",
        premiumFreight: "",
        lineStoppage: "",
        totalScore: "",
        grade: "",
        targetPpm: "",
        targetDelivery: ""
      }
    }

    const logs = allYearLogs.filter(log => log.date.startsWith(mStr))
    const partsSupplied = logs.reduce((sum, l) => sum + (l.dispatch || 0), 0)
    const rejectionQty = logs.reduce((sum, l) => sum + (l.rejection || 0), 0)
    const partsPlanned = logs.reduce((sum, l) => sum + (l.plannedQty || 0), 0)
    const ppm = partsSupplied > 0 ? Math.round((rejectionQty / partsSupplied) * 1000000) : 0
    const otd = partsPlanned > 0 ? Math.min(100, Math.round((partsSupplied / partsPlanned) * 100)) : 0
    
    const sc = allYearScorecards.find(s => s.month === mStr) || {
      responsivenessScore: 0,
      auditScore: 0,
      totalScore: 0,
      grade: '-'
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
      grade: sc.grade,
      targetPpm: selectedScorecard?.category === "Child-Part" ? 40 : 2000,
      targetDelivery: 100
    }
  }

  useEffect(() => {
    if (selectedScorecard) {
      setLocalResponsiveness(selectedScorecard.responsivenessScore !== undefined ? selectedScorecard.responsivenessScore : 10)
      const audit = selectedScorecard.auditScore !== undefined ? selectedScorecard.auditScore : 10
      if (audit === 10) {
        setLocalPremiumFreight(5)
        setLocalLineStoppage(5)
      } else if (audit === 5) {
        setLocalPremiumFreight(5)
        setLocalLineStoppage(0)
      } else {
        setLocalPremiumFreight(0)
        setLocalLineStoppage(0)
      }
    }
  }, [selectedScorecard])

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

  const calculateGrade = (score: number) => {
      if (score >= 95) return 'A+'
      if (score >= 90) return 'A'
      if (score >= 80) return 'B'
      if (score >= 70) return 'C'
      return 'D'
  }

  const handleSaveParameters = async (responsiveness: number, audit: number) => {
      if (!selectedScorecard) return
      setSavingParameters(true)
      try {
          const res = await fetch('/api/reports', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  supplierId: selectedScorecard.supplierId,
                  month: filter.month,
                  ppm: selectedScorecard.ppm,
                  otd: selectedScorecard.otd,
                  qualityScore: selectedScorecard.qualityScore,
                  deliveryScore: selectedScorecard.deliveryScore,
                  responsivenessScore: responsiveness,
                  auditScore: audit,
                  totalScore: selectedScorecard.qualityScore + selectedScorecard.deliveryScore + responsiveness + audit,
                  grade: calculateGrade(selectedScorecard.qualityScore + selectedScorecard.deliveryScore + responsiveness + audit)
              })
          })
          if (res.ok) {
              alert("Evaluation parameters updated successfully!")
              fetchReportData()
              setScorecardDialogOpen(false)
          }
      } catch (e) {
          console.error(e)
          alert("Network error: Failed to save scorecard.")
      }
      setSavingParameters(false)
  }

  const handleSignReport = async (dept: "Quality" | "Delivery" | "Management") => {
      if (!selectedScorecard) return
      if (!inputSignerName.trim()) {
          alert("Please enter signer name to authorize.")
          return
      }
      try {
          const body: any = {
              supplierId: selectedScorecard.supplierId,
              month: filter.month,
              signerName: inputSignerName
          }
          if (dept === "Quality") body.signQuality = true
          if (dept === "Delivery") body.signDelivery = true
          if (dept === "Management") body.signManagement = true

          const res = await fetch('/api/reports', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body)
          })
          if (res.ok) {
              alert(`Report successfully authorized with e-sign by ${inputSignerName} (${dept} Department)!`)
              fetchReportData()
              setScorecardDialogOpen(false)
              setInputSignerName("")
          }
      } catch (e) {
          console.error(e)
          alert("Network error: Signing failed.")
      }
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
                                      <TableHead>Evaluation Rank</TableHead>
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
                                      <TableCell className="font-bold text-blue-600">
                                          #{i + 1}
                                      </TableCell>
                                      <TableCell className="text-right">
                                          <Button 
                                              variant="ghost" 
                                              size="sm" 
                                              className="h-8 text-primary hover:bg-orange-50 hover:text-primary font-semibold"
                                              onClick={() => {
                                                  setSelectedScorecard(row)
                                                  setScorecardDialogOpen(true)
                                              }}
                                          >
                                              <FileText className="h-4 w-4 mr-1" /> View Report
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

      <Dialog open={scorecardDialogOpen} onOpenChange={setScorecardDialogOpen}>
          <DialogContent className="max-w-3xl border-t-4 border-t-primary max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-slate-800">
                      Monthly Supplier Performance Evaluation
                  </DialogTitle>
                  <DialogDescription>
                      Performance scorecard audit & authorization for {selectedScorecard?.supplierName} ({selectedScorecard?.supplierId}) - {filter.month}
                  </DialogDescription>
              </DialogHeader>

              {selectedScorecard && (
                  <div className="space-y-6 py-2 text-sm">
                      {/* Grade & Score Summary Bar */}
                      <div className="flex justify-between items-center bg-slate-50 border p-4 rounded-lg">
                          <div>
                              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Supplier Category</span>
                              <span className="font-semibold text-slate-700">{selectedScorecard.category || "Pre-Machining"}</span>
                          </div>
                          <div className="text-center">
                              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Total Evaluation Score</span>
                              <span className="text-3xl font-extrabold font-mono text-primary">
                                  {selectedScorecard.qualityScore + selectedScorecard.deliveryScore + localResponsiveness + (localPremiumFreight + localLineStoppage)}/100
                              </span>
                          </div>
                          <div className="text-right">
                              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Assigned Grade</span>
                              <Badge className="bg-primary text-white text-md px-3.5 py-1 font-bold">
                                  {calculateGrade(selectedScorecard.qualityScore + selectedScorecard.deliveryScore + localResponsiveness + (localPremiumFreight + localLineStoppage))}
                              </Badge>
                          </div>
                      </div>

                      {/* 1. Quality Performance */}
                      <div className="border rounded-lg p-4 space-y-3">
                          <div className="flex justify-between border-b pb-2">
                              <h3 className="font-bold text-slate-800">1. Quality Performance (60 Marks)</h3>
                              <span className="font-mono font-bold text-slate-700">{selectedScorecard.qualityScore} / 60 Marks</span>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <p className="text-xs text-slate-500">Log Period PPM Rate</p>
                                  <p className="text-lg font-bold font-mono text-slate-800">{selectedScorecard.ppm.toLocaleString()} PPM</p>
                              </div>
                              <div>
                                  <p className="text-xs text-slate-500">Methodology Bracket</p>
                                  <p className="text-xs text-slate-600 mt-1 italic leading-normal text-slate-500">
                                      {selectedScorecard.category === "Child-Part" 
                                          ? "Child-Parts: 0 PPM = 60 | 1-10 PPM = 50 | 11-20 PPM = 40 | 21-30 PPM = 30 | 31-40 PPM = 20 | >40 PPM = 0"
                                          : "Pre-Machining: <=2000 PPM = 60 | 2001-2500 = 50 | 2501-3000 = 40 | 3001-4000 = 30 | 4001-5000 = 20 | >5000 = 0"
                                      }
                                  </p>
                              </div>
                          </div>
                      </div>

                      {/* 2. Delivery Performance */}
                      <div className="border rounded-lg p-4 space-y-3">
                          <div className="flex justify-between border-b pb-2">
                              <h3 className="font-bold text-slate-800">2. Delivery Performance (20 Marks)</h3>
                              <span className="font-mono font-bold text-slate-700">{selectedScorecard.deliveryScore} / 20 Marks</span>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <p className="text-xs text-slate-500">On-Time Delivery Rate (OTD)</p>
                                  <p className="text-lg font-bold font-mono text-slate-800">{selectedScorecard.otd}%</p>
                              </div>
                              <div>
                                  <p className="text-xs text-slate-500">Methodology Bracket</p>
                                  <p className="text-xs text-slate-600 mt-1 italic leading-normal text-slate-500">
                                      Common: 100% = 20 | 95-99% = 15 | 90-94% = 10 | 85-89% = 5 | 80-84% = 2 | &lt;80% = 0
                                  </p>
                              </div>
                          </div>
                      </div>

                      {/* 3. Others (20 Marks) */}
                      <div className="border rounded-lg p-4 space-y-4 bg-slate-50/50">
                          <div className="flex justify-between border-b pb-2">
                              <h3 className="font-bold text-slate-800">3. Others (20 Marks)</h3>
                              <span className="font-mono font-bold text-slate-700">
                                  {localResponsiveness + localPremiumFreight + localLineStoppage} / 20 Marks
                              </span>
                          </div>
                          <div className="grid md:grid-cols-3 gap-4">
                              <div className="grid gap-1">
                                  <Label className="text-xs text-slate-500 font-semibold">4M Change Submission (10m)</Label>
                                  <Select 
                                      value={String(localResponsiveness)} 
                                      onValueChange={(val) => setLocalResponsiveness(Number(val))}
                                  >
                                      <SelectTrigger className="bg-white text-xs h-9">
                                          <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                          <SelectItem value="10">Submitted on Time (10m)</SelectItem>
                                          <SelectItem value="0">Delayed / Not Submitted (0m)</SelectItem>
                                      </SelectContent>
                                  </Select>
                              </div>
                              <div className="grid gap-1">
                                  <Label className="text-xs text-slate-500 font-semibold">Premium Freight (5m)</Label>
                                  <Select 
                                      value={String(localPremiumFreight)} 
                                      onValueChange={(val) => setLocalPremiumFreight(Number(val))}
                                  >
                                      <SelectTrigger className="bg-white text-xs h-9">
                                          <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                          <SelectItem value="5">Nil (5m)</SelectItem>
                                          <SelectItem value="0">Used (0m)</SelectItem>
                                      </SelectContent>
                                  </Select>
                              </div>
                              <div className="grid gap-1">
                                  <Label className="text-xs text-slate-500 font-semibold">Line Stoppage (5m)</Label>
                                  <Select 
                                      value={String(localLineStoppage)} 
                                      onValueChange={(val) => setLocalLineStoppage(Number(val))}
                                  >
                                      <SelectTrigger className="bg-white text-xs h-9">
                                          <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                          <SelectItem value="5">Nil (5m)</SelectItem>
                                          <SelectItem value="0">Occurred (0m)</SelectItem>
                                      </SelectContent>
                                  </Select>
                              </div>
                          </div>
                          <div className="flex justify-end pt-1">
                              <Button 
                                  onClick={() => handleSaveParameters(localResponsiveness, localPremiumFreight + localLineStoppage)}
                                  disabled={savingParameters}
                                  className="bg-slate-800 text-white text-xs h-8 px-4"
                              >
                                  {savingParameters ? "Saving..." : "Save Parameters"}
                              </Button>
                          </div>
                      </div>

                      {/* 4. Department E-Sign Approvals */}
                      <div className="border rounded-lg p-4 space-y-4">
                          <div className="border-b pb-2">
                              <h3 className="font-bold text-slate-800">4. Department E-Sign Authorization</h3>
                          </div>
                          
                          <div className="grid md:grid-cols-3 gap-4">
                              {/* Quality Approval */}
                              <div className="border rounded p-3 flex flex-col justify-between text-center bg-slate-50 h-32">
                                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quality Dept</div>
                                  {selectedScorecard.qualitySignedBy ? (
                                      <div className="text-xs space-y-1">
                                          <p className="font-semibold text-green-700">✓ Authorized</p>
                                          <p className="font-mono text-[10px] text-slate-500">{selectedScorecard.qualitySignedBy}</p>
                                          <p className="text-[10px] text-slate-400">{new Date(selectedScorecard.qualitySignedAt).toLocaleDateString()}</p>
                                      </div>
                                  ) : (
                                      <Button 
                                          onClick={() => handleSignReport("Quality")}
                                          variant="outline" 
                                          size="sm"
                                          className="border-primary text-primary hover:bg-orange-50 text-[11px]"
                                      >
                                          Authorize Quality
                                      </Button>
                                  )}
                              </div>

                              {/* SCM / Delivery Approval */}
                              <div className="border rounded p-3 flex flex-col justify-between text-center bg-slate-50 h-32">
                                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Delivery/SCM Dept</div>
                                  {selectedScorecard.deliverySignedBy ? (
                                      <div className="text-xs space-y-1">
                                          <p className="font-semibold text-green-700">✓ Authorized</p>
                                          <p className="font-mono text-[10px] text-slate-500">{selectedScorecard.deliverySignedBy}</p>
                                          <p className="text-[10px] text-slate-400">{new Date(selectedScorecard.deliverySignedAt).toLocaleDateString()}</p>
                                      </div>
                                  ) : (
                                      <Button 
                                          onClick={() => handleSignReport("Delivery")}
                                          variant="outline" 
                                          size="sm"
                                          className="border-primary text-primary hover:bg-orange-50 text-[11px]"
                                      >
                                          Authorize SCM
                                      </Button>
                                  )}
                              </div>

                              {/* Management Approval */}
                              <div className="border rounded p-3 flex flex-col justify-between text-center bg-slate-50 h-32">
                                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Management</div>
                                  {selectedScorecard.managementSignedBy ? (
                                      <div className="text-xs space-y-1">
                                          <p className="font-semibold text-green-700">✓ Authorized</p>
                                          <p className="font-mono text-[10px] text-slate-500">{selectedScorecard.managementSignedBy}</p>
                                          <p className="text-[10px] text-slate-400">{new Date(selectedScorecard.managementSignedAt).toLocaleDateString()}</p>
                                      </div>
                                  ) : (
                                      <Button 
                                          onClick={() => handleSignReport("Management")}
                                          variant="outline" 
                                          size="sm"
                                          className="border-primary text-primary hover:bg-orange-50 text-[11px]"
                                      >
                                          Authorize Mgmt
                                      </Button>
                                  )}
                              </div>
                          </div>

                          {/* Signer input name if any department needs signing */}
                          {(!selectedScorecard.qualitySignedBy || !selectedScorecard.deliverySignedBy || !selectedScorecard.managementSignedBy) && (
                              <div className="grid gap-1 pt-2">
                                  <Label className="text-xs font-semibold text-slate-700">Authorized Signatory Name</Label>
                                  <Input 
                                      placeholder="Enter your full name to execute e-sign" 
                                      value={inputSignerName}
                                      onChange={(e) => setInputSignerName(e.target.value)}
                                      className="h-9 text-xs"
                                  />
                              </div>
                          )}
                      </div>
                  </div>
              )}

              <DialogFooter className="flex justify-between items-center w-full">
                  {selectedScorecard && (
                      <Button 
                          onClick={() => handleOpenPrintPreview(selectedScorecard.supplierId)}
                          className="bg-primary hover:bg-orange-600 text-white font-medium shadow-sm"
                      >
                          <Download className="mr-2 h-4 w-4" /> Download / Print Official Performance Report (PDF)
                      </Button>
                  )}
                  <Button variant="outline" onClick={() => setScorecardDialogOpen(false)}>Close</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>

      <Dialog open={printOpen} onOpenChange={setPrintOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto no-print">
          <DialogHeader className="no-print">
            <DialogTitle>Print / Save Official Monthly Report</DialogTitle>
            <DialogDescription>
              Preview and save the official SAKTHI AUTO Monthly Performance Report as a high-fidelity PDF document.
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
                    body {
                      visibility: hidden !important;
                    }
                    div[data-radix-portal], div[role="dialog"], #print-scorecard-document, #print-scorecard-document * {
                      visibility: visible !important;
                    }
                    /* Hide dialog overlays, close buttons and other background details */
                    div[role="dialog"] > div:first-child, [class*="DialogOverlay"], button[class*="absolute"] {
                      display: none !important;
                      opacity: 0 !important;
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
                        <p className="font-bold text-slate-800 uppercase mt-1">{supplierDetails?.name || ""}</p>
                        <p className="text-slate-600 max-w-sm whitespace-pre-line mt-0.5">{supplierDetails?.companyDetails?.address || supplierDetails?.address || ""}</p>
                        <p className="font-bold text-slate-700 mt-2">KIND ATTN. : {supplierDetails?.contactPerson ? `Mr. ${supplierDetails.contactPerson}` : ""}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest border border-red-600 px-2 py-0.5 rounded">CONFIDENTIAL</span>
                      </div>
                    </div>

                    {/* Sub Line */}
                    <div className="mt-6 border-b border-slate-300 pb-2">
                      <p className="font-bold text-sm text-slate-800">
                        Sub : Quality & Delivery Performance for {filter.month ? formatMonthName(filter.month).toUpperCase() : "JANUARY - 2026"}
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
                          const currentStats = selectedScorecard ? getMonthlyStats(filter.month) : {
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
                            <LineChart data={fyMonths.filter(m => m <= filter.month).map(m => getMonthlyStats(m))}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="monthLabel" tick={{ fontSize: 7 }} />
                              <YAxis tick={{ fontSize: 7 }} />
                              <Tooltip />
                              <Legend wrapperStyle={{ fontSize: 8 }} />
                              <Line type="monotone" dataKey="ppm" stroke="#22c55e" strokeWidth={1.5} name="Actual PPM" activeDot={{ r: 4 }} />
                              <Line type="monotone" dataKey="targetPpm" stroke="#2563eb" strokeWidth={1.5} name="Target PPM" />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      <div className="border p-2 rounded bg-white">
                        <p className="text-[10px] font-bold text-slate-700 text-center mb-1">DELIVERY PERFORMANCE</p>
                        <div className="h-44 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={fyMonths.filter(m => m <= filter.month).map(m => getMonthlyStats(m))}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="monthLabel" tick={{ fontSize: 7 }} />
                              <YAxis domain={[0, 120]} tick={{ fontSize: 7 }} />
                              <Tooltip />
                              <Legend wrapperStyle={{ fontSize: 8 }} />
                              <Line type="monotone" dataKey="otd" stroke="#22c55e" strokeWidth={1.5} name="Delivery Performance" activeDot={{ r: 4 }} />
                              <Line type="monotone" dataKey="targetDelivery" stroke="#2563eb" strokeWidth={1.5} name="Target %" />
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
                          {selectedScorecard?.qualitySignedBy && (
                            <span className="font-mono text-[9px] text-green-700 border border-green-300 bg-green-50 px-2 py-0.5 rounded">
                              Digitally signed by: {selectedScorecard.qualitySignedBy}
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
                      SUPPLIER NAME : {supplierDetails?.name || ""}
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
                              <span>{selectedScorecard?.qualityScore || 60}</span>
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
                              <span>{selectedScorecard?.deliveryScore || 20}</span>
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
                              <span>{localResponsiveness + (localPremiumFreight + localLineStoppage)}</span>
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

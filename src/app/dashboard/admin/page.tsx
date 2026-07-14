"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { 
  Users, 
  Upload, 
  AlertTriangle, 
  FileUp, 
  PlusCircle, 
  CheckCircle2, 
  Calendar, 
  Filter, 
  TrendingUp, 
  FileText, 
  Search, 
  ArrowRight,
  TrendingDown,
  RotateCw,
  BarChart4
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
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

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  
  const [partWisePartFilter, setPartWisePartFilter] = useState("All")
  const [planActualPartFilter, setPlanActualPartFilter] = useState("All")
  const [rejRatePartFilter, setRejRatePartFilter] = useState("All")
  
  // Data States
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [rawProdLogs, setRawProdLogs] = useState<any[]>([])
  const [dataSource, setDataSource] = useState<"Admin" | "Supplier">("Admin")

  const prodLogs = useMemo(() => {
    return rawProdLogs.filter((l: any) => {
      const source = l.enteredBy || "Supplier"
      return source === dataSource
    })
  }, [rawProdLogs, dataSource])

  const [issuesCount, setIssuesCount] = useState(0)
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0)
  const [recentActivities, setRecentActivities] = useState<any[]>([])
  const [issuesList, setIssuesList] = useState<any[]>([])

  // 1. Production Filters & Inputs
  const [prodDateInput, setProdDateInput] = useState(new Date().toISOString().split('T')[0])
  const [prodSupplierInput, setProdSupplierInput] = useState("All")
  const [prodLineInput, setProdLineInput] = useState("All")
  const [prodPartInput, setProdPartInput] = useState("All")
  const [prodShiftInput, setProdShiftInput] = useState("All")

  const [prodDateFilter, setProdDateFilter] = useState(new Date().toISOString().split('T')[0])
  const [prodSupplierFilter, setProdSupplierFilter] = useState("All")
  const [prodLineFilter, setProdLineFilter] = useState("All")
  const [prodPartFilter, setProdPartFilter] = useState("All")
  const [prodShiftFilter, setProdShiftFilter] = useState("All")

  const applyProdFilters = () => {
    setProdDateFilter(prodDateInput)
    setProdSupplierFilter(prodSupplierInput)
    setProdLineFilter(prodLineInput)
    setProdPartFilter(prodPartInput)
    setProdShiftFilter(prodShiftInput)
  }

  // 2. Dispatch Filters & Inputs
  const [dispDateInput, setDispDateInput] = useState(new Date().toISOString().split('T')[0])
  const [dispSupplierInput, setDispSupplierInput] = useState("All")
  const [dispPartInput, setDispPartInput] = useState("All")

  const [dispDateFilter, setDispDateFilter] = useState(new Date().toISOString().split('T')[0])
  const [dispSupplierFilter, setDispSupplierFilter] = useState("All")
  const [dispPartFilter, setDispPartFilter] = useState("All")

  const applyDispFilters = () => {
    setDispDateFilter(dispDateInput)
    setDispSupplierFilter(dispSupplierInput)
    setDispPartFilter(dispPartInput)
  }

  // 3. Inventory Filters & Inputs
  const [invSupplierInput, setInvSupplierInput] = useState("All")
  const [invPartInput, setInvPartInput] = useState("All")
  
  const [liveLineStatuses, setLiveLineStatuses] = useState<any[]>([])

  // 4. Performance Chart Filters & Inputs
  const [chartSupplierInput, setChartSupplierInput] = useState("All")
  const [chartStartDateInput, setChartStartDateInput] = useState("")
  const [chartEndDateInput, setChartEndDateInput] = useState("")
  const [chartMonthInput, setChartMonthInput] = useState("All")
  const [chartPartInput, setChartPartInput] = useState("All")

  const [chartSupplierFilter, setChartSupplierFilter] = useState("All")
  const [chartStartDate, setChartStartDate] = useState("")
  const [chartEndDate, setChartEndDate] = useState("")
  const [chartMonthFilter, setChartMonthFilter] = useState("07")
  const [chartPartFilter, setChartPartFilter] = useState("All")

  const [sortField, setSortField] = useState<"partName" | "rejectionQty" | "percentage">("rejectionQty")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [defectPartFilter, setDefectPartFilter] = useState("All")

  const refreshData = async () => {
      setLoading(true)
      try {
          const suppliersRes = await fetch('/api/suppliers')
          if (suppliersRes.ok) {
              const usersData = await suppliersRes.json()
              setSuppliers(usersData)
          }
          
          const issuesRes = await fetch('/api/issues')
          if (issuesRes.ok) {
              const issuesData = await issuesRes.json()
              setIssuesCount(issuesData.filter((i: any) => i.status === "Open").length)
              setIssuesList(issuesData)
          }
          
          const docsRes = await fetch('/api/documents')
          if (docsRes.ok) {
              const docsData = await docsRes.json()
              setPendingApprovalsCount(docsData.filter((d: any) => d.status === "Pending").length)
          }
          
          const prodRes = await fetch('/api/production')
          if (prodRes.ok) {
              const logsData = await prodRes.json()
              setRawProdLogs(logsData)
          }
      } catch (e) {
          console.error("Refresh error", e)
      }
      setLoading(false)
  }

  const handleSort = (field: "partName" | "rejectionQty" | "percentage") => {
      if (sortField === field) {
          setSortDirection(prev => prev === "asc" ? "desc" : "asc")
      } else {
          setSortField(field)
          setSortDirection("desc")
      }
  }

  // 5. Dashboard Overview Filters & Inputs
  const [overviewSupplierInput, setOverviewSupplierInput] = useState("All")
  const [overviewDateInput, setOverviewDateInput] = useState(new Date().toISOString().split('T')[0])
  const [overviewPartInput, setOverviewPartInput] = useState("")
  const [redThresholdInput, setRedThresholdInput] = useState("1.0")
  const [orangeThresholdInput, setOrangeThresholdInput] = useState("1.5")

  const [overviewSupplierFilter, setOverviewSupplierFilter] = useState("All")
  const [overviewDateFilter, setOverviewDateFilter] = useState(new Date().toISOString().split('T')[0])
  const [overviewPartFilter, setOverviewPartFilter] = useState("All")
  const [overviewCategoryFilter, setOverviewCategoryFilter] = useState("All")
  const [selectedMonth, setSelectedMonth] = useState("2026-07")
  const [redThreshold, setRedThreshold] = useState(1.0)
  const [orangeThreshold, setOrangeThreshold] = useState(1.5)

  // Details expansion category state
  const [activeDetailCategory, setActiveDetailCategory] = useState<"suppliers" | "active" | "pending" | "parts" | null>(null)

  const showDetails = (category: "suppliers" | "active" | "pending" | "parts") => {
      setActiveDetailCategory(category)
      setTimeout(() => {
          const el = document.getElementById("overview-detail-section")
          if (el) {
              el.scrollIntoView({ behavior: 'smooth' })
          }
      }, 100)
  }

  useEffect(() => {
    setMounted(true)
    async function fetchData() {
        try {
            // Fetch Suppliers
            const suppliersRes = await fetch('/api/suppliers')
            let usersData = []
            if (suppliersRes.ok) {
                usersData = await suppliersRes.json()
                setSuppliers(usersData)
            }

            // Fetch Issues
            let issuesData: any[] = []
            try {
                const issuesRes = await fetch('/api/issues')
                if (issuesRes.ok) {
                    issuesData = await issuesRes.json()
                    setIssuesCount(issuesData.filter((i: any) => i.status === "Open").length)
                    setIssuesList(issuesData)
                }
            } catch (e) { console.warn("Issues API failed", e) }

            // Fetch Documents
            let docsData: any[] = []
            try {
                 const docsRes = await fetch('/api/documents')
                 if (docsRes.ok) {
                     docsData = await docsRes.json()
                     setPendingApprovalsCount(docsData.filter((d: any) => d.status === "Pending").length)
                 }
            } catch (e) { console.warn("Docs API failed", e) }

            // Fetch Production Logs
            let logsData: any[] = []
            try {
                 const prodRes = await fetch(`/api/production?month=${selectedMonth}`)
                 if (prodRes.ok) {
                     logsData = await prodRes.json()
                     setRawProdLogs(logsData)
                 }
            } catch (e) { console.warn("Production API failed", e) }

            // Setup Recent SQA Activities
            const issueActivities = issuesData.slice(0, 5).map((i: any) => ({
                id: i.id,
                action: `Quality Issue: ${i.type}`,
                status: i.status,
                date: i.raisedDate || i.createdAt || new Date().toISOString(),
                supplierId: i.supplierId
            }))
            
            const docActivities = docsData.slice(0, 5).map((d: any) => ({
                id: d.id,
                action: `Uploaded ${d.type}`,
                status: d.status,
                date: d.date || d.createdAt || new Date().toISOString(),
                supplierId: d.supplierId
            }))

            const combined = [...docActivities, ...issueActivities]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 8)
                .map(act => {
                    const supp = usersData.find((u: any) => u.id === act.supplierId)
                    return { 
                        ...act, 
                        supplierName: supp ? supp.name : act.supplierId,
                        time: new Date(act.date).toLocaleDateString()
                    }
                })

            setRecentActivities(combined)
            // Fetch Live Line statuses
            try {
              const liveRes = await fetch('/api/suppliers/setting-change?live=true')
              if (liveRes.ok) {
                setLiveLineStatuses(await liveRes.json())
              }
            } catch (e) { console.warn("Live line status fetch failed", e) }
        } catch (e) { 
            console.error("Dashboard Fetch Error", e) 
        }
        setLoading(false)
    }
    fetchData()
  }, [selectedMonth])

  // Helper lists for dropdowns
  const supplierList = useMemo(() => {
      return suppliers.filter(u => u.role === "SUPPLIER_USER")
  }, [suppliers])

  // 3. Compiled Current Inventory Stock list (Supplier, Part Name, Part No, Opening, Production, Dispatch, Rejection, Current Stock)
  const currentInventoryList = useMemo(() => {
      const list: any[] = []
      
      for (const s of supplierList) {
          const parts = s.companyDetails?.approvedParts || []
          for (const part of parts) {
              const pLogs = prodLogs.filter((l: any) => l.supplierId === s.id && (l.partNumber || "").trim() === (part.partNumber || "").trim())
              const sortedLogs = [...pLogs].sort((a,b) => a.date.localeCompare(b.date))
              
              // Opening Stock is the earliest openingStock record or first daily log's openingStock
              const openingRec = sortedLogs.find((l: any) => l.isOpeningStockRecord)
              const opStock = openingRec ? openingRec.openingStock : 0
              
              const dailyLogsOnly = sortedLogs.filter((l: any) => !l.isOpeningStockRecord)
              const totalProd = sortedLogs.reduce((sum, l) => sum + (l.production || 0), 0)
              const totalDisp = sortedLogs.reduce((sum, l) => sum + (l.dispatch || 0), 0)
              const totalRej = sortedLogs.reduce((sum, l) => sum + (l.rejection || 0), 0)
              const totalCasting = sortedLogs.reduce((sum, l) => sum + (l.castingIssued || 0), 0)
              
              const curStock = opStock + totalCasting - totalDisp
              
              list.push({
                  supplierId: s.id,
                  supplierName: s.name,
                  partNumber: part.partNumber,
                  partName: part.name,
                  productionLine: part.productionLine || "Line-1",
                  openingStock: opStock,
                  castingIssued: totalCasting,
                  production: totalProd,
                  dispatch: totalDisp,
                  rejection: totalRej,
                  currentStock: curStock,
                  monthlyRequirement: part.monthlyRequirement || 0,
                  safetyStockLevel: part.safetyStockLevel || 0
              })
          }
      }
      return list;
  }, [supplierList, prodLogs])

  // Filtered Supplier List for Dashboard Overview metrics
  const filteredSupplierList = useMemo(() => {
      return supplierList.filter(s => {
          const matchSupplier = overviewSupplierFilter && overviewSupplierFilter !== "All" ? s.id === overviewSupplierFilter : true
          const matchPart = overviewPartFilter && overviewPartFilter !== "All" && overviewPartFilter !== "" ? (
              s.companyDetails?.approvedParts?.some((p: any) => 
                  p.partNumber === overviewPartFilter
              )
          ) : true
          const matchCategory = overviewCategoryFilter && overviewCategoryFilter !== "All" ? (
              s.companyDetails?.category === overviewCategoryFilter || s.category === overviewCategoryFilter
          ) : true
          return matchSupplier && matchPart && matchCategory
      })
  }, [supplierList, overviewSupplierFilter, overviewPartFilter, overviewCategoryFilter])

  // Filtered Inventory List for Dashboard Overview
  const overviewFilteredInventory = useMemo(() => {
      return currentInventoryList.filter(item => {
          const matchSupplier = overviewSupplierFilter && overviewSupplierFilter !== "All" ? item.supplierId === overviewSupplierFilter : true
          const matchPart = overviewPartFilter && overviewPartFilter !== "All" && overviewPartFilter !== "" ? (
              item.partNumber === overviewPartFilter
          ) : true
          const supp = suppliers.find(s => s.id === item.supplierId)
          const matchCategory = overviewCategoryFilter && overviewCategoryFilter !== "All" ? (
              supp && (supp.companyDetails?.category === overviewCategoryFilter || supp.category === overviewCategoryFilter)
          ) : true
          return matchSupplier && matchPart && matchCategory
      })
  }, [currentInventoryList, overviewSupplierFilter, overviewPartFilter, overviewCategoryFilter, suppliers])

  // Unique Parts list for inventory dropdown scroll
  const uniquePartsList = useMemo(() => {
      const partsMap = new Map<string, string>()
      for (const item of currentInventoryList) {
          partsMap.set(item.partNumber, item.partName)
      }
      return Array.from(partsMap.entries()).map(([partNumber, partName]) => ({
          partNumber,
          partName
      }))
  }, [currentInventoryList])

  // Filtered Inventory List for Tab 3 Table
  const filteredInventory = useMemo(() => {
      return currentInventoryList.filter(item => {
          const matchSupplier = invSupplierInput && invSupplierInput !== "All" ? item.supplierId === invSupplierInput : true
          const matchPart = invPartInput && invPartInput !== "All" ? item.partNumber === invPartInput : true
          return matchSupplier && matchPart
      })
  }, [currentInventoryList, invSupplierInput, invPartInput])

  // 4. Risk Supplier statistics calculation using admin safety rules
  const riskCategorizedData = useMemo(() => {
      const redList: any[] = []
      const orangeList: any[] = []
      const greenList: any[] = []

      for (const item of overviewFilteredInventory) {
          const monthlyRequirement = item.monthlyRequirement || 0
          const dailyTarget = monthlyRequirement > 0 ? (monthlyRequirement / 25) : 0
          
          // Red: below safety stock / below 1 day target production stock
          const redLimit = Math.max(item.safetyStockLevel || 0, dailyTarget)
          // Orange: below 1.5 days production stock
          const orangeLimit = dailyTarget * 1.5

          if (item.currentStock < redLimit) {
              redList.push(item)
          } else if (item.currentStock < orangeLimit) {
              orangeList.push(item)
          } else {
              greenList.push(item)
          }
      }

      return {
          red: redList,
          orange: orangeList,
          green: greenList
      }
  }, [overviewFilteredInventory])

  const riskStats = useMemo(() => {
      const redSupps = new Set(riskCategorizedData.red.map(item => item.supplierId))
      const orangeSupps = new Set(riskCategorizedData.orange.map(item => item.supplierId))
      const greenSupps = new Set(riskCategorizedData.green.map(item => item.supplierId))

      return {
          red: { parts: riskCategorizedData.red.length, suppliers: redSupps.size, list: riskCategorizedData.red },
          orange: { parts: riskCategorizedData.orange.length, suppliers: orangeSupps.size, list: riskCategorizedData.orange },
          green: { parts: riskCategorizedData.green.length, suppliers: greenSupps.size, list: riskCategorizedData.green }
      }
  }, [riskCategorizedData])

  // 5. Total Supplier Dashboard calculations
  const totalSuppliersCount = filteredSupplierList.length
  const activeSuppliersToday = useMemo(() => {
      const activeIds = new Set(
          prodLogs
            .filter((l: any) => l.date === overviewDateFilter && !l.isOpeningStockRecord)
            .map((l: any) => l.supplierId)
      )
      return Array.from(activeIds).filter(id => filteredSupplierList.some(s => s.id === id)).length
  }, [prodLogs, overviewDateFilter, filteredSupplierList])

  const suppliersPendingEntry = Math.max(0, totalSuppliersCount - activeSuppliersToday)
  
  const totalPartsCount = useMemo(() => {
      let count = 0
      for (const s of filteredSupplierList) {
          const parts = s.companyDetails?.approvedParts || []
          const matchingParts = parts.filter((p: any) => {
              const matchPart = overviewPartFilter && overviewPartFilter !== "" ? (
                  p.partNumber.toLowerCase().includes(overviewPartFilter.toLowerCase()) ||
                  p.name.toLowerCase().includes(overviewPartFilter.toLowerCase())
              ) : true
              return matchPart
          })
          count += matchingParts.length
      }
      return count
  }, [filteredSupplierList, overviewPartFilter])

  // Lists for Dashboard Overview Detail Drawer/Table
  const activeSuppliersList = useMemo(() => {
      const activeIds = new Set(
          prodLogs
            .filter((l: any) => l.date === overviewDateFilter && !l.isOpeningStockRecord)
            .map((l: any) => l.supplierId)
      )
      return filteredSupplierList.filter(s => activeIds.has(s.id))
  }, [filteredSupplierList, prodLogs, overviewDateFilter])

  const pendingSuppliersList = useMemo(() => {
      const activeIds = new Set(
          prodLogs
            .filter((l: any) => l.date === overviewDateFilter && !l.isOpeningStockRecord)
            .map((l: any) => l.supplierId)
      )
      return filteredSupplierList.filter(s => !activeIds.has(s.id))
  }, [filteredSupplierList, prodLogs, overviewDateFilter])

  const activePartsList = useMemo(() => {
      const list: any[] = []
      for (const s of filteredSupplierList) {
          const parts = s.companyDetails?.approvedParts || []
          for (const p of parts) {
              const matchPart = overviewPartFilter && overviewPartFilter !== "" ? (
                  p.partNumber.toLowerCase().includes(overviewPartFilter.toLowerCase()) ||
                  p.name.toLowerCase().includes(overviewPartFilter.toLowerCase())
              ) : true
              if (matchPart) {
                  list.push({
                      supplierId: s.id,
                      supplierName: s.name,
                      partName: p.name,
                      partNumber: p.partNumber,
                      monthlyRequirement: p.monthlyRequirement || 0,
                      safetyStockLevel: p.safetyStockLevel || 0
                  })
              }
          }
      }
      return list
  }, [filteredSupplierList, overviewPartFilter])

  // Filtered Today's Production Logs
  const filteredProduction = useMemo(() => {
      return prodLogs.filter(log => {
          if (log.isOpeningStockRecord) return false
          const matchDate = prodDateInput ? log.date === prodDateInput : true
          const matchSupplier = prodSupplierInput && prodSupplierInput !== "All" ? log.supplierId === prodSupplierInput : true
          const matchLine = prodLineInput && prodLineInput !== "All" ? log.productionLine === prodLineInput : true
          const matchPart = prodPartInput && prodPartInput !== "All" && prodPartInput !== "" ? log.partNumber === prodPartInput : true
          const matchShift = prodShiftInput && prodShiftInput !== "All" ? log.shift === prodShiftInput : true
          return matchDate && matchSupplier && matchLine && matchPart && matchShift
      })
  }, [prodLogs, prodDateInput, prodSupplierInput, prodLineInput, prodPartInput, prodShiftInput])

  // Filtered Today's Dispatch Logs
  const filteredDispatch = useMemo(() => {
      return prodLogs.filter(log => {
          if (log.isOpeningStockRecord) return false
          const matchDate = dispDateInput ? log.date === dispDateInput : true
          const matchSupplier = dispSupplierInput && dispSupplierInput !== "All" ? log.supplierId === dispSupplierInput : true
          const matchPart = dispPartInput && dispPartInput !== "All" && dispPartInput !== "" ? log.partNumber === dispPartInput : true
          return matchDate && matchSupplier && matchPart
      })
  }, [prodLogs, dispDateInput, dispSupplierInput, dispPartInput])

  const prodPartsList = useMemo(() => {
      const parts: any[] = []
      const targetSuppliers = prodSupplierInput === "All" 
          ? supplierList 
          : supplierList.filter(s => s.id === prodSupplierInput)
          
      for (const s of targetSuppliers) {
          const sParts = s.companyDetails?.approvedParts || []
          for (const p of sParts) {
              if (!parts.some(x => x.partNumber === p.partNumber)) {
                  parts.push(p)
              }
          }
      }
      return parts
  }, [supplierList, prodSupplierInput])

  const dispPartsList = useMemo(() => {
      const parts: any[] = []
      const targetSuppliers = dispSupplierInput === "All" 
          ? supplierList 
          : supplierList.filter(s => s.id === dispSupplierInput)
          
      for (const s of targetSuppliers) {
          const sParts = s.companyDetails?.approvedParts || []
          for (const p of sParts) {
              if (!parts.some(x => x.partNumber === p.partNumber)) {
                  parts.push(p)
              }
          }
      }
      return parts
  }, [supplierList, dispSupplierInput])

  // 6. Supplier Performance Chart Data Compilation & Memos
  const chartPartsList = useMemo(() => {
      const parts: any[] = []
      const selectedSuppId = chartSupplierFilter
      
      const targetSuppliers = selectedSuppId === "All" 
          ? supplierList 
          : supplierList.filter(s => s.id === selectedSuppId)
          
      for (const s of targetSuppliers) {
          const sParts = s.companyDetails?.approvedParts || []
          for (const p of sParts) {
              if (!parts.some(x => x.partNumber === p.partNumber)) {
                  parts.push(p)
              }
          }
      }
      return parts
  }, [supplierList, chartSupplierFilter])

  // Plan vs Actual Chart Data (respects local planActualPartFilter dropdown)
  const planActualChartData = useMemo(() => {
      const filtered = prodLogs.filter(log => {
          if (log.isOpeningStockRecord) return false
          const matchSupplier = chartSupplierFilter && chartSupplierFilter !== "All" ? log.supplierId === chartSupplierFilter : true
          const matchStart = chartStartDate ? log.date >= chartStartDate : true
          const matchEnd = chartEndDate ? log.date <= chartEndDate : true
          const matchMonth = chartMonthFilter && chartMonthFilter !== "All" ? log.date.split('-')[1] === chartMonthFilter : true
          const matchPart = planActualPartFilter && planActualPartFilter !== "All" && planActualPartFilter !== "" ? (
              log.partNumber === planActualPartFilter
          ) : true
          return matchSupplier && matchStart && matchEnd && matchMonth && matchPart
      })
      
      const sorted = [...filtered].sort((a, b) => a.date.localeCompare(b.date))
      const groupedMap = new Map<string, any>()
      for (const log of sorted) {
          const existing = groupedMap.get(log.date) || {
              date: log.date,
              production: 0,
              dispatch: 0,
              rejection: 0,
              closingStock: 0,
              plan: 0,
              count: 0
          }
          const supp = supplierList.find(s => s.id === log.supplierId)
          const part = supp?.companyDetails?.approvedParts?.find((p: any) => p.partNumber === log.partNumber)
          const dailyPlan = part ? (part.monthlyRequirement || 0) / 25 : 0
          existing.production += log.production || 0
          existing.dispatch += log.dispatch || 0
          existing.rejection += log.rejection || 0
          existing.closingStock += log.closingStock || 0
          existing.plan += dailyPlan
          existing.count++
          groupedMap.set(log.date, existing)
      }
      return Array.from(groupedMap.values())
  }, [prodLogs, chartSupplierFilter, chartStartDate, chartEndDate, chartMonthFilter, planActualPartFilter, supplierList])

  // Quality Rejection Rate & PPM Chart Data (respects local rejRatePartFilter dropdown)
  const rejRateChartData = useMemo(() => {
      const filtered = prodLogs.filter(log => {
          if (log.isOpeningStockRecord) return false
          const matchSupplier = chartSupplierFilter && chartSupplierFilter !== "All" ? log.supplierId === chartSupplierFilter : true
          const matchStart = chartStartDate ? log.date >= chartStartDate : true
          const matchEnd = chartEndDate ? log.date <= chartEndDate : true
          const matchMonth = chartMonthFilter && chartMonthFilter !== "All" ? log.date.split('-')[1] === chartMonthFilter : true
          const matchPart = rejRatePartFilter && rejRatePartFilter !== "All" && rejRatePartFilter !== "" ? (
              log.partNumber === rejRatePartFilter
          ) : true
          return matchSupplier && matchStart && matchEnd && matchMonth && matchPart
      })
      
      const sorted = [...filtered].sort((a, b) => a.date.localeCompare(b.date))
      const groupedMap = new Map<string, any>()
      for (const log of sorted) {
          const existing = groupedMap.get(log.date) || {
              date: log.date,
              production: 0,
              dispatch: 0,
              rejection: 0,
              closingStock: 0,
              plan: 0,
              count: 0
          }
          existing.production += log.production || 0
          existing.dispatch += log.dispatch || 0
          existing.rejection += log.rejection || 0
          existing.closingStock += log.closingStock || 0
          groupedMap.set(log.date, existing)
      }
      
      return Array.from(groupedMap.values()).map(item => {
          const baseQty = item.dispatch > 0 ? item.dispatch : (item.production > 0 ? item.production : 0)
          const rejRate = baseQty > 0 ? (item.rejection / baseQty) * 100 : 0
          const ppmVal = baseQty > 0 ? Math.round((item.rejection / baseQty) * 1000000) : 0
          return {
              ...item,
              rejectionRate: Math.round(rejRate * 10) / 10,
              ppm: ppmVal
          }
      })
  }, [prodLogs, chartSupplierFilter, chartStartDate, chartEndDate, chartMonthFilter, rejRatePartFilter])

  // Dynamic Constant Plan value based on registration targets (monthlyRequirement / 25)
  const constantPlanValue = useMemo(() => {
      let totalPlan = 0
      const selectedSuppId = chartSupplierFilter
      const selectedPartNo = planActualPartFilter
      
      const targetSuppliers = selectedSuppId === "All" 
          ? supplierList 
          : supplierList.filter(s => s.id === selectedSuppId)
          
      for (const s of targetSuppliers) {
          const sParts = s.companyDetails?.approvedParts || []
          for (const p of sParts) {
              const matchPart = selectedPartNo === "All" || selectedPartNo === "" || p.partNumber === selectedPartNo
              if (matchPart) {
                  totalPlan += (p.monthlyRequirement || 0) / 25
              }
          }
      }
      return totalPlan
  }, [supplierList, chartSupplierFilter, planActualPartFilter])

  // Part-wise rejections pie chart data
  const pieChartData = useMemo(() => {
      const filtered = prodLogs.filter(log => {
          if (log.isOpeningStockRecord) return false
          const matchSupplier = chartSupplierFilter && chartSupplierFilter !== "All" ? log.supplierId === chartSupplierFilter : true
          const matchStart = chartStartDate ? log.date >= chartStartDate : true
          const matchEnd = chartEndDate ? log.date <= chartEndDate : true
          const matchMonth = chartMonthFilter && chartMonthFilter !== "All" ? log.date.split('-')[1] === chartMonthFilter : true
          const matchPart = partWisePartFilter && partWisePartFilter !== "All" && partWisePartFilter !== "" ? (
              log.partNumber === partWisePartFilter
          ) : true
          return matchSupplier && matchStart && matchEnd && matchMonth && matchPart
      })
      
      const partRejectionMap = new Map<string, number>()
      for (const log of filtered) {
          const currentRej = partRejectionMap.get(log.partNumber) || 0
          partRejectionMap.set(log.partNumber, currentRej + (log.rejection || 0))
      }
      
      const dataList = Array.from(partRejectionMap.entries()).map(([partNo, rejQty]) => {
          let name = partNo
          for (const s of supplierList) {
              const p = s.companyDetails?.approvedParts?.find((x: any) => x.partNumber === partNo)
              if (p) {
                  name = p.name
                  break
              }
          }
          return { name, value: rejQty, partNumber: partNo }
      }).filter(item => item.value > 0)
      
      return dataList;
  }, [prodLogs, chartSupplierFilter, chartStartDate, chartEndDate, chartMonthFilter, partWisePartFilter, supplierList])

  // Filtered Issues for quality problems table breakdown
  const filteredIssues = useMemo(() => {
      return issuesList.filter((issue: any) => {
          const matchSupplier = chartSupplierFilter && chartSupplierFilter !== "All" ? issue.supplierId === chartSupplierFilter : true
          const matchPart = chartPartFilter && chartPartFilter !== "All" && chartPartFilter !== "" ? (
              issue.partName === chartPartFilter || (issue.partNumber && issue.partNumber === chartPartFilter)
          ) : true
          return matchSupplier && matchPart
      })
  }, [issuesList, chartSupplierFilter, chartPartFilter])

  // Group rejections by part for the new sortable table
  const partRejectionTableData = useMemo(() => {
      const filtered = prodLogs.filter(log => {
          if (log.isOpeningStockRecord) return false
          
          const matchSupplier = chartSupplierFilter && chartSupplierFilter !== "All" ? log.supplierId === chartSupplierFilter : true
          const matchStart = chartStartDate ? log.date >= chartStartDate : true
          const matchEnd = chartEndDate ? log.date <= chartEndDate : true
          const matchMonth = chartMonthFilter && chartMonthFilter !== "All" ? log.date.split('-')[1] === chartMonthFilter : true
          const matchPart = chartPartFilter && chartPartFilter !== "All" && chartPartFilter !== "" ? (
              log.partNumber === chartPartFilter
          ) : true
          
          return matchSupplier && matchStart && matchEnd && matchMonth && matchPart
      })
      
      const partDataMap = new Map<string, { partNumber: string; partName: string; rejectionQty: number; defects: string[] }>()
      
      let totalRejections = 0
      
      for (const log of filtered) {
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
              for (const s of supplierList) {
                  const p = s.companyDetails?.approvedParts?.find((x: any) => x.partNumber === log.partNumber)
                  if (p) {
                      existing.partName = p.name
                      break
                  }
              }
              if (!existing.partName) existing.partName = log.partName || log.partNumber
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
      
      for (const issue of filteredIssues) {
          const partNo = issue.partNumber
          if (!partNo) continue
          
          const existing = partDataMap.get(partNo) || {
              partNumber: partNo,
              partName: issue.partName || partNo,
              rejectionQty: 0,
              defects: [] as string[]
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
  }, [prodLogs, chartSupplierFilter, chartStartDate, chartEndDate, chartMonthFilter, chartPartFilter, supplierList, filteredIssues])

  const sortedPartRejectionData = useMemo(() => {
      const sorted = [...partRejectionTableData]
      sorted.sort((a, b) => {
          let valA: any = a[sortField]
          let valB: any = b[sortField]
          
          if (typeof valA === "string") {
              valA = valA.toLowerCase()
              valB = valB.toLowerCase()
          }
          
          if (valA < valB) return sortDirection === "asc" ? -1 : 1
          if (valA > valB) return sortDirection === "asc" ? 1 : -1
          return 0
      })
      return sorted
  }, [partRejectionTableData, sortField, sortDirection])

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

  const defectPartsOptions = useMemo(() => {
      return partRejectionTableData.map(item => ({
          partNumber: item.partNumber,
          partName: item.partName
      }))
  }, [partRejectionTableData])

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

  return (
    <div className="flex-1 space-y-6 p-1">
      <div className="flex flex-col gap-4 border p-4 bg-slate-50/50 rounded-lg shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-800">SQA & Management Portal</h2>
              <p className="text-slate-500 text-sm">Live Supplier Production & Inventory Monitoring Board.</p>
          </div>
          <div className="flex items-center space-x-2">
              <Button onClick={() => window.print()} className="bg-slate-800 hover:bg-slate-700 text-white font-semibold">
                  Print Report
              </Button>
          </div>
        </div>

        <div className="grid gap-3 grid-cols-2 md:grid-cols-4 border-t pt-3 mt-1">
          <div className="grid gap-1">
            <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Analysis Month</Label>
            <input 
              type="month" 
              value={selectedMonth} 
              onChange={(e) => {
                if (e.target.value) {
                  setSelectedMonth(e.target.value);
                }
              }} 
              className="flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary outline-none"
            />
          </div>
          <div className="grid gap-1">
            <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Supplier</Label>
            <Select value={overviewSupplierFilter} onValueChange={setOverviewSupplierFilter}>
              <SelectTrigger className="h-9 text-xs bg-white border-slate-300"><SelectValue placeholder="All Suppliers" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Suppliers</SelectItem>
                {supplierList.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1">
            <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Part Number</Label>
            <Select value={overviewPartFilter} onValueChange={setOverviewPartFilter}>
              <SelectTrigger className="h-9 text-xs bg-white border-slate-300"><SelectValue placeholder="All Parts" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Parts</SelectItem>
                {Array.from(new Set(rawProdLogs.map(l => l.partNumber).filter(Boolean))).map((p: any) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1">
            <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Category</Label>
            <Select value={overviewCategoryFilter} onValueChange={setOverviewCategoryFilter}>
              <SelectTrigger className="h-9 text-xs bg-white border-slate-300"><SelectValue placeholder="All Categories" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Categories</SelectItem>
                <SelectItem value="Pre-Machining">Pre-Machining</SelectItem>
                <SelectItem value="Child-Part">Child-Part</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-slate-100 p-1 border rounded-lg">
              <TabsTrigger value="overview">Dashboard Overview</TabsTrigger>
              <TabsTrigger value="todays-activity">Today's Activity</TabsTrigger>
              <TabsTrigger value="inventory">Current Inventory</TabsTrigger>
              <TabsTrigger value="performance">Supplier Performance</TabsTrigger>
          </TabsList>

          {/* 1. Dashboard Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
              {/* Total Supplier Dashboard (5) */}
              <div className="grid gap-4 md:grid-cols-4">
                  <Dialog>
                      <DialogTrigger asChild>
                          <Card className="border-l-4 border-l-slate-800 cursor-pointer hover:bg-slate-50 transition-colors shadow-sm">
                              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                  <CardTitle className="text-sm font-medium text-slate-500">Total Suppliers</CardTitle>
                                  <Users className="h-4 w-4 text-slate-400" />
                              </CardHeader>
                              <CardContent>
                                  <div className="text-2xl font-bold">{totalSuppliersCount} Vendors</div>
                                  <p className="text-[10px] text-slate-400 mt-1">Click to view scrollable list</p>
                              </CardContent>
                          </Card>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl border-t-4 border-t-slate-800">
                          <DialogHeader>
                              <DialogTitle>Total Configured Suppliers</DialogTitle>
                              <DialogDescription>
                                  All registered vendors in the system master database.
                              </DialogDescription>
                          </DialogHeader>
                          <div className="max-h-[350px] overflow-y-auto border rounded-md">
                              <Table>
                                  <TableHeader>
                                      <TableRow className="bg-slate-50">
                                          <TableHead>Supplier ID</TableHead>
                                          <TableHead>Supplier Name</TableHead>
                                          <TableHead>Category</TableHead>
                                          <TableHead>GST Number</TableHead>
                                      </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                      {filteredSupplierList.length > 0 ? (
                                          filteredSupplierList.map(s => (
                                              <TableRow key={s.id}>
                                                  <TableCell className="font-bold">{s.id}</TableCell>
                                                  <TableCell>{s.name}</TableCell>
                                                  <TableCell>
                                                      <Badge variant="outline">{s.category || 'Pre-Machining'}</Badge>
                                                  </TableCell>
                                                  <TableCell className="font-mono text-xs">{s.gstNumber || 'N/A'}</TableCell>
                                              </TableRow>
                                          ))
                                      ) : (
                                          <TableRow>
                                              <TableCell colSpan={4} className="text-center text-slate-400 py-6">No suppliers found.</TableCell>
                                          </TableRow>
                                      )}
                                  </TableBody>
                              </Table>
                          </div>
                      </DialogContent>
                  </Dialog>

                  <Dialog>
                      <DialogTrigger asChild>
                          <Card className="border-l-4 border-l-green-600 cursor-pointer hover:bg-slate-50 transition-colors shadow-sm">
                              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                  <CardTitle className="text-sm font-medium text-slate-500">Active Suppliers Today</CardTitle>
                                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                              </CardHeader>
                              <CardContent>
                                  <div className="text-2xl font-bold text-green-700">{activeSuppliersToday} Active</div>
                                  <p className="text-[10px] text-slate-400 mt-1">Click to view scrollable list</p>
                              </CardContent>
                          </Card>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl border-t-4 border-t-green-600">
                          <DialogHeader>
                              <DialogTitle>Active Suppliers Today</DialogTitle>
                              <DialogDescription>
                                  Suppliers who have submitted daily logs for the selected date ({overviewDateFilter}).
                              </DialogDescription>
                          </DialogHeader>
                          <div className="max-h-[350px] overflow-y-auto border rounded-md">
                              <Table>
                                  <TableHeader>
                                      <TableRow className="bg-slate-50">
                                          <TableHead>Supplier ID</TableHead>
                                          <TableHead>Supplier Name</TableHead>
                                          <TableHead>Category</TableHead>
                                          <TableHead>Status</TableHead>
                                      </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                      {activeSuppliersList.length > 0 ? (
                                          activeSuppliersList.map(s => (
                                              <TableRow key={s.id}>
                                                  <TableCell className="font-bold">{s.id}</TableCell>
                                                  <TableCell>{s.name}</TableCell>
                                                  <TableCell>
                                                      <Badge variant="outline">{s.category || 'Pre-Machining'}</Badge>
                                                  </TableCell>
                                                  <TableCell>
                                                      <Badge className="bg-green-600">Active</Badge>
                                                  </TableCell>
                                              </TableRow>
                                          ))
                                      ) : (
                                          <TableRow>
                                              <TableCell colSpan={4} className="text-center text-slate-400 py-6">No active entries today.</TableCell>
                                          </TableRow>
                                      )}
                                  </TableBody>
                              </Table>
                          </div>
                      </DialogContent>
                  </Dialog>

                  <Dialog>
                      <DialogTrigger asChild>
                          <Card className="border-l-4 border-l-amber-600 cursor-pointer hover:bg-slate-50 transition-colors shadow-sm">
                              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                  <CardTitle className="text-sm font-medium text-slate-500">Suppliers Pending Entry</CardTitle>
                                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                              </CardHeader>
                              <CardContent>
                                  <div className="text-2xl font-bold text-amber-700">{suppliersPendingEntry} Pending</div>
                                  <p className="text-[10px] text-slate-400 mt-1">Click to view scrollable list</p>
                              </CardContent>
                          </Card>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl border-t-4 border-t-amber-600">
                          <DialogHeader>
                              <DialogTitle>Suppliers Pending Entry</DialogTitle>
                              <DialogDescription>
                                  Suppliers awaiting daily logs submission for the selected date ({overviewDateFilter}).
                              </DialogDescription>
                          </DialogHeader>
                          <div className="max-h-[350px] overflow-y-auto border rounded-md">
                              <Table>
                                  <TableHeader>
                                      <TableRow className="bg-slate-50">
                                          <TableHead>Supplier ID</TableHead>
                                          <TableHead>Supplier Name</TableHead>
                                          <TableHead>Category</TableHead>
                                          <TableHead>Status</TableHead>
                                      </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                      {pendingSuppliersList.length > 0 ? (
                                          pendingSuppliersList.map(s => (
                                              <TableRow key={s.id}>
                                                  <TableCell className="font-bold">{s.id}</TableCell>
                                                  <TableCell>{s.name}</TableCell>
                                                  <TableCell>
                                                      <Badge variant="outline">{s.category || 'Pre-Machining'}</Badge>
                                                  </TableCell>
                                                  <TableCell>
                                                      <Badge variant="destructive">Pending</Badge>
                                                  </TableCell>
                                              </TableRow>
                                          ))
                                      ) : (
                                          <TableRow>
                                              <TableCell colSpan={4} className="text-center text-slate-400 py-6">All suppliers have submitted logs today!</TableCell>
                                          </TableRow>
                                      )}
                                  </TableBody>
                              </Table>
                          </div>
                      </DialogContent>
                  </Dialog>

                  <Dialog>
                      <DialogTrigger asChild>
                          <Card className="border-l-4 border-l-primary cursor-pointer hover:bg-slate-50 transition-colors shadow-sm">
                              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                  <CardTitle className="text-sm font-medium text-slate-500">Total Active Parts</CardTitle>
                                  <FileText className="h-4 w-4 text-primary/50" />
                              </CardHeader>
                              <CardContent>
                                  <div className="text-2xl font-bold">{totalPartsCount} Parts</div>
                                  <p className="text-[10px] text-slate-400 mt-1">Click to view scrollable list</p>
                              </CardContent>
                          </Card>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl border-t-4 border-t-orange-500">
                          <DialogHeader>
                              <DialogTitle>Total Active Parts</DialogTitle>
                              <DialogDescription>
                                  All approved component categories configured for active suppliers.
                              </DialogDescription>
                          </DialogHeader>
                          <div className="max-h-[350px] overflow-y-auto border rounded-md">
                              <Table>
                                  <TableHeader>
                                      <TableRow className="bg-slate-50">
                                          <TableHead>Part Number</TableHead>
                                          <TableHead>Part Name</TableHead>
                                          <TableHead>Supplier</TableHead>
                                          <TableHead className="text-right">Monthly Requirement</TableHead>
                                      </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                      {activePartsList.length > 0 ? (
                                          activePartsList.map((p, idx) => (
                                              <TableRow key={idx}>
                                                  <TableCell className="font-mono font-bold text-xs">{p.partNumber}</TableCell>
                                                  <TableCell>{p.partName}</TableCell>
                                                  <TableCell>{p.supplierName} ({p.supplierId})</TableCell>
                                                  <TableCell className="text-right font-mono">{p.monthlyRequirement?.toLocaleString()}</TableCell>
                                              </TableRow>
                                          ))
                                      ) : (
                                          <TableRow>
                                              <TableCell colSpan={4} className="text-center text-slate-400 py-6">No parts configured.</TableCell>
                                          </TableRow>
                                      )}
                                  </TableBody>
                              </Table>
                          </div>
                      </DialogContent>
                  </Dialog>
              </div>

              {/* Live Supplier Production Lines */}
              <Card className="shadow-md">
                   <CardHeader className="bg-slate-50/50">
                       <CardTitle className="text-md flex items-center">
                           <RotateCw className="mr-2 h-5 w-5 text-slate-400" /> Current Live Line Production (Supplier End)
                       </CardTitle>
                       <CardDescription>Live monitoring of active components running on supplier pre-machining lines.</CardDescription>
                   </CardHeader>
                   <CardContent className="pt-6">
                       {liveLineStatuses.length === 0 ? (
                           <p className="text-sm text-slate-400 italic text-center py-6">No active supplier lines logged. Suppliers can log line setting changes in their daily dashboard.</p>
                       ) : (
                           <div className="grid gap-4 md:grid-cols-5">
                               {liveLineStatuses.map((status, index) => (
                                   <Card key={index} className="bg-slate-50/80 border border-slate-200">
                                       <CardContent className="p-4 space-y-2">
                                           <div className="flex justify-between items-center">
                                               <Badge className="bg-blue-600 text-white font-mono text-[10px]">{status.line}</Badge>
                                               <span className="text-[10px] text-slate-400 font-mono">{status.date}</span>
                                           </div>
                                           <div>
                                               <h4 className="font-bold text-slate-700 text-xs truncate" title={status.supplierName}>{status.supplierName}</h4>
                                               <div className="text-xs font-semibold text-green-700 mt-1 font-mono">{status.runningPart}</div>
                                           </div>
                                           <div className="text-[9px] text-slate-400 pt-1 border-t">
                                               Live status updated
                                           </div>
                                       </CardContent>
                                   </Card>
                               ))}
                           </div>
                       )}
                   </CardContent>
               </Card>

              {/* Risk Supplier Dashboard (4) */}
              <div className="grid gap-4 md:grid-cols-3">
                  <Card className="md:col-span-2">
                      <CardHeader>
                          <CardTitle>Inventory Risk Category Summary</CardTitle>
                          <CardDescription>Consolidated suppliers & parts matching safety levels.</CardDescription>
                      </CardHeader>
                      <CardContent>
                          <Table>
                              <TableHeader>
                                  <TableRow className="bg-slate-50">
                                      <TableHead>Safety Status</TableHead>
                                      <TableHead className="text-center">Suppliers Count</TableHead>
                                      <TableHead className="text-center">Parts Count</TableHead>
                                  </TableRow>
                              </TableHeader>
                              <TableBody>
                                  {/* Red Category */}
                                  <Dialog>
                                      <DialogTrigger asChild>
                                          <TableRow className="hover:bg-red-50/50 cursor-pointer">
                                              <TableCell className="font-bold text-red-600 flex items-center gap-2">
                                                  <span>🔴 Red Category</span>
                                              </TableCell>
                                              <TableCell className="text-center font-bold">{riskStats.red.suppliers}</TableCell>
                                              <TableCell className="text-center font-bold text-red-600">{riskStats.red.parts}</TableCell>
                                          </TableRow>
                                      </DialogTrigger>
                                      <DialogContent className="max-w-2xl border-t-4 border-t-red-600">
                                          <DialogHeader>
                                              <DialogTitle className="text-red-600">Red Category - Inventory Shortage List</DialogTitle>
                                              <DialogDescription>
                                                  Components currently below safety stock level / 1 day target production stock.
                                              </DialogDescription>
                                          </DialogHeader>
                                          <div className="max-h-[300px] overflow-y-auto border rounded-md">
                                              <Table>
                                                  <TableHeader>
                                                      <TableRow className="bg-slate-50">
                                                          <TableHead>Supplier</TableHead>
                                                          <TableHead>Part No</TableHead>
                                                          <TableHead>Part Name</TableHead>
                                                          <TableHead className="text-right">Current Stock</TableHead>
                                                          <TableHead className="text-right">Safety Stock</TableHead>
                                                      </TableRow>
                                                  </TableHeader>
                                                  <TableBody>
                                                      {riskStats.red.list.length > 0 ? (
                                                          riskStats.red.list.map((item, idx) => (
                                                              <TableRow key={idx}>
                                                                  <TableCell className="font-bold text-slate-800">{item.supplierName} ({item.supplierId})</TableCell>
                                                                  <TableCell className="font-mono text-xs">{item.partNumber}</TableCell>
                                                                  <TableCell>{item.partName}</TableCell>
                                                                  <TableCell className="text-right font-mono font-bold text-red-600">{item.currentStock?.toLocaleString()}</TableCell>
                                                                  <TableCell className="text-right font-mono text-slate-500">{item.safetyStockLevel?.toLocaleString()}</TableCell>
                                                              </TableRow>
                                                          ))
                                                      ) : (
                                                          <TableRow>
                                                              <TableCell colSpan={5} className="text-center text-slate-400 py-6">No parts in Red Category.</TableCell>
                                                          </TableRow>
                                                      )}
                                                  </TableBody>
                                              </Table>
                                          </div>
                                      </DialogContent>
                                  </Dialog>

                                  {/* Orange Category */}
                                  <Dialog>
                                      <DialogTrigger asChild>
                                          <TableRow className="hover:bg-amber-50/50 cursor-pointer">
                                              <TableCell className="font-bold text-amber-600 flex items-center gap-2">
                                                  <span>▲ Orange Category</span>
                                              </TableCell>
                                              <TableCell className="text-center font-bold">{riskStats.orange.suppliers}</TableCell>
                                              <TableCell className="text-center font-bold text-amber-600">{riskStats.orange.parts}</TableCell>
                                          </TableRow>
                                      </DialogTrigger>
                                      <DialogContent className="max-w-2xl border-t-4 border-t-amber-600">
                                          <DialogHeader>
                                              <DialogTitle className="text-amber-600">Orange Category - Low Inventory Warning List</DialogTitle>
                                              <DialogDescription>
                                                  Components currently below 1.5 days production stock.
                                              </DialogDescription>
                                          </DialogHeader>
                                          <div className="max-h-[300px] overflow-y-auto border rounded-md">
                                              <Table>
                                                  <TableHeader>
                                                      <TableRow className="bg-slate-50">
                                                          <TableHead>Supplier</TableHead>
                                                          <TableHead>Part No</TableHead>
                                                          <TableHead>Part Name</TableHead>
                                                          <TableHead className="text-right">Current Stock</TableHead>
                                                          <TableHead className="text-right">Safety Stock</TableHead>
                                                      </TableRow>
                                                  </TableHeader>
                                                  <TableBody>
                                                      {riskStats.orange.list.length > 0 ? (
                                                          riskStats.orange.list.map((item, idx) => (
                                                              <TableRow key={idx}>
                                                                  <TableCell className="font-bold text-slate-800">{item.supplierName} ({item.supplierId})</TableCell>
                                                                  <TableCell className="font-mono text-xs">{item.partNumber}</TableCell>
                                                                  <TableCell>{item.partName}</TableCell>
                                                                  <TableCell className="text-right font-mono font-bold text-amber-600">{item.currentStock?.toLocaleString()}</TableCell>
                                                                  <TableCell className="text-right font-mono text-slate-500">{item.safetyStockLevel?.toLocaleString()}</TableCell>
                                                              </TableRow>
                                                          ))
                                                      ) : (
                                                          <TableRow>
                                                              <TableCell colSpan={5} className="text-center text-slate-400 py-6">No parts in Orange Category.</TableCell>
                                                          </TableRow>
                                                      )}
                                                  </TableBody>
                                              </Table>
                                          </div>
                                      </DialogContent>
                                  </Dialog>

                                  {/* Green Category */}
                                  <Dialog>
                                      <DialogTrigger asChild>
                                          <TableRow className="hover:bg-green-50/50 cursor-pointer">
                                              <TableCell className="font-bold text-green-600 flex items-center gap-2">
                                                  <span>🟢 Green Category</span>
                                              </TableCell>
                                              <TableCell className="text-center font-bold">{riskStats.green.suppliers}</TableCell>
                                              <TableCell className="text-center font-bold text-green-600">{riskStats.green.parts}</TableCell>
                                          </TableRow>
                                      </DialogTrigger>
                                      <DialogContent className="max-w-2xl border-t-4 border-t-green-600">
                                          <DialogHeader>
                                              <DialogTitle className="text-green-600">Green Category - Safe Inventory List</DialogTitle>
                                              <DialogDescription>
                                                  Components with stock levels above 1.5 days production stock.
                                              </DialogDescription>
                                          </DialogHeader>
                                          <div className="max-h-[300px] overflow-y-auto border rounded-md">
                                              <Table>
                                                  <TableHeader>
                                                      <TableRow className="bg-slate-50">
                                                          <TableHead>Supplier</TableHead>
                                                          <TableHead>Part No</TableHead>
                                                          <TableHead>Part Name</TableHead>
                                                          <TableHead className="text-right">Current Stock</TableHead>
                                                          <TableHead className="text-right">Safety Stock</TableHead>
                                                      </TableRow>
                                                  </TableHeader>
                                                  <TableBody>
                                                      {riskStats.green.list.length > 0 ? (
                                                          riskStats.green.list.map((item, idx) => (
                                                              <TableRow key={idx}>
                                                                  <TableCell className="font-bold text-slate-800">{item.supplierName} ({item.supplierId})</TableCell>
                                                                  <TableCell className="font-mono text-xs">{item.partNumber}</TableCell>
                                                                  <TableCell>{item.partName}</TableCell>
                                                                  <TableCell className="text-right font-mono font-bold text-green-600">{item.currentStock?.toLocaleString()}</TableCell>
                                                                  <TableCell className="text-right font-mono text-slate-500">{item.safetyStockLevel?.toLocaleString()}</TableCell>
                                                              </TableRow>
                                                          ))
                                                      ) : (
                                                          <TableRow>
                                                              <TableCell colSpan={5} className="text-center text-slate-400 py-6">No parts in Green Category.</TableCell>
                                                          </TableRow>
                                                      )}
                                                  </TableBody>
                                              </Table>
                                          </div>
                                      </DialogContent>
                                  </Dialog>
                              </TableBody>
                          </Table>
                      </CardContent>
                  </Card>

                  {/* SQA Actions Card */}
                  <Card>
                      <CardHeader>
                          <CardTitle>Management Actions</CardTitle>
                          <CardDescription>Rapid controls & creation links.</CardDescription>
                      </CardHeader>
                      <CardContent className="grid gap-3 pt-2">
                          <Button variant="outline" className="justify-start border-slate-200" asChild>
                              <a href="/dashboard/admin/suppliers">
                                  <PlusCircle className="mr-2 h-4 w-4 text-green-500" /> Manage Suppliers & Opening Stock
                              </a>
                          </Button>
                          <Button variant="outline" className="justify-start border-slate-200" asChild>
                              <a href="/dashboard/admin/issues">
                                  <AlertTriangle className="mr-2 h-4 w-4 text-red-500" /> Track SQA Quality Concerns
                              </a>
                          </Button>
                          <Button variant="outline" className="justify-start border-slate-200" asChild>
                              <a href="/dashboard/admin/approvals">
                                  <CheckCircle2 className="mr-2 h-4 w-4 text-blue-500" /> Approve APQP/PPAP Submissions
                              </a>
                          </Button>
                      </CardContent>
                  </Card>
              </div>
          </TabsContent>

          {/* 2. Today's Activity (Production & Dispatch logs) Tab */}
          <TabsContent value="todays-activity" className="space-y-6">
              {/* Today's Production Table (2) */}
              <Card>
                  <CardHeader>
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div>
                              <CardTitle>Today's Production Entries</CardTitle>
                              <CardDescription>Logs of items produced categorized by shifts and lines.</CardDescription>
                          </div>
                          <div className="flex flex-wrap gap-2 items-center bg-slate-50 p-2 rounded-lg border">
                              <div className="grid gap-1">
                                  <Label className="text-[10px] text-slate-500">Date</Label>
                                  <Input type="date" value={prodDateInput} onChange={(e) => setProdDateInput(e.target.value)} className="h-8 text-xs py-1 px-2 w-[130px] bg-white"/>
                              </div>
                              <div className="grid gap-1">
                                  <Label className="text-[10px] text-slate-500">Supplier</Label>
                                  <Select value={prodSupplierInput} onValueChange={setProdSupplierInput}>
                                      <SelectTrigger className="h-8 text-xs bg-white w-[130px]"><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                          <SelectItem value="All">All Suppliers</SelectItem>
                                          {supplierList.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                      </SelectContent>
                                  </Select>
                              </div>
                              <div className="grid gap-1">
                                  <Label className="text-[10px] text-slate-500">Line</Label>
                                  <Select value={prodLineInput} onValueChange={setProdLineInput}>
                                      <SelectTrigger className="h-8 text-xs bg-white w-[90px]"><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                          <SelectItem value="All">All Lines</SelectItem>
                                          <SelectItem value="Line-1">Line-1</SelectItem>
                                          <SelectItem value="Line-2">Line-2</SelectItem>
                                          <SelectItem value="Line-3">Line-3</SelectItem>
                                      </SelectContent>
                                  </Select>
                              </div>
                              <div className="grid gap-1">
                                  <Label className="text-[10px] text-slate-500">Shift</Label>
                                  <Select value={prodShiftInput} onValueChange={setProdShiftInput}>
                                      <SelectTrigger className="h-8 text-xs bg-white w-[90px]"><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                          <SelectItem value="All">All Shifts</SelectItem>
                                          <SelectItem value="Shift A">Shift A</SelectItem>
                                          <SelectItem value="Shift B">Shift B</SelectItem>
                                          <SelectItem value="Shift C">Shift C</SelectItem>
                                      </SelectContent>
                                  </Select>
                              </div>
                              <div className="grid gap-1">
                                  <Label className="text-[10px] text-slate-500">Part Filter</Label>
                                  <Select value={prodPartInput} onValueChange={setProdPartInput}>
                                      <SelectTrigger className="h-8 text-xs bg-white w-[120px]"><SelectValue placeholder="All Parts" /></SelectTrigger>
                                      <SelectContent>
                                          <SelectItem value="All">All Parts</SelectItem>
                                          {prodPartsList.map((p: any, idx: number) => (
                                              <SelectItem key={idx} value={p.partNumber}>{p.name}</SelectItem>
                                          ))}
                                      </SelectContent>
                                  </Select>
                              </div>
                              <div className="grid gap-1 mt-auto pt-1">
                                  <Button onClick={refreshData} className="h-8 bg-slate-800 hover:bg-slate-700 text-white text-xs px-3 font-semibold flex items-center gap-1">
                                      <RotateCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
                                  </Button>
                              </div>
                          </div>
                      </div>
                  </CardHeader>
                  <CardContent>
                      <div className="border rounded-md overflow-hidden">
                          <Table>
                              <TableHeader>
                                  <TableRow className="bg-slate-50">
                                      <TableHead>Supplier Name</TableHead>
                                      <TableHead>Line Name</TableHead>
                                      <TableHead>Part No</TableHead>
                                      <TableHead>Shift</TableHead>
                                      <TableHead className="text-right">Production Qty</TableHead>
                                      <TableHead className="text-right">Rejection Qty</TableHead>
                                      <TableHead>Shortage Reason</TableHead>
                                  </TableRow>
                              </TableHeader>
                              <TableBody>
                                  {filteredProduction.length > 0 ? (
                                      filteredProduction.map((log, idx) => {
                                          const supp = suppliers.find(s => s.id === log.supplierId)
                                          return (
                                              <TableRow key={idx} className="hover:bg-slate-50/50">
                                                  <TableCell className="font-medium text-slate-800">{supp ? supp.name : log.supplierId}</TableCell>
                                                  <TableCell>{log.productionLine || "Line-1"}</TableCell>
                                                  <TableCell className="font-mono">{log.partNumber}</TableCell>
                                                  <TableCell><Badge variant="outline">{log.shift || "Shift A"}</Badge></TableCell>
                                                  <TableCell className="text-right font-bold text-slate-800">{log.production?.toLocaleString() || 0}</TableCell>
                                                  <TableCell className="text-right text-red-500 font-bold">{log.rejection?.toLocaleString() || 0}</TableCell>
                                                  <TableCell className="text-xs text-red-600 font-bold">{log.shortageReason || "None"}</TableCell>
                                              </TableRow>
                                          )
                                      })
                                  ) : (
                                      <TableRow>
                                          <td colSpan={7} className="text-center py-10 text-slate-400 italic">No production entries recorded for this filter selection.</td>
                                      </TableRow>
                                  )}
                              </TableBody>
                          </Table>
                      </div>
                  </CardContent>
              </Card>

              {/* Today's Dispatch Table (1) */}
              <Card>
                  <CardHeader>
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div>
                              <CardTitle>Today's Dispatch Entries</CardTitle>
                              <CardDescription>Logs of products dispatched to SAKTHI plant today.</CardDescription>
                          </div>
                          <div className="flex flex-wrap gap-2 items-center bg-slate-50 p-2 rounded-lg border">
                              <div className="grid gap-1">
                                  <Label className="text-[10px] text-slate-500">Date</Label>
                                  <Input type="date" value={dispDateInput} onChange={(e) => setDispDateInput(e.target.value)} className="h-8 text-xs py-1 px-2 w-[130px] bg-white"/>
                              </div>
                              <div className="grid gap-1">
                                  <Label className="text-[10px] text-slate-500">Supplier</Label>
                                  <Select value={dispSupplierInput} onValueChange={setDispSupplierInput}>
                                      <SelectTrigger className="h-8 text-xs bg-white w-[130px]"><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                          <SelectItem value="All">All Suppliers</SelectItem>
                                          {supplierList.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                      </SelectContent>
                                  </Select>
                              </div>
                              <div className="grid gap-1">
                                  <Label className="text-[10px] text-slate-500">Part No</Label>
                                  <Select value={dispPartInput} onValueChange={setDispPartInput}>
                                      <SelectTrigger className="h-8 text-xs bg-white w-[140px]"><SelectValue placeholder="All Parts" /></SelectTrigger>
                                      <SelectContent>
                                          <SelectItem value="All">All Parts</SelectItem>
                                          {dispPartsList.map((p: any, idx: number) => (
                                              <SelectItem key={idx} value={p.partNumber}>{p.name}</SelectItem>
                                          ))}
                                      </SelectContent>
                                  </Select>
                              </div>
                              <div className="grid gap-1 mt-auto pt-1">
                                  <Button onClick={refreshData} className="h-8 bg-slate-800 hover:bg-slate-700 text-white text-xs px-3 font-semibold flex items-center gap-1">
                                      <RotateCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
                                  </Button>
                              </div>
                          </div>
                      </div>
                  </CardHeader>
                  <CardContent>
                      <div className="border rounded-md overflow-hidden">
                          <Table>
                              <TableHeader>
                                  <TableRow className="bg-slate-50">
                                      <TableHead>Supplier Name</TableHead>
                                      <TableHead>Part No</TableHead>
                                      <TableHead className="text-right">Dispatch Qty</TableHead>
                                  </TableRow>
                              </TableHeader>
                              <TableBody>
                                  {filteredDispatch.length > 0 ? (
                                      filteredDispatch.map((log, idx) => {
                                          const supp = suppliers.find(s => s.id === log.supplierId)
                                          return (
                                              <TableRow key={idx} className="hover:bg-slate-50/50">
                                                  <TableCell className="font-medium text-slate-800">{supp ? supp.name : log.supplierId}</TableCell>
                                                  <TableCell className="font-mono">{log.partNumber}</TableCell>
                                                  <TableCell className="text-right font-bold text-slate-900">{log.dispatch?.toLocaleString() || 0} Units</TableCell>
                                              </TableRow>
                                          )
                                      })
                                  ) : (
                                      <TableRow>
                                          <td colSpan={3} className="text-center py-10 text-slate-400 italic">No dispatch entries recorded for this filter selection.</td>
                                      </TableRow>
                                  )}
                              </TableBody>
                          </Table>
                      </div>
                  </CardContent>
              </Card>
          </TabsContent>

          {/* 3. Current Inventory Stock Tab */}
          <TabsContent value="inventory" className="space-y-6">
              {/* Inventory Summary Cards */}
              <div className="grid gap-4 md:grid-cols-3">
                  <Dialog>
                      <DialogTrigger asChild>
                          <Card className="border-l-4 border-l-orange-500 cursor-pointer hover:bg-slate-50 transition-colors shadow-sm">
                              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                  <CardTitle className="text-sm font-medium text-slate-500">Total Casting Issued</CardTitle>
                                  <RotateCw className="h-4 w-4 text-orange-500" />
                              </CardHeader>
                              <CardContent>
                                  <div className="text-2xl font-bold text-orange-600">
                                      {filteredInventory.reduce((sum, item) => sum + (item.castingIssued || 0), 0).toLocaleString()} Nos
                                  </div>
                                  <p className="text-[10px] text-slate-400 mt-1">Click to view part-wise scrollable list</p>
                              </CardContent>
                          </Card>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl border-t-4 border-t-orange-500">
                          <DialogHeader>
                              <DialogTitle>Part-wise Casting Issued Breakdown</DialogTitle>
                              <DialogDescription>
                                  Total raw castings supplied to partners for the selected filter.
                              </DialogDescription>
                          </DialogHeader>
                          <div className="max-h-[350px] overflow-y-auto border rounded-md">
                              <Table>
                                  <TableHeader>
                                      <TableRow className="bg-slate-50">
                                          <TableHead>Part Number</TableHead>
                                          <TableHead>Part Name</TableHead>
                                          <TableHead>Supplier</TableHead>
                                          <TableHead className="text-right">Casting Issued</TableHead>
                                      </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                      {filteredInventory.length > 0 ? (
                                          filteredInventory.map((item, idx) => (
                                              <TableRow key={idx}>
                                                  <TableCell className="font-mono font-bold text-xs">{item.partNumber}</TableCell>
                                                  <TableCell>{item.partName}</TableCell>
                                                  <TableCell>{item.supplierName} ({item.supplierId})</TableCell>
                                                  <TableCell className="text-right font-mono font-bold text-orange-600">
                                                      +{item.castingIssued?.toLocaleString() || 0}
                                                  </TableCell>
                                              </TableRow>
                                          ))
                                      ) : (
                                          <TableRow>
                                              <TableCell colSpan={4} className="text-center text-slate-400 py-6">No records found.</TableCell>
                                          </TableRow>
                                      )}
                                  </TableBody>
                              </Table>
                          </div>
                      </DialogContent>
                  </Dialog>

                  <Dialog>
                      <DialogTrigger asChild>
                          <Card className="border-l-4 border-l-blue-600 cursor-pointer hover:bg-slate-50 transition-colors shadow-sm">
                              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                  <CardTitle className="text-sm font-medium text-slate-500">Total Machined Parts Received</CardTitle>
                                  <TrendingUp className="h-4 w-4 text-blue-600" />
                              </CardHeader>
                              <CardContent>
                                  <div className="text-2xl font-bold text-blue-700">
                                      {filteredInventory.reduce((sum, item) => sum + (item.dispatch || 0), 0).toLocaleString()} Nos
                                  </div>
                                  <p className="text-[10px] text-slate-400 mt-1">Click to view part-wise scrollable list</p>
                              </CardContent>
                          </Card>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl border-t-4 border-t-blue-600">
                          <DialogHeader>
                              <DialogTitle>Part-wise Machined Parts Received Breakdown</DialogTitle>
                              <DialogDescription>
                                  Total finished components returned by partners for the selected filter.
                              </DialogDescription>
                          </DialogHeader>
                          <div className="max-h-[350px] overflow-y-auto border rounded-md">
                              <Table>
                                  <TableHeader>
                                      <TableRow className="bg-slate-50">
                                          <TableHead>Part Number</TableHead>
                                          <TableHead>Part Name</TableHead>
                                          <TableHead>Supplier</TableHead>
                                          <TableHead className="text-right">Machined Parts Received</TableHead>
                                      </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                      {filteredInventory.length > 0 ? (
                                          filteredInventory.map((item, idx) => (
                                              <TableRow key={idx}>
                                                  <TableCell className="font-mono font-bold text-xs">{item.partNumber}</TableCell>
                                                  <TableCell>{item.partName}</TableCell>
                                                  <TableCell>{item.supplierName} ({item.supplierId})</TableCell>
                                                  <TableCell className="text-right font-mono font-bold text-blue-600">
                                                      -{item.dispatch?.toLocaleString() || 0} Nos
                                                  </TableCell>
                                              </TableRow>
                                          ))
                                      ) : (
                                          <TableRow>
                                              <TableCell colSpan={4} className="text-center text-slate-400 py-6">No records found.</TableCell>
                                          </TableRow>
                                      )}
                                  </TableBody>
                              </Table>
                          </div>
                      </DialogContent>
                  </Dialog>

                  <Dialog>
                      <DialogTrigger asChild>
                          <Card className="border-l-4 border-l-green-600 cursor-pointer hover:bg-slate-50 transition-colors shadow-sm">
                              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                  <CardTitle className="text-sm font-medium text-slate-500">Total Current Stock (WIP)</CardTitle>
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                              </CardHeader>
                              <CardContent>
                                  <div className="text-2xl font-bold text-green-700">
                                      {filteredInventory.reduce((sum, item) => sum + (item.currentStock || 0), 0).toLocaleString()} Nos
                                  </div>
                                  <p className="text-[10px] text-slate-400 mt-1">Click to view part-wise scrollable list</p>
                              </CardContent>
                          </Card>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl border-t-4 border-t-green-600">
                          <DialogHeader>
                              <DialogTitle>Part-wise Current Stock Breakdown</DialogTitle>
                              <DialogDescription>
                                  Live inventory balances currently held at partners' ends.
                              </DialogDescription>
                          </DialogHeader>
                          <div className="max-h-[350px] overflow-y-auto border rounded-md">
                              <Table>
                                  <TableHeader>
                                      <TableRow className="bg-slate-50">
                                          <TableHead>Part Number</TableHead>
                                          <TableHead>Part Name</TableHead>
                                          <TableHead>Supplier</TableHead>
                                          <TableHead className="text-right">Current Stock</TableHead>
                                          <TableHead>Status</TableHead>
                                      </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                      {filteredInventory.length > 0 ? (
                                          filteredInventory.map((item, idx) => {
                                              let alertBadge = "bg-green-600 text-white"
                                              let alertText = "Green (Safe)"
                                              
                                              if (item.currentStock < 100) {
                                                  alertBadge = "bg-red-600 text-white animate-pulse"
                                                  alertText = "Red (Critical)"
                                              } else if (item.currentStock < 500) {
                                                  alertBadge = "bg-amber-600 text-white"
                                                  alertText = "Orange (Low)"
                                              }
                                              return (
                                                  <TableRow key={idx}>
                                                      <TableCell className="font-mono font-bold text-xs">{item.partNumber}</TableCell>
                                                      <TableCell>{item.partName}</TableCell>
                                                      <TableCell>{item.supplierName} ({item.supplierId})</TableCell>
                                                      <TableCell className="text-right font-mono font-bold text-slate-900">
                                                          {item.currentStock?.toLocaleString() || 0}
                                                      </TableCell>
                                                      <TableCell>
                                                          <Badge className={`border-0 font-medium ${alertBadge}`}>
                                                              {alertText}
                                                          </Badge>
                                                      </TableCell>
                                                  </TableRow>
                                              )
                                          })
                                      ) : (
                                          <TableRow>
                                              <TableCell colSpan={5} className="text-center text-slate-400 py-6">No records found.</TableCell>
                                          </TableRow>
                                      )}
                                  </TableBody>
                              </Table>
                          </div>
                      </DialogContent>
                  </Dialog>
              </div>

              <Card>
                  <CardHeader>
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div>
                              <CardTitle>Current Inventory Stock</CardTitle>
                              <CardDescription>Live closing balance derived automatically using closing stock formula.</CardDescription>
                          </div>
                          <div className="flex flex-wrap gap-2 items-center bg-slate-50 p-2 rounded-lg border">
                              <div className="grid gap-1">
                                  <Label className="text-[10px] text-slate-500">Supplier</Label>
                                  <Select value={invSupplierInput} onValueChange={setInvSupplierInput}>
                                      <SelectTrigger className="h-8 text-xs bg-white w-[180px]"><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                          <SelectItem value="All">All Suppliers</SelectItem>
                                          {supplierList.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                      </SelectContent>
                                  </Select>
                              </div>
                              <div className="grid gap-1">
                                  <Label className="text-[10px] text-slate-500">Part No / Description</Label>
                                  <Select value={invPartInput} onValueChange={setInvPartInput}>
                                      <SelectTrigger className="h-8 text-xs bg-white w-[220px]"><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                          <SelectItem value="All">All Parts</SelectItem>
                                          {uniquePartsList.map(p => (
                                              <SelectItem key={p.partNumber} value={p.partNumber}>
                                                  {p.partName} ({p.partNumber})
                                              </SelectItem>
                                          ))}
                                      </SelectContent>
                                  </Select>
                              </div>
                          </div>
                      </div>
                  </CardHeader>
                  <CardContent>
                      <div className="border rounded-md overflow-hidden">
                          <Table>
                              <TableHeader>
                                  <TableRow className="bg-slate-50">
                                      <TableHead>Supplier</TableHead>
                                      <TableHead>Part Name</TableHead>
                                      <TableHead>Part No</TableHead>
                                      <TableHead className="text-right">Opening Stock</TableHead>
                                      <TableHead className="text-right">Casting Issued</TableHead>
                                      <TableHead className="text-right">Machined Parts Received</TableHead>
                                      <TableHead className="text-right">Current Stock</TableHead>
                                      <TableHead>Status</TableHead>
                                  </TableRow>
                              </TableHeader>
                              <TableBody>
                                  {filteredInventory.length > 0 ? (
                                      filteredInventory.map((item, idx) => {
                                          let alertBadge = "bg-green-600 hover:bg-green-700 text-white"
                                          let alertText = "Green (Safe)"
                                          
                                          if (item.currentStock < 100) {
                                              alertBadge = "bg-red-600 hover:bg-red-700 text-white animate-pulse"
                                              alertText = "Red (Critical)"
                                          } else if (item.currentStock < 500) {
                                              alertBadge = "bg-amber-600 hover:bg-amber-700 text-white"
                                              alertText = "Orange (Low)"
                                          }
                                          return (
                                              <TableRow key={idx} className="hover:bg-slate-50/50">
                                                  <TableCell>
                                                      <span className="font-bold text-slate-800">{item.supplierId}</span>
                                                      <div className="text-xs text-slate-400">{item.supplierName}</div>
                                                  </TableCell>
                                                  <TableCell className="font-medium text-slate-700">{item.partName || "Component"}</TableCell>
                                                  <TableCell className="font-mono text-xs">{item.partNumber}</TableCell>
                                                  <TableCell className="text-right font-mono text-slate-500">{item.openingStock?.toLocaleString() || 0} Nos</TableCell>
                                                  <TableCell className="text-right text-slate-700 font-medium font-mono">+{item.castingIssued?.toLocaleString() || 0} Nos</TableCell>
                                                  <TableCell className="text-right text-slate-700 font-medium font-mono">-{item.dispatch?.toLocaleString() || 0} Nos</TableCell>
                                                  <TableCell className="text-right font-bold text-slate-900 font-mono text-md">{item.currentStock?.toLocaleString() || 0} Nos</TableCell>
                                                  <TableCell>
                                                      <Badge className={`border-0 font-medium ${alertBadge}`}>
                                                          {alertText}
                                                      </Badge>
                                                  </TableCell>
                                              </TableRow>
                                          )
                                      })
                                  ) : (
                                      <TableRow>
                                          <td colSpan={8} className="text-center py-10 text-slate-400 italic">No inventory balances compiled for this criteria.</td>
                                      </TableRow>
                                  )}
                              </TableBody>
                          </Table>
                      </div>
                  </CardContent>
              </Card>
          </TabsContent>

          {/* 6. Supplier Performance Charts Tab */}
          <TabsContent value="performance" className="space-y-6">
              <Card>
                  <CardHeader>
                      <CardTitle>Supplier Performance & Analytics</CardTitle>
                      <CardDescription>Track daily production, dispatch, rejection, and quality trends.</CardDescription>
                      <div className="grid gap-3 md:grid-cols-6 pt-4 bg-slate-50 p-4 rounded-lg border mt-2">
                          <div className="grid gap-1">
                              <Label className="text-xs font-medium text-slate-600">Supplier</Label>
                              <Select value={chartSupplierFilter} onValueChange={(val) => { setChartSupplierFilter(val); setChartSupplierInput(val); }}>
                                  <SelectTrigger className="h-9 bg-white"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                      <SelectItem value="All">All Suppliers</SelectItem>
                                      {supplierList.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                  </SelectContent>
                              </Select>
                          </div>
                          <div className="grid gap-1">
                              <Label className="text-xs font-medium text-slate-600">Month</Label>
                              <Select value={chartMonthFilter} onValueChange={(val) => { setChartMonthFilter(val); setChartMonthInput(val); }}>
                                  <SelectTrigger className="h-9 bg-white"><SelectValue /></SelectTrigger>
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
                              <Label className="text-xs font-medium text-slate-600">Start Date</Label>
                              <Input type="date" value={chartStartDate} onChange={(e) => { setChartStartDate(e.target.value); setChartStartDateInput(e.target.value); }} className="h-9 bg-white"/>
                          </div>
                          <div className="grid gap-1">
                              <Label className="text-xs font-medium text-slate-600">End Date</Label>
                              <Input type="date" value={chartEndDate} onChange={(e) => { setChartEndDate(e.target.value); setChartEndDateInput(e.target.value); }} className="h-9 bg-white"/>
                          </div>
                          <div className="grid gap-1">
                              <Label className="text-xs font-medium text-slate-600">Part Dropdown</Label>
                              <Select value={chartPartFilter} onValueChange={(val) => { setChartPartFilter(val); setChartPartInput(val); }}>
                                  <SelectTrigger className="h-9 bg-white"><SelectValue placeholder="All Parts" /></SelectTrigger>
                                  <SelectContent>
                                      <SelectItem value="All">All Parts</SelectItem>
                                      {chartPartsList.map((p, idx) => (
                                          <SelectItem key={idx} value={p.partNumber}>{p.name} ({p.partNumber})</SelectItem>
                                      ))}
                                  </SelectContent>
                              </Select>
                          </div>
                          <div className="grid gap-1 mt-auto">
                              <Button onClick={refreshData} className="h-9 bg-slate-800 hover:bg-slate-700 text-white font-semibold flex items-center justify-center gap-1.5">
                                  <RotateCw className="h-4 w-4" /> Refresh Data
                              </Button>
                          </div>
                      </div>
                  </CardHeader>
                  <CardContent className="space-y-8">
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
                                                          {pieChartData.map((entry, index) => {
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
                                                      {defectPartsOptions.map((opt, idx) => (
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
                                                          {defectPieChartData.map((entry, index) => {
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

                              {/* Part-wise Rejection Details (%) & Recorded Defects */}
                              <Card className="shadow-sm border bg-white mt-4">
                                  <CardHeader>
                                      <CardTitle className="text-md font-bold text-slate-800">Part-wise Rejection Details (%) & Recorded Defects</CardTitle>
                                      <CardDescription>Breakdown of components rejected including registered defect reasons. Click table headers to sort.</CardDescription>
                                  </CardHeader>
                                  <CardContent>
                                      <div className="border rounded-md overflow-hidden bg-white">
                                          <Table>
                                              <TableHeader className="bg-slate-50">
                                                  <TableRow>
                                                      <TableHead 
                                                          className="cursor-pointer hover:bg-slate-100/80 transition-colors select-none"
                                                          onClick={() => handleSort("partName")}
                                                      >
                                                          Part Name & Number {sortField === "partName" ? (sortDirection === "asc" ? "▲" : "▼") : ""}
                                                      </TableHead>
                                                      <TableHead 
                                                          className="text-right cursor-pointer hover:bg-slate-100/80 transition-colors select-none"
                                                          onClick={() => handleSort("rejectionQty")}
                                                      >
                                                          Rejection Qty {sortField === "rejectionQty" ? (sortDirection === "asc" ? "▲" : "▼") : ""}
                                                      </TableHead>
                                                      <TableHead 
                                                          className="text-right cursor-pointer hover:bg-slate-100/80 transition-colors select-none"
                                                          onClick={() => handleSort("percentage")}
                                                      >
                                                          Rejection Share (%) {sortField === "percentage" ? (sortDirection === "asc" ? "▲" : "▼") : ""}
                                                      </TableHead>
                                                      <TableHead>Recorded Defect of Part</TableHead>
                                                  </TableRow>
                                              </TableHeader>
                                              <TableBody>
                                                  {sortedPartRejectionData.length > 0 ? (
                                                      sortedPartRejectionData.map((item: any, idx: number) => (
                                                          <TableRow key={idx} className="hover:bg-slate-50/40 text-xs">
                                                              <TableCell>
                                                                  <span className="font-bold text-slate-800">{item.partName}</span>
                                                                  <div className="text-[10px] text-slate-400 font-mono">{item.partNumber}</div>
                                                              </TableCell>
                                                              <TableCell className="text-right font-semibold font-mono text-red-600">
                                                                  {item.rejectionQty.toLocaleString()} Units
                                                              </TableCell>
                                                              <TableCell className="text-right font-bold text-slate-900 font-mono">
                                                                  {item.percentage}%
                                                              </TableCell>
                                                              <TableCell className="text-slate-600 font-medium">
                                                                  {item.defects.length > 0 ? (
                                                                      <div className="flex flex-wrap gap-1">
                                                                          {item.defects.map((def: string, dIdx: number) => (
                                                                              <Badge key={dIdx} variant="outline" className="text-[10px] font-normal border-red-200 bg-red-50/30 text-red-700">
                                                                                  {def}
                                                                              </Badge>
                                                                          ))}
                                                                      </div>
                                                                  ) : (
                                                                      <span className="italic text-slate-400">No defect description logged</span>
                                                                  )}
                                                              </TableCell>
                                                          </TableRow>
                                                      ))
                                                  ) : (
                                                      <TableRow>
                                                          <TableCell colSpan={4} className="text-center py-8 text-slate-400 italic">No rejection entries registered for the filtered range.</TableCell>
                                                      </TableRow>
                                                  )}
                                              </TableBody>
                                          </Table>
                                      </div>
                                  </CardContent>
                              </Card>
                          </>
                      ) : (
                          <div className="flex flex-col items-center justify-center py-20 text-slate-400 italic">
                              <BarChart4 className="h-10 w-10 text-slate-300 mb-2"/>
                              {loading ? "Loading chart visualization..." : "No production performance records found for the filtered period."}
                          </div>
                      )}
                  </CardContent>
              </Card>
          </TabsContent>
      </Tabs>
    </div>
  )
}
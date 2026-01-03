"use client"

import { useEffect, useState } from "react"
import { MOCK_PERFORMANCE, MOCK_DAILY_LOGS } from "@/lib/performance"
import { PerformanceLineChart, RejectionPieChart } from "@/components/dashboard/enhanced-charts"
import { getAllUsers } from "@/lib/auth"

import { SYSTEM_SETTINGS } from "@/lib/settings"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function SupplierDashboardPage() {
  const [supplierId, setSupplierId] = useState<string>("")
  const [supplierName, setSupplierName] = useState<string>("")
  const [supplierCategory, setSupplierCategory] = useState<string>("")
  
  const [dailyLogs, setDailyLogs] = useState<any[]>([])
  const [selectedPart, setSelectedPart] = useState<string>("ALL")

  useEffect(() => {
      // simulate session check
      const storedId = localStorage.getItem("currentUserId")
      const allUsers = getAllUsers()
      
      if (storedId && allUsers[storedId]) {
          setSupplierId(storedId)
          setSupplierName(allUsers[storedId].name)
          setSupplierCategory(allUsers[storedId].companyDetails?.category || "")
          setDailyLogs(MOCK_DAILY_LOGS[storedId] || [])
      } else {
          setSupplierName("Unknown Supplier")
      }
  }, [])

  // --- Filtering Logic ---
  const uniqueParts = Array.from(new Set(dailyLogs.map(l => l.partName).filter(Boolean)))

  const filteredLogs = selectedPart === "ALL" 
      ? dailyLogs 
      : dailyLogs.filter(l => l.partName === selectedPart)

  // --- Aggregation Logic (Month-wise) ---
  const monthlyData = filteredLogs.reduce((acc: Record<string, { totalReceived: number, totalRejected: number, totalTarget: number, complaints: number }>, log: any) => {
      // Create Key: "Oct 2025" or "2025-10"
      const date = new Date(log.date)
      const monthKey = date.toLocaleString('default', { month: 'short', year: 'numeric' }) // e.g., "Oct 2025"
      
      if (!acc[monthKey]) {
          acc[monthKey] = { totalReceived: 0, totalRejected: 0, totalTarget: 0, complaints: 0 }
      }

      acc[monthKey].totalReceived += (Number(log.loadReceived) || 0)
      acc[monthKey].totalRejected += (Number(log.rejectedQty) || 0)
      acc[monthKey].totalTarget += (Number(log.castingIssued) || 0)
      acc[monthKey].complaints += (Number(log.complaints) || 0)

      return acc
  }, {})

  // Convert to Array and Calculate KPIs
  const tableData = Object.entries(monthlyData).map(([month, data]) => {
      const ppm = data.totalReceived > 0 
          ? Math.round((data.totalRejected / data.totalReceived) * 1000000) 
          : 0
      
      const deliveryPerf = data.totalTarget > 0 
          ? Math.round((data.totalReceived / data.totalTarget) * 100) 
          : 0 // Or 100 if target 0? Usually 0 if no target.

      return {
          month,
          ppm,
          deliveryPerf,
          complaints: data.complaints,
          rawDate: new Date(month) // Helper for sort
      }
  }).sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime()) // Newest first

  return (
    <div className="flex-1 flex flex-col space-y-4 font-sans text-sm">
      
      {/* Header */}
      {/* Header */}
      <div className="border border-black bg-gray-100 p-2 flex items-center justify-between">
         <div className="flex items-center space-x-4 w-1/3">
             <span className="font-bold text-gray-700 whitespace-nowrap">Filter Part:</span>
             <Select value={selectedPart} onValueChange={setSelectedPart}>
                <SelectTrigger className="w-[180px] bg-white border-black h-8 text-xs font-bold">
                    <SelectValue placeholder="All Parts" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="ALL">All Parts</SelectItem>
                    {uniqueParts.map(part => (
                        <SelectItem key={part} value={part}>{part}</SelectItem>
                    ))}
                </SelectContent>
             </Select>
         </div>
         <div className="flex-1 text-center">
             <h2 className="text-xl font-bold uppercase tracking-wide">SUPPLIER DASHBOARD - MONTHLY PERFORMANCE</h2>
         </div>
         <div className="w-1/4 text-right">
             <span className="font-bold text-gray-700">{supplierName}</span>
         </div>
      </div>

      {/* Monthly Performance Table */}
      <div className="border border-black bg-white shadow-sm overflow-hidden">
           <table className="w-full text-left border-collapse">
               <thead className="bg-gray-800 text-white uppercase text-xs">
                   <tr>
                       <th className="p-3 border-r border-gray-700 w-1/4">Month</th>
                       <th className="p-3 border-r border-gray-700 text-center w-1/4">Quality PPM</th>
                       <th className="p-3 border-r border-gray-700 text-center w-1/4">Delivery Performance %</th>
                       <th className="p-3 text-center w-1/4">No. of Customer Concerns</th>
                   </tr>
               </thead>
               <tbody className="divide-y divide-gray-200">
                   {tableData.length > 0 ? (
                       tableData.map((row, index) => {
                           const targetPPM = supplierCategory === "Child-Part" 
                               ? SYSTEM_SETTINGS.ppmTargets.childPart 
                               : SYSTEM_SETTINGS.ppmTargets.preMachining

                           return (
                               <tr key={index} className="hover:bg-gray-50">
                                   <td className="p-3 border-r font-bold text-gray-800">{row.month}</td>
                                   <td className="p-3 border-r text-center font-medium">
                                       <span className={row.ppm > targetPPM ? "text-red-600 font-bold" : "text-green-600 font-bold"}>
                                           {row.ppm.toLocaleString()}
                                       </span>
                                   </td>
                                   <td className="p-3 border-r text-center font-medium">
                                       <span className={row.deliveryPerf < 100 ? "text-amber-600 font-bold" : "text-green-600 font-bold"}>
                                           {row.deliveryPerf}%
                                       </span>
                                   </td>
                                   <td className="p-3 text-center font-bold">
                                       {row.complaints > 0 ? (
                                           <span className="text-red-700">{row.complaints}</span>
                                       ) : (
                                           <span className="text-gray-400">-</span>
                                       )}
                                   </td>
                               </tr>
                           )
                       })
                   ) : (
                       <tr>
                           <td colSpan={4} className="p-8 text-center text-gray-400 italic">
                               No performance data recorded yet.
                           </td>
                       </tr>
                   )}
               </tbody>
           </table>
      </div>
      
      <div className="text-xs text-gray-500 italic mt-2">
          * PPM = (Rejected Qty / Received Qty) × 1,000,000
          <br/>
          * Delivery % = (Received Qty / Scheduled Qty) × 100
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {/* Quality PPM Chart */}
          <div className="border border-black bg-white p-2 shadow-sm">
              <h3 className="text-center font-bold text-gray-700 mb-2 border-b pb-1">Quality PPM Trend</h3>
              <div className="h-[200px]">
                  <PerformanceLineChart 
                    data={tableData.map(d => ({ month: d.month, qualityScore: d.ppm, deliveryScore: 0, complaints: 0, repeatedProblems: 0 })).reverse()} 
                    type="Quality" 
                  />
              </div>
          </div>

          {/* Delivery Performance Chart */}
          <div className="border border-black bg-white p-2 shadow-sm">
              <h3 className="text-center font-bold text-gray-700 mb-2 border-b pb-1">Delivery Performance % Trend</h3>
              <div className="h-[200px]">
                  <PerformanceLineChart 
                    data={tableData.map(d => ({ month: d.month, qualityScore: 0, deliveryScore: d.deliveryPerf, complaints: 0, repeatedProblems: 0 })).reverse()} 
                    type="Delivery" 
                  />
              </div>
          </div>

          {/* Complaints Chart */}
          <div className="border border-black bg-white p-2 shadow-sm">
              <h3 className="text-center font-bold text-gray-700 mb-2 border-b pb-1">Customer Complaints Trend</h3>
              <div className="h-[200px]">
                   <PerformanceLineChart 
                    data={tableData.map(d => ({ month: d.month, qualityScore: 0, deliveryScore: 0, complaints: d.complaints, repeatedProblems: 0 })).reverse()} 
                    type="Complaints" 
                  />
              </div>
          </div>
      </div>

      {/* Defect Analysis Section */}
      <div className="mt-8">
          <h3 className="text-lg font-bold text-gray-800 border-b-2 border-gray-300 pb-2 mb-4 uppercase">
              Defect Analysis ({selectedPart === "ALL" ? "Overall" : selectedPart})
          </h3>
          <div className="border border-black bg-white shadow-sm overflow-hidden md:w-1/2 p-4">
              {(() => {
                  const rejectionCounts: Record<string, number> = {}
                  filteredLogs.forEach(l => {
                      if (l.rejectionBreakdown && l.rejectionBreakdown.length > 0) {
                          l.rejectionBreakdown.forEach((item: { reason: string; qty: number }) => {
                              if (item.qty > 0) rejectionCounts[item.reason] = (rejectionCounts[item.reason] || 0) + item.qty
                          })
                      } else if (l.rejectedQty > 0 && l.rejectionDescription) {
                          // Fallback
                          const reasons = l.rejectionDescription.split(",").map((s: string) => s.trim())
                          reasons.forEach((r: string) => rejectionCounts[r] = (rejectionCounts[r] || 0) + l.rejectedQty)
                      }
                  })

                  const pieData = Object.entries(rejectionCounts)
                      .map(([name, value], index) => ({
                          name,
                          value,
                          fill: ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'][index % 6]
                      }))
                      .sort((a, b) => b.value - a.value)

                  if (pieData.length === 0) {
                      return <div className="text-center text-gray-400 italic p-8">No defects recorded for this selection.</div>
                  }

                  return (
                      <div className="h-[300px]">
                          <RejectionPieChart data={pieData} />
                      </div>
                  )
              })()}
          </div>
      </div>

    </div>
  )
}

"use client"

import { useState, useEffect, useMemo } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Calendar, Loader2, Award } from "lucide-react"

interface RankedSupplier {
  id: string
  name: string
  category: string
  totalSupplied: number
  score: number | string
  grade: string
}

export default function RankingsPage() {
  const [selectedMonth, setSelectedMonth] = useState("2026-07")
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [productionLogs, setProductionLogs] = useState<any[]>([])
  const [scorecards, setScorecards] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const supRes = await fetch("/api/suppliers")
        if (supRes.ok) {
          const list = await supRes.json()
          setSuppliers(list.filter((u: any) => u.role === "SUPPLIER_USER"))
        }

        const prodRes = await fetch("/api/production")
        if (prodRes.ok) {
          setProductionLogs(await prodRes.json())
        }

        const repRes = await fetch(`/api/reports?month=${selectedMonth}`)
        if (repRes.ok) {
          setScorecards(await repRes.json())
        }
      } catch (e) {
        console.error("Failed to load rankings data", e)
      }
      setLoading(false)
    }
    loadData()
  }, [selectedMonth])

  // Process supplier rankings for the selected month
  const rankedList = useMemo<RankedSupplier[]>(() => {
    const list: RankedSupplier[] = []

    for (const supplier of suppliers) {
      // 1. Calculate total parts supplied (dispatch) during the selected month
      const logs = productionLogs.filter(
        (log: any) => log.supplierId === supplier.id && log.date.startsWith(selectedMonth)
      )
      const totalSupplied = logs.reduce((sum, log) => sum + (log.dispatch || 0), 0)

      // 2. Only include suppliers who supplied parts during the selected month
      if (totalSupplied > 0) {
        // Find monthly scorecard
        const sc = scorecards.find((card: any) => card.supplierId === supplier.id)
        
        list.push({
          id: supplier.id,
          name: supplier.name,
          category: supplier.category || supplier.companyDetails?.category || "Pre-Machining",
          totalSupplied,
          score: sc ? sc.totalScore : "-",
          grade: sc ? sc.grade : "-"
        })
      }
    }

    // 3. Sort by total quantity of parts supplied descending
    return list.sort((a, b) => b.totalSupplied - a.totalSupplied)
  }, [suppliers, productionLogs, scorecards, selectedMonth])

  const preMachiningRankings = useMemo(() => {
    return rankedList.filter(item => item.category === "Pre-Machining" || item.category === "Pre Machining")
  }, [rankedList])

  const childPartRankings = useMemo(() => {
    return rankedList.filter(item => item.category === "Child-Part" || item.category === "Child Part" || item.category === "Child Parts")
  }, [rankedList])

  return (
    <div className="flex-1 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Supplier Rankings</h2>
          <p className="text-slate-500 text-xs">Rankings calculated by total monthly parts supply volume.</p>
        </div>
        
        <div className="flex items-center space-x-2 bg-white p-2 border rounded-lg shadow-sm">
          <Calendar className="h-4 w-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-600">Month:</span>
          <Input 
            type="month" 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-36 h-8 text-xs focus:ring-0 border-none"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 italic">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <span>Computing performance metrics & volume rankings...</span>
        </div>
      ) : (
        <Tabs defaultValue="pre-machining" className="space-y-4">
          <TabsList className="bg-slate-100 p-1 rounded-lg">
            <TabsTrigger value="pre-machining" className="rounded-md">Pre-Machining Suppliers</TabsTrigger>
            <TabsTrigger value="child-part" className="rounded-md">Child-Part Suppliers</TabsTrigger>
          </TabsList>
          
          <TabsContent value="pre-machining" className="space-y-4">
            <Card className="border shadow-sm">
              <CardHeader className="bg-slate-50/50 pb-3 border-b">
                <CardTitle className="text-slate-800 flex items-center gap-2">
                  <Award className="h-5 w-5 text-orange-600" /> Pre-Machining Volume Rankings
                </CardTitle>
                <CardDescription>Suppliers ranked by total parts supplied in {selectedMonth}.</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50">
                      <TableHead className="w-[80px]">Rank</TableHead>
                      <TableHead>Supplier Code</TableHead>
                      <TableHead>Supplier Name</TableHead>
                      <TableHead className="text-right">Total Machined Parts Received (Nos)</TableHead>
                      <TableHead className="text-right">Scorecard Mark (100m)</TableHead>
                      <TableHead className="text-center">Evaluation Grade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preMachiningRankings.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-slate-400 italic">
                          No pre-machining supply logs found for {selectedMonth}.
                        </TableCell>
                      </TableRow>
                    ) : (
                      preMachiningRankings.map((s, index) => (
                        <TableRow key={s.id} className="hover:bg-slate-50/50">
                          <TableCell className="font-extrabold text-slate-800 text-sm">#{index + 1}</TableCell>
                          <TableCell className="font-mono text-xs text-slate-500">{s.id}</TableCell>
                          <TableCell className="font-semibold text-slate-700">{s.name}</TableCell>
                          <TableCell className="text-right font-mono font-bold text-slate-800">
                            {s.totalSupplied.toLocaleString()} Nos
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold text-primary">
                            {s.score}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={
                              s.grade.startsWith("A") ? "bg-green-500 hover:bg-green-600 text-white" :
                              s.grade.startsWith("B") ? "bg-blue-500 hover:bg-blue-600 text-white" :
                              s.grade.startsWith("C") ? "bg-amber-500 hover:bg-amber-600 text-white" :
                              "bg-slate-300 text-slate-800"
                            }>
                              {s.grade}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="child-part" className="space-y-4">
            <Card className="border shadow-sm">
              <CardHeader className="bg-slate-50/50 pb-3 border-b">
                <CardTitle className="text-slate-800 flex items-center gap-2">
                  <Award className="h-5 w-5 text-orange-600" /> Child-Part Volume Rankings
                </CardTitle>
                <CardDescription>Suppliers ranked by total parts supplied in {selectedMonth}.</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50">
                      <TableHead className="w-[80px]">Rank</TableHead>
                      <TableHead>Supplier Code</TableHead>
                      <TableHead>Supplier Name</TableHead>
                      <TableHead className="text-right">Total Machined Parts Received (Nos)</TableHead>
                      <TableHead className="text-right">Scorecard Mark (100m)</TableHead>
                      <TableHead className="text-center">Evaluation Grade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {childPartRankings.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-slate-400 italic">
                          No child-part supply logs found for {selectedMonth}.
                        </TableCell>
                      </TableRow>
                    ) : (
                      childPartRankings.map((s, index) => (
                        <TableRow key={s.id} className="hover:bg-slate-50/50">
                          <TableCell className="font-extrabold text-slate-800 text-sm">#{index + 1}</TableCell>
                          <TableCell className="font-mono text-xs text-slate-500">{s.id}</TableCell>
                          <TableCell className="font-semibold text-slate-700">{s.name}</TableCell>
                          <TableCell className="text-right font-mono font-bold text-slate-800">
                            {s.totalSupplied.toLocaleString()} Nos
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold text-primary">
                            {s.score}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={
                              s.grade.startsWith("A") ? "bg-green-500 hover:bg-green-600 text-white" :
                              s.grade.startsWith("B") ? "bg-blue-500 hover:bg-blue-600 text-white" :
                              s.grade.startsWith("C") ? "bg-amber-500 hover:bg-amber-600 text-white" :
                              "bg-slate-300 text-slate-800"
                            }>
                              {s.grade}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}

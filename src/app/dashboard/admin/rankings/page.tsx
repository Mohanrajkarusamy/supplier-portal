"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getSupplierRankings } from "@/lib/performance"
import { Badge } from "lucide-react"

function RankingTable({ category }: { category: string }) {
    const suppliers = getSupplierRankings(category)

    return (
         <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Rank</TableHead>
                <TableHead>Supplier Name</TableHead>
                <TableHead>Last 3 Mos Avg Score</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-4">No data available</TableCell></TableRow>
              ) : (
                  suppliers.map((s, index) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-bold">#{index + 1}</TableCell>
                      <TableCell>{s.name}</TableCell>
                      <TableCell className="font-medium text-blue-600">{s.averageScore?.toFixed(1)}%</TableCell>
                      <TableCell>
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800">
                             Active
                          </span>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
    )
}

export default function RankingsPage() {
  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Supplier Rankings</h2>
      </div>
      
      <Tabs defaultValue="pre-machining" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pre-machining">Pre-Machining Suppliers</TabsTrigger>
          <TabsTrigger value="child-part">Child-Part Suppliers</TabsTrigger>
        </TabsList>
        <TabsContent value="pre-machining" className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Pre-Machining Performance Rankings</CardTitle>
                    <CardDescription>Based on average Quality & Delivery scores.</CardDescription>
                </CardHeader>
                <CardContent>
                    <RankingTable category="Pre-Machining" />
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="child-part" className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Child-Part Performance Rankings</CardTitle>
                    <CardDescription>Based on average Quality & Delivery scores.</CardDescription>
                </CardHeader>
                <CardContent>
                    <RankingTable category="Child-Part" />
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

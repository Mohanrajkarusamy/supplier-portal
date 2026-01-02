"use client"

import { useState, useEffect } from "react"
import { CheckCircle, XCircle, Search, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function AdminSortingPage() {
    const [logs, setLogs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [filterStatus, setFilterStatus] = useState("All")
    const [search, setSearch] = useState("")

    const fetchLogs = async () => {
        try {
            const res = await fetch('/api/sorting')
            if (res.ok) {
                setLogs(await res.json())
            }
        } catch (e) { console.error(e) }
        setLoading(false)
    }

    useEffect(() => {
        fetchLogs()
    }, [])

    const handleStatusUpdate = async (id: string, newStatus: "Validated" | "Rejected") => {
        try {
            const res = await fetch('/api/sorting', {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ id, status: newStatus })
            })

            if (res.ok) {
                // Update Store
                setLogs(logs.map(l => l.id === id ? { ...l, status: newStatus } : l))
            } else {
                alert("Update failed")
            }
        } catch (e) { alert("Network error") }
    }

    const filteredLogs = logs.filter(l => {
        const matchesSearch = (l.supplierName || "").toLowerCase().includes(search.toLowerCase()) || 
                              (l.partName || "").toLowerCase().includes(search.toLowerCase())
        const matchesStatus = filterStatus === "All" || l.status === filterStatus

        return matchesSearch && matchesStatus
    })

    return (
        <div className="flex-1 space-y-4">
             <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Sorting & Rework Validation</h2>
            </div>

            <div className="flex items-center space-x-2">
                <div className="relative w-full max-w-sm">
                   <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                   <Input 
                       placeholder="Search Supplier or Part..." 
                       className="pl-8" 
                       value={search}
                       onChange={(e) => setSearch(e.target.value)}
                   />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="All">All Status</SelectItem>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Validated">Validated</SelectItem>
                        <SelectItem value="Rejected">Rejected</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Daily Rework Logs</CardTitle>
                    <CardDescription>Review and validate daily quality data submitted by suppliers.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Supplier</TableHead>
                                <TableHead>Part</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead>Defects (NG)</TableHead>
                                <TableHead>Reworked (OK)</TableHead>
                                <TableHead>Final OK</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredLogs.length > 0 ? (
                                filteredLogs.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell>{log.date}</TableCell>
                                        <TableCell className="font-medium">{log.supplierName} <br/><span className="text-xs text-muted-foreground">{log.supplierId}</span></TableCell>
                                        <TableCell>{log.partName}</TableCell>
                                        <TableCell>{log.totalQty}</TableCell>
                                        <TableCell className="text-red-600">{log.defectsFound}</TableCell>
                                        <TableCell className="text-blue-600">{log.reworkedQty}</TableCell>
                                        <TableCell className="font-bold text-green-700">{log.okQty}</TableCell>
                                        <TableCell>
                                             <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                 log.status === "Validated" ? "bg-green-100 text-green-800" :
                                                 log.status === "Rejected" ? "bg-red-100 text-red-800" :
                                                 "bg-yellow-100 text-yellow-800"
                                             }`}>
                                                 {log.status}
                                             </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {log.status === "Pending" && (
                                                <div className="flex justify-end space-x-2">
                                                    <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => handleStatusUpdate(log.id, "Validated")}>
                                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                                    </Button>
                                                    <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => handleStatusUpdate(log.id, "Rejected")}>
                                                        <XCircle className="h-4 w-4 text-red-600" />
                                                    </Button>
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center h-24">
                                        {loading ? "Loading..." : "No logs found matching criteria."} 
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}

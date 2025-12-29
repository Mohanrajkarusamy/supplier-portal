"use client"

import { useState } from "react"
import { Plus, Save, Clock, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MOCK_SORTING_LOGS, SortingLog } from "@/lib/sorting"

export default function SupplierSortingPage() {
    const currentSupplierId = "SUP001"
    const supplierName = "Andavar Casting"

    const [logs, setLogs] = useState<SortingLog[]>(
        MOCK_SORTING_LOGS.filter(l => l.supplierId === currentSupplierId)
    )

    // Form State
    const [date, setDate] = useState("")
    const [partName, setPartName] = useState("")
    const [totalQty, setTotalQty] = useState("")
    const [defects, setDefects] = useState("")
    const [reworked, setReworked] = useState("")

    const handleSubmit = () => {
        if(!date || !partName || !totalQty) return

        const total = parseInt(totalQty) || 0
        const ng = parseInt(defects) || 0
        const rew = parseInt(reworked) || 0
        const ok = total - ng + rew

        const newLog: SortingLog = {
            id: `SR${Date.now()}`,
            supplierId: currentSupplierId,
            supplierName: supplierName,
            date,
            partName,
            totalQty: total,
            defectsFound: ng,
            reworkedQty: rew,
            okQty: ok,
            status: "Pending"
        }

        // Simulating backend update
        MOCK_SORTING_LOGS.unshift(newLog)
        setLogs([newLog, ...logs])

        // Reset
        setDate("")
        setPartName("")
        setTotalQty("")
        setDefects("")
        setReworked("")
        alert("Sorting Log Submitted Successfully")
    }

    return (
        <div className="flex-1 space-y-4">
            <h2 className="text-3xl font-bold tracking-tight">Sorting & Rework Tracking</h2>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Daily Rework Entry</CardTitle>
                        <CardDescription>Log data for parts sorted/reworked today.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                             <Label>Date</Label>
                             <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                             <Label>Part Name</Label>
                             <Input placeholder="Part Name" value={partName} onChange={e => setPartName(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Total Inspection Qty</Label>
                                <Input type="number" placeholder="0" value={totalQty} onChange={e => setTotalQty(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Defects Found (NG)</Label>
                                <Input type="number" placeholder="0" value={defects} onChange={e => setDefects(e.target.value)} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <Label>Reworked Qty (OK)</Label>
                                <Input type="number" placeholder="0" value={reworked} onChange={e => setReworked(e.target.value)} />
                             </div>
                             <div className="space-y-2">
                                <Label>Final OK Qty</Label>
                                <Input 
                                    readOnly 
                                    className="bg-slate-100" 
                                    value={
                                        (parseInt(totalQty)||0) - (parseInt(defects)||0) + (parseInt(reworked)||0)
                                    } 
                                />
                             </div>
                        </div>
                        <Button className="w-full" onClick={handleSubmit}>
                            <Save className="mr-2 h-4 w-4" /> Submit Log
                        </Button>
                    </CardContent>
                </Card>

                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Submission History</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Part</TableHead>
                                    <TableHead>Total</TableHead>
                                    <TableHead>OK</TableHead>
                                    <TableHead className="text-right">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs.length > 0 ? (
                                    logs.map(log => (
                                        <TableRow key={log.id}>
                                            <TableCell>{log.date}</TableCell>
                                            <TableCell>{log.partName}</TableCell>
                                            <TableCell>{log.totalQty}</TableCell>
                                            <TableCell className="font-bold text-green-700">{log.okQty}</TableCell>
                                            <TableCell className="text-right">
                                                 {log.status === "Validated" ? (
                                                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                                                        <CheckCircle className="mr-1 h-3 w-3" /> Validated
                                                    </span>
                                                ) : log.status === "Rejected" ? (
                                                     <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                                                        <Clock className="mr-1 h-3 w-3" /> Rejected
                                                    </span>
                                                ) : (
                                                     <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                                                        <Clock className="mr-1 h-3 w-3" /> Pending
                                                    </span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center h-24">No logs found.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

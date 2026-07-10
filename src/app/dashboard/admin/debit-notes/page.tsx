"use client"

import { useState, useEffect, useMemo } from "react"
import { IndianRupee, Plus, Search, Calendar, RotateCw, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

export default function AdminDebitNotesPage() {
    const [notes, setNotes] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [suppliers, setSuppliers] = useState<any[]>([])
    const [dialogOpen, setDialogOpen] = useState(false)
    const [productionLogs, setProductionLogs] = useState<any[]>([])

    // Allowance editing states
    const [editAllowanceOpen, setEditAllowanceOpen] = useState(false)
    const [allowanceTarget, setAllowanceTarget] = useState<{ supplierCode: string; partNum: string; currentValue: number; supplierName: string } | null>(null)
    const [newAllowanceValue, setNewAllowanceValue] = useState<string>("")

    // Registry Filter States
    const [filterSupplier, setFilterSupplier] = useState("All")
    const [filterMonth, setFilterMonth] = useState(() => {
        const now = new Date()
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    })

    // Dialog Date Range Filter
    const [startDate, setStartDate] = useState(() => {
        const now = new Date()
        return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    })
    const [endDate, setEndDate] = useState(() => {
        const now = new Date()
        return new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
    })

    // Form State
    const [newNote, setNewNote] = useState({
        supplierId: '',
        partNumber: '',
        date: new Date().toISOString().split('T')[0],
        receivedQuantity: 0,
        rejectionQuantity: 0,
        allowancePercentage: 0,
        allowanceQuantity: 0,
        exceedQuantity: 0,
        recoveryRate: 0,
        debitAmount: 0
    })

    // Filter approved parts dynamically for selected supplier
    const supplierParts = useMemo(() => {
        if (!newNote.supplierId) return []
        const selectedSupp = suppliers.find(s => s.id === newNote.supplierId)
        return selectedSupp?.companyDetails?.approvedParts || []
    }, [newNote.supplierId, suppliers])

    useEffect(() => {
        fetchNotes()
        fetchSuppliers()
        fetchProductionLogs()
    }, [])

    // Trigger auto-fetching of SQA daily performance logs
    useEffect(() => {
        if (newNote.supplierId && newNote.partNumber) {
            fetchPerformanceMetrics(newNote.supplierId, newNote.partNumber, startDate, endDate)
        }
    }, [newNote.supplierId, newNote.partNumber, startDate, endDate])

    // Update total debit amount in sync when rate changes
    useEffect(() => {
        const total = newNote.exceedQuantity * newNote.recoveryRate
        setNewNote(prev => ({ ...prev, debitAmount: Number(total.toFixed(2)) }))
    }, [newNote.recoveryRate, newNote.exceedQuantity])

    const fetchNotes = async () => {
        try {
            const res = await fetch('/api/debit-notes')
            if (res.ok) setNotes(await res.json())
        } catch (e) { console.error(e) }
        setLoading(false)
    }

    const fetchProductionLogs = async () => {
        try {
            const res = await fetch('/api/production?enteredBy=Admin')
            if (res.ok) {
                setProductionLogs(await res.json())
            }
        } catch (e) { console.error(e) }
    }

    const fetchSuppliers = async () => {
        try {
            const res = await fetch('/api/suppliers')
            if (res.ok) {
                const data = await res.json()
                setSuppliers(Array.isArray(data) ? data : (data.suppliers || []))
            }
        } catch (e) { console.error(e) }
    }

    const fetchPerformanceMetrics = async (suppId: string, partNum: string, start: string, end: string) => {
        try {
            const res = await fetch(`/api/production?supplierId=${suppId}&partNumber=${partNum}`)
            if (res.ok) {
                const logs: any[] = await res.json()
                const adminLogs = logs.filter(l => {
                    const matchesDate = (!start || l.date >= start) && (!end || l.date <= end)
                    return matchesDate && l.enteredBy === 'Admin'
                })

                const totalReceived = adminLogs.reduce((sum, l) => sum + (l.dispatch || 0), 0)
                const totalRejected = adminLogs.reduce((sum, l) => sum + (l.rejection || 0), 0)

                const selectedSupp = suppliers.find(s => s.id === suppId)
                const approvedPart = selectedSupp?.companyDetails?.approvedParts?.find((p: any) => (p.partNumber || "").trim() === (partNum || "").trim())
                const allowancePercent = approvedPart?.debitAllowance || 0

                const allowanceQty = Number((totalReceived * (allowancePercent / 100)).toFixed(2))
                const exceedQty = Math.max(0, totalRejected - allowanceQty)

                setNewNote(prev => ({
                    ...prev,
                    receivedQuantity: totalReceived,
                    rejectionQuantity: totalRejected,
                    allowancePercentage: allowancePercent,
                    allowanceQuantity: allowanceQty,
                    exceedQuantity: exceedQty
                }))
            }
        } catch (e) {
            console.error(e)
        }
    }

    const handleSubmit = async () => {
        if (!newNote.supplierId || !newNote.partNumber) {
            alert("Please select supplier and component.")
            return
        }
        try {
            const res = await fetch('/api/debit-notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newNote)
            })
            if (res.ok) {
                fetchNotes()
                fetchProductionLogs()
                setDialogOpen(false)
                // Reset form
                setNewNote({
                    supplierId: '',
                    partNumber: '',
                    date: new Date().toISOString().split('T')[0],
                    receivedQuantity: 0,
                    rejectionQuantity: 0,
                    allowancePercentage: 0,
                    allowanceQuantity: 0,
                    exceedQuantity: 0,
                    recoveryRate: 0,
                    debitAmount: 0
                })
                alert("Debit Note Created Successfully")
            }
        } catch (e) { console.error(e) }
    }

    const handleSaveAllowance = async () => {
        if (!allowanceTarget) return
        try {
            const supplier = suppliers.find(s => s.id === allowanceTarget.supplierCode || s.name === allowanceTarget.supplierCode)
            if (!supplier) {
                alert("Supplier not found")
                return
            }

            const updatedDetails = JSON.parse(JSON.stringify(supplier.companyDetails || {}))
            const approvedParts = updatedDetails.approvedParts || []
            const targetPart = approvedParts.find((p: any) => (p.partNumber || "").trim() === allowanceTarget.partNum.trim())
            
            if (targetPart) {
                targetPart.debitAllowance = Number(newAllowanceValue)
            } else {
                alert("Part not found in supplier registration settings.")
                return
            }

            const res = await fetch('/api/suppliers', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: supplier.id,
                    companyDetails: updatedDetails
                })
            })

            const result = await res.json()
            if (result.success) {
                alert("Allowance percentage updated successfully!")
                setEditAllowanceOpen(false)
                setAllowanceTarget(null)
                fetchSuppliers()
                fetchProductionLogs()
            } else {
                alert("Failed to update: " + result.message)
            }
        } catch (e) {
            console.error(e)
            alert("Network error")
        }
    }

    // Auto-calculate on the fly for all parts of the selected supplier
    const calculatedNotes = useMemo(() => {
        if (suppliers.length === 0) return []

        const activeSuppliers = filterSupplier === "All" 
            ? suppliers 
            : suppliers.filter(s => s.id === filterSupplier)

        const results: any[] = []
        let index = 1

        for (const supplier of activeSuppliers) {
            const approvedParts = supplier.companyDetails?.approvedParts || []
            for (const part of approvedParts) {
                const partNum = (part.partNumber || "").trim()
                const partName = part.name || partNum

                // Filter logs for this supplier, part, and selected month
                const matchedLogs = productionLogs.filter(l => 
                    l.supplierId === supplier.id && 
                    (l.partNumber || "").trim() === partNum && 
                    l.date.startsWith(filterMonth)
                )

                const receivedQty = matchedLogs.reduce((sum, l) => sum + (l.dispatch || 0), 0)
                const rejectionQty = matchedLogs.reduce((sum, l) => sum + (l.rejection || 0), 0)

                // Only show parts with active logs
                if (receivedQty === 0 && rejectionQty === 0) continue

                const allowancePercent = part.debitAllowance || 0
                const allowanceQty = Number((receivedQty * (allowancePercent / 100)).toFixed(2))
                const exceedQty = Math.max(0, rejectionQty - allowanceQty)

                results.push({
                    id: `DN-${filterMonth.replace('-', '')}-${String(index++).padStart(3, '0')}`,
                    supplierId: supplier.name,
                    partNumber: `${partName} (${partNum})`,
                    receivedQuantity: receivedQty,
                    rejectionQuantity: rejectionQty,
                    allowancePercentage: allowancePercent,
                    allowanceQuantity: allowanceQty,
                    exceedQuantity: exceedQty
                })
            }
        }

        return results
    }, [suppliers, filterSupplier, filterMonth, productionLogs])

    return (
        <div className="flex-1 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-800">Debit Note Management</h2>
                    <p className="text-slate-500">Auto-calculate rejection recovery costs from verified SQA Admin logs.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-primary hover:bg-orange-600 text-white font-semibold shadow-sm">
                                <Plus className="mr-2 h-4 w-4" /> Create Debit Note
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl border-t-4 border-t-primary">
                            <DialogHeader>
                                <DialogTitle className="text-xl font-bold text-slate-800">Issue Rejection Debit Note</DialogTitle>
                                <DialogDescription>Queries production logs to calculate the billable quantity exceeding component allowance limits.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-6 py-4 md:grid-cols-2">
                                {/* Parameter Selectors */}
                                <div className="space-y-4">
                                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">1. Target Parameters</h3>
                                    
                                    <div className="grid gap-2">
                                        <Label className="text-xs font-semibold text-slate-700">Supplier Account</Label>
                                        <Select onValueChange={(v) => setNewNote(prev => ({ ...prev, supplierId: v, partNumber: '' }))}>
                                            <SelectTrigger><SelectValue placeholder="Select Supplier" /></SelectTrigger>
                                            <SelectContent>
                                                {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name} ({s.id})</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label className="text-xs font-semibold text-slate-700">Part Number / Component</Label>
                                        <Select value={newNote.partNumber} onValueChange={(v) => setNewNote(prev => ({ ...prev, partNumber: v }))} disabled={!newNote.supplierId}>
                                            <SelectTrigger><SelectValue placeholder={newNote.supplierId ? "Select Part Number" : "Select supplier first"} /></SelectTrigger>
                                            <SelectContent>
                                                {supplierParts.map((p: any) => (
                                                    <SelectItem key={p.partNumber} value={p.partNumber}>{p.name} ({p.partNumber})</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="grid gap-2">
                                            <Label className="text-xs font-semibold text-slate-700">Start Date</Label>
                                            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label className="text-xs font-semibold text-slate-700">End Date</Label>
                                            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                                        </div>
                                    </div>

                                     <div className="grid grid-cols-1 gap-3 pt-2">
                                         <div className="grid gap-2">
                                             <Label className="text-xs font-semibold text-slate-700">Allowance Percentage (%)</Label>
                                             <Input 
                                                 type="number" 
                                                 value={newNote.allowancePercentage} 
                                                 onChange={(e) => {
                                                     const val = Number(e.target.value) || 0;
                                                     const allowanceQty = Number((newNote.receivedQuantity * (val / 100)).toFixed(2));
                                                     const exceedQty = Math.max(0, newNote.rejectionQuantity - allowanceQty);
                                                     setNewNote(prev => ({
                                                         ...prev,
                                                         allowancePercentage: val,
                                                         allowanceQuantity: allowanceQty,
                                                         exceedQuantity: exceedQty
                                                     }));
                                                 }} 
                                             />
                                         </div>
                                     </div>
                                 </div>

                                 {/* Calculation Receipt Panel */}
                                 <div className="bg-slate-50 border rounded-lg p-5 flex flex-col justify-between">
                                     <div className="space-y-4">
                                         <div className="flex justify-between items-center pb-2 border-b">
                                             <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">2. Log Calculations</h3>
                                             <Badge variant="outline" className="bg-white">Verified Admin Logs</Badge>
                                         </div>
                                         
                                         <div className="space-y-3 text-sm">
                                             <div className="flex justify-between">
                                                 <span className="text-slate-500">Received Quantity (Total Dispatch):</span>
                                                 <span className="font-mono font-bold text-slate-700">{newNote.receivedQuantity} Units</span>
                                             </div>
                                             <div className="flex justify-between">
                                                 <span className="text-slate-500">Rejection Quantity (SQA logs):</span>
                                                 <span className="font-mono font-bold text-red-600">{newNote.rejectionQuantity} Units</span>
                                             </div>
                                             <div className="flex justify-between">
                                                 <span className="text-slate-500">Allowance (Tolerance %):</span>
                                                 <span className="font-mono font-bold text-slate-700">{newNote.allowancePercentage}%</span>
                                             </div>
                                             <div className="flex justify-between">
                                                 <span className="text-slate-500">Allowance Qty (Acceptable Limit):</span>
                                                 <span className="font-mono font-bold text-slate-700">{newNote.allowanceQuantity} Units</span>
                                             </div>
                                             <div className="flex justify-between pt-2 border-t font-semibold">
                                                 <span className="text-slate-700">Exceed Quantity (Billable Limit):</span>
                                                 <span className="font-mono text-red-600 font-extrabold">{newNote.exceedQuantity} Units</span>
                                             </div>
                                         </div>
                                     </div>
                                 </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleSubmit} className="bg-primary text-white hover:bg-orange-600 font-bold px-6 shadow">Generate Debit Note</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <Card className="shadow-sm">
                <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <CardTitle>Debit Note Registry</CardTitle>
                        <CardDescription>Track the lifecycle of issued debit notes.</CardDescription>
                    </div>
                    {/* Live Scroll filters */}
                    <div className="flex flex-wrap gap-2 items-center bg-slate-50 p-2 rounded-lg border">
                        <div className="grid gap-1">
                            <Label className="text-[10px] text-slate-500">Supplier</Label>
                            <Select value={filterSupplier} onValueChange={setFilterSupplier}>
                                <SelectTrigger className="h-8 text-xs bg-white w-[180px]"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All">All Suppliers</SelectItem>
                                    {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-1">
                            <Label className="text-[10px] text-slate-500">Month Period</Label>
                            <input 
                                type="month" 
                                value={filterMonth}
                                onChange={(e) => setFilterMonth(e.target.value)}
                                className="flex h-8 w-[140px] rounded-md border border-slate-300 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary/20"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-md overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50">
                                    <TableHead>DN No</TableHead>
                                    <TableHead>Supplier</TableHead>
                                    <TableHead>Component</TableHead>
                                    <TableHead className="text-right">Recv. Qty</TableHead>
                                    <TableHead className="text-right">Rej. Qty</TableHead>
                                    <TableHead className="text-right">Allowance %</TableHead>
                                    <TableHead className="text-right">Allowance Qty</TableHead>
                                    <TableHead className="text-right">Exceed Qty</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {calculatedNotes.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-10 text-slate-400">
                                            {loading ? "Loading..." : "No debit notes records found."}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    calculatedNotes.map((note) => (
                                        <TableRow key={note.id} className="hover:bg-slate-50/50">
                                            <TableCell className="font-bold text-slate-800">{note.id}</TableCell>
                                            <TableCell className="font-semibold">{note.supplierId}</TableCell>
                                            <TableCell className="font-mono text-xs">{note.partNumber}</TableCell>
                                            <TableCell className="text-right font-mono">{note.receivedQuantity || 0}</TableCell>
                                            <TableCell className="text-right font-mono text-red-600 font-semibold">{note.rejectionQuantity || 0}</TableCell>
                                            <TableCell className="text-right font-mono text-slate-500">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <span>{note.allowancePercentage || 0}%</span>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-6 w-6 text-slate-400 hover:text-primary"
                                                        onClick={() => {
                                                            const originalSupplier = suppliers.find(s => s.name === note.supplierId);
                                                            const rawPart = note.partNumber.split('(')[1]?.replace(')', '').trim() || note.partNumber.trim();
                                                            setAllowanceTarget({
                                                                supplierCode: originalSupplier?.id || note.supplierId,
                                                                supplierName: note.supplierId,
                                                                partNum: rawPart,
                                                                currentValue: note.allowancePercentage || 0
                                                            });
                                                            setNewAllowanceValue(String(note.allowancePercentage || 0));
                                                            setEditAllowanceOpen(true);
                                                        }}
                                                    >
                                                        <Edit className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-slate-600 font-semibold">{note.allowanceQuantity || 0}</TableCell>
                                            <TableCell className="text-right font-mono text-amber-700 font-semibold">{note.exceedQuantity || 0}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={editAllowanceOpen} onOpenChange={setEditAllowanceOpen}>
                <DialogContent className="max-w-md border-t-4 border-t-primary">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-slate-800">Modify Part Allowance %</DialogTitle>
                        <DialogDescription>
                            Update the debit note allowance threshold configuration for this component.
                        </DialogDescription>
                    </DialogHeader>
                    {allowanceTarget && (
                        <div className="space-y-4 py-3 text-sm">
                            <div className="grid grid-cols-3 gap-2">
                                <span className="font-bold text-slate-500">Supplier:</span>
                                <span className="col-span-2 font-semibold text-slate-800">{allowanceTarget.supplierName}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <span className="font-bold text-slate-500">Component:</span>
                                <span className="col-span-2 font-mono text-slate-800">{allowanceTarget.partNum}</span>
                            </div>
                            <div className="grid gap-2 pt-2">
                                <Label className="font-bold text-slate-700">New Allowance Percentage (%)</Label>
                                <Input 
                                    type="number" 
                                    step="0.01"
                                    value={newAllowanceValue} 
                                    onChange={(e) => setNewAllowanceValue(e.target.value)} 
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditAllowanceOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveAllowance} className="bg-primary text-white hover:bg-orange-600 font-bold px-4 shadow">Update Settings</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

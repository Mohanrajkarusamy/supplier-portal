"use client"

import { useState, useEffect, useMemo } from "react"
import { IndianRupee, Plus, Search, Calendar, RotateCw } from "lucide-react"
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

    // Registry Filter States
    const [filterSupplier, setFilterSupplier] = useState("All")
    const [filterMonth, setFilterMonth] = useState("All") // "All" or "01"-"12"

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

    // Reactive table list filtering
    const filteredNotes = useMemo(() => {
        return notes.filter(n => {
            const matchesSupplier = filterSupplier === "All" || n.supplierId === filterSupplier
            const matchesMonth = filterMonth === "All" || (n.date && n.date.split('-')[1] === filterMonth)
            return matchesSupplier && matchesMonth
        })
    }, [notes, filterSupplier, filterMonth])

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

                                    <div className="grid grid-cols-2 gap-3 pt-2">
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
                                        <div className="grid gap-2">
                                            <Label className="text-xs font-semibold text-slate-700">Recovery Rate (per unit)</Label>
                                            <div className="relative">
                                                <IndianRupee className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                                                <Input type="number" className="pl-8" placeholder="Rate" value={newNote.recoveryRate || ''} onChange={(e) => setNewNote(prev => ({ ...prev, recoveryRate: Number(e.target.value) }))} />
                                            </div>
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

                                    <div className="mt-8 pt-4 border-t">
                                        <div className="flex justify-between items-center">
                                            <span className="text-md font-bold text-slate-700">Total Debit Recovery:</span>
                                            <span className="text-2xl font-extrabold text-primary font-mono">₹{newNote.debitAmount.toLocaleString()}</span>
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
                            <Label className="text-[10px] text-slate-500">Month</Label>
                            <Select value={filterMonth} onValueChange={setFilterMonth}>
                                <SelectTrigger className="h-8 text-xs bg-white w-[140px]"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All">All Months</SelectItem>
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
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-md overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50">
                                    <TableHead>DN No</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Supplier</TableHead>
                                    <TableHead>Component</TableHead>
                                    <TableHead className="text-right">Recv. Qty</TableHead>
                                    <TableHead className="text-right">Rej. Qty</TableHead>
                                    <TableHead className="text-right">Allowance %</TableHead>
                                    <TableHead className="text-right">Allowance Qty</TableHead>
                                    <TableHead className="text-right">Exceed Qty</TableHead>
                                    <TableHead className="text-right">Debit Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredNotes.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={10} className="text-center py-10 text-slate-400">
                                            {loading ? "Loading..." : "No debit notes records found."}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredNotes.map((note) => (
                                        <TableRow key={note.id} className="hover:bg-slate-50/50">
                                            <TableCell className="font-bold text-slate-800">{note.id}</TableCell>
                                            <TableCell className="font-mono text-xs">{note.date ? new Date(note.date).toLocaleDateString() : 'N/A'}</TableCell>
                                            <TableCell className="font-semibold">{note.supplierId}</TableCell>
                                            <TableCell className="font-mono text-xs">{note.partNumber}</TableCell>
                                            <TableCell className="text-right font-mono">{note.receivedQuantity || 0}</TableCell>
                                            <TableCell className="text-right font-mono text-red-600 font-semibold">{note.rejectionQuantity || 0}</TableCell>
                                            <TableCell className="text-right font-mono text-slate-500">{note.allowancePercentage || 0}%</TableCell>
                                            <TableCell className="text-right font-mono text-slate-600 font-semibold">{note.allowanceQuantity || 0}</TableCell>
                                            <TableCell className="text-right font-mono text-amber-700 font-semibold">{note.exceedQuantity || 0}</TableCell>
                                            <TableCell className="text-right font-mono text-primary font-bold">₹{(note.debitAmount || 0).toLocaleString()}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

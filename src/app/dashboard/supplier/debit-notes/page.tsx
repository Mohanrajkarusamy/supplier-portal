"use client"

import { useState, useEffect, useMemo } from "react"
import { Download, AlertCircle, FileText, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function SupplierDebitNotesPage() {
    const [supplierId, setSupplierId] = useState("")
    const [supplierProfile, setSupplierProfile] = useState<any>(null)
    const [productionLogs, setProductionLogs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Registry Filter State
    const [filterMonth, setFilterMonth] = useState(() => {
        const now = new Date()
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    })

    useEffect(() => {
        const id = localStorage.getItem("currentUserId") || "SUP001"
        setSupplierId(id)
        fetchData(id)
    }, [])

    const fetchData = async (id: string) => {
        setLoading(true)
        try {
            // Fetch supplier profile
            const profileRes = await fetch(`/api/suppliers?id=${id}`)
            if (profileRes.ok) {
                const profile = await profileRes.json()
                setSupplierProfile(profile)
            }

            // Fetch admin entered production logs for this supplier
            const prodRes = await fetch(`/api/production?supplierId=${id}&enteredBy=Admin`)
            if (prodRes.ok) {
                setProductionLogs(await prodRes.json())
            }
        } catch (e) {
            console.error("Failed to load supplier debit notes data:", e)
        }
        setLoading(false)
    }

    // Auto-calculate on the fly for all parts supplied by this supplier
    const calculatedNotes = useMemo(() => {
        if (!supplierProfile) return []

        const approvedParts = supplierProfile.companyDetails?.approvedParts || []
        const results: any[] = []
        let index = 1

        for (const part of approvedParts) {
            const partNum = (part.partNumber || "").trim()
            const partName = part.name || partNum

            // Filter logs for this part and selected month
            const matchedLogs = productionLogs.filter(l => 
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
                partNumber: `${partName} (${partNum})`,
                receivedQuantity: receivedQty,
                rejectionQuantity: rejectionQty,
                allowancePercentage: allowancePercent,
                allowanceQuantity: allowanceQty,
                exceedQuantity: exceedQty
            })
        }

        return results
    }, [supplierProfile, filterMonth, productionLogs])

    const totalExceed = calculatedNotes.reduce((acc, curr) => acc + (curr.exceedQuantity || 0), 0)

    return (
        <div className="flex-1 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-800">Debit Notes Registry</h2>
                    <p className="text-slate-500">Review rejection quantity statements exceeding allowed tolerances.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="border-slate-300">
                        <Download className="mr-2 h-4 w-4" /> Export Statement
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-1">
                <Card className="border-l-4 border-l-red-500 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Exceed Rejection Qty</CardTitle>
                        <AlertCircle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-mono">{totalExceed.toLocaleString()} Units</div>
                        <p className="text-xs text-muted-foreground mt-1">Total pieces exceeding allowance limits</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="shadow-sm">
                <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <CardTitle>Debit Note Statements</CardTitle>
                        <CardDescription>Statement of parts exceeding allowed rejection tolerances.</CardDescription>
                    </div>
                    <div className="flex items-center bg-slate-50 p-2 rounded-lg border">
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
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50">
                                <TableHead>DN Number</TableHead>
                                <TableHead>Ref. Part</TableHead>
                                <TableHead className="text-right">Recv. Qty</TableHead>
                                <TableHead className="text-right">Rej. Qty</TableHead>
                                <TableHead className="text-right">Allowance %</TableHead>
                                <TableHead className="text-right">Allowance Qty</TableHead>
                                <TableHead className="text-right">Exceed Qty</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {calculatedNotes.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-20 text-slate-400 italic">
                                        {loading ? "Fetching statements..." : "No debit notes found. High quality production maintained."}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                calculatedNotes.map((note) => (
                                    <TableRow key={note.id} className="hover:bg-slate-50/50">
                                        <TableCell className="font-bold text-slate-700">{note.id}</TableCell>
                                        <TableCell className="text-slate-600">{note.partNumber}</TableCell>
                                        <TableCell className="text-right font-mono">{note.receivedQuantity || 0}</TableCell>
                                        <TableCell className="text-right font-mono text-red-600 font-semibold">{note.rejectionQuantity || 0}</TableCell>
                                        <TableCell className="text-right font-mono text-slate-500">{note.allowancePercentage || 0}%</TableCell>
                                        <TableCell className="text-right font-mono text-slate-600 font-semibold">{note.allowanceQuantity || 0}</TableCell>
                                        <TableCell className="text-right font-mono text-amber-700 font-semibold">{note.exceedQuantity || 0}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" className="h-8 text-primary hover:text-primary hover:bg-orange-55">
                                                <FileText className="h-4 w-4 mr-2" /> View Details
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-4">
                <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                <div className="space-y-1">
                    <p className="text-sm font-bold text-blue-900">Information: Rejection Tolerance Policy</p>
                    <p className="text-xs text-blue-700 leading-normal">
                        Debit notes track rejection parts that exceed the allowed allowance percentage limit.
                        For disputes, please contact SQA Department within 7 days of note generation.
                    </p>
                </div>
            </div>
        </div>
    )
}

// Simple label helper
function Label({ children, className }: { children: React.ReactNode; className?: string }) {
    return <span className={className}>{children}</span>
}

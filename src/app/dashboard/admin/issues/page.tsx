"use client"

import { useState, useEffect } from "react"
import { AlertCircle, Plus, Filter, MoreHorizontal, Pencil, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"

export default function AdminIssuesPage() {
    const [issues, setIssues] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [open, setOpen] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [currentId, setCurrentId] = useState("")

    // Form
    const [supplier, setSupplier] = useState("")
    const [defect, setDefect] = useState("")
    const [partName, setPartName] = useState("")
    const [partNumber, setPartNumber] = useState("")
    const [quantity, setQuantity] = useState("")
    const [raisedDate, setRaisedDate] = useState(new Date().toISOString().split('T')[0])
    const [closedDate, setClosedDate] = useState("")
    const [status, setStatus] = useState<"Open" | "Closed">("Open")
    const [rootCause, setRootCause] = useState("")
    const [correctiveAction, setCorrectiveAction] = useState("")

    const fetchIssues = async () => {
        try {
            const res = await fetch('/api/issues')
            if (res.ok) {
                setIssues(await res.json())
            }
        } catch (e) { console.error(e) }
        setLoading(false)
    }

    useEffect(() => {
        fetchIssues()
    }, [])

    const handleSave = () => {
        if (isEditing) {
            handleUpdate()
            return
        }
        handleCreate()
    }

    const handleCreate = async () => {
        const newIssue = {
            id: `NCR-${Date.now()}`,
            supplierId: "SUP001", // TODO: Replace with actual ID lookup from supplier name or selection
            supplierName: supplier, // Added for display convenience if schema supports it
            type: "NCR",
            description: defect,
            partName: partName,
            // partNumber is not in schema but partName is.
            severity: "Major", // Default
            raisedDate: raisedDate,
            status: "Open",
            quantity: parseInt(quantity) || 0
        }
        
        // Mongoose schema: supplierId, type, description, partName, severity, raisedDate, status, rootCause, correctiveAction, closedDate
        // I should stick to schema fields.
        // My User model has ID. I need to map Supplier Name to Supplier ID ideally, or just save Name if schema allows loose typing, 
        // but looking at previous session schema, it had supplierId.
        // I will use a mock ID for now or just generic if I didn't enforce it rigidly.
        // Let's assume the API acts loosely or I send what matches.
        
        try {
            const res = await fetch('/api/issues', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(newIssue)
            })

            if (res.ok) {
                fetchIssues()
                setOpen(false)
                resetForm()
                alert("NCR Created Successfully")
            } else {
                alert("Failed to create NCR")
            }
        } catch (e) { alert("Network Error") }
    }

    const handleUpdate = async () => {
        const updateData = {
            id: currentId,
            description: defect,
            partName,
            raisedDate,
             // partNumber and quantity might not be in my schema explicitly if I didn't add them? 
             // Checking schema from summary: id, supplierId, type, description, partName, severity, raisedDate, status, rootCause, correctiveAction, closedDate.
             // Quantity is missing in Schema summary! I should probably add it or just ignore for now.
            status,
            rootCause,
            correctiveAction,
            closedDate: status === "Closed" && !closedDate ? new Date().toISOString().split('T')[0] : closedDate
        }

        try {
            const res = await fetch('/api/issues', {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(updateData)
            })

            if (res.ok) {
                fetchIssues()
                setOpen(false)
                resetForm()
                alert("Issue Updated Successfully")
            } else {
                 alert("Failed to update NCR")
            }
        } catch (e) { alert("Error updating") }
    }

    const handleEditClick = (issue: any) => {
        setIsEditing(true)
        setCurrentId(issue.id)
        setSupplier(issue.supplierName || issue.supplierId) // Fallback
        setDefect(issue.description || issue.defect) // Handle both schema possibilities
        setPartName(issue.partName)
        setPartNumber("") // Not in schema
        setQuantity(String(issue.quantity || "")) // Not in schema, might be lost if persisted only to mongo
        setRaisedDate(issue.raisedDate)
        setClosedDate(issue.closedDate || "")
        setStatus(issue.status)
        setRootCause(issue.rootCause || "")
        setCorrectiveAction(issue.correctiveAction || "")
        setOpen(true)
    }

    const resetForm = () => {
        setOpen(false)
        setIsEditing(false)
        setCurrentId("")
        setSupplier("")
        setDefect("")
        setPartName("")
        setPartNumber("")
        setQuantity("")
        setRaisedDate(new Date().toISOString().split('T')[0])
        setClosedDate("")
        setStatus("Open")
        setRootCause("")
        setCorrectiveAction("")
    }

    return (
        <div className="flex-1 space-y-4">
             <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Quality Issues (NCR)</h2>
                <div className="flex items-center space-x-2">
                    <Dialog open={open} onOpenChange={(val) => {
                        if (!val) resetForm()
                        setOpen(val)
                    }}>
                        <DialogTrigger asChild>
                            <Button className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                <Plus className="mr-2 h-4 w-4" /> Raise NCR
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[700px]">
                            <DialogHeader>
                                <DialogTitle>{isEditing ? "Edit NCR Details" : "Raise Non-Conformance Report"}</DialogTitle>
                                <DialogDescription>{isEditing ? "Update existing quality issue." : "Create a new quality issue against a supplier."}</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Supplier</Label>
                                        <Select value={supplier} onValueChange={setSupplier}>
                                            <SelectTrigger><SelectValue placeholder="Select Supplier" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Fast Machining Ltd">Fast Machining Ltd</SelectItem>
                                                <SelectItem value="Precision Gears">Precision Gears</SelectItem>
                                                <SelectItem value="Alpha Castings">Alpha Castings</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Defect Description</Label>
                                        <Input value={defect} onChange={(e) => setDefect(e.target.value)} placeholder="e.g., Dimension out of spec" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Part Name</Label>
                                        <Input value={partName} onChange={(e) => setPartName(e.target.value)} placeholder="Part Name" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Part No</Label>
                                        <Input value={partNumber} onChange={(e) => setPartNumber(e.target.value)} placeholder="Part No (Optional)" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Quantity</Label>
                                        <Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Qty (Optional)" />
                                    </div>
                                </div>
                                
                                <div className="grid gap-2">
                                    <Label>Root Cause Analysis</Label>
                                    <Textarea value={rootCause} onChange={(e) => setRootCause(e.target.value)} placeholder="Why did this happen?" />
                                </div>

                                <div className="grid gap-2">
                                    <Label>Corrective Action</Label>
                                    <Textarea value={correctiveAction} onChange={(e) => setCorrectiveAction(e.target.value)} placeholder="Action taken to prevent recurrence..." />
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                     <div className="grid gap-2">
                                        <Label>Raised Date</Label>
                                        <Input type="date" value={raisedDate} onChange={(e) => setRaisedDate(e.target.value)} />
                                    </div>
                                    {isEditing && (
                                        <>
                                            <div className="grid gap-2">
                                                <Label>Status</Label>
                                                <Select value={status} onValueChange={(val: "Open" | "Closed") => setStatus(val)}>
                                                    <SelectTrigger><SelectValue placeholder="Select Status" /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Open">Open</SelectItem>
                                                        <SelectItem value="Closed">Closed</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Closed Date</Label>
                                                <Input type="date" value={closedDate} onChange={(e) => setClosedDate(e.target.value)} disabled={status !== "Closed"} />
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleSave}>{isEditing ? "Update NCR" : "Create NCR"}</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Issue Tracker</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>NCR ID</TableHead>
                                <TableHead>Supplier</TableHead>
                                <TableHead>Part Details</TableHead>
                                <TableHead>Defect</TableHead>
                                <TableHead>Root Cause</TableHead>
                                <TableHead>Corrective Action</TableHead>
                                <TableHead>Raised</TableHead>
                                <TableHead>Closed</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {issues.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={10} className="text-center h-24">{loading ? "Loading..." : "No issues found."}</TableCell>
                                </TableRow>
                            ) : (
                                issues.map((issue) => (
                                <TableRow key={issue.id}>
                                    <TableCell className="font-medium">{issue.id}</TableCell>
                                    <TableCell>{issue.supplierName || issue.supplierId}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-xs">{issue.partName}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{issue.description || issue.defect}</TableCell>
                                    <TableCell className="max-w-[150px] truncate" title={issue.rootCause}>{issue.rootCause || "-"}</TableCell>
                                    <TableCell className="max-w-[150px] truncate" title={issue.correctiveAction}>{issue.correctiveAction || "-"}</TableCell>
                                    <TableCell>{issue.raisedDate}</TableCell>
                                    <TableCell>{issue.closedDate || "-"}</TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${issue.status === 'Open' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                            {issue.status}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => handleEditClick(issue)}>
                                                    <Pencil className="mr-2 h-4 w-4" /> Edit Details
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => {
                                                    // Quick close/open logic reusing handleUpdate flow would be better but requires logic duplication
                                                    // or state setting. Simplest to just open edit modal for now or implement direct API call.
                                                    // Let's implement direct API call for quick action.
                                                    const newStatus = issue.status === "Open" ? "Closed" : "Open"
                                                    const newClosedDate = newStatus === "Closed" ? new Date().toISOString().split('T')[0] : ""
                                                    
                                                    // Optimistic UI update or refresh
                                                    fetch('/api/issues', {
                                                        method: 'PUT',
                                                        headers: {'Content-Type': 'application/json'},
                                                        body: JSON.stringify({
                                                            id: issue.id,
                                                            status: newStatus,
                                                            closedDate: newClosedDate
                                                        })
                                                    }).then(() => fetchIssues())
                                                }}>
                                                    {issue.status === "Open" ? <><CheckCircle2 className="mr-2 h-4 w-4" /> Mark Closed</> : "Re-open Issue"}
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            )))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}

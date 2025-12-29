"use client"

import { useState } from "react"
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

import { MOCK_ISSUES, Issue } from "@/lib/issues"

export default function AdminIssuesPage() {
    const [issues, setIssues] = useState(MOCK_ISSUES)
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

    const handleSave = () => {
        if (isEditing) {
            handleUpdate()
            return
        }
        handleCreate()
    }

    const handleCreate = () => {
        const newIssue: Issue = {
            id: `NCR-2025-00${MOCK_ISSUES.length + 1}`,
            supplier: supplier || "Unknown",
            defect: defect || "General Defect",
            partName: partName || "Unknown Part",
            partNumber: partNumber || "N/A",
            quantity: Number(quantity) || 1,
            raisedDate: raisedDate,
            closedDate: closedDate || undefined,
            status: status,
            rootCause,
            correctiveAction
        }
        
        MOCK_ISSUES.unshift(newIssue)
        setIssues([newIssue, ...issues])
        resetForm()
    }

    const handleUpdate = () => {
        const issueIndex = MOCK_ISSUES.findIndex(i => i.id === currentId)
        if (issueIndex > -1) {
            // Auto-set closed date if closing and not set
            let finalClosedDate = closedDate
            if (status === "Closed" && !finalClosedDate) {
                finalClosedDate = new Date().toISOString().split('T')[0]
            }

            MOCK_ISSUES[issueIndex] = {
                ...MOCK_ISSUES[issueIndex],
                supplier,
                defect,
                partName,
                partNumber,
                quantity: Number(quantity),
                raisedDate,
                closedDate: finalClosedDate,
                status,
                rootCause,
                correctiveAction
            }
        }

        setIssues(MOCK_ISSUES.map(i => i.id === currentId ? MOCK_ISSUES[issueIndex] : i))
        
        resetForm()
    }

    const handleEditClick = (issue: Issue) => {
        setIsEditing(true)
        setCurrentId(issue.id)
        setSupplier(issue.supplier)
        setDefect(issue.defect)
        setPartName(issue.partName)
        setPartNumber(issue.partNumber)
        setQuantity(String(issue.quantity))
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
                                        <Input value={partNumber} onChange={(e) => setPartNumber(e.target.value)} placeholder="Part No" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Quantity</Label>
                                        <Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Qty" />
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
                                <TableHead>Qty</TableHead>
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
                            {issues.map((issue) => (
                                <TableRow key={issue.id}>
                                    <TableCell className="font-medium">{issue.id}</TableCell>
                                    <TableCell>{issue.supplier}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-xs">{issue.partName}</span>
                                            <span className="text-xs text-muted-foreground">{issue.partNumber}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{issue.quantity}</TableCell>
                                    <TableCell>{issue.defect}</TableCell>
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
                                                    const newStatus: "Open" | "Closed" = issue.status === "Open" ? "Closed" : "Open"
                                                    // Trigger edit logic to update status and potentially closed date
                                                    const updatedIssue: Issue = { 
                                                        ...issue, 
                                                        status: newStatus,
                                                        closedDate: (newStatus === "Closed" && !issue.closedDate) ? new Date().toISOString().split('T')[0] : issue.closedDate
                                                    }
                                                    
                                                    handleEditClick(updatedIssue)
                                                }}>
                                                    {issue.status === "Open" ? <><CheckCircle2 className="mr-2 h-4 w-4" /> Mark Closed</> : "Re-open Issue"}
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}

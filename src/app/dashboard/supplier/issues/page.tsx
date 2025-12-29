"use client"

import { useState } from "react"
import { AlertCircle, FileEdit, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

const ISSUES = [
    { id: "NCR-2025-001", defect: "Dimension Oversize", part: "Cylinder Head", date: "2025-10-22", status: "Open" },
]

export default function SupplierIssuesPage() {
     const [rootCause, setRootCause] = useState("")
     const [capa, setCapa] = useState("")

     const handleSubmit = () => {
         // Submit logic
         alert("Response Submitted")
     }

    return (
        <div className="flex-1 space-y-4">
            <h2 className="text-3xl font-bold tracking-tight">Quality Issues</h2>

            <Card>
                <CardHeader>
                    <CardTitle>Open Non-Conformances</CardTitle>
                    <CardDescription>Action required on the following issues.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>NCR ID</TableHead>
                                <TableHead>Defect</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {ISSUES.map((issue) => (
                                <TableRow key={issue.id}>
                                    <TableCell className="font-medium">{issue.id}</TableCell>
                                    <TableCell>{issue.defect}</TableCell>
                                    <TableCell>{issue.date}</TableCell>
                                    <TableCell>
                                        <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                                            {issue.status}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button size="sm">
                                                    <FileEdit className="mr-2 h-4 w-4" /> Respond
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-2xl">
                                                <DialogHeader>
                                                    <DialogTitle>Submit CAPA for {issue.id}</DialogTitle>
                                                    <DialogDescription>Provide root cause analysis (5-Why) and corrective actions.</DialogDescription>
                                                </DialogHeader>
                                                <div className="grid gap-4 py-4">
                                                    <div className="grid gap-2">
                                                        <Label>Root Cause (5-Why Analysis)</Label>
                                                        <Input value={rootCause} onChange={(e) => setRootCause(e.target.value)} placeholder="Why? Why? Why?..." />
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <Label>Corrective & Preventive Action (CAPA)</Label>
                                                        <Input value={capa} onChange={(e) => setCapa(e.target.value)} placeholder="Immediate and long-term actions..." />
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <Label>Upload Evidence</Label>
                                                        <Input type="file" />
                                                    </div>
                                                </div>
                                                <DialogFooter>
                                                    <Button onClick={handleSubmit}>
                                                        <CheckCircle2 className="mr-2 h-4 w-4" /> Submit Response
                                                    </Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
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

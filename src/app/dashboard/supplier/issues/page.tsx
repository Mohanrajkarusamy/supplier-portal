
"use client"

import { useState, useEffect } from "react"
import { AlertTriangle, MessageSquare, CheckCircle, Clock, Send, FileEdit, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"


export default function SupplierIssuesPage() {
    const currentSupplierId = "SUP001"
    
    const [issues, setIssues] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const fetchIssues = async () => {
        try {
            const res = await fetch(`/api/issues?supplierId=${currentSupplierId}`)
            if (res.ok) {
                setIssues(await res.json())
            }
        } catch (e) { console.error(e) }
        setLoading(false)
    }

    useEffect(() => {
        fetchIssues()
    }, [])
    
    const [rootCause, setRootCause] = useState("")
    const [correctiveAction, setCorrectiveAction] = useState("")

     const handleResponseSubmit = async (issueId: string) => {
        const responseData = {
            id: issueId,
            rootCause,
            correctiveAction,
            // We might want to update status to "Responded" if the system supports it,
            // or just save the CAPA info.
            // My schema model has rootCause and correctiveAction.
        }

        try {
             const res = await fetch('/api/issues', {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(responseData)
             })

             if (res.ok) {
                fetchIssues()
                setRootCause("")
                setCorrectiveAction("")
                alert("Response Submitted Successfully")
             } else {
                 alert("Failed to submit response")
             }
        } catch (e) {
            alert("Network error")
        }
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
                            {issues.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24">
                                        {loading ? "Loading..." : "No open issues."}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                issues.map((issue) => (
                                <TableRow key={issue.id}>
                                    <TableCell className="font-medium">{issue.id}</TableCell>
                                    <TableCell>{issue.description || issue.defect}</TableCell>
                                    <TableCell>{issue.raisedDate}</TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${issue.status === 'Open' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
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
                                                        <Input value={correctiveAction} onChange={(e) => setCorrectiveAction(e.target.value)} placeholder="Immediate and long-term actions..." />
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <Label>Upload Evidence</Label>
                                                        <Input type="file" />
                                                    </div>
                                                </div>
                                                <DialogFooter>
                                                    <Button onClick={() => handleResponseSubmit(issue.id)}>
                                                        <CheckCircle2 className="mr-2 h-4 w-4" /> Submit Response
                                                    </Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
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

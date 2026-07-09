"use client"

import { useState, useEffect } from "react"
import { AlertTriangle, MessageSquare, CheckCircle, Clock, Send, FileEdit, CheckCircle2, Search, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

export default function SupplierIssuesPage() {
    const [supplierId, setSupplierId] = useState("")
    const [issues, setIssues] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const id = localStorage.getItem("currentUserId") || "SUP001"
        setSupplierId(id)
        fetchIssues(id)
    }, [])

    const fetchIssues = async (id: string) => {
        try {
            const res = await fetch(`/api/issues?supplierId=${id}`)
            if (res.ok) {
                setIssues(await res.json())
            }
        } catch (e) { console.error(e) }
        setLoading(false)
    }
    
    const [currentStep, setCurrentStep] = useState(1)
    const [d1Team, setD1Team] = useState("")
    const [d2Problem, setD2Problem] = useState("")
    const [d3Containment, setD3Containment] = useState("")
    const [d4RootCause, setD4RootCause] = useState("")
    const [d5PCA, setD5PCA] = useState("")
    const [d6Verify, setD6Verify] = useState("")
    const [d7Preventive, setD7Preventive] = useState("")
    const [d8Closure, setD8Closure] = useState("")
    const [dialogOpen, setDialogOpen] = useState<string | null>(null) // tracks open issue ID

    const handleOpenResolveDialog = (issue: any) => {
        setCurrentStep(1)
        setD1Team("")
        setD2Problem(issue.defectReason || issue.description || issue.defect || "")
        setD3Containment("")
        setD4RootCause("")
        setD5PCA("")
        setD6Verify("")
        setD7Preventive("")
        setD8Closure("")
        setDialogOpen(issue.id)
    }

     const handleResponseSubmit = async (issueId: string) => {
        const rootCauseMarkdown = `### D1: Establish Team\n${d1Team}\n\n### D2: Problem Description\n${d2Problem}\n\n### D3: Containment Actions\n${d3Containment}\n\n### D4: Root Cause Analysis (5-Why)\n${d4RootCause}`;
        const correctiveActionMarkdown = `### D5: Permanent Corrective Action (PCA)\n${d5PCA}\n\n### D6: Implement & Verify PCA\n${d6Verify}\n\n### D7: Preventive Actions\n${d7Preventive}\n\n### D8: Team Recognition & Closure\n${d8Closure}`;

        const responseData = {
            id: issueId,
            rootCause: rootCauseMarkdown,
            correctiveAction: correctiveActionMarkdown,
            status: 'Responded' 
        }

        try {
             const res = await fetch('/api/issues', {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(responseData)
             })

             if (res.ok) {
                fetchIssues(supplierId)
                alert("8D Response Submitted Successfully. SQA Admin has been notified.")
                setDialogOpen(null)
             } else {
                 alert("Failed to submit response")
             }
        } catch (e) {
            alert("Network error")
        }
     }

    return (
        <div className="flex-1 space-y-6 p-1">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-800">Quality Concerns</h2>
                    <p className="text-slate-500">Respond to customer concerns and track corrective actions (RC-CA).</p>
                </div>
            </div>

            <Card className="border-t-4 border-t-red-500 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Open Quality Concerns</CardTitle>
                        <CardDescription>Immediate root cause analysis required for these issues.</CardDescription>
                    </div>
                    <div className="p-2 bg-red-50 rounded-full">
                        <AlertTriangle className="h-6 w-6 text-red-500" />
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50">
                                <TableHead className="w-[150px]">Concern No</TableHead>
                                <TableHead>Defect / Reason</TableHead>
                                <TableHead>Part Reference</TableHead>
                                <TableHead>Raised Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {issues.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10 text-slate-400 italic">
                                        {loading ? "Loading concerns..." : "No open quality concerns. Great job!"}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                issues.map((issue) => (
                                <TableRow key={issue.id} className="hover:bg-slate-50/50">
                                    <TableCell className="font-bold text-red-600">{issue.concernNumber || issue.id}</TableCell>
                                    <TableCell className="font-medium">{issue.defectReason || issue.defect}</TableCell>
                                    <TableCell className="text-slate-600">{issue.partName}</TableCell>
                                    <TableCell className="text-slate-500 text-xs">{issue.raisedDate}</TableCell>
                                    <TableCell>
                                        <Badge variant={issue.status === 'Open' ? 'destructive' : 'outline'} className={issue.status === 'Open' ? '' : 'text-green-600 border-green-200 bg-green-50'}>
                                            {issue.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Dialog open={dialogOpen === issue.id} onOpenChange={(open) => setDialogOpen(open ? issue.id : null)}>
                                            <DialogTrigger asChild>
                                                <Button size="sm" variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white" onClick={() => handleOpenResolveDialog(issue)}>
                                                    <FileEdit className="mr-2 h-4 w-4" /> Resolve
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-2xl border-t-4 border-t-primary">
                                                <DialogHeader>
                                                    <DialogTitle>Submit 8D Quality Report for {issue.concernNumber || issue.id}</DialogTitle>
                                                    <DialogDescription>
                                                        Follow the standard 8 Disciplines (8D) process to resolve customer complaint.
                                                    </DialogDescription>
                                                </DialogHeader>

                                                {/* Stepper progress indicator */}
                                                <div className="flex justify-between items-center mb-4 bg-slate-50 p-2.5 rounded-md border border-slate-100">
                                                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                                                        <div key={s} className="flex items-center">
                                                            <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                                                                currentStep === s 
                                                                    ? "bg-primary text-white scale-110 shadow-sm" 
                                                                    : currentStep > s 
                                                                        ? "bg-green-500 text-white" 
                                                                        : "bg-slate-200 text-slate-500"
                                                            }`}>
                                                                {s}
                                                            </div>
                                                            {s < 8 && <div className={`h-[2px] w-3 sm:w-5 transition-all ${currentStep > s ? "bg-green-500" : "bg-slate-200"}`} />}
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="min-h-[220px] py-2">
                                                    {currentStep === 1 && (
                                                        <div className="space-y-3 animate-in fade-in duration-300">
                                                            <div className="flex items-center gap-2 text-primary font-bold">
                                                                <span className="bg-primary/10 px-2 py-0.5 rounded text-xs">D1</span>
                                                                <span>Establish Team</span>
                                                            </div>
                                                            <Label className="text-xs text-slate-500 leading-normal block">
                                                                Identify the team members, departments, and leaders working together to analyze and resolve this quality issue.
                                                            </Label>
                                                            <textarea 
                                                                className="flex min-h-[100px] w-full rounded-md border border-slate-300 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                                value={d1Team} 
                                                                onChange={(e) => setD1Team(e.target.value)} 
                                                                placeholder="e.g. John Doe (QA Manager), Smith (Production Lead), Ram (Operator)..." 
                                                            />
                                                        </div>
                                                    )}

                                                    {currentStep === 2 && (
                                                        <div className="space-y-3 animate-in fade-in duration-300">
                                                            <div className="flex items-center gap-2 text-primary font-bold">
                                                                <span className="bg-primary/10 px-2 py-0.5 rounded text-xs">D2</span>
                                                                <span>Describe the Problem</span>
                                                            </div>
                                                            <Label className="text-xs text-slate-500 leading-normal block">
                                                                Describe the defect details, dimensions, parts involved, and symptoms of the issue.
                                                            </Label>
                                                            <textarea 
                                                                className="flex min-h-[100px] w-full rounded-md border border-slate-300 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                                value={d2Problem} 
                                                                onChange={(e) => setD2Problem(e.target.value)} 
                                                                placeholder="Provide a detailed description of the defect, dimensions, etc..." 
                                                            />
                                                        </div>
                                                    )}

                                                    {currentStep === 3 && (
                                                        <div className="space-y-3 animate-in fade-in duration-300">
                                                            <div className="flex items-center gap-2 text-primary font-bold">
                                                                <span className="bg-primary/10 px-2 py-0.5 rounded text-xs">D3</span>
                                                                <span>Containment Actions</span>
                                                            </div>
                                                            <Label className="text-xs text-slate-500 leading-normal block">
                                                                Specify immediate action taken to isolate/quarantine suspect parts in transit, warehouse, or plant to stop further defects.
                                                            </Label>
                                                            <textarea 
                                                                className="flex min-h-[100px] w-full rounded-md border border-slate-300 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                                value={d3Containment} 
                                                                onChange={(e) => setD3Containment(e.target.value)} 
                                                                placeholder="Describe quarantine actions, sorting of stock, etc..." 
                                                            />
                                                        </div>
                                                    )}

                                                    {currentStep === 4 && (
                                                        <div className="space-y-3 animate-in fade-in duration-300">
                                                            <div className="flex items-center gap-2 text-primary font-bold">
                                                                <span className="bg-primary/10 px-2 py-0.5 rounded text-xs">D4</span>
                                                                <span>Root Cause Analysis (5-Why)</span>
                                                            </div>
                                                            <Label className="text-xs text-slate-500 leading-normal block">
                                                                Describe the primary failure mode and root cause using 5-Why analysis (Ask "Why" 5 times sequentially).
                                                            </Label>
                                                            <textarea 
                                                                className="flex min-h-[100px] w-full rounded-md border border-slate-300 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                                value={d4RootCause} 
                                                                onChange={(e) => setD4RootCause(e.target.value)} 
                                                                placeholder="Why 1: Spindle bearing runout... Why 2: Maintenance overdue..." 
                                                            />
                                                        </div>
                                                    )}

                                                    {currentStep === 5 && (
                                                        <div className="space-y-3 animate-in fade-in duration-300">
                                                            <div className="flex items-center gap-2 text-primary font-bold">
                                                                <span className="bg-primary/10 px-2 py-0.5 rounded text-xs">D5</span>
                                                                <span>Permanent Corrective Actions (PCA)</span>
                                                            </div>
                                                            <Label className="text-xs text-slate-500 leading-normal block">
                                                                Outline permanent action items designed to address and eliminate the identified root cause.
                                                                These should be irreversible changes to the system.
                                                            </Label>
                                                            <textarea 
                                                                className="flex min-h-[100px] w-full rounded-md border border-slate-300 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                                value={d5PCA} 
                                                                onChange={(e) => setD5PCA(e.target.value)} 
                                                                placeholder="Describe permanent machine fixes, tool replacements, process parameter locks..." 
                                                            />
                                                        </div>
                                                    )}

                                                    {currentStep === 6 && (
                                                        <div className="space-y-3 animate-in fade-in duration-300">
                                                            <div className="flex items-center gap-2 text-primary font-bold">
                                                                <span className="bg-primary/10 px-2 py-0.5 rounded text-xs">D6</span>
                                                                <span>Implement & Verify PCA</span>
                                                            </div>
                                                            <Label className="text-xs text-slate-500 leading-normal block">
                                                                Provide verification plan/data proving that the corrective action successfully resolved the defect.
                                                            </Label>
                                                            <textarea 
                                                                className="flex min-h-[100px] w-full rounded-md border border-slate-300 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                                value={d6Verify} 
                                                                onChange={(e) => setD6Verify(e.target.value)} 
                                                                placeholder="Define quality metrics collected, runoffs, gauge checks to verify results..." 
                                                            />
                                                        </div>
                                                    )}

                                                    {currentStep === 7 && (
                                                        <div className="space-y-3 animate-in fade-in duration-300">
                                                            <div className="flex items-center gap-2 text-primary font-bold">
                                                                <span className="bg-primary/10 px-2 py-0.5 rounded text-xs">D7</span>
                                                                <span>Preventive Actions</span>
                                                            </div>
                                                            <Label className="text-xs text-slate-500 leading-normal block">
                                                                Define preventative changes in management systems, standard operating procedures (SOP), FMEA, or training to prevent recurrence.
                                                            </Label>
                                                            <textarea 
                                                                className="flex min-h-[100px] w-full rounded-md border border-slate-300 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                                value={d7Preventive} 
                                                                onChange={(e) => setD7Preventive(e.target.value)} 
                                                                placeholder="SOP updates, FMEA revisions, preventive maintenance schedule changes..." 
                                                            />
                                                        </div>
                                                    )}

                                                    {currentStep === 8 && (
                                                        <div className="space-y-3 animate-in fade-in duration-300">
                                                            <div className="flex items-center gap-2 text-primary font-bold">
                                                                <span className="bg-primary/10 px-2 py-0.5 rounded text-xs">D8</span>
                                                                <span>Recognize Team & Close</span>
                                                            </div>
                                                            <Label className="text-xs text-slate-500 leading-normal block">
                                                                Document lessons learned and team sign-offs. This completes the 8D response submission.
                                                            </Label>
                                                            <textarea 
                                                                className="flex min-h-[100px] w-full rounded-md border border-slate-300 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                                value={d8Closure} 
                                                                onChange={(e) => setD8Closure(e.target.value)} 
                                                                placeholder="Describe team recognition, lessons shared across production plants, and closing remarks..." 
                                                            />
                                                        </div>
                                                    )}
                                                </div>

                                                <DialogFooter className="bg-slate-50 p-4 -mx-6 -mb-6 mt-4 flex justify-between sm:justify-between items-center border-t">
                                                    <div>
                                                        {currentStep > 1 && (
                                                            <Button type="button" variant="outline" onClick={() => setCurrentStep(currentStep - 1)}>
                                                                Back
                                                            </Button>
                                                        )}
                                                    </div>
                                                    <div>
                                                        {currentStep < 8 ? (
                                                            <Button 
                                                                type="button" 
                                                                onClick={() => setCurrentStep(currentStep + 1)}
                                                                className="bg-primary hover:bg-orange-600 text-white"
                                                                disabled={
                                                                    (currentStep === 1 && !d1Team) ||
                                                                    (currentStep === 2 && !d2Problem) ||
                                                                    (currentStep === 3 && !d3Containment) ||
                                                                    (currentStep === 4 && !d4RootCause) ||
                                                                    (currentStep === 5 && !d5PCA) ||
                                                                    (currentStep === 6 && !d6Verify) ||
                                                                    (currentStep === 7 && !d7Preventive)
                                                                }
                                                            >
                                                                Next Step
                                                            </Button>
                                                        ) : (
                                                            <Button 
                                                                onClick={() => handleResponseSubmit(issue.id)} 
                                                                className="bg-green-600 hover:bg-green-500 text-white font-bold"
                                                                disabled={!d8Closure}
                                                            >
                                                                <CheckCircle2 className="mr-2 h-4 w-4" /> Submit 8D Report
                                                            </Button>
                                                        )}
                                                    </div>
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

            <div className="p-4 bg-orange-50 border border-orange-100 rounded-lg flex items-start gap-4">
                <Info className="h-5 w-5 text-orange-500 mt-0.5" />
                <div className="space-y-1">
                    <p className="text-sm font-bold text-orange-900">RC-CA Policy Reminder</p>
                    <p className="text-xs text-orange-700 leading-normal">
                        Corrective action responses (RC-CA) must be submitted within **8 hours (one shift)** of concern generation.
                        Failure to provide adequate root cause analysis may lead to repeated problems and weightage reduction in quality score.
                    </p>
                </div>
            </div>
        </div>
    )
}
